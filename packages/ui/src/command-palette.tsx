"use client";

import * as React from "react";

export interface CommandItem {
  label: string;
  href: string;
  hint?: string;
  icon?: string;
  group?: string;
}

/** Remove acentos e baixa caixa — busca tolerante a acentuação. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Busca global (⌘K / Ctrl+K). Abre também via evento
 * `window` "open-command-palette" (disparado por botões no shell).
 */
export function CommandPalette({
  items,
  onNavigate,
}: {
  items: CommandItem[];
  onNavigate: (href: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = norm(query.trim());
    const list = q ? items.filter((i) => norm(i.label + " " + (i.hint ?? "")).includes(q)) : items;
    return list.slice(0, 40);
  }, [query, items]);

  React.useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered, active]);

  function go(item: CommandItem | undefined) {
    if (!item) return;
    setOpen(false);
    onNavigate(item.href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 p-4 pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Busca global"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <span aria-hidden className="text-[var(--text-soft)]">
            🔍
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(filtered[active]);
              }
            }}
            placeholder="Buscar paciente, página, ação…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-soft)]"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-soft)]">
            ESC
          </kbd>
        </div>

        <ul className="max-h-[52vh] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-[var(--text-soft)]">Nada encontrado para “{query}”.</li>
          )}
          {filtered.map((item, i) => (
            <li key={`${item.href}-${i}`}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left ${
                  i === active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text)]"
                }`}
              >
                <span aria-hidden className="w-5 text-center">
                  {item.icon ?? "•"}
                </span>
                <span className="flex-1 truncate text-sm font-semibold">{item.label}</span>
                {item.hint && <span className="truncate text-xs text-[var(--text-soft)]">{item.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
