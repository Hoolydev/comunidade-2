# Dúvidas e dívidas registradas

Coisas que um agente achou erradas ou arriscadas e que não deve resolver
sozinho. Registre e siga o que está no CLAUDE.md.

---

## D-01 · O PRD pedia Firebase + Vercel; o projeto é Clerk + Cloudflare Workers

**Registrado por:** orquestrador, na Fase 0.
`firebase-admin` depende de gRPC e binários nativos do Node e não roda em
Cloudflare Workers, então Firebase + este hosting não coexistem. Decidido com o
responsável pelo produto: manter Clerk e Workers, traduzindo o comportamento do
PRD. Mapeamento: Firebase Auth → Clerk; Firestore `usuarios/{uid}` → metadata do
usuário no Clerk; custom claims → `publicMetadata`; `onSnapshot` → polling de
`GET /api/assinatura`; Security Rules → o cliente não fala com o banco, toda
autorização é server-side.

## D-02 · `POST /api/auth/session` do PRD não existe aqui

O Clerk já cria e renova um cookie de sessão httpOnly e já permite identificar o
usuário no servidor. A rota seria uma reimplementação sem função. Substituída
por `app/lib/sessao.ts`.

## D-03 · Duas fontes de verdade para preço

`app/lib/planos.ts` guarda os valores exibidos; a Stripe guarda os valores
cobrados. Se divergirem, o usuário vê um número e paga outro. Card no backlog:
buscar os preços da própria Stripe em vez de constantes locais.

## D-04 · Valores dos planos são suposição

`mensal R$ 97/mês` e `anual R$ 970/ano` foram colocados como referência para
destravar a interface. **Precisam ser confirmados** e precisam bater com os
prices criados na Stripe antes do go-live.

## D-05 · Binding `DB` do D1 depende do control plane

`.openai/hosting.json` passou a declarar `"d1": "DB"`. Em desenvolvimento o
Miniflare simula. Em produção o binding depende de provisionamento pelo control
plane do OpenAI Sites. Por isso todo acesso ao banco degrada com elegância — o
webhook credita o pagamento mesmo sem banco.

---

<!-- Novas dúvidas abaixo. Assine com a sua tarefa. -->
