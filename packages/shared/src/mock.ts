/**
 * MODO DEMO — dados fictícios para rodar o ecossistema sem Supabase configurado.
 * Quando NEXT_PUBLIC_SUPABASE_URL estiver definida, os apps trocam esta fonte
 * pelas queries reais (ver packages/database e lib/data.ts de cada app).
 * Nenhum dado aqui representa pessoa real.
 */
import type { Appointment, ClinicalScale, DiaryEntry, Lead, Message, Notice, Patient, RecordEntry, TimeBlock, Transaction } from "./types";

function daysFromNow(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const mockPatients: Patient[] = [
  {
    id: "pat-1",
    name: "Mariana Costa",
    photoUrl: null,
    cpf: "***.***.***-01",
    birthDate: "1994-03-12",
    phone: "(11) 98888-0001",
    whatsapp: "(11) 98888-0001",
    email: "mariana@example.com",
    address: "Rua das Acácias, 120 — São Paulo/SP",
    insurance: null,
    financialGuardian: null,
    notes: "Prefere sessões online às terças.",
    active: true,
    createdAt: daysFromNow(-180),
  },
  {
    id: "pat-2",
    name: "João Pedro Lima",
    photoUrl: null,
    cpf: "***.***.***-02",
    birthDate: "1988-08-25",
    phone: "+351 912 000 002",
    whatsapp: "+351 912 000 002",
    email: "joao.lima@example.com",
    address: "Lisboa — Portugal",
    insurance: null,
    financialGuardian: null,
    notes: "Brasileiro no exterior — sessões às 16h (horário de Brasília), fuso de Lisboa.",
    active: true,
    createdAt: daysFromNow(-90),
  },
  {
    id: "pat-3",
    name: "Alex Ferreira",
    photoUrl: null,
    cpf: "***.***.***-03",
    birthDate: "1999-11-02",
    phone: "(11) 96666-0003",
    whatsapp: "(11) 96666-0003",
    email: "alex@example.com",
    address: "Rua Augusta, 500 — São Paulo/SP",
    insurance: null,
    financialGuardian: null,
    notes: null,
    active: true,
    createdAt: daysFromNow(-45),
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: "apt-1",
    patientId: "pat-1",
    patientName: "Mariana Costa",
    startsAt: daysFromNow(1, 14, 0),
    endsAt: daysFromNow(1, 14, 50),
    mode: "ONLINE",
    status: "CONFIRMADA",
    room: null,
    videoLink: "https://meet.google.com/exemplo-demo",
    recurring: true,
  },
  {
    id: "apt-2",
    patientId: "pat-2",
    patientName: "João Pedro Lima",
    startsAt: daysFromNow(1, 16, 0),
    endsAt: daysFromNow(1, 16, 50),
    mode: "ONLINE",
    status: "PENDENTE",
    room: null,
    videoLink: "https://meet.google.com/exemplo-demo-3",
    recurring: true,
  },
  {
    id: "apt-3",
    patientId: "pat-3",
    patientName: "Alex Ferreira",
    startsAt: daysFromNow(2, 9, 0),
    endsAt: daysFromNow(2, 9, 50),
    mode: "ONLINE",
    status: "CONFIRMADA",
    room: null,
    videoLink: "https://meet.google.com/exemplo-demo-2",
    recurring: false,
  },
  {
    id: "apt-4",
    patientId: "pat-1",
    patientName: "Mariana Costa",
    startsAt: daysFromNow(-6, 14, 0),
    endsAt: daysFromNow(-6, 14, 50),
    mode: "ONLINE",
    status: "REALIZADA",
    room: null,
    videoLink: null,
    recurring: true,
  },
  {
    id: "apt-5",
    patientId: "pat-2",
    patientName: "João Pedro Lima",
    startsAt: daysFromNow(-7, 16, 0),
    endsAt: daysFromNow(-7, 16, 50),
    mode: "ONLINE",
    status: "FALTA",
    room: null,
    videoLink: null,
    recurring: true,
  },
  // Cancelada: continua visível na agenda (Anderson sabe), mas o horário ficou livre…
  {
    id: "apt-6",
    patientId: "pat-2",
    patientName: "João Pedro Lima",
    startsAt: daysFromNow(3, 10, 0),
    endsAt: daysFromNow(3, 10, 50),
    mode: "ONLINE",
    status: "CANCELADA",
    room: null,
    videoLink: null,
    recurring: false,
    cancelReason: "Paciente remarcou — imprevisto no trabalho",
  },
  // …e foi reaproveitado por outra sessão no mesmo horário.
  {
    id: "apt-7",
    patientId: "pat-3",
    patientName: "Alex Ferreira",
    startsAt: daysFromNow(3, 10, 0),
    endsAt: daysFromNow(3, 10, 50),
    mode: "ONLINE",
    status: "CONFIRMADA",
    room: null,
    videoLink: "https://meet.google.com/exemplo-demo-2",
    recurring: false,
  },
];

export const mockClinicalScales: ClinicalScale[] = [
  { id: "scl-1", patientId: "pat-1", instrument: "GAD-7", score: 15, maxScore: 21, note: "Início do acompanhamento", appliedAt: daysFromNow(-120) },
  { id: "scl-2", patientId: "pat-1", instrument: "GAD-7", score: 11, maxScore: 21, note: null, appliedAt: daysFromNow(-75) },
  { id: "scl-3", patientId: "pat-1", instrument: "GAD-7", score: 8, maxScore: 21, note: "Boa resposta às estratégias", appliedAt: daysFromNow(-30) },
  { id: "scl-4", patientId: "pat-1", instrument: "GAD-7", score: 6, maxScore: 21, note: null, appliedAt: daysFromNow(-3) },
];

// Bloqueios AVULSOS (o almoço e os feriados são gerados automaticamente).
export const mockTimeBlocks: TimeBlock[] = [
  {
    id: "blk-1",
    title: "Supervisão clínica",
    startsAt: daysFromNow(1, 18, 0),
    endsAt: daysFromNow(1, 19, 0),
    kind: "OUTRO",
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    patientId: "pat-1",
    patientName: "Mariana Costa",
    kind: "RECEITA",
    description: "Sessão de psicoterapia — junho",
    amountCents: 20000,
    method: "PIX",
    status: "PAGO",
    dueDate: daysFromNow(-6),
    paidAt: daysFromNow(-6),
    receiptNumber: "REC-2026-0142",
  },
  {
    id: "tx-2",
    patientId: "pat-1",
    patientName: "Mariana Costa",
    kind: "RECEITA",
    description: "Sessão de psicoterapia — junho",
    amountCents: 20000,
    method: null,
    status: "PENDENTE",
    dueDate: daysFromNow(1),
    paidAt: null,
    receiptNumber: null,
  },
  {
    id: "tx-3",
    patientId: "pat-2",
    patientName: "João Pedro Lima",
    kind: "RECEITA",
    description: "Pacote mensal — 4 sessões",
    amountCents: 72000,
    method: "CARTAO",
    status: "ATRASADO",
    dueDate: daysFromNow(-10),
    paidAt: null,
    receiptNumber: null,
  },
  {
    id: "tx-4",
    patientId: null,
    patientName: null,
    kind: "DESPESA",
    description: "Aluguel do consultório",
    amountCents: 250000,
    method: "TRANSFERENCIA",
    status: "PAGO",
    dueDate: daysFromNow(-5),
    paidAt: daysFromNow(-5),
    receiptNumber: null,
  },
];

export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Fernanda Oliveira",
    email: "fernanda@example.com",
    phone: "(11) 95555-0004",
    source: "SITE",
    stage: "NOVO",
    message: "Gostaria de saber valores e horários para terapia online.",
    createdAt: daysFromNow(0, 8, 30),
    lastContactAt: null,
  },
  {
    id: "lead-2",
    name: "Ricardo Mendes",
    email: null,
    phone: "(11) 94444-0005",
    source: "WHATSAPP",
    stage: "PRIMEIRO_CONTATO",
    message: "Moro na Irlanda e tenho sofrido com a adaptação. Vocês atendem no meu fuso?",
    createdAt: daysFromNow(-1, 19, 10),
    lastContactAt: daysFromNow(0, 9, 0),
  },
  {
    id: "lead-3",
    name: "Beatriz Santos",
    email: "bia.santos@example.com",
    phone: "(11) 93333-0006",
    source: "INSTAGRAM",
    stage: "TRIAGEM",
    message: "Procuro um espaço seguro e acolhedor. Atende pessoas trans?",
    createdAt: daysFromNow(-3, 12, 0),
    lastContactAt: daysFromNow(-1, 15, 0),
  },
  {
    id: "lead-4",
    name: "Paulo Henrique",
    email: "paulo.h@example.com",
    phone: null,
    source: "FACEBOOK",
    stage: "AGENDAMENTO",
    message: "Quero agendar uma primeira conversa.",
    createdAt: daysFromNow(-5),
    lastContactAt: daysFromNow(-2),
  },
];

