"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Modal } from "@as/ui";
import { CLINICAL_INSTRUMENTS } from "@as/shared";
import { addEvolution } from "../app/actions/record";

const field =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm";
const labelCls = "mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]";

/** Registro ágil pós-sessão (SOAP) + escala clínica opcional. */
export function NewEvolutionButton({ patientId }: { patientId: string }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [instrument, setInstrument] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const router = useRouter();

  const inst = CLINICAL_INSTRUMENTS.find((i) => i.id === instrument);
  const max = inst?.max ?? 10;

  async function submit(formData: FormData) {
    setBusy(true);
    const res = await addEvolution({ ok: false }, formData);
    setBusy(false);
    if (res.ok) {
      setToast(`Evolução registrada${res.demo ? " (demo)" : ""} ✓`);
      formRef.current?.reset();
      setInstrument("");
      if (!res.demo) router.refresh();
      setTimeout(() => {
        setOpen(false);
        setToast(null);
      }, 1200);
    } else {
      setToast(res.error ?? "Não foi possível salvar.");
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nova evolução</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova evolução de sessão" maxWidth={640}>
        <form ref={formRef} action={submit} className="space-y-3">
          <input type="hidden" name="patientId" value={patientId} />
          <input type="hidden" name="scoreMax" value={max} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelCls}>S · Relato do paciente</span>
              <textarea name="subjetivo" rows={3} className={field} placeholder="Como chegou, queixa, relato…" />
            </label>
            <label>
              <span className={labelCls}>O · Observação clínica</span>
              <textarea name="objetivo" rows={3} className={field} placeholder="Apresentação, afeto, comportamento…" />
            </label>
            <label>
              <span className={labelCls}>A · Avaliação</span>
              <textarea name="avaliacao" rows={3} className={field} placeholder="Hipóteses, evolução do quadro…" />
            </label>
            <label>
              <span className={labelCls}>P · Plano / conduta</span>
              <textarea name="plano" rows={3} className={field} placeholder="Intervenções, tarefas, próximos passos…" />
            </label>
          </div>

          <fieldset className="rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
            <legend className="px-1 text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">
              Escala clínica (opcional)
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="sm:col-span-2">
                <span className={labelCls}>Instrumento</span>
                <select
                  name="instrument"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className={field}
                >
                  <option value="">— não aplicar —</option>
                  {CLINICAL_INSTRUMENTS.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelCls}>Pontuação (0–{max})</span>
                <input
                  type="number"
                  name="score"
                  min={0}
                  max={max}
                  disabled={!instrument}
                  className={field}
                  placeholder="—"
                />
              </label>
            </div>
            {inst && <p className="mt-2 text-xs text-[var(--text-soft)]">{inst.help}</p>}
          </fieldset>

          {toast && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-2 text-sm font-semibold text-[var(--success)]">
              {toast}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Salvar evolução"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
