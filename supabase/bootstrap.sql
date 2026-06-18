-- ════════════════════════════════════════════════════════════════
-- BOOTSTRAP COMPLETO — cole no SQL Editor do Supabase e rode UMA vez.
-- Parte 1: tabelas + enums (gerado do schema Prisma).
-- Parte 2: RLS, triggers, funções e preferências (migrações 0001–0007).
-- ════════════════════════════════════════════════════════════════

-- ========== PARTE 1: ESQUEMA (tabelas, enums, índices, FKs) ==========
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PSYCHOLOGIST', 'SECRETARY', 'COORDINATOR', 'PATIENT');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('SITE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'INDICACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NOVO', 'PRIMEIRO_CONTATO', 'TRIAGEM', 'AGENDAMENTO', 'EM_ATENDIMENTO', 'ALTA', 'PERDIDO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDENTE', 'CONFIRMADA', 'REALIZADA', 'CANCELADA', 'FALTA');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "VideoProvider" AS ENUM ('GOOGLE_MEET', 'ZOOM', 'INTERNO');

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARTAO', 'BOLETO', 'DINHEIRO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "RecordEntryKind" AS ENUM ('ANAMNESE', 'EVOLUCAO', 'PLANO_TERAPEUTICO', 'HIPOTESE_DIAGNOSTICA', 'ENCAMINHAMENTO', 'OBSERVACAO');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('CONTRATO', 'DECLARACAO', 'RELATORIO', 'RECIBO', 'LAUDO', 'TERMO_LGPD', 'OUTRO');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'PUSH', 'INTERNO');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'SITE',
    "stage" "LeadStage" NOT NULL DEFAULT 'NOVO',
    "message" TEXT,
    "utm_campaign" TEXT,
    "last_contact_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "converted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "profile_id" UUID,
    "lead_id" UUID,
    "name" TEXT NOT NULL,
    "social_name" TEXT,
    "photo_url" TEXT,
    "pronouns" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "birth_date" DATE,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address_street" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_zip" TEXT,
    "insurance" TEXT,
    "financial_guardian" TEXT,
    "emergency_contact" TEXT,
    "naturalidade" TEXT,
    "billing_day" INTEGER,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "discharged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "ip_address" TEXT,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "clinician_id" UUID,
    "room_id" UUID,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "mode" "AppointmentMode" NOT NULL DEFAULT 'PRESENCIAL',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDENTE',
    "video_provider" "VideoProvider",
    "video_link" TEXT,
    "video_started_at" TIMESTAMP(3),
    "video_ended_at" TIMESTAMP(3),
    "recurrence_rule" TEXT,
    "recurrence_id" UUID,
    "google_event_id" TEXT,
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'WHATSAPP',
    "kind" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_entries" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "kind" "RecordEntryKind" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "record_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_entry_versions" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "edited_by" UUID NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_entry_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_templates" (
    "id" UUID NOT NULL,
    "kind" "RecordEntryKind" NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "record_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "patient_id" UUID,
    "appointment_id" UUID,
    "kind" "TransactionKind" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "method" "PaymentMethod",
    "description" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_at" TIMESTAMP(3),
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_codes" (
    "id" UUID NOT NULL,
    "contact" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "pdf_path" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "template_id" UUID,
    "kind" "DocumentKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pdf_path" TEXT,
    "signed_at" TIMESTAMP(3),
    "signed_by" TEXT,
    "signature_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "subject" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "assignee_id" UUID,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "due_date" DATE,
    "done_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_responses" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nps_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entries" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "mood" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "daily_agenda_enabled" BOOLEAN NOT NULL DEFAULT true,
    "daily_agenda_hour" INTEGER NOT NULL DEFAULT 8,
    "daily_agenda_email" TEXT,
    "remind_24h_email" BOOLEAN NOT NULL DEFAULT true,
    "remind_24h_whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "remind_2h_email" BOOLEAN NOT NULL DEFAULT false,
    "remind_2h_whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "billing_email" BOOLEAN NOT NULL DEFAULT true,
    "billing_whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "billing_retry_days" INTEGER NOT NULL DEFAULT 5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "leads_stage_idx" ON "leads"("stage");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE UNIQUE INDEX "patients_profile_id_key" ON "patients"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_lead_id_key" ON "patients"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE INDEX "patients_name_idx" ON "patients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE INDEX "appointments_starts_at_idx" ON "appointments"("starts_at");

-- CreateIndex
CREATE INDEX "appointments_patient_id_starts_at_idx" ON "appointments"("patient_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "reminders_scheduled_for_sent_at_idx" ON "reminders"("scheduled_for", "sent_at");

-- CreateIndex
CREATE INDEX "record_entries_patient_id_created_at_idx" ON "record_entries"("patient_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_status_due_date_idx" ON "transactions"("status", "due_date");

-- CreateIndex
CREATE INDEX "transactions_kind_due_date_idx" ON "transactions"("kind", "due_date");

-- CreateIndex
CREATE INDEX "recovery_codes_contact_expires_at_idx" ON "recovery_codes"("contact", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_transaction_id_key" ON "receipts"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_number_key" ON "receipts"("number");

-- CreateIndex
CREATE INDEX "messages_thread_id_created_at_idx" ON "messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "diary_entries_patient_id_created_at_idx" ON "diary_entries"("patient_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_settings_singleton_key" ON "clinic_settings"("singleton");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinician_id_fkey" FOREIGN KEY ("clinician_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_entries" ADD CONSTRAINT "record_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_entries" ADD CONSTRAINT "record_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_entry_versions" ADD CONSTRAINT "record_entry_versions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "record_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- ========== 0001_init.sql ==========
-- ════════════════════════════════════════════════════════════════
-- ANDERSON SILVA — ECOSSISTEMA CLÍNICO · MIGRAÇÃO INICIAL
-- Execute no SQL Editor do Supabase (ou `supabase db push`).
-- Cria: trigger de perfis, papéis, RLS por perfil e auditoria.
-- O DDL das tabelas de domínio é gerado pelo Prisma (`npm run db:push`);
-- este arquivo cobre o que o Prisma não gerencia: triggers, RLS e grants.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Perfil automático ao criar usuário no Supabase Auth ──────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::text, 'PATIENT')::"Role",
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. Helpers de papel (usados nas policies) ───────────────────
create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role() in ('ADMIN', 'PSYCHOLOGIST', 'SECRETARY', 'COORDINATOR');
$$;

create or replace function public.is_clinical()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.current_role() in ('ADMIN', 'PSYCHOLOGIST');
$$;

create or replace function public.my_patient_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.patients where profile_id = auth.uid();
$$;

-- ── 3. Ativar RLS em todas as tabelas sensíveis ──────────────────
alter table public.profiles              enable row level security;
alter table public.leads                 enable row level security;
alter table public.patients              enable row level security;
alter table public.consents              enable row level security;
alter table public.rooms                 enable row level security;
alter table public.appointments          enable row level security;
alter table public.reminders             enable row level security;
alter table public.record_entries        enable row level security;
alter table public.record_entry_versions enable row level security;
alter table public.record_templates      enable row level security;
alter table public.transactions          enable row level security;
alter table public.receipts              enable row level security;
alter table public.document_templates    enable row level security;
alter table public.documents             enable row level security;
alter table public.attachments           enable row level security;
alter table public.message_threads       enable row level security;
alter table public.messages              enable row level security;
alter table public.tasks                 enable row level security;
alter table public.notices               enable row level security;
alter table public.nps_responses         enable row level security;
alter table public.audit_logs            enable row level security;

-- ── 4. PROFILES ──────────────────────────────────────────────────
create policy "ver o próprio perfil"
  on public.profiles for select using (id = auth.uid());
create policy "staff vê todos os perfis"
  on public.profiles for select using (public.is_staff());
create policy "editar o próprio perfil"
  on public.profiles for update using (id = auth.uid());
create policy "admin gerencia perfis"
  on public.profiles for all using (public.current_role() = 'ADMIN');

-- ── 5. LEADS — apenas equipe; inserção pública via service role ──
create policy "staff gerencia leads"
  on public.leads for all using (public.is_staff());
-- O formulário do site insere leads via Server Action com SERVICE_ROLE_KEY
-- (server-side apenas), portanto não há policy de insert anônimo.

-- ── 6. PATIENTS ──────────────────────────────────────────────────
create policy "staff gerencia pacientes"
  on public.patients for all using (public.is_staff());
create policy "paciente vê o próprio cadastro"
  on public.patients for select using (profile_id = auth.uid());
create policy "paciente edita contatos do próprio cadastro"
  on public.patients for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── 7. CONSENTS ──────────────────────────────────────────────────
create policy "staff gerencia consentimentos"
  on public.consents for all using (public.is_staff());
create policy "paciente vê e registra os próprios consentimentos"
  on public.consents for select using (patient_id = public.my_patient_id());
create policy "paciente registra consentimento"
  on public.consents for insert with check (patient_id = public.my_patient_id());

-- ── 8. AGENDA ────────────────────────────────────────────────────
create policy "staff gerencia salas"   on public.rooms for all using (public.is_staff());
create policy "staff gerencia agenda"  on public.appointments for all using (public.is_staff());
create policy "paciente vê as próprias sessões"
  on public.appointments for select using (patient_id = public.my_patient_id());
create policy "staff gerencia lembretes" on public.reminders for all using (public.is_staff());

-- ── 9. PRONTUÁRIO — SOMENTE perfis clínicos. Sigilo profissional:
--      secretária e coordenador NÃO acessam conteúdo clínico (CFP).
create policy "clínicos gerenciam prontuário"
  on public.record_entries for all using (public.is_clinical());
create policy "clínicos veem versões"
  on public.record_entry_versions for all using (public.is_clinical());
create policy "clínicos gerenciam templates clínicos"
  on public.record_templates for all using (public.is_clinical());

-- ── 10. FINANCEIRO ───────────────────────────────────────────────
create policy "staff gerencia transações"
  on public.transactions for all using (public.is_staff());
create policy "paciente vê as próprias cobranças"
  on public.transactions for select using (patient_id = public.my_patient_id());
create policy "staff gerencia recibos"
  on public.receipts for all using (public.is_staff());
create policy "paciente vê os próprios recibos"
  on public.receipts for select using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.patient_id = public.my_patient_id()
    )
  );

-- ── 11. DOCUMENTOS ───────────────────────────────────────────────
create policy "staff gerencia templates de documento"
  on public.document_templates for all using (public.is_staff());
create policy "staff gerencia documentos"
  on public.documents for all using (public.is_staff());
create policy "paciente vê os próprios documentos"
  on public.documents for select using (patient_id = public.my_patient_id());
create policy "staff gerencia anexos"
  on public.attachments for all using (public.is_staff());
create policy "paciente vê os próprios anexos"
  on public.attachments for select using (patient_id = public.my_patient_id());

-- ── 12. MENSAGENS ────────────────────────────────────────────────
create policy "staff gerencia threads"
  on public.message_threads for all using (public.is_staff());
create policy "paciente vê as próprias threads"
  on public.message_threads for select using (patient_id = public.my_patient_id());
create policy "participantes leem mensagens"
  on public.messages for select using (
    public.is_staff() or exists (
      select 1 from public.message_threads th
      where th.id = thread_id and th.patient_id = public.my_patient_id()
    )
  );
create policy "participantes enviam mensagens"
  on public.messages for insert with check (
    sender_id = auth.uid() and (
      public.is_staff() or exists (
        select 1 from public.message_threads th
        where th.id = thread_id and th.patient_id = public.my_patient_id()
      )
    )
  );

-- ── 13. OPERAÇÃO ─────────────────────────────────────────────────
create policy "staff gerencia tarefas" on public.tasks for all using (public.is_staff());
create policy "staff gerencia avisos"  on public.notices for all using (public.is_staff());
create policy "todos leem avisos vigentes"
  on public.notices for select using (expires_at is null or expires_at > now());
create policy "staff lê NPS"
  on public.nps_responses for select using (public.is_staff());
create policy "paciente responde NPS"
  on public.nps_responses for insert with check (patient_id = public.my_patient_id());

-- ── 14. AUDITORIA — escrita por todos autenticados, leitura só admin
create policy "autenticados registram auditoria"
  on public.audit_logs for insert with check (auth.uid() is not null);
create policy "admin lê auditoria"
  on public.audit_logs for select using (public.current_role() = 'ADMIN');

-- ── 15. STORAGE — buckets privados ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false), ('recibos', 'recibos', false), ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "staff acessa anexos"
  on storage.objects for all
  using (bucket_id in ('anexos', 'recibos', 'documentos') and public.is_staff());
-- Pacientes baixam arquivos via URL assinada gerada no servidor (Server Action),
-- nunca por acesso direto ao bucket.

-- ── 16. Auditoria automática de prontuário (trigger) ─────────────
create or replace function public.audit_record_entry()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_logs (id, actor_id, action, entity, entity_id, created_at)
  values (gen_random_uuid(), auth.uid(), lower(tg_op) || '_record_entry', 'record_entries',
          coalesce(new.id, old.id)::text, now());
  -- Versionamento: updates preservam o conteúdo anterior
  if tg_op = 'UPDATE' and old.content is distinct from new.content then
    insert into public.record_entry_versions (id, entry_id, content, edited_by, edited_at)
    values (gen_random_uuid(), old.id, old.content, auth.uid(), now());
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists record_entry_audit on public.record_entries;
create trigger record_entry_audit
  before insert or update or delete on public.record_entries
  for each row execute procedure public.audit_record_entry();

-- ========== 0002_notifications.sql ==========
-- ════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 0002 · NOTIFICAÇÕES
-- Execute APÓS `npm run db:push` (que cria a tabela clinic_settings).
-- Cobre RLS da nova tabela e a linha inicial de configurações.
-- ════════════════════════════════════════════════════════════════

alter table public.clinic_settings enable row level security;

create policy "staff lê configurações"
  on public.clinic_settings for select using (public.is_staff());
create policy "admin gerencia configurações"
  on public.clinic_settings for all using (public.current_role() = 'ADMIN');

-- Linha única com os padrões (e-mail diário 8h ativado)
insert into public.clinic_settings (id, singleton, updated_at)
values (gen_random_uuid(), true, now())
on conflict (singleton) do nothing;

-- Observação de agendamento (sem custo):
--  • Agenda diária 8h  → Vercel Cron (Hobby permite 1 execução/dia):
--      apps/admin/vercel.json → "0 11 * * *" (11h UTC = 8h em São Paulo)
--  • Lembretes 24h/2h e cobranças → GitHub Action a cada 15 min
--      (.github/workflows/reminders.yml) chamando /api/cron/reminders,
--      pois o plano Hobby da Vercel não roda crons em frequência menor que diária.
--      Alternativa: pg_cron do Supabase + Edge Function.

-- ========== 0003_intake_diario.sql ==========
-- ════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 0003 · LINK DE CADASTRO + DIÁRIO DO PACIENTE
-- Execute APÓS `npm run db:push` (que cria as colunas naturalidade/
-- billing_day em patients e a tabela diary_entries).
-- ════════════════════════════════════════════════════════════════

-- ── Diário do paciente ───────────────────────────────────────────
alter table public.diary_entries enable row level security;

-- paciente escreve e lê o próprio diário
create policy "paciente escreve no próprio diário"
  on public.diary_entries for insert
  with check (patient_id = public.my_patient_id());
create policy "paciente lê o próprio diário"
  on public.diary_entries for select using (patient_id = public.my_patient_id());

-- conteúdo sensível: só perfis CLÍNICOS leem (secretária/coordenador não)
create policy "clínicos leem diários"
  on public.diary_entries for select using (public.is_clinical());

-- ── Link de cadastro (intake) ────────────────────────────────────
-- Não exige tabela: o token é assinado por HMAC (INTAKE_SECRET) e o
-- envio do formulário grava via SERVICE_ROLE no servidor — por isso
-- não há policy de update anônimo em patients (de propósito).

-- ========== 0004_agenda_pagamento.sql ==========
-- ════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 0004 · AGENDA (anti-conflito) + PAGAMENTO + CONSENTIMENTO + OTP
-- Execute após `npm run db:push`.
-- ════════════════════════════════════════════════════════════════

-- ── 1. Prevenção de conflito de horário no BANCO ─────────────────
-- Garante que duas sessões NÃO-canceladas nunca se sobreponham,
-- mesmo que um bug no app tente inserir. Usa GiST + tstzrange.
create extension if not exists btree_gist;

alter table public.appointments
  add constraint appointments_sem_sobreposicao
  exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  ) where (status <> 'CANCELADA');