export const mockRecordEntries: RecordEntry[] = [
  {
    id: "rec-1",
    patientId: "pat-1",
    kind: "ANAMNESE",
    title: "Anamnese inicial",
    content:
      "Queixa principal: episódios de ansiedade com impacto no trabalho. Histórico familiar e contexto registrados conforme roteiro de anamnese adulto.",
    authorName: "Anderson Silva",
    createdAt: daysFromNow(-180),
    updatedAt: daysFromNow(-180),
  },
  {
    id: "rec-2",
    patientId: "pat-1",
    kind: "EVOLUCAO",
    title: "Evolução — sessão 22",
    content:
      "Paciente relata melhora na qualidade do sono. Trabalhadas estratégias de enfrentamento discutidas na sessão anterior. Próximo passo: exposição gradual.",
    authorName: "Anderson Silva",
    createdAt: daysFromNow(-6),
    updatedAt: daysFromNow(-6),
  },
  {
    id: "rec-3",
    patientId: "pat-1",
    kind: "PLANO_TERAPEUTICO",
    title: "Plano terapêutico — revisão semestral",
    content:
      "Objetivos: (1) reduzir frequência de crises; (2) fortalecer rede de apoio; (3) desenvolver repertório de regulação emocional. Reavaliação em 8 semanas.",
    authorName: "Anderson Silva",
    createdAt: daysFromNow(-30),
    updatedAt: daysFromNow(-14),
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg-1",
    threadId: "thread-pat-1",
    senderRole: "PATIENT",
    senderName: "Mariana Costa",
    body: "Olá! Posso remarcar a sessão de quinta para sexta no mesmo horário?",
    createdAt: daysFromNow(-1, 18, 22),
    readAt: daysFromNow(-1, 19, 0),
  },
  {
    id: "msg-2",
    threadId: "thread-pat-1",
    senderRole: "SECRETARY",
    senderName: "Recepção",
    body: "Olá, Mariana! Sexta às 14h está disponível. Confirmo a alteração? 😊",
    createdAt: daysFromNow(-1, 19, 5),
    readAt: null,
  },
];

