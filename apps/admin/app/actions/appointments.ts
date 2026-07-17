"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import {
  DEFAULT_WORKING_HOURS,
  effectiveBlocks,
  findBlock,
  findConflict,
  formatTime,
  mockAppointments,
  mockPatients,
  mockTimeBlocks,
  type Appointment,
} from "@as/shared";
import { getAgendaPrefs } from "../../lib/data";
import { logAudit } from "../../lib/audit";
import { createWeeklyMeetEvent, isGoogleCalendarConfigured, rescheduleSeries } from "../../lib/google-calendar";
import {
  composeCancellationEmail,
  composeCancellationText,
  composeRescheduleEmail,
  composeRescheduleText,
} from "../../lib/notifications/messages";
import { sendEmail } from "../../lib/notifications/mailer";
import { sendWhatsAppText } from "../../lib/notifications/whatsapp";

/** Avisa o paciente do cancelamento por e-mail e WhatsApp (acolhedor). */
async function notifyCancellation(
  patient: { name: string; email: string | null; whatsapp: string | null; phone: string | null },
  appt: Appointment,
  reason?: string | null
): Promise<string[]> {
  const firstName = patient.name.split(" ")[0];
  const channels: string[] = [];
  if (patient.email) {
    const { subject, html } = composeCancellationEmail(firstName, appt, reason);
    const r = await sendEmail(patient.email, subject, html);
    if (r.ok) channels.push("e-mail");
  }
  const phone = patient.whatsapp ?? patient.phone;
  if (phone) {
    const r = await sendWhatsAppText(phone, composeCancellationText(firstName, appt, reason));
    if (r.ok) channels.push("WhatsApp");
  }
  return channels;
}

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Selecione o cliente"),
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data inválida (dd/mm/aaaa)"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Horário inicial inválido"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Horário final inválido"),
  recurrence: z.enum(["nao", "semanal", "quinzenal", "mensal"]),
  mode: z.enum(["online", "presencial"]),
  service: z.string().max(60),
});

export type AppointmentActionState = {
  ok: boolean;
  demo?: boolean;
  error?: string;
  meetLink?: string | null;
  channels?: string[];
};

// dateBr = "dd/mm/aaaa" e time = "HH:MM" são a hora de PAREDE da clínica (SP).
// SP é UTC-3 fixo (Brasil sem horário de verão desde 2019) e o servidor roda em
// UTC — o instante correto é Date.UTC(..., hh + 3). Sem isso, o que o Anderson
// agenda às 14h apareceria às 11h no grid (que exibe em America/Sao_Paulo).
const SP_OFFSET_H = 3;
function toIso(dateBr: string, time: string): Date {
  const [d, m, y] = dateBr.split("/").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + SP_OFFSET_H, mm, 0, 0));
}

/**
 * A sessão cabe no expediente daquele dia? Lê a hora de PAREDE direto do input
 * (já em SP), sem converter para instante — evita o viés de fuso do servidor.
 */
function withinWorkingHoursSP(dateBr: string, start: string, end: string): boolean {
  const [d, m, y] = dateBr.split("/").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // meio-dia evita rollover
  const window = DEFAULT_WORKING_HOURS[weekday];
  if (!window) return false;
  const min = (t: string) => {
    const [h, mm] = t.split(":").map(Number);
    return h * 60 + mm;
  };
  return min(start) >= min(window.open) && min(end) <= min(window.close);
}

/** Almoço recorrente + feriados (SP) que cobrem o intervalo — null se livre. */
async function findGeneratedBlock(startIso: string, endIso: string): Promise<{ title: string } | null> {
  const prefs = await getAgendaPrefs();
  const day = new Date(startIso);
  const blocks = effectiveBlocks({
    from: day,
    to: day,
    oneOff: [],
    lunch: prefs.lunch,
    blockHolidays: prefs.blockHolidays,
  });
  return findBlock(startIso, endIso, blocks);
}

