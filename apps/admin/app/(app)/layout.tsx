import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@as/auth";
import { getSessionUser } from "@as/auth/server";
import { AdminShell } from "../../components/admin-shell";
import { getPatients } from "../../lib/data";

// o ADMIN da clínica é o próprio psicólogo
const roleLabel: Record<string, string> = {
  ADMIN: "Psicólogo · Admin",
  PSYCHOLOGIST: "Psicólogo",
  SECRETARY: "Secretária",
  COORDINATOR: "Coordenador",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const patients = (await getPatients()).map((p) => ({ id: p.id, name: p.name }));

  if (isDemoMode()) return <AdminShell patients={patients}>{children}</AdminShell>;

  const user = await getSessionUser(await cookies());
  if (!user) redirect("/login");
  // Gate por papel: paciente não entra no painel — vai para o portal
  if (user.role === "PATIENT") redirect(process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001");

  return (
    <AdminShell userName={user.name} userRole={roleLabel[user.role] ?? user.role} patients={patients}>
      {children}
    </AdminShell>
  );
}
