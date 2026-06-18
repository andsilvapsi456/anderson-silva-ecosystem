import { ButtonLink, Card, CardHeader, CardTitle, CardContent, EmptyState, PageHeader } from "@as/ui";
import { formatBRL, formatDate } from "@as/shared";
import { getMyTransactions } from "../../../lib/data";

export default async function RecibosPage() {
  const transactions = await getMyTransactions();
  const receipts = transactions.filter((t) => t.receiptNumber);

  // anos com pagamentos confirmados → informe anual para o IR
  const anosPagos = [
    ...new Set(
      transactions
        .filter((t) => t.kind === "RECEITA" && t.status === "PAGO")
        .map((t) => new Date(t.paidAt ?? t.dueDate).getFullYear())
    ),
  ].sort((a, b) => b - a);

  return (
    <>
      <PageHeader
        title="Recibos e declarações"
        subtitle="Baixe recibos para reembolso de convênio ou declaração de Imposto de Renda."
      />

      {anosPagos.length > 0 && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>🧾 Informe anual para o Imposto de Renda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-[var(--text-soft)]">
              Documento com o total pago no ano, para deduzir despesas com psicoterapia na sua declaração.
            </p>
            <div className="flex flex-wrap gap-2">
              {anosPagos.map((y) => (
                <ButtonLink key={y} href={`/api/informe?year=${y}`} variant="secondary" size="sm">
                  Informe {y} ↓
                </ButtonLink>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        {receipts.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Nenhum recibo emitido ainda"
            description="Assim que um pagamento for confirmado, o recibo aparece aqui para download."
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {receipts.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <span aria-hidden className="text-xl">
                  🧾
                </span>
                <div className="flex-1 min-w-44">
                  <p className="text-sm font-bold">Recibo {t.receiptNumber}</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    {t.description} · {formatBRL(t.amountCents)} · {t.paidAt ? formatDate(t.paidAt) : "—"}
                  </p>
                </div>
                {/* PDF oficial gerado na hora a partir do template da marca */}
                <ButtonLink href={`/api/receipts/${t.id}`} variant="secondary" size="sm">
                  Baixar PDF ↓
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