/** Bloqueio de agenda (real) que cobre o intervalo — null se livre. */
async function findBlockReal(
  supabase: ReturnType<typeof createServerSupabase>,
  startIso: string,
  endIso: string
): Promise<{ title: string } | null> {
  const { data } = await supabase
    .from("time_blocks")
    .select("title, starts_at, ends_at")
    .lt("starts_at", endIso)
    .gt("ends_at", startIso);
  return findBlock(
    startIso,
    endIso,
    (data ?? []).map((b: any) => ({ title: b.title, startsAt: b.starts_at, endsAt: b.ends_at }))
  );
}

const RRULE: Record<string, string | null> = {
  nao: null,
  semanal: "RRULE:FREQ=WEEKLY",
  quinzenal: "RRULE:FREQ=WEEKLY;INTERVAL=2",
  mensal: "RRULE:FREQ=MONTHLY",
};

/** Cria a sessão; se online + recorrente, cria também o evento Google com Meet fixo. */
export async function createAppointment(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = appointmentSchema.safeParse({
    patientId: formData.get("patientId"),
    date: formData.get("date"),
    start: formData.get("start"),
    end: formData.get("end"),
    recurrence: formData.get("recurrence"),
    mode: formData.get("mode"),
    service: formData.get("service") ?? "psicanalise",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const d = parsed.data;
  const startsAt = toIso(d.date, d.start);
  const endsAt = toIso(d.date, d.end);
  if (endsAt <= startsAt) return { ok: false, error: "O horário final deve ser depois do inicial." };

  const startIso = startsAt.toISOString();
  const endIso = endsAt.toISOString();

  // fora do horário de atendimento?
  if (!withinWorkingHoursSP(d.date, d.start, d.end)) {
    return { ok: false, error: "Esse horário está fora do seu período de atendimento. Ajuste em Configurações → Agenda." };
  }

  // almoço recorrente ou feriado (SP)?
  const gen = await findGeneratedBlock(startIso, endIso);
  if (gen) return { ok: false, error: `Esse horário está bloqueado: ${gen.title}. Escolha outro horário.` };

  if (isDemoMode()) {
    const conflict = findConflict(startIso, endIso, mockAppointments);
    if (conflict) {
      return { ok: false, error: `Conflito: já há uma sessão das ${formatTime(conflict.startsAt)} às ${formatTime(conflict.endsAt)} nesse horário.` };
    }
    const block = findBlock(startIso, endIso, mockTimeBlocks);
    if (block) return { ok: false, error: `Esse horário está bloqueado: ${block.title}. Escolha outro horário.` };
    return { ok: true, demo: true, meetLink: d.mode === "online" ? "https://meet.google.com/exemplo-demo" : null };
  }

  const supabase = createServerSupabase(await cookies());

  // prevenção de conflito: busca sessões que tocam a janela (exceto canceladas)
  const { data: nearby } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .neq("status", "CANCELADA")
    .lt("starts_at", endIso)
    .gt("ends_at", startIso);
  const conflict = findConflict(
    startIso,
    endIso,
    (nearby ?? []).map((r) => ({ startsAt: r.starts_at, endsAt: r.ends_at, status: r.status }))
  );
  if (conflict) {
    return { ok: false, error: `Conflito: já há uma sessão das ${formatTime(conflict.startsAt)} às ${formatTime(conflict.endsAt)} nesse horário.` };
  }

  const block = await findBlockReal(supabase, startIso, endIso);
  if (block) return { ok: false, error: `Esse horário está bloqueado: ${block.title}. Escolha outro horário.` };

  // Google Calendar + Meet com link fixo (online + recorrente + paciente com e-mail)
  let videoLink: string | null = null;
  let googleEventId: string | null = null;
  if (d.mode === "online" && d.recurrence !== "nao" && d.recurrence !== "mensal" && isGoogleCalendarConfigured()) {
    const { data: patient } = await supabase
      .from("patients")
      .select("name, email")
      .eq("id", d.patientId)
      .single();
    if (patient?.email) {
      try {
        const event = await createWeeklyMeetEvent({
          patientName: patient.name,
          patientEmail: patient.email,
          startsAt: startsAt.toISOString(),
          durationMinutes: Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
          frequency: d.recurrence === "quinzenal" ? "FORTNIGHTLY" : "WEEKLY",
        });
        videoLink = event.meetLink;
        googleEventId = event.googleEventId;
      } catch (err) {
        console.error("Google Calendar falhou — sessão criada sem link:", err);
      }
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: d.patientId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      mode: d.mode === "online" ? "ONLINE" : "PRESENCIAL",
      status: "PENDENTE",
      recurrence_rule: RRULE[d.recurrence],
      video_provider: videoLink ? "GOOGLE_MEET" : null,
      video_link: videoLink,
      google_event_id: googleEventId,
      notes: `Serviço: ${d.service}`,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "Não foi possível salvar a sessão." };

  await logAudit("appointment.create", "appointments", data.id, { recurrence: d.recurrence, mode: d.mode });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true, meetLink: videoLink };
}

const STATUSES = ["PENDENTE", "CONFIRMADA", "REALIZADA", "CANCELADA", "FALTA"] as const;

export async function setAppointmentStatus(
  appointmentId: string,
  status: string,
  reason?: string
): Promise<AppointmentActionState> {
  const parsed = z.enum(STATUSES).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Status inválido." };
  const cancelando = parsed.data === "CANCELADA";

  if (isDemoMode()) {
    let notified: string[] = [];
    if (cancelando) {
      const appt = mockAppointments.find((a) => a.id === appointmentId);
      const patient = appt && mockPatients.find((p) => p.id === appt.patientId);
      if (appt && patient) notified = await notifyCancellation(patient, appt, reason);
    }
    return { ok: true, demo: true, ...(cancelando ? { channels: notified } : {}) };
  }

  const supabase = createServerSupabase(await cookies());

  // dados da sessão/paciente antes de atualizar (para o aviso de cancelamento)
  const { data: appt } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, mode, room:rooms(name), video_link, patients(name, social_name, email, whatsapp, phone)")
    .eq("id", appointmentId)
    .maybeSingle();

  const { error } = await supabase
    .from("appointments")
    .update({ status: parsed.data, cancel_reason: cancelando ? reason ?? null : null })
    .eq("id", appointmentId);
  if (error) return { ok: false, error: "Não foi possível atualizar o status." };

  let channels: string[] = [];
  if (cancelando && appt?.patients) {
    const p: any = appt.patients;
    const appointment: Appointment = {
      id: appointmentId,
      patientId: "",
      patientName: p.social_name ?? p.name,
      startsAt: appt.starts_at,
      endsAt: appt.ends_at,
      mode: appt.mode,
      status: "CANCELADA",
      room: (appt.room as any)?.name ?? null,
      videoLink: appt.video_link,
      recurring: false,
    };
    channels = await notifyCancellation(
      { name: p.social_name ?? p.name, email: p.email, whatsapp: p.whatsapp, phone: p.phone },
      appointment,
      reason
    ).catch(() => []);
  }

  await logAudit("appointment.set_status", "appointments", appointmentId, { status: parsed.data, ...(channels.length ? { notified: channels } : {}) });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true, ...(cancelando ? { channels } : {}) };
}

/* ───────── Remarcar sessão (mover para outro horário) ───────── */

const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  date: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data inválida (dd/mm/aaaa)"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Horário inicial inválido"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Horário final inválido"),
});

