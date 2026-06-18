import * as React from "react";

type Tone = "accent" | "success" | "warning" | "danger" | "info" | "violet";

const toneVars: Record<Tone, { fg: string; bg: string }> = {
  accent: { fg: "var(--accent)", bg: "var(--accent-soft)" },
  success: { fg: "var(--success)", bg: "var(--success-soft)" },
  warning: { fg: "var(--warning)", bg: "var(--warning-soft)" },
  danger: { fg: "var(--danger)", bg: "var(--danger-soft)" },
  info: { fg: "var(--info)", bg: "var(--info-soft)" },
  violet: { fg: "#8b5cf6", bg: "rgba(139,92,246,.12)" },
};

/** KPI premium: ícone colorido, valor em destaque, rótulo e tendência. */
export function KpiTile({
  icon,
  tone,
  label,
  value,
  hint,
  trend,
}: {
  icon: React.ReactNode;
  tone: Tone;
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive: boolean };
}) {
  const c = toneVars[tone];
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: c.bg, color: c.fg }}
        >
          {icon}
        </span>
        {trend && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-extrabold"
            style={{
              color: trend.positive ? "var(--success)" : "var(--danger)",
              background: trend.positive ? "var(--success-soft)" : "var(--danger-soft)",
            }}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight">{value}</p>
      <p className="mt-1.5 text-[13px] font-bold text-[var(--text)]">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--text-soft)]">{hint}</p>}
    </div>
  );
}

/* ícones SVG (traço 1.8) — crispos em qualquer DPI */
const s = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const I = {
  patients: (<svg {...s}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.4M21 20a6 6 0 0 0-4-5.6" /></svg>),
  sessions: (<svg {...s}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 3v3M16 3v3" /></svg>),
  revenue: (<svg {...s}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>),
  year: (<svg {...s}><path d="M3 17l5-5 3 3 7-7" /><path d="M14 8h4v4" /></svg>),
  receivable: (<svg {...s}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>),
  noshow: (<svg {...s}><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></svg>),
  occupancy: (<svg {...s}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  newPatient: (<svg {...s}><circle cx="10" cy="8" r="3.2" /><path d="M4 20a6 6 0 0 1 12 0M19 8v6M16 11h6" /></svg>),
};
