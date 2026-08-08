// Livro-razão de eventos da Stripe e busca reversa customer -> usuário.
//
// Tudo aqui é *melhor esforço*. O binding `DB` do D1 pode simplesmente não
// existir (docs/handoff/duvidas.md, D-05) e uma consulta pode falhar por conta
// própria. Nenhuma dessas situações pode derrubar a confirmação de um
// pagamento, então nenhuma função deste arquivo lança: elas devolvem o estado
// "não deu" e o webhook segue.
//
// Sem banco, a idempotência vira no-op e a proteção contra reentrega passa a
// ser a guarda de ordem por `event.created` em `gravarAssinatura()` — que
// descarta o evento repetido por ser mais antigo ou idêntico ao já aplicado, e
// que de qualquer forma reescreve o mesmo estado.

import { eq } from "drizzle-orm";

import { obterBanco } from "../../db";
import { clientesStripe, eventosStripe } from "../../db/schema";

/**
 * - `novo`       — primeira vez que vemos este evento, pode processar
 * - `duplicado`  — já processado, pare e responda 200
 * - `sem_banco`  — não há como saber; processe assim mesmo
 */
export type ResultadoDoRegistro = "novo" | "duplicado" | "sem_banco";

/**
 * Registra o evento antes de processá-lo. A chave primária de `eventos_stripe`
 * é o `event.id`, então a segunda inserção falha — e é exatamente isso que
 * queremos: a falha é a detecção da duplicata.
 */
export async function registrarEvento(
  id: string,
  tipo: string,
): Promise<ResultadoDoRegistro> {
  const banco = obterBanco();
  if (!banco) return "sem_banco";

  try {
    const inseridos = await banco
      .insert(eventosStripe)
      .values({ id, tipo, recebidoEm: Date.now() })
      .onConflictDoNothing()
      .returning({ id: eventosStripe.id });

    return inseridos.length > 0 ? "novo" : "duplicado";
  } catch {
    // Banco existe mas recusou a escrita (tabela ausente, indisponibilidade).
    // Melhor processar de novo do que não creditar o pagamento.
    return "sem_banco";
  }
}

/**
 * Apaga o registro de idempotência quando o processamento falhou, para que a
 * reentrega da Stripe encontre o evento como novo. Sem isso, um erro
 * transitório congelaria o evento como "já processado" para sempre.
 */
export async function esquecerEvento(id: string): Promise<void> {
  const banco = obterBanco();
  if (!banco) return;

  try {
    await banco.delete(eventosStripe).where(eq(eventosStripe.id, id));
  } catch {
    // Silêncio proposital: já estamos no caminho de erro e a resposta 500 é o
    // que importa para a Stripe reenviar.
  }
}

/** Grava a busca reversa customer -> uid. Idempotente. */
export async function guardarCliente(
  stripeCustomerId: string,
  uid: string,
): Promise<void> {
  const banco = obterBanco();
  if (!banco) return;

  try {
    await banco
      .insert(clientesStripe)
      .values({ stripeCustomerId, uid, criadoEm: Date.now() })
      .onConflictDoUpdate({
        target: clientesStripe.stripeCustomerId,
        set: { uid },
      });
  } catch {
    // A busca reversa é uma otimização: sem ela o webhook ainda encontra o uid
    // no metadata do customer na própria Stripe.
  }
}

/** uid do dono de um customer da Stripe, se o conhecemos. */
export async function uidDoCliente(stripeCustomerId: string): Promise<string | null> {
  const banco = obterBanco();
  if (!banco) return null;

  try {
    const linhas = await banco
      .select({ uid: clientesStripe.uid })
      .from(clientesStripe)
      .where(eq(clientesStripe.stripeCustomerId, stripeCustomerId))
      .limit(1);

    return linhas[0]?.uid ?? null;
  } catch {
    return null;
  }
}
