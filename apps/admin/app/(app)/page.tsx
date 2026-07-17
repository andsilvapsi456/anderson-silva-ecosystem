import { Card, CardContent, CardHeader, CardTitle } from "@as/ui";
import { formatBRL, greeting } from "@as/shared";
import { getAppointments, getDashboardStats, getPaymentBadge, getBillingConfigs } from "../../lib/data";
import { UpcomingSessions, type SessionRow } from "../../components/upcoming-sessions";
import { KpiTile, I } from "../../components/dashboard-kpis";

/** Gráfico de receita — barras com gradiente, valores e linha-base (6 meses). */
function RevenueChart() {
  const months = [
    { m: "Jan", v: 4900 },
    { m: "Fev", v: 4300 },
    { m: "Mar", v: 6000 },
    { m: "Abr", v: 5200 },
    { m: "Mai", v: 6300 },
    { m: "Jun", v: 6600 },
  ];
  const max = Math.max(...months.map((x) => x.v));
  return (
    <div className="flex h-44 items-end gap-3">
      {months.map((x, i) => (
        <div key={x.m} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-bold text-[var(--text-soft)]">{(x.v / 1000).toFixed(1)}k</span>
          <div
            className="w-full rounded-t-[6px] transition-all"
            style={{
              height: `${(x.v / max) * 100}%`,
              background:
                i === months.length - 1
                  ? "linear-gradient(180deg, var(--accent), var(--accent-hover))"
                  : "linear-gradient(180deg, var(--accent-soft), color-mix(in srgb, var(--accent) 30%, transparent))",
            }}
            title={`${x.m}: ${formatBRL(x.v * 100)}`}
          />
          <span className="text-[10px] font-bold text-[var(--text-soft)]">{x.m}</span>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, appointments, billing] = await Promise.all([
    getDashboardStats(),
    getAppointments(),
    getBillingConfigs(),
  ]);

  // só a janela que a lista exibe (hoje → +7d, com folga de fuso) — evita
  // mapear todo o histórico de sessões a cada render do dashboard
  const windowStart = Date.now() - 24 * 3600_000;
  const windowEnd = Date.now() + 8 * 86_400_000;
  const upcoming: SessionRow[] = await Promise.all(
    appointments
      .filter((a) => {
        const t = new Date(a.startsAt).getTime();
        return a.status !== "CANCELADA" && t >= windowStart && t <= windowEnd;
      })
      .map(async (a) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patientName,
        startsAt: a.startsAt,
        mode: a.mode,
        payment: await getPaymentBadge(a),
        amountCents: billing.find((b) => b.patientId === a.patientId)?.amountCents ?? null,
        videoLink: a.videoLink,
      }))
  );

  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });

  return (
    <>
      {/* Saudação calorosa em vez de "Visão geral" */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight">{greeting("Anderson")}</h1>
        <p className="mt-1 text-sm capitalize text-[var(--text-soft)]">{today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile icon={I.patients} tone="accent" label="Pacientes ativos" value={String(stats.activePatients)} trend={{ value: "+1", positive: true }} />
        <KpiTile icon={I.sessions} tone="info" label="Sessões realizadas" value={String(stats.sessionsDone)} hint="últimos 30 dias" />
        <KpiTile icon={I.revenue} tone="success" label="Receita mensal" value={formatBRL(stats.monthlyRevenueCents)} trend={{ value: "8%", positive: true }} />
        <KpiTile icon={I.year} tone="violet" label="Receita anual" value={formatBRL(stats.yearlyRevenueCents)} hint="acumulado 2026" />
        <KpiTile
          icon={I.receivable}
          tone="warning"
          label="A receber"
          value={formatBRL(stats.openReceivablesCents)}
          hint={stats.overdueCount > 0 ? `${stats.overdueCount} cobrança(s) atrasada(s)` : "nada atrasado ✨"}
        />
        <KpiTile icon={I.noshow} tone="danger" label="Taxa de faltas" value={`${stats.noShowRate}%`} trend={{ value: "2%", positive: false }} />
        <KpiTile icon={I.occupancy} tone="info" label="Ocupação da agenda" value={`${stats.occupancy}%`} hint="slots preenchidos" />
        <KpiTile icon={I.newPatient} tone="accent" label="Pacientes novos" value={String(stats.newPatientsMonth)} hint="este mês" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UpcomingSessions sessions={upcoming} />
        </div>
        <Card className="lg:col-span-2 self-start">
          <CardHeader>
            <CardTitle>Receita — últimos 6 meses</CardTitle>
            <span className="text-sm font-extrabold text-[var(--success)]">{formatBRL(6600_00)}</span>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
