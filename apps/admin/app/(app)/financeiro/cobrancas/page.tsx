import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@as/ui";
import { formatBRL, formatDate } from "@as/shared";
import { chargeMessageTemplate, getCharges } from "../../../../lib/data";

const statusView: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  PAGA: { label: "Paga", tone: "success" },
  ENVIADA: { label: "Enviada", tone: "info" },
  AGENDADA: { label: "Agendada", tone: "warning" },
  VENCIDA: { label: "Vencida", tone: "danger" },
};

export default async function CobrancasPage() {
  const charges = await getCharges();

  return (
    <>
      <PageHeader
        title="Cobranças geradas"
        subtitle="Envio automático por e-mail e WhatsApp na data acordada com cada paciente."
        actions={<Button>+ Nova cobrança</Button>}
      />

      <Card>
        <ul className="divide-y divide-[var(--border)]">
          {charges.map((c) => {
            const v = statusView[c.status];
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <div className="min-w-44 flex-1">
                  <p className="text-sm font-bold">{c.patientName}</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    {c.description} · {c.status === "AGENDADA" ? "envia em" : "enviada em"} {formatDate(c.scheduledFor)}
                  </p>
                </div>
                <span className="flex gap-1 text-base" title={c.channels.join(" + ")}>
                  {c.channels.includes("EMAIL") && <span aria-label="E-mail">📧</span>}
                  {c.channels.includes("WHATSAPP") && <span aria-label="WhatsApp">📱</span>}
                </span>
                <p className="w-24 text-right font-extrabold text-sm">{formatBRL(c.amountCents)}</p>
                <Badge tone={v.tone}>{v.label}</Badge>
                {c.status === "VENCIDA" && (
                  <Button size="sm" variant="secondary">
                    Reenviar
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Modelo da mensagem de cobrança</CardTitle>
          <Badge tone="accent">Profissional & acolhedora</Badge>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-5 py-4 font-sans text-sm leading-relaxed">
            {chargeMessageTemplate()}
          </pre>
          <p className="mt-3 text-xs text-[var(--text-soft)]">
            Os campos <code>{"{{…}}"}</code> são preenchidos automaticamente com os dados do paciente, o valor, a data
            acordada e a chave PIX. Edite o modelo em{" "}
            <a href="/configuracoes" className="font-bold text-[var(--accent)]">
              Configurações → Mensagens
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </>
  );
}
