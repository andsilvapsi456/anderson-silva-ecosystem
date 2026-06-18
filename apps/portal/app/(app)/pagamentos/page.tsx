import { Badge, Card, PageHeader, StatCard, statusLabel, statusTone } from "@as/ui";
import { formatBRL, formatDate } from "@as/shared";
import { getMyTransactions } from "../../../lib/data";

const methodLabel: Record<string, string> = {
  PIX: "PIX",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
};

export default async function PagamentosPage() {
  const transactions = await getMyTransactions();
  const open = transactions.filter((t) => t.status === "PENDENTE" || t.status === "ATRASADO");

  return (
    <>
      <PageHeader title="Pagamentos" subtitle="Acompanhe cobranças, histórico e formas de pagamento." />

      <div className="mb-6 max-w-sm">
        <StatCard
          label="Em aberto"
          value={formatBRL(open.reduce((s, t) => s + t.amountCents, 0))}
          hint={open.length > 0 ? `${open.length} cobrança(s)` : "tudo em dia ✨"}
        />
      </div>

      <Card>
        <ul className="divide-y divide-[var(--border)]">
          {transactions.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <div className="flex-1 min-w-44">
                <p className="text-sm font-bold">{t.description}</p>
                <p className="text-xs text-[var(--text-soft)]">
                  Vencimento {formatDate(t.dueDate)}
                  {t.method ? ` · ${methodLabel[t.method]}` : ""}
                  {t.paidAt ? ` · pago em ${formatDate(t.paidAt)}` : ""}
                </p>
              </div>
              <p className="font-extrabold">{formatBRL(t.amountCents)}</p>
              <Badge tone={statusTone[t.status]}>{statusLabel[t.status]}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-4 text-xs text-[var(--text-soft)]">
        Aceitamos PIX, cartão e boleto. Dúvidas sobre alguma cobrança? Chame a clínica no WhatsApp.
      </p>
    </>
  );
}
