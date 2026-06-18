import * as React from "react";

export interface MoodPoint {
  createdAt: string;
  mood: number; // 1–5
}

export interface MoodStats {
  count: number;
  average: number;
  /** média da metade recente − média da metade antiga (≥ +0.5 melhora, ≤ −0.5 atenção) */
  delta: number;
  trend: "melhora" | "estavel" | "atencao";
  last: number;
}

const MOOD_EMOJI = ["", "😞", "😕", "😐", "🙂", "😄"];

/** Estatísticas do humor — usadas na ficha, nos relatórios e no portal. */
export function computeMoodStats(points: MoodPoint[]): MoodStats | null {
  const ordered = [...points]
    .filter((p) => p.mood >= 1 && p.mood <= 5)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (ordered.length < 2) return null;

  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const moods = ordered.map((p) => p.mood);
  const half = Math.floor(moods.length / 2);
  const delta = avg(moods.slice(half)) - avg(moods.slice(0, half));

  return {
    count: moods.length,
    average: Math.round(avg(moods) * 10) / 10,
    delta: Math.round(delta * 10) / 10,
    trend: delta >= 0.5 ? "melhora" : delta <= -0.5 ? "atencao" : "estavel",
    last: moods[moods.length - 1],
  };
}

/**
 * Gráfico de evolução do humor (1–5) — SVG puro, sem dependências.
 * Eixo Y com emojis; pontos coloridos pela escala; linha suave.
 */
export function MoodChart({ points, height = 160 }: { points: MoodPoint[]; height?: number }) {
  const ordered = [...points]
    .filter((p) => p.mood >= 1 && p.mood <= 5)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (ordered.length < 2) return null;

  const W = 600;
  const PAD_L = 34;
  const PAD_R = 14;
  const PAD_Y = 18;
  const innerW = W - PAD_L - PAD_R;
  const innerH = height - PAD_Y * 2;

  const x = (i: number) => PAD_L + (i / (ordered.length - 1)) * innerW;
  const y = (mood: number) => PAD_Y + ((5 - mood) / 4) * innerH;

  const path = ordered.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.mood).toFixed(1)}`).join(" ");
  const moodColor = (m: number) =>
    m >= 4 ? "var(--success)" : m === 3 ? "var(--warning)" : "var(--danger)";

  const first = new Date(ordered[0].createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const lastD = new Date(ordered[ordered.length - 1].createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Evolução do humor" className="w-full">
      {/* linhas-guia + emojis do eixo */}
      {[1, 2, 3, 4, 5].map((m) => (
        <g key={m}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(m)} y2={y(m)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4" />
          <text x={PAD_L - 8} y={y(m) + 5} textAnchor="end" fontSize="14">
            {MOOD_EMOJI[m]}
          </text>
        </g>
      ))}
      {/* linha do humor */}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* pontos */}
      {ordered.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.mood)} r="5" fill={moodColor(p.mood)} stroke="var(--surface)" strokeWidth="2">
          <title>{`${new Date(p.createdAt).toLocaleDateString("pt-BR")} — ${MOOD_EMOJI[p.mood]}`}</title>
        </circle>
      ))}
      {/* datas extremas */}
      <text x={PAD_L} y={height - 2} fontSize="10" fill="var(--text-soft)" fontWeight="700">
        {first}
      </text>
      <text x={W - PAD_R} y={height - 2} textAnchor="end" fontSize="10" fill="var(--text-soft)" fontWeight="700">
        {lastD}
      </text>
    </svg>
  );
}

export const trendView: Record<MoodStats["trend"], { label: string; tone: "success" | "warning" | "info" }> = {
  melhora: { label: "▲ em melhora", tone: "success" },
  estavel: { label: "● estável", tone: "info" },
  atencao: { label: "▼ atenção", tone: "warning" },
};
