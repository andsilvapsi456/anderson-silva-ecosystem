import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, StatCard } from "@as/ui";
import { formatBRL } from "@as/shared";
import { getAllDiaryEntries, getPatientReport, getPatients, getReportStats } from "../../../lib/data";
import { ReportFilters } from "../../../components/report-filters";

const AGE_BANDS: { label: string; min: number; max: number }[] = [
  { label: "Crianças (0–12)", min: 0, max: 12 },
  { label: "Adolescentes (13–20)", min: 13, max: 20 },
  { label: "Jovens adultos (21–40)", min: 21, max: 40 },
  { label: "Adultos (41–60)", min: 41, max: 60 },
  { label: "Idosos (61+)", min: 61, max: 200 },
];

const MOOD_INFO = [
  { value: 5, label: "😄 Muito boa" },
  { value: 4, label: "🙂 Boa" },
  { value: 3, label: "😐 Neutra" },
  { value: 2, label: "😕 Difícil" },
  { value: 1, label: "😞 Muito difícil" },
];

function age(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
  return a;
}

/** Pizza SVG sem dependências. */
function Pie({ data, size = 150 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  const r = size / 2;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const sweep = (d.value / total) * 360;
      const a0 = (angle * Math.PI) / 180;
      const a1 = ((angle + sweep) * Math.PI) / 180;
      angle += sweep;
      const large = sweep > 180 ? 1 : 0;
      const path =
        sweep >= 360
          ? `M ${r} 0 A ${r} ${r} 0 1 1 ${r - 0.01} 0 Z`
          : `M ${r} ${r} L ${r + r * Math.cos(a0)} ${r + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${r + r * Math.cos(a1)} ${r + r * Math.sin(a1)} Z`;
      return { ...d, path };
    });
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color}>
            <title>{`${s.label}: ${s.value}`}</title>
          </path>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[var(--text-soft)]">
        {data.map((d) => (
          <span key={d.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} /> {d.label} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}

function HBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-0.5 flex justify-between text-[12px] font-semibold">
            <span className="text-[var(--text-soft)]">{d.label}</span>
            <span>{d.value}</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--bg-alt)]">
            <div
              className="h-3 rounded-full bg-[var(--success)]"
              style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value > 0 ? 10 : 0 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; paciente?: string }>;
}) {
  const params = await searchParams;
  const year = Number(params.ano) || new Date().getFullYear();
  const month = params.mes ? Number(params.mes) : null;
  const patientId = params.paciente || null;

  const [s, patients, allDiaries] = await Promise.all([getReportStats(), getPatients(), getAllDiaryEntries()]);
  const patientReport = patientId ? await getPatientReport(patientId, year, month) : null;
  const periodLabel = month
    ? `${String(month).padStart(2, "0")}/${year}`
    : `ano de ${year}`;

  // faixa etária calculada dos cadastros reais
  const byAge = AGE_BANDS.map((band) => ({
    label: band.label,
    value: patients.filter((p) => {
      if (!p.birthDate) return false;
      const a = age(p.birthDate);
      return a >= band.min && a <= band.max;
    }).length,
  }));

  // sentimentos dos diários, respeitando os filtros de período e paciente
  const diariesInPeriod = allDiaries.filter((d) => {
    if (d.mood == null) return false;
    if (patientId && d.patientId !== patientId) return false;
    const dt = new Date(d.createdAt);
    return dt.getFullYear() === year && (month === null || dt.getMonth() + 1 === month);
  });
  const moodDist = MOOD_INFO.map((m) => ({
    label: m.label,
    value: diariesInPeriod.filter((d) => d.mood === m.value).length,
  }));
  const moodAvg =
    diariesInPeriod.length > 0
      ? diariesInPeriod.reduce((sum, d) => sum + (d.mood ?? 0), 0) / diariesInPeriod.length
      : null;

  const kpis = [
    { label: "Clientes ativos", value: s.active, icon: "❤️", color: "var(--success)" },
    { label: "Na lista de espera", value: s.waitlist, icon: "🕐", color: "var(--warning)" },
    { label: "Com alta", value: s.discharged, icon: "🏆", color: "var(--info)" },
    { label: "Desativados", value: s.deactivated, icon: "🚫", color: "var(--danger)" },
    { label: "Desistentes", value: s.dropouts, icon: "➖", color: "var(--text-soft)" },
  ];

  return (
    <>
      <PageHeader
        title="Relatórios"
        subtitle={`O perfil da sua clínica em números — ${periodLabel}.`}
        actions={<Button variant="secondary">Exportar PDF</Button>}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--text-soft)]">Período e paciente:</p>
        <ReportFilters
          patients={patients.map((p) => ({ id: p.id, name: p.name }))}
          years={[2024, 2025, 2026]}
        />
      </div>

      {/* ───── Relatório individual do paciente ───── */}
      {patientReport && (
        <Card className="mb-6 border-l-4 border-l-[var(--accent)]">
          <CardHeader>
            <CardTitle>
              <span className="mr-2 inline-block align-middle">
                <Avatar name={patientReport.patient.name} size={28} />
              </span>
              {patientReport.patient.name} — {periodLabel}
            </CardTitle>
            <Badge tone={patientReport.patient.active ? "success" : "neutral"}>
              {patientReport.patient.active ? "Ativo" : "Inativo"} · há {patientReport.monthsActive} meses
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Sessões no período"
                value={String(patientReport.sessions.total)}
                hint={`${patientReport.sessions.realizadas} realizadas · ${patientReport.sessions.confirmadas} a realizar`}
              />
              <StatCard
                label="Presença"
                value={`${patientReport.attendanceRate}%`}
                hint={`${patientReport.sessions.faltas} falta(s) · ${patientReport.sessions.canceladas} cancelada(s)`}
                trend={{ value: patientReport.attendanceRate >= 80 ? "boa adesão" : "atenção", positive: patientReport.attendanceRate >= 80 }}
              />
              <StatCard
                label="Receita paga"
                value={formatBRL(patientReport.revenue.paidCents)}
                hint={patientReport.revenue.openCents > 0 ? `${formatBRL(patientReport.revenue.openCents)} em aberto` : "nada em aberto ✨"}
              />
              <StatCard
                label="Ticket médio"
                value={patientReport.revenue.avgTicketCents ? formatBRL(patientReport.revenue.avgTicketCents) : "—"}
                hint="por pagamento no período"
              />
              {patientReport.mood && (
                <StatCard
                  label="Humor (diário)"
                  value={`${patientReport.mood.average.toFixed(1).replace(".", ",")} / 5`}
                  hint={`${patientReport.mood.count} check-ins no período`}
                  trend={{
                    value: `${patientReport.mood.delta > 0 ? "+" : ""}${patientReport.mood.delta.toFixed(1).replace(".", ",")}`,
                    positive: patientReport.mood.delta >= 0,
                  }}
                />
              )}
            </div>
            <p className="mt-4 text-xs text-[var(--text-soft)]">
              Ver histórico completo na{" "}
              <a href={`/pacientes/${patientReport.patient.id}`} className="font-bold text-[var(--accent)]">
                ficha do paciente →
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="px-5 py-4 text-center">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">{k.label}</p>
            <p className="mt-1.5 text-2xl font-extrabold" style={{ color: k.color }}>
              {k.icon} {k.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clientes por gênero</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={s.byGender} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faixa etária dos pacientes</CardTitle>
          </CardHeader>
          <CardContent>
            <HBars data={byAge} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentimentos do diário — {periodLabel}</CardTitle>
            {moodAvg !== null && (
              <span className="text-sm font-extrabold text-[var(--accent)]">
                média {moodAvg.toFixed(1).replace(".", ",")} / 5
              </span>
            )}
          </CardHeader>
          <CardContent>
            {diariesInPeriod.length === 0 ? (
              <p className="py-6 text-sm text-[var(--text-soft)]">
                Nenhum check-in de humor no período{patientId ? " para este paciente" : ""}.
              </p>
            ) : (
              <>
                <HBars data={moodDist} />
                <p className="mt-3 text-xs text-[var(--text-soft)]">
                  {diariesInPeriod.length} check-ins{patientId ? " deste paciente" : " de todos os pacientes"} ·
                  conteúdo das anotações permanece restrito à ficha (sigilo clínico).
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de plano financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie data={s.byPlan} />
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <p className="text-sm font-bold">Clientes com cobrança automática habilitada</p>
              <div className="mt-2 flex h-7 overflow-hidden rounded-[var(--radius-xs)] text-[11px] font-extrabold text-white">
                <div className="flex items-center justify-center bg-[var(--info)]" style={{ width: `${s.autoChargePct}%` }}>
                  {s.autoChargePct}%
                </div>
                <div className="flex flex-1 items-center justify-center bg-[var(--border-strong)] text-[var(--text-soft)]">
                  {100 - s.autoChargePct}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Onde nos conheceu?</CardTitle>
            </CardHeader>
            <CardContent>
              <HBars data={s.bySource} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Indicado por</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-[var(--border)]">
                {s.referrals.map((r) => (
                  <li key={r.name} className="flex justify-between px-6 py-3 text-sm">
                    <span className="font-semibold">{r.name}</span>
                    <span className="font-extrabold text-[var(--accent)]">{r.count} indicações</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
