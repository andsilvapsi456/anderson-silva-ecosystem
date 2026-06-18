import { ButtonLink, Card } from "@as/ui";
import { isDemoMode } from "@as/auth";
import { BRAND } from "@as/shared";
import { LoginForm } from "../../components/login-form";
import { LoginPanel } from "../../components/login-panel";

export default function LoginPage() {
  const demo = isDemoMode();
  return (
    <main className="flex min-h-screen">
      <LoginPanel
        headline="Sua clínica inteira, num só lugar."
        sub="Agenda, prontuário, financeiro e o portal do paciente — com a sua cara, do seu jeito."
        quote="Tudo o que a clínica precisa em um só lugar — agenda, prontuário, financeiro e o portal do paciente, com a minha cara."
        quoteAuthor="Anderson V. V. Silva · Psicólogo"
      />

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <img
            src="/brand/logo-color.png"
            alt="Anderson V. V. Silva · Psicólogo · CRP 06/166223"
            className="mx-auto mb-6 w-52 lg:hidden"
          />
          <h1 className="text-2xl font-extrabold tracking-tight">Painel da clínica</h1>
          <p className="mt-1.5 mb-6 text-sm text-[var(--text-soft)]">
            Acesso restrito à equipe. Recomendamos ativar a verificação em duas etapas (2FA).
          </p>
          <Card className="p-7">
            <LoginForm demo={demo} />
            {demo && (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <ButtonLink href="/" variant="secondary" size="sm" className="w-full">
                  Entrar como Anderson (admin demo) →
                </ButtonLink>
              </div>
            )}
          </Card>
          <p className="mt-6 text-center text-xs text-[var(--text-soft)]">{BRAND.crp}</p>
        </div>
      </section>
    </main>
  );
}
