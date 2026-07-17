/**
 * Dados para CRONS (agenda diária, lembretes, aniversários).
 * Os jobs rodam SEM sessão de usuário — a RLS (is_staff) devolveria zero
 * linhas com a chave anon. Aqui usamos o SERVICE ROLE, que só existe no
 * servidor. Em modo demo, devolve os mocks (como a camada normal).
 */
import { isDemoMode } from "@as/auth";
import { createServiceSupabase } from "@as/auth/service";
import { mockAppointments, mockPatients, mockTransactions, type Appointment, type Patient, type Transaction } from "@as/shared";
import { mapAppointment, mapPatient, mapTransaction } from "./data";

function service() {
  const client = createServiceSupabase();
  if (!client) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente — cron sem acesso ao banco");
  return client;
}

export async function getCronAppointments(): Promise<Appointment[]> {
  if (isDemoMode()) return [...mockAppointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const { data, error } = await service()
    .from("appointments")
    .select("*, patients(name, social_name), rooms(name)")
    .order("starts_at");
  if (error) console.error("cron getAppointments:", error.message);
  return (data ?? []).map(mapAppointment);
}

export async function getCronPatients(): Promise<Patient[]> {
  if (isDemoMode()) return mockPatients;
  const { data, error } = await service().from("patients").select("*").order("name");
  if (error) console.error("cron getPatients:", error.message);
  return (data ?? []).map(mapPatient);
}

export async function getCronTransactions(): Promise<Transaction[]> {
  if (isDemoMode()) return mockTransactions;
  const { data, error } = await service()
    .from("transactions")
    .select("*, patients(name, social_name), receipts(number)")
    .order("due_date", { ascending: false });
  if (error) console.error("cron getTransactions:", error.message);
  return (data ?? []).map(mapTransaction);
}

/** Lembretes já enviados para estas sessões — UMA query, devolve Set("id:kind"). */
export async function getSentReminderKeys(appointmentIds: string[]): Promise<Set<string>> {
  if (isDemoMode() || appointmentIds.length === 0) return new Set();
  const { data } = await service()
    .from("reminders")
    .select("appointment_id, kind")
    .in("appointment_id", appointmentIds)
    .not("sent_at", "is", null);
  return new Set((data ?? []).map((r: any) => `${r.appointment_id}:${r.kind}`));
}

export async function markReminderSent(appointmentId: string, kind: string, channel: string) {
  if (isDemoMode()) return;
  await service().from("reminders").insert({
    appointment_id: appointmentId,
    kind,
    channel,
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });
}

/* ───────── aniversários: dedupe pela trilha de auditoria ───────── */

const BIRTHDAY_ACTION = "birthday.greeting_sent";

/** Pacientes que JÁ receberam parabéns hoje (reexecução do cron não duplica). */
export async function getBirthdayAlreadySent(sinceIso: string): Promise<Set<string>> {
  if (isDemoMode()) return new Set();
  const { data } = await service()
    .from("audit_logs")
    .select("entity_id")
    .eq("action", BIRTHDAY_ACTION)
    .gte("created_at", sinceIso);
  return new Set((data ?? []).map((r: any) => r.entity_id).filter(Boolean));
}

export async function logBirthdaySent(patientId: string, channels: string[]) {
  if (isDemoMode()) return;
  await service().from("audit_logs").insert({
    actor_id: null,
    action: BIRTHDAY_ACTION,
    entity: "patients",
    entity_id: patientId,
    metadata: { channels },
  });
}

/** Settings de notificação lidas com service role (a RLS bloquearia o anon do cron). */
export async function getCronNotificationSettings() {
  const { DEFAULT_SETTINGS, mapNotificationSettings } = await import("./notifications/settings");
  if (isDemoMode()) return DEFAULT_SETTINGS;
  const { data } = await service().from("clinic_settings").select("*").eq("singleton", true).maybeSingle();
  return data ? mapNotificationSettings(data) : DEFAULT_SETTINGS;
}
