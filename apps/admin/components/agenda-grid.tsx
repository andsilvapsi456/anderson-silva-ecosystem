"use client";

/**
 * Agenda semanal CLICÁVEL (modelo Google Calendar).
 * - Clicar num horário vazio → mini-painel: Agendar sessão (com cadastro
 *   rápido de paciente) ou Bloquear horário.
 * - Clicar numa sessão → mini-painel: Remarcar, Cancelar (avisa o paciente
 *   por e-mail/WhatsApp automaticamente) ou abrir a ficha.
 * Tudo em fuso da clínica (America/Sao_Paulo, UTC-3 fixo).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Field, Input, Modal, Segmented, Select, statusLabel, statusTone } from "@as/ui";
import { formatTime, spDayKey, spHour, type Appointment, type TimeBlock } from "@as/shared";
import { createAppointment, rescheduleAppointment, setAppointmentStatus } from "../app/actions/appointments";
import { createPatient } from "../app/actions/patients";
import { addTimeBlock } from "../app/actions/time-blocks";

const SP_OFFSET_H = 3;

export interface AgendaDay {
  iso: string;
  dayKey: string; // YYYY-MM-DD (SP)
  label: string; // Seg, Ter…
  dayNum: number;
  isToday: boolean;
}
export interface PatientOption {
  id: string;
  name: string;
}

/* dayKey "YYYY-MM-DD" → "DD/MM/AAAA" (formato que a action espera) */
function dateBrOf(dayKey: string): string {
  const [y, m, d] = dayKey.split("-");
  return `${d}/${m}/${y}`;
}
const hh = (h: number) => String(h).padStart(2, "0") + ":00";

/** Instante ISO (UTC) da hora de parede da clínica (SP) — para bloqueios. */
function spInstantIso(dayKey: string, hour: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hour + SP_OFFSET_H, 0, 0, 0)).toISOString();
}

function appointmentsAt(appointments: Appointment[], dayKey: string, hour: number): Appointment[] {
  return appointments
    .filter((a) => spDayKey(a.startsAt) === dayKey && spHour(a.startsAt) === hour)
    .sort((a, b) => Number(a.status === "CANCELADA") - Number(b.status === "CANCELADA"));
}

function blockAt(blocks: TimeBlock[], dayKey: string, hour: number): { block: TimeBlock; isStart: boolean } | null {
  const [y, m, d] = dayKey.split("-").map(Number);
  const cellStart = new Date(Date.UTC(y, m - 1, d, hour + SP_OFFSET_H, 0, 0, 0));
  const cellEnd = new Date(cellStart.getTime() + 3_600_000);
  for (const b of blocks) {
    const bs = new Date(b.startsAt);
    const be = new Date(b.endsAt);
    if (bs < cellEnd && cellStart < be) return { block: b, isStart: bs >= cellStart && bs < cellEnd };
  }
  return null;
}

type Panel =
  | { kind: "cell"; dayKey: string; dateBr: string; label: string; dayNum: number; hour: number; blockedTitle: string | null }
  | { kind: "session"; appt: Appointment };
type Mode = "menu" | "schedule" | "block" | "reschedule" | "cancel";

