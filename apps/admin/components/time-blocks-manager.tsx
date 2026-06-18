"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@as/ui";
import type { TimeBlock, TimeBlockKind } from "@as/shared";
import { addTimeBlock, removeTimeBlock } from "../app/actions/time-blocks";

const KIND_LABEL: Record<TimeBlockKind, string> = {
  FERIAS: "Férias",
  FOLGA: "Folga",
  FERIADO: "Feriado",
  ALMOCO: "Almoço",
  OUTRO: "Outro",
};

const field =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm";
const labelCls = "mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function TimeBlocksManager({ blocks }: { blocks: TimeBlock[] }) {
  const [list, setList] = React.useState<TimeBlock[]>(blocks);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function add(formData: FormData) {
    setBusy(true);
    const res = await addTimeBlock({ ok: false }, formData);
    setBusy(false);
    if (res.ok) {
      setMsg(`Bloqueio adicionado${res.demo ? " (demo)" : ""} ✓`);
      if (res.demo) {
        const start = String(formData.get("start"));
        const end = String(formData.get("end"));
        setList((prev) =>
          [
            ...prev,
            {
              id: `tmp-${Date.now()}`,
              title: String(formData.get("title")),
              kind: String(formData.get("kind")) as TimeBlockKind,
              startsAt: new Date(start).toISOString(),
              endsAt: new Date(end).toISOString(),
            },
          ].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        );
      } else {
        router.refresh();
      }
      formRef.current?.reset();
    } else {
      setMsg(res.error ?? "Não foi possível salvar.");
    }
  }

  async function remove(id: string) {
    const res = await removeTimeBlock(id);
    if (res.ok) {
      setList((prev) => prev.filter((b) => b.id !== id));
      setMsg(`Bloqueio removido${res.demo ? " (demo)" : ""} ✓`);
      if (!res.demo) router.refresh();
    } else {
      setMsg(res.error ?? "Não foi possível remover.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🚫 Bloqueios de agenda</CardTitle>
        <Badge tone="neutral">Férias · folgas · feriados</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-soft)]">
          Nenhuma sessão pode ser marcada nesses períodos — a agenda recusa automaticamente e mostra a faixa bloqueada.
        </p>

        <form ref={formRef} action={add} className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelCls}>O que é</span>
            <input name="title" required placeholder="Ex.: Férias de julho" className={field} />
          </label>
          <label>
            <span className={labelCls}>Tipo</span>
            <select name="kind" defaultValue="FOLGA" className={field}>
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <span />
          <label>
            <span className={labelCls}>Início</span>
            <input type="datetime-local" name="start" required className={field} />
          </label>
          <label>
            <span className={labelCls}>Fim</span>
            <input type="datetime-local" name="end" required className={field} />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Adicionar bloqueio"}
            </Button>
          </div>
        </form>

        {msg && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-2 text-sm font-semibold text-[var(--success)]">
            {msg}
          </p>
        )}

        {list.length === 0 ? (
          <p className="text-sm text-[var(--text-soft)]">Nenhum bloqueio cadastrado.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-[var(--radius-sm)] border border-[var(--border)]">
            {list.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                <Badge tone="neutral" className="!text-[10px]">
                  {KIND_LABEL[b.kind]}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold">{b.title}</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    {fmt(b.startsAt)} → {fmt(b.endsAt)}
                  </p>
                </div>
                <button
                  onClick={() => remove(b.id)}
                  className="rounded-[var(--radius-xs)] px-2 py-1 text-sm text-[var(--text-soft)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] cursor-pointer"
                  aria-label={`Remover ${b.title}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
