-- ════════════════════════════════════════════════════════════════════
-- 0008 · DEFAULTS NO BANCO (id + updated_at)
-- O Prisma gera `id` (uuid) e `updated_at` no código, então o DDL não
-- criou os DEFAULTs. Como o app grava direto pelo Supabase, sem esses
-- defaults toda inserção falha. Este script adiciona em TODAS as tabelas.
-- Idempotente: só preenche onde está faltando.
-- ════════════════════════════════════════════════════════════════════

do $$
declare r record;
begin
  -- id UUID sem default → gen_random_uuid()
  for r in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'id'
      and data_type = 'uuid'
      and column_default is null
  loop
    execute format('alter table public.%I alter column id set default gen_random_uuid()', r.table_name);
  end loop;

  -- created_at / updated_at sem default → now()
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name in ('created_at', 'updated_at')
      and data_type like 'timestamp%'
      and column_default is null
  loop
    execute format('alter table public.%I alter column %I set default now()', r.table_name, r.column_name);
  end loop;
end $$;
