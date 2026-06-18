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
