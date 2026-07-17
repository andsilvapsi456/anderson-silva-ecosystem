/**
 * Camada de dados do Painel Admin.
 * MODO DEMO: usa mocks de @as/shared. MODO REAL: queries Supabase —
 * a RLS limita o acesso conforme o papel (equipe/clínico) no banco.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import {
  DEFAULT_LUNCH,
  mockAppointments,
  mockClinicalScales,
  mockDiaryEntries,
  mockPatients,
  mockRecordEntries,
  mockTimeBlocks,
  mockTransactions,
  type Appointment,
  type ClinicalScale,
  type DiaryEntry,
  type LunchConfig,
  type Patient,
  type RecordEntry,
  type TimeBlock,
  type Transaction,
} from "@as/shared";

export interface AgendaPrefs {
  lunch: LunchConfig;
  blockHolidays: boolean;
}

export const getAgendaPrefs = cache(async (): Promise<AgendaPrefs> => {
  if (isDemoMode()) return { lunch: DEFAULT_LUNCH, blockHolidays: true };
  const { data } = await (await supa())
    .from("clinic_settings")
    .select("lunch_enabled, lunch_start, lunch_end, lunch_weekdays, block_holidays")
    .eq("singleton", true)
    .maybeSingle();
  if (!data) return { lunch: DEFAULT_LUNCH, blockHolidays: true };
  return {
    lunch: {
      enabled: data.lunch_enabled ?? DEFAULT_LUNCH.enabled,
      start: data.lunch_start ?? DEFAULT_LUNCH.start,
      end: data.lunch_end ?? DEFAULT_LUNCH.end,
      weekdays: data.lunch_weekdays ?? DEFAULT_LUNCH.weekdays,
    },
    blockHolidays: data.block_holidays ?? true,
  };
});

async function supa() {
  return createServerSupabase(await cookies());
}

/* ───────────── mapeadores snake_case → tipos do domínio ─────────────
 * Exportados para reuso na camada dos crons (lib/cron-data.ts).        */

export function mapPatient(r: any): Patient {
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

export function mapAppointment(r: any): Appointment {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patients?.social_name ?? r.patients?.name ?? "—",
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    mode: r.mode,
    status: r.status,
    room: r.rooms?.name ?? null,
    videoLink: r.video_link,
    recurring: Boolean(r.recurrence_rule),
    cancelReason: r.cancel_reason ?? null,
  };
}

export function mapTransaction(r: any): Transaction {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patients?.social_name ?? r.patients?.name ?? null,
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

/* cache() do React: memoiza POR REQUISIÇÃO — várias seções da mesma
 * página compartilham uma única ida ao banco (ex.: dashboard chama
 * getAppointments direto e dentro de getDashboardStats). */

export const getPatients = cache(async (): Promise<Patient[]> => {
  if (isDemoMode()) return mockPatients;
  const { data } = await (await supa()).from("patients").select("*").order("name");
  return (data ?? []).map(mapPatient);
});

export async function getPatient(id: string): Promise<Patient | null> {
  if (isDemoMode()) return mockPatients.find((p) => p.id === id) ?? null;
  const { data } = await (await supa()).from("patients").select("*").eq("id", id).maybeSingle();
  return data ? mapPatient(data) : null;
}

export const getAppointments = cache(async (): Promise<Appointment[]> => {
  if (isDemoMode()) return [...mockAppointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const { data } = await (await supa())
    .from("appointments")
    .select("*, patients(name, social_name), rooms(name)")
    .order("starts_at");
  return (data ?? []).map(mapAppointment);
});

export async function getClinicalScales(patientId: string): Promise<ClinicalScale[]> {
  if (isDemoMode()) {
    return mockClinicalScales
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));
  }
  const { data } = await (await supa())
    .from("clinical_scales")
    .select("*")
    .eq("patient_id", patientId)
    .order("applied_at");
  return (data ?? []).map((s: any) => ({
    id: s.id,
    patientId: s.patient_id,
    instrument: s.instrument,
    score: s.score,
    maxScore: s.max_score,
    note: s.note,
    appliedAt: s.applied_at,
  }));
}

export async function getTimeBlocks(): Promise<TimeBlock[]> {
  if (isDemoMode()) return [...mockTimeBlocks].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const { data } = await (await supa()).from("time_blocks").select("*").order("starts_at");
  return (data ?? []).map((b: any) => ({
    id: b.id,
    title: b.title,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    kind: b.kind,
  }));
}

