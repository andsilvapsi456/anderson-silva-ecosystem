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
