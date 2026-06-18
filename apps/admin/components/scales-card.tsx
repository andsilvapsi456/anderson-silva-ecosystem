import { Badge, Card, CardContent, CardHeader, CardTitle } from "@as/ui";
import { formatDate, type ClinicalScale } from "@as/shared";

/** Mini-sparkline SVG dos escores de uma escala ao longo do tempo. */
function Sparkline({ scores, max }: { scores: number[]; max: number }) {
  const W = 280;
  const H = 64;
  const pad = 6;
  if (scores.length < 2) return null;
  const stepX = (W - pad * 2) / (scores.length - 1);
  const y = (v: number) => pad + (1 - v / max) * (H - pad * 2);
  const pts = scores.map((s, i) => `${pad + i * stepX},${y(s)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {scores.map((s, i) => (
        <circle key={i} cx={pad + i * stepX} cy={y(s)} r="3" fill="var(--accent)" />
      ))}
    </svg>
  );
}

/** Escalas clínicas aplicadas pelo psicólogo, com evolução por instrumento. */
export function ScalesCard({ scales }: { scales: ClinicalScale[] }) {
  if (scales.length === 0) return null;

  const byInstrument = new Map<string, ClinicalScale[]>();
  for (const s of scales) byInstrument.set(s.instrument, [...(byInstrument.get(s.instrument) ?? []), s]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Escalas clínicas</CardTitle>
        <Badge tone="neutral">Aplicadas em sessão</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {[...byInstrument.entries()].map(([instrument, list]) => {
          const sorted = [...list].sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));
          const first = sorted[0];
          const last = sorted[sorted.length - 1];
          const delta = last.score - first.score; // negativo = sintomas diminuíram
          const melhora = delta < 0;
          return (
            <div key={instrument}>
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <p className="text-sm font-bold">{instrument}</p>
                <span className="text-xs text-[var(--text-soft)]">
                  atual <strong className="text-[var(--text)]">{last.score}</strong>/{last.maxScore}
                </span>
                {sorted.length > 1 && (
                  <Badge tone={melhora ? "success" : delta > 0 ? "danger" : "neutral"} className="!text-[10px]">
                    {melhora ? "▼" : delta > 0 ? "▲" : "→"} {Math.abs(delta)} pts desde {formatDate(first.appliedAt)}
                  </Badge>
                )}
              </div>
              <Sparkline scores={sorted.map((s) => s.score)} max={last.maxScore} />
              <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                {sorted.length} medição(ões) · de {formatDate(first.appliedAt)} a {formatDate(last.appliedAt)}.
                Em escalas de sintomas (GAD-7/PHQ-9), pontuação menor indica melhora.
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