export const getTransactions = cache(async (): Promise<Transaction[]> => {
  if (isDemoMode()) return mockTransactions;
  const { data } = await (await supa())
    .from("transactions")
    .select("*, patients(name, social_name), receipts(number)")
    .order("due_date", { ascending: false });
  return (data ?? []).map(mapTransaction);
});

export async function getRecordEntries(patientId: string): Promise<RecordEntry[]> {
  if (isDemoMode()) {
    return mockRecordEntries
      .filter((r) => r.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  // RLS: somente perfis clínicos enxergam estas linhas (is_clinical)
  const { data } = await (await supa())
    .from("record_entries")
    .select("*, author:profiles(full_name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    kind: r.kind,
    title: r.title,
    content: r.content,
    authorName: r.author?.full_name ?? "—",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/** Diário do paciente — RLS: apenas perfis clínicos enxergam. */
export async function getPatientDiary(patientId: string): Promise<DiaryEntry[]> {
  if (isDemoMode()) {
    return mockDiaryEntries
      .filter((d) => d.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data } = await (await supa())
    .from("diary_entries")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    mood: r.mood,
    note: r.note,
    createdAt: r.created_at,
  }));
}

/** Todos os check-ins de diário (relatório de sentimentos) — RLS: só clínicos. */
export const getAllDiaryEntries = cache(async (): Promise<DiaryEntry[]> => {
  if (isDemoMode()) return mockDiaryEntries;
  const { data } = await (await supa())
    .from("diary_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    patientId: r.patient_id,
    mood: r.mood,
    note: r.note,
    createdAt: r.created_at,
  }));
});

/** Situação de pagamento de uma sessão (badge Pago/Pagar/Isento). */
export type PaymentBadge = "PAGO" | "PAGAR" | "ISENTO";

export async function getPaymentBadge(appointment: Appointment): Promise<PaymentBadge> {
  const txs = mockTransactions.filter((t) => t.patientId === appointment.patientId && t.kind === "RECEITA");
  if (txs.length === 0) return "ISENTO";
  return txs.some((t) => t.status === "PAGO") && !txs.some((t) => t.status === "ATRASADO") ? "PAGO" : "PAGAR";
}

/** Cobranças programadas — envio por e-mail/WhatsApp na data acordada. */
export interface BillingConfig {
  patientId: string;
  patientName: string;
  plan: "MENSALISTA" | "PACOTE_MENSAL" | "SESSAO_AVULSA" | "ISENTO";
  amountCents: number;
  billingDay: number; // dia do mês acordado com o paciente
  channels: ("EMAIL" | "WHATSAPP")[];
  autoCharge: boolean;
  pixKey: string;
}

export interface Charge {
  id: string;
  patientName: string;
  description: string;
  amountCents: number;
  scheduledFor: string;
  channels: ("EMAIL" | "WHATSAPP")[];
  status: "AGENDADA" | "ENVIADA" | "PAGA" | "VENCIDA";
}

const PIX_DEMO = "hello@andersonsilvapsicologo.com.br";

export async function getBillingConfigs(): Promise<BillingConfig[]> {
  if (!isDemoMode()) return []; // sem cobrança recorrente configurada ainda (sistema novo)
  return [
    { patientId: "pat-1", patientName: "Mariana Costa", plan: "MENSALISTA", amountCents: 80000, billingDay: 5, channels: ["EMAIL", "WHATSAPP"], autoCharge: true, pixKey: PIX_DEMO },
    { patientId: "pat-2", patientName: "João Pedro Lima", plan: "PACOTE_MENSAL", amountCents: 72000, billingDay: 1, channels: ["WHATSAPP"], autoCharge: true, pixKey: PIX_DEMO },
    { patientId: "pat-3", patientName: "Alex Ferreira", plan: "SESSAO_AVULSA", amountCents: 20000, billingDay: 10, channels: ["EMAIL"], autoCharge: false, pixKey: PIX_DEMO },
  ];
}