/** ~10 semanas de check-ins — uma trajetória com oscilação e melhora gradual. */
export const mockDiaryEntries: DiaryEntry[] = [
  { id: "dia-1", patientId: "pat-1", mood: 4, note: "Semana mais leve. Quero falar sobre a conversa difícil com minha chefe na terça.", createdAt: daysFromNow(-2, 21, 15) },
  { id: "dia-2", patientId: "pat-1", mood: 2, note: "Dormi mal quase todos os dias. Anotei dois gatilhos que percebi.", createdAt: daysFromNow(-9, 22, 40) },
  { id: "dia-3", patientId: "pat-1", mood: 4, note: null, createdAt: daysFromNow(-16, 20, 5) },
  { id: "dia-4", patientId: "pat-1", mood: 3, note: "Usei a respiração que treinamos antes da reunião. Funcionou pela metade, mas funcionou.", createdAt: daysFromNow(-23, 19, 30) },
  { id: "dia-5", patientId: "pat-1", mood: 3, note: null, createdAt: daysFromNow(-30, 21, 0) },
  { id: "dia-6", patientId: "pat-1", mood: 2, note: "Crise no domingo. Consegui sair dela mais rápido que das outras vezes.", createdAt: daysFromNow(-37, 22, 10) },
  { id: "dia-7", patientId: "pat-1", mood: 2, note: null, createdAt: daysFromNow(-44, 20, 45) },
  { id: "dia-8", patientId: "pat-1", mood: 1, note: "Semana muito difícil. Quase desmarquei a sessão.", createdAt: daysFromNow(-51, 23, 20) },
  { id: "dia-9", patientId: "pat-1", mood: 2, note: null, createdAt: daysFromNow(-58, 21, 50) },
  { id: "dia-10", patientId: "pat-1", mood: 1, note: "Primeira semana usando o diário.", createdAt: daysFromNow(-65, 22, 0) },
];

export const mockNotices: Notice[] = [
  {
    id: "not-1",
    title: "Recesso de julho",
    body: "A clínica estará em recesso de 20 a 27 de julho. As sessões serão reagendadas com antecedência.",
    createdAt: daysFromNow(-2),
  },
];
