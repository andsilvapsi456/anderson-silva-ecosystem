import { verifyIntakeToken } from "@as/auth/intake";
import { isDemoMode } from "@as/auth";
import { mockPatients } from "@as/shared";
import { Card } from "@as/ui";
import { IntakeForm } from "../../../components/intake-form";

async function getPatientFirstName(patientId: string): Promise<string | null> {
  if (isDemoMode()) {
    return mockPatients.find((p) => p.id === patientId)?.name.split(" ")[0] ?? "paciente";
  }
  // leitura pontual via service role (página pública, sem sessão)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients?id=eq.${patientId}&select=name,social_name`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      cache: "no-store",
    }
  );
  const rows = await res.json().catch(() => []);
  const name: string | undefined = rows?.[0]?.social_name ?? rows?.[0]?.name;
  return name ? name.split(" ")[0] : null;
}

export const metadata = { title: "Cadastro · Anderson V. V. Silva", robots: { index: false } };

export default async function CadastroPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const verified = verifyIntakeToken(token);
  const firstName = verified ? await getPatientFirstName(verified.patientId) : null;

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <img src="/brand/logo.png" alt="Anderson V. V. Silva · Psicólogo · CRP 06/166223" className="mx-auto w-56" />
        </div>

        {!verified || !firstName ? (
          <Card className="p-8 text-center">
            <p className="text-lg font-extrabold">Link inválido ou expirado 😕</p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">
              Por segurança, este link tem validade de 7 dias. Peça um novo ao Anderson pelo WhatsApp.
            </p>
          </Card>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Que bom ter você aqui, {firstName}! ❤️</h1>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-[var(--text-soft)]">
              Para começarmos com tudo organizado, preencha os dados abaixo — eles completam seu cadastro e seu
              prontuário. Leva menos de 2 minutos.
            </p>
            <Card className="p-7">
              <IntakeForm token={token} />
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
