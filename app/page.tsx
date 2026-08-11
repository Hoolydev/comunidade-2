import { HomeMembro } from "./componentes/HomeMembro";
import { previewLocalAtivo } from "./lib/acesso-local";
import { exigirAssinante } from "./lib/guarda";

export const runtime = "nodejs";

export default async function Home() {
  if (!previewLocalAtivo()) await exigirAssinante("/");
  return <HomeMembro />;
}
