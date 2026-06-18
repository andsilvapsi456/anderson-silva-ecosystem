"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Modal, Switch } from "@as/ui";
import type { Holiday, LunchConfig, TimeBlock } from "@as/shared";
import { addTimeBlock, removeTimeBlock, saveAgendaPrefs } from "../app/actions/time-blocks";

const WEEKDAYS: [string, number][] = [
  ["Seg", 1],
  ["Ter", 2],
  ["Qua", 3],
  ["Qui", 4],
  ["Sex", 5],
  ["Sáb", 6],
  ["Dom", 0],
];

const field = "rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm";
const labelCls = "mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function AgendaBlocksManager({
  open,
  onClose,
  blocks,
  lunch,
  blockHolidays,
  holidays,
}: {
  open: boolean;
  onClose: () => void;
  blocks: TimeBlock[];
  lunch: LunchConfig;
  blockHolidays: boolean;
  holidays: Holiday[];
}) {
  const [lunchEnabled, setLunchEnabled] = React.useState(lunch.enabled);
  const [lunchStart, setLunchStart] = React.useState(lunch.start);
  const [lunchEnd, setLunchEnd] = React.useState(lunch.end);
  const [weekdays, setWeekdays] = React.useState<number[]>(lunch.weekdays);
  const [holidaysOn, setHolidaysOn] = React.useState(blockHolidays);
  const [list, setList] = React.useState<TimeBlock[]>(blocks);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();

  function toggleDay(d: number) {
    setWeekdays((w) => (w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort()));
  }

  async function savePrefs() {
    setBusy(true);
    const res = await saveAgendaPrefs({ lunchEnabled, lunchStart, lunchEnd, weekdays, blockHolidays: holidaysOn });
    setBusy(false);
    if (res.ok) {
      setMsg(`Preferências salvas${res.demo ? " (demo)" : ""} ✓`);
      if (!res.demo) router.refresh();
    } else {
      setMsg(res.error ?? "Falha ao salvar.");
    }
  }

  async function addOneOff(formData: FormData) {
    setBusy(true);
    const res = await addTimeBlock({ ok: false }, formData);
    setBusy(false);
    if (res.ok) {
      setMsg(`Bloqueio adicionado${res.demo ? " (demo)" : ""} ✓`);
      if (res.demo) {
        setList((p) =>
          [
            ...p,
            {
              id: `tmp-${Date.now()}`,
              title: String(formData.get("title")),
              kind: String(formData.get("kind")) as TimeBlock["kind"],
              startsAt: new Date(String(formData.get("start"))).toISOString(),
              endsAt: new Date(String(formData.get("end"))).toISOString(),
            },
          ].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        );
      } else {
        router.refresh();
      }
      formRef.current?.reset();
    } else {
      setMsg(res.error ?? "Falha.");
    }
  }

  async function removeOneOff(id: string) {
    const res = await removeTimeBlock(id);
    if (res.ok) {
      setList((p) => p.filter((b) => b.id !== id));
      if (!res.demo) router.refresh();
    }
  }

  const scopeLabel: Record<Holiday["scope"], string> = {
    nacional: "Nacional",
    "estadual-sp": "Estado SP",
    "municipal-sp": "Cidade SP",
  };

  return (
    <Modal open={open} onClose={onClose} title="Bloqueios da agenda" maxWidth={640}>
      <div className="space-y-6">
        {/* ── Almoço ── */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-extrabold">🍽️ Horário de almoço</h3>
            <Switch checked={lunchEnabled} onChange={setLunchEnabled} label="Bloquear almoço" />
          </div>
          <div className={`grid gap-3 sm:grid-cols-2 ${lunchEnabled ? "" : "opacity-50"}`}>
            <label>
              <span className={labelCls}>Início</span>
              <input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} disabled={!lunchEnabled} className={`w-full ${field}`} />
            </label>
            <label>
              <span className={labelCls}>Fim</span>
              <input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} disabled={!lunchEnabled} className={`w-full ${field}`} />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WEEKDAYS.map(([label, d]) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                disabled={!lunchEnabled}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:opacity-50 ${
                  weekdays.includes(d)
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border)] text-[var(--text-soft)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Feriados ── */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-extrabold">🇧🇷 Feriados (nacionais + SP)</h3>
            <Switch checked={holidaysOn} onChange={setHolidaysOn} label="Bloquear feriados" />
          </div>
          <p className="mb-2 text-xs text-[var(--text-soft)]">
            Inclui feriados nacionais, do Estado de São Paulo e da cidade de São Paulo (atualizados a cada ano).
          </p>
          {holidaysOn && holidays.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border)] p-2 text-sm">
              {holidays.map((h) => (
                <li key={h.date + h.name} className="flex items-center gap-2">
                  <span className="w-20 text-xs font-bold text-[var(--text-soft)]">
                    {new Date(h.date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex-1 truncate">{h.name}</span>
                  <Badge tone="neutral" className="!text-[9px]">
                    {scopeLabel[h.scope]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-2">
          <Button onClick={savePrefs} disabled={busy}>
            {busy ? "Salvando…" : "Salvar almoço e feriados"}
          </Button>
        </div>

        {/* ── Bloqueios avulsos ── */}
        <section className="border-t border-[var(--border)] pt-5">
          <h3 className="mb-2 text-sm font-extrabold">🚫 Bloqueios avulsos (férias, folgas, eventos)</h3>
          <form ref={formRef} action={addOneOff} className="grid gap-2 sm:grid-cols-2">
            <input name="title" required placeholder="Ex.: Férias de julho" className={`sm:col-span-2 w-full ${field}`} />
            <select name="kind" defaultValue="FOLGA" className={`w-full ${field}`}>
              <option value="FERIAS">Férias</option>
              <option value="FOLGA">Folga</option>
              <option value="FERIADO">Feriado</option>
              <option value="OUTRO">Outro</option>
            </select>
            <span className="hidden sm:block" />
            <input type="datetime-local" name="start" required className={`w-full ${field}`} />
            <input type="datetime-local" name="end" required className={`w-full ${field}`} />
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary" disabled={busy}>
                Adicionar bloqueio
              </Button>
            </div>
          </form>
          {list.length > 0 && (
            <ul className="mt-3 divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)]">
              {list.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">
                    <strong>{b.title}</strong> · {fmt(b.startsAt)} → {fmt(b.endsAt)}
                  </span>
                  <button
                    onClick={() => removeOneOff(b.id)}
                    className="text-xs text-[var(--text-soft)] hover:text-[var(--danger)] cursor-pointer"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {msg && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-2 text-sm font-semibold text-[var(--success)]">
            {msg}
          </p>
        )}
      </div>
    </Modal>
  );
}