export async function getCharges(): Promise<Charge[]> {
  if (!isDemoMode()) return []; // nenhuma cobrança programada ainda (sistema novo)
  const d = (days: number) => {
    const x = new Date();
    x.setDate(x.getDate() + days);
    return x.toISOString();
  };
  return [
    { id: "chg-1", patientName: "Mariana Costa", description: "Mensalidade junho", amountCents: 80000, scheduledFor: d(-6), channels: ["EMAIL", "WHATSAPP"], status: "PAGA" },
    { id: "chg-2", patientName: "João Pedro Lima", description: "Pacote mensal junho", amountCents: 72000, scheduledFor: d(-10), channels: ["WHATSAPP"], status: "VENCIDA" },
    { id: "chg-3", patientName: "Alex Ferreira", description: "Sessão 12/06", amountCents: 20000, scheduledFor: d(-1), channels: ["EMAIL"], status: "ENVIADA" },
    { id: "chg-4", patientName: "Mariana Costa", description: "Mensalidade julho", amountCents: 80000, scheduledFor: d(24), channels: ["EMAIL", "WHATSAPP"], status: "AGENDADA" },
  ];
}

/** Modelo de mensagem de cobrança — profissional e acolhedor. */
export function chargeMessageTemplate(): string {
  return (
    "Olá, {{paciente.primeiro_nome}}! Tudo bem? 😊\n\n" +
    "Passando para lembrar com carinho da sua mensalidade de {{cobranca.mes}}, " +
    "no valor de {{cobranca.valor}}, combinada para o dia {{cobranca.dia_acordado}}.\n\n" +
    "Você pode pagar por PIX usando a chave abaixo:\n" +
    "🔑 {{pagamento.chave_pix}}\n\n" +
    "Assim que o pagamento for feito, o recibo fica disponível na sua Área do Paciente. " +
    "Se este mês estiver mais apertado ou se precisar conversar sobre datas e valores, " +
    "me chama por aqui — a gente sempre encontra um caminho juntos. ❤️\n\n" +
    "Um abraço,\nAnderson V. V. Silva · Psicólogo · CRP 06/166223"
  );
}

/** Painel do paciente — KPIs de presença, plano e atividades (print PsicoManager). */
export interface PatientPanel {
  startDate: string;
  status: "Cliente ativo" | "Em espera" | "Alta" | "Inativo";
  waitlist: string;
  meetLink: string | null; // link FIXO da série no Google Meet
  attendance: { present: number; absent: number; cancelled: number; unscored: number };
  plan: { label: string; model: string; amountCents: number; autoCharge: boolean };
  activities: { id: string; text: string; at: string }[];
}

export async function getPatientPanel(patientId: string): Promise<PatientPanel> {
  const billing = (await getBillingConfigs()).find((b) => b.patientId === patientId);
  const planLabels: Record<string, string> = {
    MENSALISTA: "Por mês",
    PACOTE_MENSAL: "Pacote mensal",
    SESSAO_AVULSA: "Por sessão",
    ISENTO: "Isento",
  };
  const plan = {
    label: billing ? planLabels[billing.plan] : "—",
    model: billing?.plan === "MENSALISTA" ? "Mensalidade" : billing?.plan === "PACOTE_MENSAL" ? "Pacote" : "Avulso",
    amountCents: billing?.amountCents ?? 0,
    autoCharge: billing?.autoCharge ?? false,
  };

  // DEMO: painel ilustrativo (mantém a demo bonita)
  if (isDemoMode()) {
    const d = (days: number, h = 11) => {
      const x = new Date();
      x.setDate(x.getDate() - days);
      x.setHours(h, 2, 0, 0);
      return x.toISOString();
    };
    const confirm = (days: number) =>
      `confirmou presença para a sessão marcada no dia ${new Date(d(days)).toLocaleDateString("pt-BR")} às 14:00`;
    return {
      startDate: "2023-06-09",
      status: "Cliente ativo",
      waitlist: "Sem lista de espera",
      meetLink: mockAppointments.find((a) => a.patientId === patientId && a.videoLink)?.videoLink ?? null,
      attendance: { present: 60, absent: 8, cancelled: 4, unscored: 25 },
      plan,
      activities: [6, 13, 20, 27, 34].map((days, i) => ({ id: `act-${i}`, text: confirm(days), at: d(days) })),
    };
  }

  // REAL: tudo calculado das sessões reais (zerado para paciente novo)
  const [patient, allAppts] = await Promise.all([getPatient(patientId), getAppointments()]);
  const appts = allAppts.filter((a) => a.patientId === patientId);
  const count = (s: string) => appts.filter((a) => a.status === s).length;
  const activityText = (a: Appointment) => {
    const dt = new Date(a.startsAt).toLocaleDateString("pt-BR");
    if (a.status === "REALIZADA") return `sessão realizada em ${dt}`;
    if (a.status === "FALTA") return `falta registrada na sessão de ${dt}`;
    if (a.status === "CANCELADA") return `sessão de ${dt} cancelada`;
    if (a.status === "CONFIRMADA") return `sessão confirmada para ${dt}`;
    return `sessão agendada para ${dt}`;
  };
  return {
    startDate: appts.length
      ? appts.reduce((min, a) => (a.startsAt < min ? a.startsAt : min), appts[0].startsAt)
      : patient?.createdAt ?? new Date().toISOString(),
    status: patient?.active ? "Cliente ativo" : "Inativo",
    waitlist: "Sem lista de espera",
    meetLink: appts.find((a) => a.videoLink)?.videoLink ?? null,
    attendance: {
      present: count("REALIZADA"),
      absent: count("FALTA"),
      cancelled: count("CANCELADA"),
      unscored: appts.filter((a) => a.status === "PENDENTE" || a.status === "CONFIRMADA").length,
    },
    plan,
    activities: [...appts]
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .slice(0, 8)
      .map((a) => ({ id: a.id, text: activityText(a), at: a.startsAt })),
  };
}

