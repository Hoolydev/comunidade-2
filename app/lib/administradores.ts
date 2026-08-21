const ADMINISTRADORES_PADRAO = ["ruanna@hagios.com"];

export function emailsAdministradores(): string[] {
  const configurados = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set([...ADMINISTRADORES_PADRAO, ...configurados]));
}

export function ehAdministrador(email: string | null | undefined): boolean {
  return Boolean(email && emailsAdministradores().includes(email.trim().toLowerCase()));
}
