import { Badge, Card, EmptyState, statusLabel, statusTone } from "@as/ui";
import { formatBRL, formatDate, type Transaction } from "@as/shared";

const methodLabel: Record<string, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
};

/** Tabela de lançamentos reutilizada por Receitas, Despesas e Extrato. */
export function TransactionsTable({ rows, emptyLabel }: { rows: Transaction[]; emptyLabel: string }) {
  return (
    <Card className="overflow-x-auto">
      {rows.length === 0 ? (
        <EmptyState icon="🧾" title={emptyLabel} />
      ) : (
        <table className="w-full min-w-150 text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-soft)]">
              <th className="px-6 py-3">Descrição</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-[var(--bg-alt)]">
                <td className="px-6 py-3.5">
                  <p className="font-bold">{t.patientName ?? t.description}</p>
                  {t.patientName && <p className="text-xs text-[var(--text-soft)]">{t.description}</p>}
                </td>
                <td className="px-4 py-3.5 text-[var(--text-soft)]">{formatDate(t.dueDate)}</td>
                <td className="px-4 py-3.5 text-[var(--text-soft)]">{t.method ? methodLabel[t.method] : "—"}</td>
                <td className={`px-4 py-3.5 text-right font-extrabold ${t.kind === "DESPESA" ? "text-[var(--danger)]" : ""}`}>
                  {t.kind === "DESPESA" ? "−" : ""}
                  {formatBRL(t.amountCents)}
                </td>
                <td className="px-6 py-3.5 text-right">
                  <Badge tone={statusTone[t.status]}>{statusLabel[t.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