/** Agregados para a página de Relatórios. */
export async function getReportStats() {
  // DEMO: números ilustrativos
  if (isDemoMode()) {
    return {
      active: 13,
      waitlist: 0,
      discharged: 1,
      deactivated: 57,
      dropouts: 18,
      byGender: [
        { label: "Masculino", value: 10, color: "var(--info)" },
        { label: "Feminino", value: 3, color: "#ec4899" },
      ],
      byAge: [
        { label: "Crianças (0-12)", value: 0 },
        { label: "Adolescentes (13-20)", value: 0 },
        { label: "Jovens adultos (21-40)", value: 8 },
        { label: "Adultos (41-60)", value: 3 },
        { label: "Idosos (61+)", value: 2 },
      ],
      byPlan: [
        { label: "Mensalista", value: 9, color: "var(--success)" },
        { label: "Pacote mensal", value: 2, color: "#8b5cf6" },
        { label: "Sessão avulsa", value: 1, color: "#ec4899" },
        { label: "Isento", value: 1, color: "var(--info)" },
      ],
      autoChargePct: 92,
      bySource: [
        { label: "Site", value: 5 },
        { label: "Indicação", value: 4 },
        { label: "Instagram", value: 3 },
        { label: "Google", value: 1 },
      ],
      referrals: [
        { name: "Mariana Costa", count: 2 },
        { name: "Dra. Paula (psiquiatra parceira)", count: 2 },
      ],
    };
  }

  // REAL: calculado dos pacientes/planos reais (faixa etária a página calcula sozinha)
  const [patients, billing] = await Promise.all([getPatients(), getBillingConfigs()]);
  const planCount = (p: string) => billing.filter((b) => b.plan === p).length;
  const byPlan = [
    { label: "Mensalista", value: planCount("MENSALISTA"), color: "var(--success)" },
    { label: "Pacote mensal", value: planCount("PACOTE_MENSAL"), color: "#8b5cf6" },
    { label: "Sessão avulsa", value: planCount("SESSAO_AVULSA"), color: "#ec4899" },
    { label: "Isento", value: planCount("ISENTO"), color: "var(--info)" },
  ].filter((x) => x.value > 0);
  const withAuto = billing.filter((b) => b.autoCharge).length;
  return {
    active: patients.filter((p) => p.active).length,
    waitlist: 0,
    discharged: 0,
    deactivated: patients.filter((p) => !p.active).length,
    dropouts: 0,
    byGender: [] as { label: string; value: number; color: string }[],
    byAge: [] as { label: string; value: number }[],
    byPlan,
    autoChargePct: billing.length ? Math.round((withAuto / billing.length) * 100) : 0,
    bySource: [] as { label: string; value: number }[],
    referrals: [] as { name: string; count: number }[],
  };
}

/** Relatório individual do paciente, filtrável por ano/mês. */
export interface PatientReport {
  patient: Patient;
  sessions: { total: number; realizadas: number; confirmadas: number; faltas: number; canceladas: number };
  attendanceRate: number; // % presença sobre sessões encerradas
  revenue: { paidCents: number; openCents: number; avgTicketCents: number };
  monthsActive: number;
  mood: { average: number; delta: number; count: number } | null;
}

function inPeriod(iso: string, year: number, month: number | null): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && (month === null || d.getMonth() + 1 === month);
}

