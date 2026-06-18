import { Badge, Button, Card, PageHeader } from "@as/ui";
import { formatBRL } from "@as/shared";
import { getBillingConfigs } from "../../../../lib/data";

const planLabel: Record<string, string> = {
  MENSALISTA: "Mensalista",
  PACOTE_MENSAL: "Pacote mensal",
  SESSAO_AVULSA: "Sessão avulsa",
  ISENTO: "Isento",
};

export default async function ConfiguracaoCobrancaPage() {
  const configs = await getBillingConfigs();

  return (
    <>
      <PageHeader
        title="Configuração por cliente"
        subtitle="Plano, valor, dia acordado para pagamento e canais de envio de cada paciente."
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-175 text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-soft)]">
              <th className="px-6 py-3">Paciente</th>
              <th className="px-4 py-3">Plano</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-center">Dia acordado</th>
              <th className="px-4 py-3">Canais</th>
              <th className="px-4 py-3">Cobrança automática</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {configs.map((c) => (
              <tr key={c.patientId} className="hover:bg-[var(--bg-alt)]">
                <td className="px-6 py-3.5 font-bold">{c.patientName}</td>
                <td className="px-4 py-3.5">
                  <Badge tone={c.plan === "ISENTO" ? "info" : "accent"}>{planLabel[c.plan]}</Badge>
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold">{formatBRL(c.amountCents)}</td>
                <td className="px-4 py-3.5 text-center font-bold">dia {c.billingDay}</td>
                <td className="px-4 py-3.5">
                  {c.channels.includes("EMAIL") && <span title="E-mail">📧 </span>}
                  {c.channels.includes("WHATSAPP") && <span title="WhatsApp">📱</span>}
                </td>
                <td className="px-4 py-3.5">
                  <Badge tone={c.autoCharge ? "success" : "neutral"}>{c.autoCharge ? "Habilitada" : "Manual"}</Badge>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <Button size="sm" variant="ghost">
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-xs text-[var(--text-soft)]">
        Como funciona: no dia acordado, o sistema gera a cobrança, envia a mensagem acolhedora com os dados de
        pagamento (PIX) pelos canais configurados e agenda um lembrete gentil caso o pagamento não seja identificado
        em 5 dias. Tudo registrado na trilha de auditoria.
      </p>
    </>
  );
}
