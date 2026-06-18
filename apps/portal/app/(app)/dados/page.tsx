import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, PageHeader } from "@as/ui";
import { getMe } from "../../../lib/data";
import { updateMyContact, updateMyPhoto } from "./actions";
import { PhotoUploader } from "../../../components/photo-uploader";

export default async function DadosPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const [me, params] = await Promise.all([getMe(), searchParams]);

  return (
    <>
      <PageHeader title="Meus dados" subtitle="Mantenha seus contatos atualizados para lembretes e recibos." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados de contato</CardTitle>
          </CardHeader>
          <CardContent>
            {params.ok && (
              <p className="mb-4 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)]">
                Dados atualizados com sucesso ✨
              </p>
            )}
            <div className="mb-6 border-b border-[var(--border)] pb-5">
              <PhotoUploader name={me.name} photoUrl={me.photoUrl} onSave={updateMyPhoto} />
            </div>
            {/* Server Action com RLS — paciente só edita o próprio registro */}
            <form action={updateMyContact} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefone">
                  <Input name="phone" defaultValue={me.phone ?? ""} />
                </Field>
                <Field label="WhatsApp">
                  <Input name="whatsapp" defaultValue={me.whatsapp ?? ""} />
                </Field>
              </div>
              <Field label="E-mail">
                <Input name="email" type="email" defaultValue={me.email ?? ""} />
              </Field>
              <Field label="Endereço">
                <Input name="address" defaultValue={me.address ?? ""} />
              </Field>
              <Button type="submit">Salvar alterações</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacidade (LGPD)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[var(--text-soft)]">
            <p>Seus dados clínicos são protegidos por sigilo profissional e criptografia.</p>
            <p>
              Você pode solicitar a exportação ou exclusão dos seus dados cadastrais a qualquer momento pelo WhatsApp
              da clínica.
            </p>
            <p className="font-semibold text-[var(--text)]">
              Consentimentos ativos: tratamento de dados · teleatendimento
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
