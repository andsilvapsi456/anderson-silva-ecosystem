"use client";

import * as React from "react";

export interface DropdownItem {
  icon?: string;
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
}

/** Menu suspenso simples (estilo Linear) — fecha ao clicar fora ou selecionar. */
export function Dropdown({
  trigger,
  items,
  align = "right",
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      {open && (
        <div
          className={`absolute z-40 mt-2 min-w-56 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[var(--shadow)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect?.();
              }}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-xs)] px-3 py-2 text-left text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-alt)] disabled:opacity-50 cursor-pointer"
            >
              {item.icon && (
                <span aria-hidden className="w-5 text-center">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
