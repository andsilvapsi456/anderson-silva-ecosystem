/** Tipos de domínio do ecossistema Anderson Silva. Espelham o schema Prisma/Supabase. */

export type Role = "ADMIN" | "PSYCHOLOGIST" | "SECRETARY" | "COORDINATOR" | "PATIENT";

export type LeadSource = "SITE" | "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "INDICACAO" | "OUTRO";

export type LeadStage =
  | "NOVO"
  | "PRIMEIRO_CONTATO"
  | "TRIAGEM"
  | "AGENDAMENTO"
  | "EM_ATENDIMENTO"
  | "ALTA"
  | "PERDIDO";

export type AppointmentStatus = "PENDENTE" | "CONFIRMADA" | "REALIZADA" | "CANCELADA" | "FALTA";

export type AppointmentMode = "PRESENCIAL" | "ONLINE";

export type PaymentMethod = "PIX" | "CARTAO" | "BOLETO" | "DINHEIRO" | "TRANSFERENCIA";

export type TransactionStatus = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";

export type TransactionKind = "RECEITA" | "DESPESA";

export type RecordEntryKind =
  | "ANAMNESE"
  | "EVOLUCAO"
  | "PLANO_TERAPEUTICO"
  | "HIPOTESE_DIAGNOSTICA"
  | "ENCAMINHAMENTO"
  | "OBSERVACAO";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  stage: LeadStage;
  message: string | null;
  createdAt: string;
  lastContactAt: string | null;
}

export interface Patient {
  id: string;
  name: string;
  photoUrl: string | null;
  cpf: string | null;
  birthDate: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  insurance: string | null;
  financialGuardian: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  room: string | null;
  videoLink: string | null;
  recurring: boolean;
  /** Motivo informado ao cancelar — mostrado no cartão apagado da agenda. */
  cancelReason?: string | null;
}

/** Escala/instrumento clínico aplicado pelo psicólogo numa sessão. */
export interface ClinicalScale {
  id: string;
  patientId: string;
  instrument: string; // ex.: "GAD-7", "PHQ-9"
  score: number;
  maxScore: number;
  note?: string | null;
  appliedAt: string; // ISO
}

/** Instrumentos padronizados disponíveis para registro rápido. */
export const CLINICAL_INSTRUMENTS: { id: string; label: string; max: number; help: string }[] = [
  { id: "GAD-7", label: "GAD-7 (ansiedade)", max: 21, help: "0–4 mínima · 5–9 leve · 10–14 moderada · 15–21 grave" },
  { id: "PHQ-9", label: "PHQ-9 (depressão)", max: 27, help: "0–4 mínima · 5–9 leve · 10–14 moderada · 15–19 mod. grave · 20–27 grave" },
  { id: "Humor 0–10", label: "Escala de humor (0–10)", max: 10, help: "0 muito mal · 10 muito bem" },
  { id: "Ansiedade 0–10", label: "Ansiedade subjetiva (0–10)", max: 10, help: "0 nenhuma · 10 máxima" },
];

export type TimeBlockKind = "FERIAS" | "FOLGA" | "FERIADO" | "ALMOCO" | "OUTRO";

/** Bloqueio de agenda — período em que não se aceita marcar sessão. */
export interface TimeBlock {
  id: string;
  title: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
  kind: TimeBlockKind;
}

export interface Transaction {
  id: string;
  patientId: string | null;
  patientName: string | null;
  kind: TransactionKind;
  description: string;
  amountCents: number;
  method: PaymentMethod | null;
  status: TransactionStatus;
  dueDate: string;
  paidAt: string | null;
  receiptNumber: string | null;
}

export interface RecordEntry {
  id: string;
  patientId: string;
  kind: RecordEntryKind;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderRole: Role;
  senderName: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  patientId: string;
  /** 1–5 (😞 😕 😐 🙂 😄); null = só anotação */
  mood: number | null;
  note: string | null;
  createdAt: string;
}
