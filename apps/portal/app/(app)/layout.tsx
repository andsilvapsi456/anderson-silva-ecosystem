import { isDemoMode } from "@as/auth";
import { PortalShell } from "../../components/portal-shell";
import { GoToAdmin } from "../../components/go-to-admin";
import { getMe, getMyRole } from "../../lib/data";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://anderson-silva-ecosystem.aged-tree-05e8.workers.dev";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O middleware já exige sessão; aqui garantimos que o login tem cadastro de paciente
  const me = await getMe().catch(() => null);

  // Conta autenticada SEM cadastro de paciente. Se for da EQUIPE (admin/psicólogo),
  // mandamos para o painel admin via redirect no NAVEGADOR (funciona entre domínios;
  // o redirect() do servidor para URL externa 404a no Cloudflare/OpenNext).
  if (!me && !isDemoMode()) {
    const role = await getMyRole().catch(() => null);
    if (role && role !== "PATIENT") return <GoToAdmin url={ADMIN_URL} />;

    // Conta logada que não é paciente nem equipe → mensagem clara (sem loop).
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <div className="w-full max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow)]">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight">Esta conta não é de paciente</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
            Você está logado, mas este e-mail não tem um cadastro de paciente. A <strong>Área do Paciente</strong> é
            exclusiva para pacientes. Se você é da equipe da clínica, acesse o <strong>painel administrativo</strong>.
          </p>
          <a
            href="/auth/logout"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-6 text-sm font-bold text-white"
          >
            Sair e entrar com outra conta
          </a>
        </div>
      </main>
    );
  }

  return <PortalShell userName={me!.name}>{children}</PortalShell>;
}
