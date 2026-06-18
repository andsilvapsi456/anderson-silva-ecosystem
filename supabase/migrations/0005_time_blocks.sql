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