/** Move a sessão para um novo horário: valida conflito, atualiza o Meet/Google e avisa o paciente. */
export async function rescheduleAppointment(input: {
  appointmentId: string;
  date: string;
  start: string;
  end: string;
}): Promise<AppointmentActionState> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const startsAt = toIso(d.date, d.start);
  const endsAt = toIso(d.date, d.end);
  if (endsAt <= startsAt) return { ok: false, error: "O horário final deve ser depois do inicial." };

  const startIso = startsAt.toISOString();
  const endIso = endsAt.toISOString();
  if (!withinWorkingHoursSP(d.date, d.start, d.end)) {
    return { ok: false, error: "Esse horário está fora do seu período de atendimento." };
  }

  const gen = await findGeneratedBlock(startIso, endIso);
  if (gen) return { ok: false, error: `Esse horário está bloqueado: ${gen.title}. Escolha outro horário.` };

  if (isDemoMode()) {
    const others = mockAppointments.filter((a) => a.id !== d.appointmentId);
    const conflict = findConflict(startIso, endIso, others);
    if (conflict) {
      return { ok: false, error: `Conflito: já há uma sessão das ${formatTime(conflict.startsAt)} às ${formatTime(conflict.endsAt)} nesse horário.` };
    }
    const blk = findBlock(startIso, endIso, mockTimeBlocks);
    if (blk) return { ok: false, error: `Esse horário está bloqueado: ${blk.title}. Escolha outro horário.` };
    const appt = mockAppointments.find((a) => a.id === d.appointmentId);
    const patient = appt && mockPatients.find((p) => p.id === appt.patientId);
    let channels: string[] = [];
    if (appt && patient) channels = await notifyReschedule(patient, appt.startsAt, startIso).catch(() => []);
    return { ok: true, demo: true, channels };
  }

  const supabase = createServerSupabase(await cookies());

  // conflito (exceto a própria sessão e canceladas)
  const { data: nearby } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .neq("status", "CANCELADA")
    .neq("id", d.appointmentId)
    .lt("starts_at", endIso)
    .gt("ends_at", startIso);
  const conflict = findConflict(
    startIso,
    endIso,
    (nearby ?? []).map((r) => ({ startsAt: r.starts_at, endsAt: r.ends_at, status: r.status }))
  );
  if (conflict) {
    return { ok: false, error: `Conflito: já há uma sessão das ${formatTime(conflict.startsAt)} às ${formatTime(conflict.endsAt)} nesse horário.` };
  }

  const blk = await findBlockReal(supabase, startIso, endIso);
  if (blk) return { ok: false, error: `Esse horário está bloqueado: ${blk.title}. Escolha outro horário.` };

  const { data: appt } = await supabase
    .from("appointments")
    .select("starts_at, google_event_id, patients(name, social_name, email, whatsapp, phone)")
    .eq("id", d.appointmentId)
    .maybeSingle();

  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: startIso, ends_at: endIso })
    .eq("id", d.appointmentId);
  if (error) return { ok: false, error: "Não foi possível remarcar a sessão." };

  // mantém o MESMO link do Meet — só move o evento da série no Google
  if (appt?.google_event_id) {
    const minutes = Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
    await rescheduleSeries(appt.google_event_id, startIso, minutes).catch(() => {});
  }

  let channels: string[] = [];
  if (appt?.patients) {
    const p: any = appt.patients;
    channels = await notifyReschedule(
      { name: p.social_name ?? p.name, email: p.email, whatsapp: p.whatsapp, phone: p.phone },
      appt.starts_at,
      startIso
    ).catch(() => []);
  }

  await logAudit("appointment.reschedule", "appointments", d.appointmentId, { to: startIso, ...(channels.length ? { notified: channels } : {}) });
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true, channels };
}

/** Avisa o paciente da remarcação por e-mail e WhatsApp. */
async function notifyReschedule(
  patient: { name: string; email: string | null; whatsapp: string | null; phone: string | null },
  fromIso: string,
  toIso: string
): Promise<string[]> {
  const firstName = patient.name.split(" ")[0];
  const channels: string[] = [];
  if (patient.email) {
    const { subject, html } = composeRescheduleEmail(firstName, fromIso, toIso);
    const r = await sendEmail(patient.email, subject, html);
    if (r.ok) channels.push("e-mail");
  }
  const phone = patient.whatsapp ?? patient.phone;
  if (phone) {
    const r = await sendWhatsAppText(phone, composeRescheduleText(firstName, fromIso, toIso));
    if (r.ok) channels.push("WhatsApp");
  }
  return channels;
}
