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