export async function getPatientReport(
  patientId: string,
  year: number,
  month: number | null
): Promise<PatientReport | null> {
  // uma única rodada paralela em vez de 4 idas sequenciais ao banco
  const [patient, allAppointments, allTransactions, diary] = await Promise.all([
    getPatient(patientId),
    getAppointments(),
    getTransactions(),
    getPatientDiary(patientId),
  ]);
  if (!patient) return null;

  const appointments = allAppointments.filter(
    (a) => a.patientId === patientId && inPeriod(a.startsAt, year, month)
  );
  const transactions = allTransactions.filter(
    (t) => t.patientId === patientId && t.kind === "RECEITA" && inPeriod(t.dueDate, year, month)
  );

  const realizadas = appointments.filter((a) => a.status === "REALIZADA").length;
  const faltas = appointments.filter((a) => a.status === "FALTA").length;
  const canceladas = appointments.filter((a) => a.status === "CANCELADA").length;
  const confirmadas = appointments.filter((a) => a.status === "CONFIRMADA" || a.status === "PENDENTE").length;
  const closed = realizadas + faltas;

  const paid = transactions.filter((t) => t.status === "PAGO");
  const paidCents = paid.reduce((s, t) => s + t.amountCents, 0);
  const openCents = transactions
    .filter((t) => t.status === "PENDENTE" || t.status === "ATRASADO")
    .reduce((s, t) => s + t.amountCents, 0);

  const monthsActive = Math.max(
    1,
    Math.round((Date.now() - new Date(patient.createdAt).getTime()) / (30 * 86_400_000))
  );

  // humor do diário no período — o check-in vira indicador clínico
  const moods = diary
    .filter((d) => d.mood && inPeriod(d.createdAt, year, month))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((d) => d.mood!);
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const mood =
    moods.length >= 2
      ? {
          average: Math.round(avg(moods) * 10) / 10,
          delta: Math.round((avg(moods.slice(Math.floor(moods.length / 2))) - avg(moods.slice(0, Math.floor(moods.length / 2)))) * 10) / 10,
          count: moods.length,
        }
      : null;

  return {
    patient,
    sessions: { total: appointments.length, realizadas, confirmadas, faltas, canceladas },
    attendanceRate: closed ? Math.round((realizadas / closed) * 100) : 100,
    revenue: {
      paidCents,
      openCents,
      avgTicketCents: paid.length ? Math.round(paidCents / paid.length) : 0,
    },
    monthsActive,
    mood,
  };
}

/** KPIs do dashboard executivo. */
export async function getDashboardStats() {
  // 3 consultas em paralelo (antes eram sequenciais: 3× a latência)
  const [appointments, transactions, patients] = await Promise.all([
    getAppointments(),
    getTransactions(),
    getPatients(),
  ]);
  const done = appointments.filter((a) => a.status === "REALIZADA").length;
  const missed = appointments.filter((a) => a.status === "FALTA").length;
  const receivables = transactions.filter((t) => t.kind === "RECEITA");
  const revenue = receivables.filter((t) => t.status === "PAGO").reduce((s, t) => s + t.amountCents, 0);
  const openCents = receivables
    .filter((t) => t.status === "PENDENTE" || t.status === "ATRASADO")
    .reduce((s, t) => s + t.amountCents, 0);
  const overdueCount = receivables.filter((t) => t.status === "ATRASADO").length;

  const now = new Date();
  const newPatientsMonth = patients.filter((p) => {
    const c = new Date(p.createdAt);
    return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear();
  }).length;
  const yearlyRevenueCents = receivables
    .filter((t) => t.status === "PAGO" && new Date(t.paidAt ?? t.dueDate).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + t.amountCents, 0);
  // ocupação: sessões ativas nos próximos 7 dias sobre ~40 horários/semana
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const upcoming = appointments.filter((a) => {
    const d = new Date(a.startsAt);
    return d >= now && d <= weekAhead && a.status !== "CANCELADA";
  }).length;

  return {
    activePatients: patients.filter((p) => p.active).length,
    newPatientsMonth,
    sessionsDone: done,
    monthlyRevenueCents: revenue,
    yearlyRevenueCents,
    openReceivablesCents: openCents,
    overdueCount,
    noShowRate: done + missed ? Math.round((missed / (done + missed)) * 100) : 0,
    occupancy: Math.min(100, Math.round((upcoming / 40) * 100)),
  };
}
