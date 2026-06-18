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
