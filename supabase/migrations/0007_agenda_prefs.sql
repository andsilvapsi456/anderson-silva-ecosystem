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
