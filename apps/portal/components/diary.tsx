"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Textarea } from "@as/ui";
import { formatDateLong, type DiaryEntry } from "@as/shared";
import { saveDiaryEntry, type DiaryState } from "../app/(app)/diario/actions";

export const MOODS = [
  { value: 1, emoji: "😞", label: "Muito difícil" },
  { value: 2, emoji: "😕", label: "Difícil" },
  { value: 3, emoji: "😐", label: "Neutra" },
  { value: 4, emoji: "🙂", label: "Boa" },
  { value: 5, emoji: "😄", label: "Muito boa" },
];

const initial: DiaryState = { ok: false };

export function Diary({ entries }: { entries: DiaryEntry[] }) {
  const [mood, setMood] = React.useState<number | null>(null);
  const [state, action, pending] = useActionState(saveDiaryEntry, initial);
  const [localEntries, setLocalEntries] = React.useState<DiaryEntry[]>([]);
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastNote = React.useRef<string | null>(null);

  // feedback imediato também em demo: adiciona a entrada localmente
  React.useEffect(() => {
    if (state.ok) {
      setLocalEntries((prev) => [
        {
          id: `local-${Date.now()}`,
          patientId: "me",
          mood,
          note: lastNote.current,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setMood(null);
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const all = [...localEntries, ...entries];

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* ───── Check-in + anotações ───── */}
      <Card className="lg:col-span-3 self-start">
        <CardHeader>
          <CardTitle>Como foi sua semana?</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            action={(fd) => {
              lastNote.current = String(fd.get("note") ?? "").trim() || null;
              return action(fd);
            }}
            className="space-y-5"
          >
            <div>
              <div className="flex justify-between gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(mood === m.value ? null : m.value)}
                    aria-label={m.label}
                    aria-pressed={mood === m.value}
                    title={m.label}
                    className={`flex flex-1 flex-col items-center gap-1.5 rounded-[var(--radius-sm)] border-2 px-2 py-3 transition-all cursor-pointer ${
                      mood === m.value
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] scale-105"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-[10px] font-bold text-[var(--text-soft)]">{m.label}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" name="mood" value={mood ?? ""} />
            </div>

            <div>
              <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Pontos para a nossa próxima sessão (opcional)
              </p>
              <Textarea
                name="note"
                placeholder="Anote aqui o que quiser lembrar de falar: situações, sonhos, sentimentos, conquistas…"
                className="min-h-28"
              />
            </div>

            {state.error && <p className="text-sm font-semibold text-[var(--danger)]">{state.error}</p>}

            <Button type="submit" disabled={pending} className="w-full sm:w-auto">
              {pending ? "Salvando…" : "Registrar no diário"}
            </Button>
            <p className="text-xs text-[var(--text-soft)]">
              🔒 Só você e o Anderson têm acesso ao seu diário. Use como e quando quiser — não há certo ou errado.
            </p>
            <p className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-4 py-2.5 text-xs text-[var(--text)]">
              ⚠️ O diário não é monitorado em tempo real. Em momento de crise, ligue <strong>188 (CVV, 24h)</strong>{" "}
              ou procure a emergência mais próxima — e me avise pelo WhatsApp.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* ───── Histórico ───── */}
      <Card className="lg:col-span-2 self-start">
        <CardHeader>
          <CardTitle>Seus registros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {all.length === 0 ? (
            <EmptyState
              icon="📔"
              title="Seu diário começa aqui"
              description="Registre como foi a semana — ajuda a aproveitar melhor cada sessão."
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {all.map((e) => (
                <li key={e.id} className="flex gap-3 px-6 py-4">
                  <span className="text-2xl" aria-hidden>
                    {e.mood ? MOODS.find((m) => m.value === e.mood)?.emoji : "📝"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold capitalize text-[var(--text-soft)]">{formatDateLong(e.createdAt)}</p>
                    {e.note && <p className="mt-1 text-sm leading-relaxed">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
