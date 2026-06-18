"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Dropdown, EmptyState, Modal } from "@as/ui";
import { formatBRL } from "@as/shared";
import type { PaymentBadge } from "../lib/data";
import { rescheduleAppointment, setAppointmentStatus } from "../app/actions/appointments";
import { setSessionPayment, type PaymentStatusTarget } from "../app/actions/payments";

export interface SessionRow {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  mode: "ONLINE" | "PRESENCIAL";
  payment: PaymentBadge;
  amountCents: number | null;
  videoLink: string | null;
}

const paymentView: Record<PaymentBadge, { label: string; tone: "success" | "warning" | "info" }> = {
  PAGO: { label: "Pago", tone: "success" },
  PAGAR: { label: "Pagar", tone: "warning" },
  ISENTO: { label: "Isento", tone: "info" },
};

function dayLabel(d: Date): string {
  const date = d.toLocaleDateString("pt-BR");
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${date} (${weekday.charAt(0).toUpperCase() + weekday.slice(1)})`;
}

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] border border-[var(--border)] " +
  "bg-[var(--surface)] text-sm text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer";

/** Lista de próximas sessões agrupada por dia, com pagamento e ações rápidas. */
export function UpcomingSessions({ sessions }: { sessions: SessionRow[] }) {
  const [offset, setOffset] = React.useState(0); // janelas de 7 dias
  const [toast, setToast] = React.useState<string | null>(null);
  // sobrescrita local do badge de pagamento (feedback imediato, inclusive em demo)
  const [paymentOverride, setPaymentOverride] = React.useState<Record<string, PaymentBadge>>({});
  const [reschedule, setReschedule] = React.useState<SessionRow | null>(null);
  const router = useRouter();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const visible = sessions.filter((s) => {
    const d = new Date(s.startsAt);
    return d >= start && d < end;
  });

  const groups = new Map<string, SessionRow[]>();
  for (const s of visible) {
    const key = new Date(s.startsAt).toDateString();
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  function act(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function changeStatus(id: string, status: string, label: string, reason?: string) {
    const res = await setAppointmentStatus(id, status, reason);
    if (res.ok) {
      // ao cancelar, avisa quais canais notificaram o paciente
      const aviso = res.channels?.length ? ` · paciente avisado por ${res.channels.join(" + ")}` : "";
      act(`${label}${aviso}${res.demo ? " (demo)" : ""}`);
    } else {
      act(res.error!);
    }
    if (res.ok && !res.demo) router.refresh();
  }

  async function submitReschedule(formData: FormData) {
    if (!reschedule) return;
    const date = String(formData.get("date") || ""); // yyyy-mm-dd
    const start = String(formData.get("start") || "");
    const end = String(formData.get("end") || "");
    if (!date || !start || !end) return act("Preencha a data e os horários.");
    const [y, m, dd] = date.split("-");
    const res = await rescheduleAppointment({
      appointmentId: reschedule.id,
      date: `${dd}/${m}/${y}`,
      start,
      end,
    });
    if (res.ok) {
      const aviso = res.channels?.length ? ` · paciente avisado por ${res.channels.join(" + ")}` : "";
      setReschedule(null);
      act(`Sessão remarcada${aviso}${res.demo ? " (demo)" : ""}`);
      if (!res.demo) router.refresh();
    } else {
      act(res.error!);
    }
  }

  async function changePayment(s: SessionRow, target: PaymentStatusTarget, label: string) {
    const res = await setSessionPayment(s.id, s.patientId, target);
    if (res.ok) {
      setPaymentOverride((prev) => ({ ...prev, [s.id]: target === "PAGAR" ? "PAGAR" : target }));
      act(`Pagamento: ${label}${res.demo ? " (demo)" : ""}`);
      if (!res.demo) router.refresh();
    } else {
      act(res.error!);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📅 Próximas sessões</CardTitle>
        <div className="flex items-center gap-1.5">
          <button aria-label="Semana anterior" className={iconBtn} onClick={() => setOffset((o) => o - 1)}>
            ‹
          </button>
          <button
            onClick={() => setOffset(0)}
            disabled={offset === 0}
            className="h-8 rounded-[var(--radius-xs)] border border-[var(--border)] px-3 text-sm font-bold text-[var(--text-soft)] disabled:opacity-40 hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer"
          >
            Hoje
          </button>
          <button aria-label="Próxima semana" className={iconBtn} onClick={() => setOffset((o) => o + 1)}>
            ›
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {toast && (
          <p className="mx-6 mt-4 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-2 text-sm font-semibold text-[var(--success)]">
            {toast}
          </p>
        )}
        {groups.size === 0 && (
          <EmptyState icon="🗓️" title="Sem sessões nesta semana" description="Use as setas para navegar entre as semanas." />
        )}
        {[...groups.entries()].map(([key, rows]) => (
          <div key={key}>
            <p className="px-6 pt-4 pb-1 text-sm font-extrabold">{dayLabel(new Date(key))}</p>
            <ul className="divide-y divide-[var(--border)]">
              {rows.map((s) => {
                const payment = paymentOverride[s.id] ?? s.payment;
                const pay = paymentView[payment];
                const time = new Date(s.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
                return (
                  <li key={s.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] bg-[var(--bg-alt)] px-2.5 py-1.5 text-sm font-extrabold">
                      {time}
                      <span aria-hidden title={s.mode === "ONLINE" ? "Online" : "Presencial"}>
                        {s.mode === "ONLINE" ? "📹" : "🏢"}
                      </span>
                    </span>
                    <Avatar name={s.patientName} size={32} />
                    <a href={`/pacientes/${s.patientId}`} className="flex-1 truncate text-sm font-bold text-[var(--accent)] hover:underline">
                      {s.patientName}
                    </a>
                    {/* badge de pagamento clicável — altera o status na hora */}
                    <Dropdown
                      trigger={
                        <button aria-label={`Pagamento: ${pay.label} — clique para alterar`} title="Alterar pagamento" className="cursor-pointer">
                          <Badge tone={pay.tone}>{pay.label} ▾</Badge>
                        </button>
                      }
                      items={[
                        { icon: "✅", label: "Marcar como Pago", onSelect: () => changePayment(s, "PAGO", "pago") },
                        { icon: "🕐", label: "Marcar como A pagar", onSelect: () => changePayment(s, "PAGAR", "a pagar") },
                        { icon: "❤️", label: "Marcar como Isento", onSelect: () => changePayment(s, "ISENTO", "isento") },
                      ]}
                    />
                    {/* abrir a sala da teleconsulta */}
                    {s.videoLink && (
                      <a
                        href={s.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Abrir sala da sessão"
                        title="Abrir sala (Meet)"
                        className={iconBtn}
                      >
                        🎥
                      </a>
                    )}
                    <Dropdown
                      trigger={<button aria-label="Agenda" className={iconBtn}>📅</button>}
                      items={[
                        { icon: "🔁", label: "Reagendar sessão", onSelect: () => act("Reagendamento aberto na agenda (demo).") },
                        { icon: "👁️", label: "Ver na agenda", onSelect: () => act("Abrindo a agenda (demo).") },
                      ]}
                    />
                    <a href={`/pacientes/${s.patientId}`} aria-label="Prontuário" className={iconBtn}>
                      📝
                    </a>
                    <Dropdown
                      trigger={<button aria-label="Mais ações" className={iconBtn}>⋯</button>}
                      items={[
                        { icon: "✅", label: "Confirmar sessão", onSelect: () => changeStatus(s.id, "CONFIRMADA", "Sessão confirmada") },
                        { icon: "🔁", label: "Remarcar sessão", onSelect: () => setReschedule(s) },
                        { icon: "✔️", label: "Marcar como realizada", onSelect: () => changeStatus(s.id, "REALIZADA", "Sessão marcada como realizada") },
                        { icon: "📨", label: "Enviar lembrete agora", onSelect: () => act("Lembrete enviado por e-mail/WhatsApp (demo).") },
                        { icon: "🚫", label: "Registrar falta", onSelect: () => changeStatus(s.id, "FALTA", "Falta registrada") },
                        {
                          icon: "❌",
                          label: "Cancelar sessão",
                          onSelect: () => {
                            // motivo fica registrado na agenda e entra no aviso ao paciente
                            const reason = window.prompt(
                              "Motivo do cancelamento (opcional) — fica registrado na sua agenda e no aviso ao paciente:"
                            );
                            if (reason === null) return; // psicólogo desistiu de cancelar
                            changeStatus(s.id, "CANCELADA", "Sessão cancelada", reason.trim() || undefined);
                          },
                        },
                        ...(s.amountCents
                          ? [{ icon: "💰", label: `Cobrar ${formatBRL(s.amountCents)}`, onSelect: () => act("Cobrança enviada (demo).") }]
                          : []),
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="h-3" />
      </CardContent>

      <Modal open={!!reschedule} onClose={() => setReschedule(null)} title="Remarcar sessão" maxWidth={460}>
        {reschedule && (
          <form action={submitReschedule} className="space-y-4">
            <p className="text-sm text-[var(--text-soft)]">
              <strong className="text-[var(--text)]">{reschedule.patientName}</strong> — atualmente em{" "}
              {new Date(reschedule.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.
              O link da sala e os lembretes continuam os mesmos; o paciente é avisado.
            </p>
            <label className="block">
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Nova data</span>
              <input
                type="date"
                name="date"
                required
                defaultValue={new Date(reschedule.startsAt).toLocaleDateString("en-CA")}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Início</span>
                <input
                  type="time"
                  name="start"
                  required
                  defaultValue={new Date(reschedule.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">Fim</span>
                <input
                  type="time"
                  name="end"
                  required
                  defaultValue={new Date(new Date(reschedule.startsAt).getTime() + 50 * 60000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit">Remarcar e avisar paciente</Button>
              <Button type="button" variant="secondary" onClick={() => setReschedule(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  );
}
