"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal, Select, Switch } from "@as/ui";
import { formatBRL } from "@as/shared";
import { createInstallmentPlan, sendChargeNow } from "../app/actions/billing";
import { splitInstallments } from "../lib/installments";

export interface ChargeTx {
  id: string;
  patientName: string;
  description: string;
  amountCents: number;
}

/** "💸 Cobrar agora" + "📆 Parcelar" para cobranças atrasadas. */
export function ChargeActions({ tx }: { tx: ChargeTx }) {
  const [toast, setToast] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [parts, setParts] = React.useState(3);
  const [firstDue, setFirstDue] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notify, setNotify] = React.useState(true);
  const [done, setDone] = React.useState<string | null>(null);
  const router = useRouter();

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function chargeNow() {
    setBusy(true);
    const res = await sendChargeNow(tx.id);
    setBusy(false);
    flash(res.ok ? `Cobrança enviada por ${res.channels!.join(" + ")}${res.demo ? " (demo)" : ""} ✓` : res.error!);
  }

  async function confirmPlan() {
    setBusy(true);
    const res = await createInstallmentPlan({ transactionId: tx.id, installments: parts, firstDueDate: firstDue, notify });
    setBusy(false);
    if (res.ok) {
      setDone(
        `Parcelamento criado${res.demo ? " (demo)" : ""}${
          res.channels?.length ? ` · proposta enviada por ${res.channels.join(" + ")}` : ""
        } ✓`
      );
      if (!res.demo) router.refresh();
    } else {
      flash(res.error!);
    }
  }

  const preview = splitInstallments(tx.amountCents, parts, firstDue);

  return (
    <>
      {toast && (
        <span className="fixed bottom-6 right-6 z-50 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)] shadow-[var(--shadow)]">
          {toast}
        </span>
      )}
      <div className="flex gap-1.5">
        <Button size="sm" onClick={chargeNow} disabled={busy} title="Enviar cobrança por e-mail e WhatsApp agora">
          💸 Cobrar agora
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)} title="Renegociar em parcelas">
          📆 Parcelar
        </Button>
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setDone(null); }} title={`Parcelar — ${tx.patientName}`}>
        {done ? (
          <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-6 text-center font-bold text-[var(--success)]">
            {done}
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-soft)]">
              {tx.description} · total em aberto <strong className="text-[var(--text)]">{formatBRL(tx.amountCents)}</strong>.
              A cobrança original é substituída pelas parcelas abaixo.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nº de parcelas">
                <Select value={String(parts)} onChange={(e) => setParts(Number(e.target.value))}>
                  {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="1ª parcela vence em">
                <Input type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
              </Field>
            </div>
            <div className="max-h-44 overflow-y-auto rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3 text-sm">
              {preview.map((p) => (
                <p key={p.number} className="flex justify-between py-0.5">
                  <span>
                    {p.number}ª parcela · vence {new Date(`${p.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}
                  </span>
                  <strong>{formatBRL(p.amountCents)}</strong>
                </p>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Enviar proposta ao paciente</p>
                <p className="text-xs text-[var(--text-soft)]">Mensagem acolhedora com as parcelas e o PIX, por e-mail e WhatsApp</p>
              </div>
              <Switch checked={notify} onChange={setNotify} label="Enviar proposta" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmPlan} disabled={busy}>
                {busy ? "Criando…" : `Confirmar ${parts}x`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
