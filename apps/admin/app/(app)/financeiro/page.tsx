import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, Select } from "@as/ui";
import { formatBRL, formatDate } from "@as/shared";
import { getTransactions } from "../../../lib/data";
import { ChargeActions } from "../../../components/charge-actions";

/** Dados anuais demo: [receita paga, receita prevista não paga] em R$ */
const YEAR = [
  { m: "Jan", paid: 4900, open: 1000 },
  { m: "Fev", paid: 4300, open: 0 },
  { m: "Mar", paid: 6000, open: 0 },
  { m: "Abr", paid: 5200, open: 200 },
  { m: "Mai", paid: 5100, open: 1200 },
  { m: "Jun", paid: 4300, open: 2300 },
  { m: "Jul", paid: 0, open: 5600 },
  { m: "Ago", paid: 0, open: 3700 },
  { m: "Set", paid: 0, open: 400 },
  { m: "Out", paid: 0, open: 300 },
  { m: "Nov", paid: 0, open: 0 },
  { m: "Dez", paid: 0, open: 0 },
];

function YearChart() {
  const max = Math.max(...YEAR.map((x) => x.paid + x.open), 1);
  return (
    <div>
      <div className="flex h-48 items-end gap-2">
        {YEAR.map((x) => (
          <div key={x.m} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex w-full flex-col justify-end" style={{ height: `${((x.paid + x.open) / max) * 100}%` }}>
              {x.open > 0 && (
                <div
                  className="w-full rounded-t-[4px] bg-[var(--success)] opacity-50"
                  style={{ height: `${(x.open / (x.paid + x.open)) * 100}%` }}
                  title={`${x.m} — previsto em aberto: R$ ${x.open.toLocaleString("pt-BR")}`}
                />
              )}
              {x.paid > 0 && (
                <div
                  className={`w-full bg-[var(--success)] ${x.open === 0 ? "rounded-t-[4px]" : ""}`}
                  style={{ height: `${(x.paid / (x.paid + x.open)) * 100}%` }}
                  title={`${x.m} — recebido: R$ ${x.paid.toLocaleString("pt-BR")}`}
                />
              )}
            </div>
            <span className="text-[10px] font-bold text-[var(--text-soft)]">{x.m}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-5 text-[11px] font-semibold text-[var(--text-soft)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-[var(--success)]" /> Receitas pagas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-[var(--success)] opacity-50" /> Receitas previstas (em aberto)
        </span>
      </div>
    </div>
  );
}

export default async function PainelFinanceiroPage() {
  const transactions = await getTransactions();
  const receitas = transactions.filter((t) => t.kind === "RECEITA");
  const despesas = transactions.filter((t) => t.kind === "DESPESA");

  const paid = receitas.filter((t) => t.status === "PAGO").reduce((s, t) => s + t.amountCents, 0);
  const open = receitas.filter((t) => t.status === "PENDENTE" || t.status === "ATRASADO").reduce((s, t) => s + t.amountCents, 0);
  const expPaid = despesas.filter((t) => t.status === "PAGO").reduce((s, t) => s + t.amountCents, 0);
  const expOpen = despesas.filter((t) => t.status !== "PAGO" && t.status !== "CANCELADO").reduce((s, t) => s + t.amountCents, 0);
  const overdue = receitas.filter((t) => t.status === "ATRASADO");
  const expOverdue = despesas.filter((t) => t.status === "ATRASADO");

  return (
    <>
      <PageHeader
        title="Painel financeiro"
        subtitle="Previsto vs. realizado no período."
        actions={
          <div className="flex items-center gap-2">
            <Select defaultValue="2026-06" className="!h-10 w-36">
              <option value="2026-06">Jun/2026</option>
              <option value="2026-05">Mai/2026</option>
              <option value="2026-04">Abr/2026</option>
            </Select>
            <Button variant="secondary">↻ Atualizar</Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="px-6 py-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">💰 Resultado previsto</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none">{formatBRL(paid + open - expPaid - expOpen)}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Resultado atual: <strong className="text-[var(--text)]">{formatBRL(paid - expPaid)}</strong>
          </p>
        </Card>
        <Card className="border-l-4 border-l-[var(--success)] px-6 py-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">↗ Receitas previstas</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-[var(--success)]">{formatBRL(paid + open)}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Pago: <strong className="text-[var(--text)]">{formatBRL(paid)}</strong> · Não pago:{" "}
            <strong className="text-[var(--text)]">{formatBRL(open)}</strong>
          </p>
        </Card>
        <Card className="border-l-4 border-l-[var(--danger)] px-6 py-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">↘ Despesas previstas</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none text-[var(--danger)]">{formatBRL(expPaid + expOpen)}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Pago: <strong className="text-[var(--text)]">{formatBRL(expPaid)}</strong> · A pagar:{" "}
            <strong className="text-[var(--text)]">{formatBRL(expOpen)}</strong>
          </p>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Resultado previsto (receitas e despesas) — ano 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <YearChart />
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>↓ Receitas atrasadas no período</CardTitle>
            <Button variant="ghost" size="sm">
              Listar mais
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {overdue.length === 0 ? (
              <p className="px-6 py-8 text-sm text-[var(--text-soft)]">Nenhuma receita atrasada. ✨</p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {overdue.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{t.patientName ?? t.description}</p>
                      <p className="text-xs text-[var(--text-soft)]">
                        {t.description} · vencimento{" "}
                        <strong className="text-[var(--danger)]">{formatDate(t.dueDate)}</strong>
                      </p>
                    </div>
                    <p className="font-extrabold text-sm">{formatBRL(t.amountCents)}</p>
                    <ChargeActions
                      tx={{
                        id: t.id,
                        patientName: t.patientName ?? t.description,
                        description: t.description,
                        amountCents: t.amountCents,
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>↑ Despesas atrasadas no período</CardTitle>
          </CardHeader>
          <CardContent>
            {expOverdue.length === 0 ? (
              <div className="flex items-center gap-4 py-4">
                <span className="text-5xl" aria-hidden>
                  🧑‍🚀
                </span>
                <div>
                  <p className="font-bold">Tudo certo!</p>
                  <p className="text-sm text-[var(--text-soft)]">
                    Não existem despesas atrasadas para hoje — nos vemos amanhã!
                  </p>
                </div>
              </div>
            ) : (
              <ul>
                {expOverdue.map((t) => (
                  <li key={t.id} className="flex justify-between py-2 text-sm">
                    <span>{t.description}</span>
                    <Badge tone="danger">{formatBRL(t.amountCents)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