-- ── 2. Pagamento: PIX manual (Nubank) — sem gateway, nada a criar aqui.

-- ── 3. Códigos de recuperação de senha (OTP WhatsApp/SMS) ────────
create table if not exists public.recovery_codes (
  id          uuid primary key default gen_random_uuid(),
  contact     text not null,            -- telefone/e-mail (normalizado)
  code_hash   text not null,            -- sha256 do código (nunca em claro)
  channel     text not null,            -- 'whatsapp' | 'sms'
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists idx_recovery_contact on public.recovery_codes (contact, expires_at);
alter table public.recovery_codes enable row level security;
-- Sem policies: acesso só via SERVICE_ROLE no servidor (nunca pelo cliente).

-- ── 4. Consentimentos: já existe a tabela; reforço de unicidade ──
create unique index if not exists uq_consent_patient_kind_version
  on public.consents (patient_id, kind, version);

-- ========== 0005_time_blocks.sql ==========
-- ════════════════════════════════════════════════════════════════════
-- 0005 · BLOQUEIOS DE AGENDA (férias, folgas, feriados, almoço)
-- Períodos em que nenhuma sessão pode ser marcada. A prevenção de
-- conflito do app considera estes bloqueios além das sessões existentes.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.time_blocks (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  kind       text not null default 'OUTRO'
             check (kind in ('FERIAS', 'FOLGA', 'FERIADO', 'ALMOCO', 'OUTRO')),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_time_blocks_range on public.time_blocks (starts_at, ends_at);

alter table public.time_blocks enable row level security;

-- Só a equipe da clínica enxerga e gerencia os bloqueios.
create policy "staff gerencia bloqueios"
  on public.time_blocks for all using (public.is_staff());

-- ========== 0006_clinical_scales.sql ==========
-- ════════════════════════════════════════════════════════════════════
-- 0006 · ESCALAS CLÍNICAS (instrumentos padronizados por sessão)
-- Ex.: GAD-7, PHQ-9, escalas subjetivas 0–10. Vira gráfico de evolução
-- na ficha do paciente. Dado clínico sensível → RLS is_clinical().
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.clinical_scales (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  instrument text not null,
  score      int not null check (score >= 0),
  max_score  int not null check (max_score > 0),
  note       text,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (score <= max_score)
);

create index if not exists idx_clinical_scales_patient
  on public.clinical_scales (patient_id, applied_at);

alter table public.clinical_scales enable row level security;

-- Só perfis clínicos (psicólogo) acessam — mesmo sigilo do prontuário.
create policy "clinico gerencia escalas"
  on public.clinical_scales for all using (public.is_clinical());

-- ========== 0007_agenda_prefs.sql ==========
-- ════════════════════════════════════════════════════════════════════
-- 0007 · PREFERÊNCIAS DA AGENDA (almoço recorrente + feriados)
-- O almoço e os feriados (nacionais + SP estado + SP cidade) bloqueiam a
-- agenda automaticamente. Estas colunas guardam a escolha do psicólogo.
-- ════════════════════════════════════════════════════════════════════

alter table public.clinic_settings
  add column if not exists lunch_enabled  boolean not null default true,
  add column if not exists lunch_start    text    not null default '12:00',
  add column if not exists lunch_end      text    not null default '13:00',
  add column if not exists lunch_weekdays int[]   not null default '{1,2,3,4,5}',
  add column if not exists block_holidays boolean not null default true;
