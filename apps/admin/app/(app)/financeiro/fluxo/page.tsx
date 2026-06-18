import { Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard } from "@as/ui";
import { formatBRL } from "@as/shared";
import { getTransactions } from "../../../../lib/data";

/** Fluxo de caixa — entradas, saídas e saldo acumulado (demo mensal). */
const FLOW = [
  { m: "Jan", in: 5900, out: 2500 },
  { m: "Fev", in: 4300, out: 2500 },
  { m: "Mar", in: 6000, out: 2600 },
  { m: "Abr", in: 5400, out: 2500 },
  { m: "Mai", in: 6300, out: 2700 },
  { m: "Jun", in: 6600, out: 2500 },
];

export default async function FluxoPage() {
  const transactions = await getTransactions();
  const inflow = transactions.filter((t) => t.kind === "RECEITA" && t.status === "PAGO").reduce((s, t) => s + t.amountCents, 0);
  const outflow = transactions.filter((t) => t.kind === "DESPESA" && t.status === "PAGO").reduce((s, t) => s + t.amountCents, 0);

  let acc = 0;
  const rows = FLOW.map((x) => {
    acc += x.in - x.out;
    return { ...x, balance: acc };
  });
  const max = Math.max(...FLOW.map((x) => x.in));

  return (
    <>
      <PageHeader title="Fluxo de caixa" subtitle="Entradas, saídas e saldo acumulado." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Entradas (mês)" value={formatBRL(inflow)} />
        <StatCard label="Saídas (mês)" value={formatBRL(outflow)} />
        <StatCard label="Saldo do mês" value={formatBRL(inflow - outflow)} trend={{ value: "positivo", positive: inflow >= outflow }} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Entradas × saídas — 1º semestre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-44 items-end gap-4">
            {rows.map((x) => (
              <div key={x.m} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div className="w-1/3 rounded-t-[4px] bg-[var(--success)]" style={{ height: `${(x.in / max) * 100}%` }} title={`Entradas: R$ ${x.in.toLocaleString("pt-BR")}`} />
                  <div className="w-1/3 rounded-t-[4px] bg-[var(--danger)] opacity-70" style={{ height: `${(x.out / max) * 100}%` }} title={`Saídas: R$ ${x.out.toLocaleString("pt-BR")}`} />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-soft)]">{x.m}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-100 text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-soft)]">
                  <th className="py-2">Mês</th>
                  <th className="py-2 text-right">Entradas</th>
                  <th className="py-2 text-right">Saídas</th>
                  <th className="py-2 text-right">Saldo acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((x) => (
                  <tr key={x.m}>
                    <td className="py-2 font-bold">{x.m}/2026</td>
                    <td className="py-2 text-right text-[var(--success)] font-semibold">R$ {x.in.toLocaleString("pt-BR")}</td>
                    <td className="py-2 text-right text-[var(--danger)] font-semibold">−R$ {x.out.toLocaleString("pt-BR")}</td>
                    <td className="py-2 text-right font-extrabold">R$ {x.balance.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
