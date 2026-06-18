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
