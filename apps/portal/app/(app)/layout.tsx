import { isDemoMode } from "@as/auth";
import { PortalShell } from "../../components/portal-shell";
import { getMe } from "../../lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O middleware já exige sessão; aqui garantimos que o login tem cadastro de paciente
  const me = await getMe().catch(() => null);

  // Conta autenticada SEM cadastro de paciente (ex.: conta da equipe/admin).
  // Não redirecionamos para /login (isso causaria loop, pois há sessão ativa):
  // mostramos uma mensagem clara com a opção de sair.
  if (!me && !isDemoMode()) {
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
