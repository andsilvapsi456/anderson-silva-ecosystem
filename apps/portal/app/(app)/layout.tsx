import { redirect } from "next/navigation";
import { isDemoMode } from "@as/auth";
import { PortalShell } from "../../components/portal-shell";
import { getMe } from "../../lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O middleware já exige sessão; aqui garantimos que o login tem cadastro de paciente
  const me = await getMe().catch(() => null);
  if (!me && !isDemoMode()) redirect("/login");
  return <PortalShell userName={me!.name}>{children}</PortalShell>;
}
