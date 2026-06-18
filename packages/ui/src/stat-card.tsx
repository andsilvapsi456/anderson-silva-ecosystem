import * as React from "react";
import { Card } from "./card";

/** Cartão de indicador para dashboards (KPI). */
export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card className="px-6 py-5">
      <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">{label}</p>
      <p className="mt-2 text-[28px] font-extrabold tracking-tight leading-none">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[12px]">
        {trend && (
          <span className={`font-bold ${trend.positive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
        {hint && <span className="text-[var(--text-soft)]">{hint}</span>}
      </div>
    </Card>
  );
}
