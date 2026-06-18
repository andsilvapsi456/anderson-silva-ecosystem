"use client";

import * as React from "react";

/** Controle segmentado (Individual | Grupo | Evento geral). */
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-[var(--radius-sm)] border border-[var(--border-strong)] p-0.5 bg-[var(--bg-alt)]">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-[8px] px-4 py-1.5 text-sm font-bold transition-colors cursor-pointer ${
            value === opt
              ? "bg-[var(--accent)] text-[var(--on-accent)]"
              : "text-[var(--text-soft)] hover:text-[var(--text)]"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
