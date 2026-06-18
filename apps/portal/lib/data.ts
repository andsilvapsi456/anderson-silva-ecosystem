/**
 * Camada de dados do Portal do Paciente.
 * MODO DEMO (sem Supabase): dados fictícios de @as/shared.
 * MODO REAL: queries Supabase — a RLS garante que o paciente
 * só enxerga os próprios registros (defesa no banco, não no app).
 */
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import {
  mockAppointments,
  mockDiaryEntries,
  mockNotices,
  mockPatients,
  mockTransactions,
  type Appointment,
  type DiaryEntry,
  type Notice,
  type Patient,
  type Transaction,
} from "@as/shared";

const DEMO_PATIENT_ID = "pat-1";

async function supa() {
  return createServerSupabase(await cookies());
}

/* ───────────── mapeadores snake_case → tipos do domínio ───────────── */

function mapPatient(r: any): Patient {
  return {
    id: r.id,
    name: r.social_name ?? r.name,
    photoUrl: r.photo_url,
    cpf: r.cpf,
    birthDate: r.birth_date,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    address: [r.address_street, r.address_city, r.address_state].filter(Boolean).join(" — ") || null,
    insurance: r.insurance,
    financialGuardian: r.financial_guardian,
    notes: r.notes,
    active: r.active,
    createdAt: r.created_at,
  };
}

function mapAppointment(r: any, patientName: string): Appointment {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    mode: r.mode,
    status: r.status,
    room: r.rooms?.name ?? null,
    videoLink: r.video_link,
    recurring: Boolean(r.recurrence_rule),
  };
}

function mapTransaction(r: any, patientName: string | null): Transaction {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName,
    kind: r.kind,
    description: r.description,
    amountCents: r.amount_cents,
    method: r.method,
    status: r.status,
    dueDate: r.due_date,
    paidAt: r.paid_at,
    receiptNumber: r.receipts?.number ?? null,
  };
}

/* ───────────────────────────── consultas ───────────────────────────── */

export async function getMe(): Promise<Patient> {
  if (isDemoMode()) return mockPatients.find((p) => p.id === DEMO_PATIENT_ID)!;

  const supabase = await supa();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase.from("patients").select("*").eq("profile_id", user!.id).single();
  return mapPatient(data);
}

export async function getMyAppointments(): Promise<Appointment[]> {
  if (isDemoMode()) {
    return mockAppointments
      .filter((a) => a.patientId === DEMO_PATIENT_ID)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  }
  const me = await getMe();
  const supabase = await supa();
  const { data } = await supabase
    .from("appointments")
    .select("*, rooms(name)")
    .eq("patient_id", me.id)
    .order("starts_at", { ascending: false });
  return (data ?? []).map((r) => mapAppointment(r, me.name));
}

export async function getNextAppointment(): Promise<Appointment | null> {
  const now = new Date().toISOString();
  return (
    (await getMyAppointments())
      .filter((a) => a.startsAt > now && a.status !== "CANCELADA")
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
  );
}

export async function getLastAppointment(): Promise<Appointment | null> {
  const now = new Date().toISOString();
  return (await getMyAppointments()).filter((a) => a.startsAt <= now)[0] ?? null;
}

export async function getMyTransactions(): Promise<Transaction[]> {
  if (isDemoMode()) return mockTransactions.filter((t) => t.patientId === DEMO_PATIENT_ID);

  const me = await getMe();
  const supabase = await supa();
  const { data } = await supabase
    .from("transactions")
    .select("*, receipts(number)")
    .eq("patient_id", me.id)
    .order("due_date", { ascending: false });
  return (data ?? []).map((r) => mapTransaction(r, me.name));
}

export async function getMyDiary(): Promise<DiaryEntry[]> {
  if (isDemoMode()) {
    return mockDiaryEntries
      .filter((d) => d.patientId === DEMO_PATIENT_ID)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const me = await getMe();
  const supabase = await supa();
  const { data } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("patient_id", me.id)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    mood: r.mood,
    note: r.note,
    createdAt: r.created_at,
  }));
}

export async function getNotices(): Promise<Notice[]> {
  if (isDemoMode()) return mockNotices;

  const supabase = await supa();
  const { data } = await supabase
    .from("notices")
    .select("*")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("published_at", { ascending: false })
    .limit(5);
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, body: r.body, createdAt: r.published_at }));
}

/**
 * Link da teleconsulta sempre disponível para o paciente — a sala é fixa
 * (Google Meet da série) e só psicólogo e paciente têm o convite.
 */
export function isVideoLinkAvailable(appointment: Appointment): boolean {
  return appointment.mode === "ONLINE" && Boolean(appointment.videoLink);
}
