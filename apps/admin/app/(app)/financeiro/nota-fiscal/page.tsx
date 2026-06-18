import { Badge, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@as/ui";
import { getTransactions } from "../../../../lib/data";
import { isNfseConfigured } from "../../../../lib/nfse";
import { NfseRow } from "../../../../components/nfse-row";

export default async function NotaFiscalPage() {
  const paid = (await getTransactions()).filter((t) => t.kind === "RECEITA" && t.status === "PAGO");
  const configured = isNfseConfigured();

  return (
    <>
      <PageHeader
        title="Nota fiscal — NFS-e Osasco/SP"
        subtitle="Emissão automática integrada à prefeitura (nfe.osasco.sp.gov.br)."
      />

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Status da integração</CardTitle>
          <Badge tone={configured ? "success" : "warning"}>{configured ? "Conectada" : "Aguardando configuração"}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--text-soft)]">
          <p>
            Osasco é município integrado dos emissores fiscais — usamos a <strong>Focus NFe</strong> (guia oficial
            para Osasco). Como funciona: pagamento confirmado → NFS-e emitida com o CPF do paciente → PDF/XML anexados
            ao cadastro e disponíveis no portal. Serviço enquadrado como <strong>psicologia (item 4.16, LC 116/2003)</strong>.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Gere o <strong>token de integração</strong> no portal da prefeitura (
              <span className="font-mono text-xs">nfe.osasco.sp.gov.br</span> → acesso do contribuinte);
            </li>
            <li>Crie a conta na Focus NFe e cadastre seu CNPJ/CPF + inscrição municipal usando esse token;</li>
            <li>
              Preencha <span className="font-mono text-xs">FOCUS_NFE_TOKEN</span> no <span className="font-mono text-xs">.env</span> — homologação é gratuita para testar.
            </li>
          </ol>
          <p className="rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3 text-xs">
            💡 As notas emitidas alimentam automaticamente o relatório do <strong>Receita Saúde</strong> (Carnê-Leão),
            com CPF, valor e competência prontos para lançamento.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos aptos a emissão</CardTitle>
          <Badge tone="info">{paid.length} cobrança(s) paga(s)</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {paid.length === 0 ? (
            <p className="px-6 py-8 text-sm text-[var(--text-soft)]">Nenhum pagamento aguardando nota.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {paid.map((t) => (
                <NfseRow key={t.id} tx={t} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
