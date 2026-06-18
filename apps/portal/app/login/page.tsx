import Link from "next/link";
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
        headline="Que bom te ver de novo."
        sub="Seu cuidado continua aqui: sessões, pagamentos, recibos e o seu diário, sempre à mão."
        quote="Um psicólogo que te escuta de verdade. Saí de cada sessão me sentindo acolhido e compreendido."
        quoteAuthor="Avaliação de paciente · Google"
      />

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <img
            src="/brand/logo-color.png"
            alt="Anderson V. V. Silva · Psicólogo · CRP 06/166223"
            className="mx-auto mb-6 w-52 lg:hidden"
          />
          <h1 className="text-2xl font-extrabold tracking-tight">Área do Paciente</h1>
          <p className="mt-1.5 mb-6 text-sm text-[var(--text-soft)]">
            Que bom ter você de volta. Entre para acompanhar seu cuidado. ❤️
          </p>
          <Card className="p-7">
            <LoginForm demo={demo} />
            {demo && (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <ButtonLink href="/" variant="secondary" size="sm" className="w-full">
                  Entrar como paciente demo →
                </ButtonLink>
              </div>
            )}
          </Card>
          <p className="mt-6 text-center text-xs text-[var(--text-soft)]">
            <Link href={BRAND.siteUrl} className="font-semibold hover:text-[var(--accent)]">
              ← Voltar ao site
            </Link>
            {" · "}Conexão criptografada (TLS) · dados conforme a LGPD
          </p>
        </div>
      </section>
    </main>
  );
}