export function AgendaGrid({
  hours,
  days,
  appointments,
  blocks,
  patients,
}: {
  hours: number[];
  days: AgendaDay[];
  appointments: Appointment[];
  blocks: TimeBlock[];
  patients: PatientOption[];
}) {
  const router = useRouter();
  const [panel, setPanel] = React.useState<Panel | null>(null);
  const [mode, setMode] = React.useState<Mode>("menu");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  function openCell(d: AgendaDay, hour: number, blockedTitle: string | null) {
    setErr(null);
    setMode("menu");
    setPanel({ kind: "cell", dayKey: d.dayKey, dateBr: dateBrOf(d.dayKey), label: d.label, dayNum: d.dayNum, hour, blockedTitle });
  }
  function openSession(appt: Appointment) {
    setErr(null);
    setMode("menu");
    setPanel({ kind: "session", appt });
  }
  function close() {
    setPanel(null);
    setBusy(false);
    setErr(null);
  }
  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  }
  function done(msg: string) {
    close();
    notify(msg);
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full min-w-175 border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-14 border-b border-[var(--border)] px-2 py-3" />
              {days.map((d) => (
                <th
                  key={d.iso}
                  className={`border-b border-l border-[var(--border)] px-2 py-3 text-center ${d.isToday ? "bg-[var(--accent-soft)]" : ""}`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">{d.label}</p>
                  <p className={`text-lg font-extrabold ${d.isToday ? "text-[var(--accent)]" : ""}`}>{d.dayNum}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="border-b border-[var(--border)] px-2 py-1 text-right align-top text-[11px] font-bold text-[var(--text-soft)]">
                  {String(hour).padStart(2, "0")}h
                </td>
                {days.map((d) => {
                  const slot = appointmentsAt(appointments, d.dayKey, hour);
                  const blocked = blockAt(blocks, d.dayKey, hour);
                  const active = slot.filter((a) => a.status !== "CANCELADA");
                  return (
                    <td
                      key={d.iso}
                      onClick={() => (active.length === 1 ? openSession(active[0]) : openCell(d, hour, blocked?.block.title ?? null))}
                      className={`group h-14 cursor-pointer border-b border-l border-[var(--border)] p-1 align-top transition-colors hover:bg-[var(--accent-soft)]/40 ${
                        blocked ? "bg-[var(--bg-alt)] bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--border)_6px,var(--border)_7px)]" : ""
                      }`}
                      title={blocked ? `Bloqueado: ${blocked.block.title}` : "Clique para agendar ou bloquear"}
                    >
                      {blocked?.isStart && (
                        <p className="truncate rounded-[var(--radius-xs)] bg-[var(--text-soft)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-soft)]">
                          🚫 {blocked.block.title}
                        </p>
                      )}
                      {slot.map((a) => (
                        <SlotCard key={a.id} a={a} onClick={() => openSession(a)} />
                      ))}
                      {slot.length === 0 && !blocked && (
                        <span className="pointer-events-none flex h-full items-center justify-center text-lg font-bold text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-60">
                          +
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────────── mini-painel ───────────── */}
      {panel?.kind === "cell" && (
        <Modal
          open
          onClose={close}
          title={`${panel.label} ${panel.dayNum} · ${hh(panel.hour)}${panel.blockedTitle ? " (bloqueado)" : ""}`}
        >
          {mode === "menu" && (
            <div className="space-y-2.5">
              {panel.blockedTitle && (
                <p className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-3 py-2 text-xs font-semibold text-[var(--warning)]">
                  🚫 {panel.blockedTitle} — agendar aqui pode gerar conflito.
                </p>
              )}
              <Button className="w-full" onClick={() => setMode("schedule")}>
                📅 Agendar sessão
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setMode("block")}>
                🚫 Bloquear horário
              </Button>
            </div>
          )}
          {mode === "schedule" && (
            <ScheduleForm
              dateBr={panel.dateBr}
              hour={panel.hour}
              patients={patients}
              busy={busy}
              err={err}
              onBack={() => (setMode("menu"), setErr(null))}
              onSubmit={async ({ patientId, quick, start, end, recurrence, mode: m }) => {
                setBusy(true);
                setErr(null);
                let pid = patientId;
                if (quick) {
                  const pf = new FormData();
                  pf.set("name", quick.name);
                  if (quick.whatsapp) pf.set("whatsapp", quick.whatsapp);
                  if (quick.email) pf.set("email", quick.email);
                  const pr = await createPatient({ ok: false }, pf);
                  if (!pr.ok || !pr.patientId) {
                    setBusy(false);
                    setErr(pr.error ?? "Não foi possível criar o paciente.");
                    return;
                  }
                  pid = pr.patientId;
                }
                const fd = new FormData();
                fd.set("patientId", pid);
                fd.set("date", panel.dateBr);
                fd.set("start", start);
                fd.set("end", end);
                fd.set("recurrence", recurrence);
                fd.set("mode", m);
                const res = await createAppointment({ ok: false }, fd);
                if (!res.ok) {
                  setBusy(false);
                  setErr(res.error ?? "Não foi possível agendar.");
                  return;
                }
                done(
                  res.demo
                    ? "Sessão agendada (demo)."
                    : `Sessão agendada ✓${res.meetLink ? " · sala do Meet criada" : ""}${quick ? " · paciente cadastrado" : ""}`
                );
              }}
            />
          )}
          {mode === "block" && (
            <BlockForm
              hour={panel.hour}
              busy={busy}
              err={err}
              onBack={() => (setMode("menu"), setErr(null))}
              onSubmit={async ({ title, kind, endHour }) => {
                setBusy(true);
                setErr(null);
                const fd = new FormData();
                fd.set("title", title);
                fd.set("kind", kind);
                fd.set("start", spInstantIso(panel.dayKey, panel.hour));
                fd.set("end", spInstantIso(panel.dayKey, endHour));
                const res = await addTimeBlock({ ok: false }, fd);
                if (!res.ok) {
                  setBusy(false);
                  setErr(res.error ?? "Não foi possível bloquear.");
                  return;
                }
                done(res.demo ? "Horário bloqueado (demo)." : "Horário bloqueado ✓");
              }}
            />
          )}
        </Modal>
      )}

      {panel?.kind === "session" && (
        <Modal open onClose={close} title={panel.appt.patientName}>
          {mode === "menu" && (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-3 py-2 text-sm">
                <p className="font-semibold">
                  {formatTime(panel.appt.startsAt)}–{formatTime(panel.appt.endsAt)} ·{" "}
                  {panel.appt.mode === "ONLINE" ? "Online 💻" : panel.appt.room ? panel.appt.room : "Presencial"}
                </p>
                <Badge tone={statusTone[panel.appt.status]} className="mt-1">
                  {statusLabel[panel.appt.status]}
                </Badge>
              </div>
              {panel.appt.status !== "CANCELADA" && (
                <div className="space-y-2.5">
                  <Button className="w-full" onClick={() => setMode("reschedule")}>
                    🔁 Remarcar
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => setMode("cancel")}>
                    ✕ Cancelar sessão (avisa o paciente)
                  </Button>
                </div>
              )}
              <Link
                href={`/pacientes/${panel.appt.patientId}`}
                className="block rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-2 text-center text-sm font-bold hover:bg-[var(--bg-alt)]"
              >
                Abrir ficha do paciente →
              </Link>
            </div>
          )}
          {mode === "reschedule" && (
            <RescheduleForm
              appt={panel.appt}
              busy={busy}
              err={err}
              onBack={() => (setMode("menu"), setErr(null))}
              onSubmit={async ({ date, start, end }) => {
                setBusy(true);
                setErr(null);
                const res = await rescheduleAppointment({ appointmentId: panel.appt.id, date, start, end });
                if (!res.ok) {
                  setBusy(false);
                  setErr(res.error ?? "Não foi possível remarcar.");
                  return;
                }
                const ch = res.channels?.length ? ` · paciente avisado (${res.channels.join(", ")})` : "";
                done(`Sessão remarcada ✓${ch}`);
              }}
            />
          )}
          {mode === "cancel" && (
            <CancelForm
              busy={busy}
              err={err}
              onBack={() => (setMode("menu"), setErr(null))}
              onSubmit={async (reason) => {
                setBusy(true);
                setErr(null);
                const res = await setAppointmentStatus(panel.appt.id, "CANCELADA", reason || undefined);
                if (!res.ok) {
                  setBusy(false);
                  setErr(res.error ?? "Não foi possível cancelar.");
                  return;
                }
                const ch = res.channels?.length ? ` · paciente avisado (${res.channels.join(", ")})` : "";
                done(`Sessão cancelada — horário liberado${ch}`);
              }}
            />
          )}
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-[var(--radius-sm)] bg-[var(--text)] px-4 py-2.5 text-sm font-bold text-[var(--surface)] shadow-[var(--shadow)]">
          {toast}
        </div>
      )}
    </>
  );
}

function SlotCard({ a, onClick }: { a: Appointment; onClick: () => void }) {
  if (a.status === "CANCELADA") {
    return (
      <div className="mt-1 rounded-[var(--radius-xs)] border border-dashed border-[var(--border)] bg-[var(--bg-alt)] px-2 py-1 opacity-80">
        <p className="truncate text-[11px] font-bold text-[var(--text-soft)] line-through">
          {a.patientName} · {formatTime(a.startsAt)}
        </p>
        <p className="text-[10px] font-bold text-[var(--success)]">✕ Cancelada · horário livre</p>
      </div>
    );
  }
  return (
    <div
      onClick={(e) => (e.stopPropagation(), onClick())}
      className="cursor-pointer rounded-[var(--radius-xs)] border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 hover:opacity-80"
    >
      <p className="truncate text-[11px] font-bold">{a.patientName}</p>
      <p className="text-[10px] text-[var(--text-soft)]">
        {formatTime(a.startsAt)} {a.mode === "ONLINE" ? "💻" : a.room ? `· ${a.room}` : ""}
      </p>
      <Badge tone={statusTone[a.status]} className="mt-0.5 !px-1.5 !text-[9px]">
        {statusLabel[a.status]}
      </Badge>
    </div>
  );
}

/* ───────────────── formulários do painel ───────────────── */

function ErrorMsg({ err }: { err: string | null }) {
  if (!err) return null;
  return <p className="rounded-[var(--radius-sm)] bg-[var(--danger-soft)] px-3 py-2 text-xs font-semibold text-[var(--danger)]">{err}</p>;
}
function BackRow({ onBack, busy, submitLabel }: { onBack: () => void; busy: boolean; submitLabel: string }) {
  return (
    <div className="flex gap-2.5 pt-1">
      <Button type="button" variant="ghost" className="flex-1" onClick={onBack} disabled={busy}>
        Voltar
      </Button>
      <Button type="submit" className="flex-1" disabled={busy}>
        {busy ? "…" : submitLabel}
      </Button>
    </div>
  );
}

function ScheduleForm({
  dateBr,
  hour,
  patients,
  busy,
  err,
  onBack,
  onSubmit,
}: {
  dateBr: string;
  hour: number;
  patients: PatientOption[];
  busy: boolean;
  err: string | null;
  onBack: () => void;
  onSubmit: (v: {
    patientId: string;
    quick: { name: string; whatsapp: string; email: string } | null;
    start: string;
    end: string;
    recurrence: string;
    mode: string;
  }) => void;
}) {
  const [patientId, setPatientId] = React.useState(patients[0]?.id ?? "__new");
  const isNew = patientId === "__new";
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [end, setEnd] = React.useState(hh(hour + 1));
  const [recurrence, setRecurrence] = React.useState("semanal");
  const [mode, setMode] = React.useState("Online");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          patientId: isNew ? "" : patientId,
          quick: isNew ? { name: name.trim(), whatsapp: whatsapp.trim(), email: email.trim() } : null,
          start: hh(hour),
          end,
          recurrence,
          mode: mode.toLowerCase(),
        });
      }}
    >
      <Field label="Paciente">
        <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          <option value="__new">➕ Cadastro rápido de paciente</option>
        </Select>
      </Field>
      {isNew && (
        <div className="space-y-2.5 rounded-[var(--radius-sm)] border border-dashed border-[var(--border)] p-3">
          <Field label="Nome completo">
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex.: Maria Souza" />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="WhatsApp">
              <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 9…" />
            </Field>
            <Field label="E-mail">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="opcional" />
            </Field>
          </div>
          <p className="text-[11px] text-[var(--text-soft)]">Cadastro mínimo — você completa a ficha depois.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Início">
          <Input value={hh(hour)} readOnly className="opacity-70" />
        </Field>
        <Field label="Fim">
          <Select value={end} onChange={(e) => setEnd(e.target.value)}>
            {[hour + 1, hour + 2].map((h) => (
              <option key={h} value={hh(h)}>
                {hh(h)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Recorrência">
        <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="nao">Sessão única</option>
          <option value="semanal">Toda semana</option>
          <option value="quinzenal">A cada 15 dias</option>
          <option value="mensal">Todo mês</option>
        </Select>
      </Field>
      <Field label="Modalidade">
        <Segmented options={["Online", "Presencial"]} value={mode} onChange={setMode} />
      </Field>
      <ErrorMsg err={err} />
      <BackRow onBack={onBack} busy={busy} submitLabel="Agendar" />
    </form>
  );
}

function BlockForm({
  hour,
  busy,
  err,
  onBack,
  onSubmit,
}: {
  hour: number;
  busy: boolean;
  err: string | null;
  onBack: () => void;
  onSubmit: (v: { title: string; kind: string; endHour: number }) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState("FOLGA");
  const [endHour, setEndHour] = React.useState(hour + 1);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title: title.trim(), kind, endHour });
      }}
    >
      <Field label="Motivo do bloqueio">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex.: Reunião, folga, compromisso" />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Tipo">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="FOLGA">Folga</option>
            <option value="FERIAS">Férias</option>
            <option value="OUTRO">Outro</option>
          </Select>
        </Field>
        <Field label="Até">
          <Select value={String(endHour)} onChange={(e) => setEndHour(Number(e.target.value))}>
            {[hour + 1, hour + 2, hour + 3, hour + 4].map((h) => (
              <option key={h} value={h}>
                {hh(h)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorMsg err={err} />
      <BackRow onBack={onBack} busy={busy} submitLabel="Bloquear" />
    </form>
  );
}

function RescheduleForm({
  appt,
  busy,
  err,
  onBack,
  onSubmit,
}: {
  appt: Appointment;
  busy: boolean;
  err: string | null;
  onBack: () => void;
  onSubmit: (v: { date: string; start: string; end: string }) => void;
}) {
  // valores atuais em SP como defaults
  const curDayKey = spDayKey(appt.startsAt);
  const curStart = spHour(appt.startsAt);
  const curEnd = spHour(appt.endsAt);
  const [dateInput, setDateInput] = React.useState(curDayKey); // yyyy-mm-dd (input date)
  const [start, setStart] = React.useState(hh(curStart));
  const [end, setEnd] = React.useState(hh(curEnd));
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const [y, m, d] = dateInput.split("-");
        onSubmit({ date: `${d}/${m}/${y}`, start, end });
      }}
    >
      <Field label="Nova data">
        <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Início">
          <Select value={start} onChange={(e) => setStart(e.target.value)}>
            {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
              <option key={h} value={hh(h)}>
                {hh(h)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fim">
          <Select value={end} onChange={(e) => setEnd(e.target.value)}>
            {Array.from({ length: 14 }, (_, i) => i + 9).map((h) => (
              <option key={h} value={hh(h)}>
                {hh(h)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="text-[11px] text-[var(--text-soft)]">O paciente recebe o aviso do novo horário automaticamente.</p>
      <ErrorMsg err={err} />
      <BackRow onBack={onBack} busy={busy} submitLabel="Remarcar" />
    </form>
  );
}

function CancelForm({
  busy,
  err,
  onBack,
  onSubmit,
}: {
  busy: boolean;
  err: string | null;
  onBack: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(reason.trim());
      }}
    >
      <Field label="Motivo (opcional — vai na mensagem ao paciente)">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: imprevisto, remarcar semana que vem" />
      </Field>
      <p className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-3 py-2 text-xs font-semibold text-[var(--warning)]">
        Ao confirmar, a sessão é cancelada, o horário fica livre e o paciente é avisado por e-mail e WhatsApp.
      </p>
      <ErrorMsg err={err} />
      <div className="flex gap-2.5 pt-1">
        <Button type="button" variant="ghost" className="flex-1" onClick={onBack} disabled={busy}>
          Voltar
        </Button>
        <Button type="submit" variant="danger" className="flex-1" disabled={busy}>
          {busy ? "…" : "Confirmar cancelamento"}
        </Button>
      </div>
    </form>
  );
}
