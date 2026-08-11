/* eslint-disable @next/next/no-img-element -- O otimizador de imagens do Vinext exige ASSETS e falha no preview local. */

import Link from "next/link";

export function MarcaHagios({ href = "/vendas" }: { href?: string }) {
  return (
    <Link className="mh-public-brand" href={href} aria-label="Movimento Hágios">
      <img src="/logo-hagios.png" alt="" width="50" height="50" />
      <span><small>MOVIMENTO</small><strong>HÁGIOS</strong></span>
    </Link>
  );
}
