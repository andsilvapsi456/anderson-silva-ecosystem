# 16 · Go-live — checklist de lançamento

Runbook único para tirar o sistema do **modo demo** e colocar em produção.
Ordem importa. O que **só você** pode fazer está marcado com 👤.

---

## 0. Antes de tudo
- [ ] 👤 **Rotacionar o token do Autentique** (o atual foi exposto em conversa — gere um novo em autentique.com.br → API).
- [ ] Segredos já gerados para você (cole no `.env` de produção):
  - `INTAKE_SECRET=96f58349c84964f8a7bebbebd6cd6a13b0bd48a36b400825286dace6edda3a47`
  - `CRON_SECRET=1d4c10434422259a15d705a51f6edf02356c92c287141b771b4364935c8d1b0c`
  - `WHATSAPP_VERIFY_TOKEN=7faf101f31a8bff06db93946c4c5c22a`
  > Se preferir, gere novos: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## 1. 👤 GitHub
```bash
cd anderson-silva-ecosystem
git add -A && git commit -m "chore: pronto para produção"
gh repo create anderson-silva-ecosystem --private --source=. --push
```
(O repositório já está inicializado e com um commit limpo — `.env` está no `.gitignore`, nenhum segredo vai para o GitHub.)

## 2. 👤 Supabase (free, região São Paulo `sa-east-1`)
1. New project → copie de **Settings → API**: `URL`, `anon key`, `service_role key`.
2. **SQL Editor** → **New query** → cole o conteúdo de **`supabase/bootstrap.sql`** → **Run**.
   > Esse arquivo é o **script único e completo**: Parte 1 cria as tabelas/enums (DDL do Prisma),
   > Parte 2 aplica RLS + triggers + as migrações `0001`→`0007`. Não precisa de connection string
   > nem de `prisma db push`. Para copiá-lo de uma vez (macOS):
   > `cat supabase/bootstrap.sql | pbcopy`
3. Garanta 1 linha em `clinic_settings`: `insert into clinic_settings (singleton) values (true) on conflict do nothing;`
4. **Authentication → Providers**: habilite Email (e Google/Facebook se quiser login social); templates em pt-BR.
5. **Crie seu usuário admin** e dê o papel:
   ```sql
   update profiles set role = 'ADMIN' where email = 'andersonvictor07@gmail.com';
   ```

## 3. 👤 Cloudflare Workers (free, comercial OK) — 3 apps, mesmo repo

Os apps usam o adaptador **OpenNext** (`@opennextjs/cloudflare`) — já configurado
(`open-next.config.ts` + `wrangler.jsonc` em cada app).

No painel **Cloudflare → Workers & Pages → Create → Workers → Connect to Git**,
crie **3 Workers** a partir do mesmo repositório:

| Worker | Root directory | Build command | Deploy command |
|---|---|---|---|
| `as-site`   | `apps/site`   | `npx opennextjs-cloudflare build` | `npx wrangler deploy` |
| `as-portal` | `apps/portal` | `npx opennextjs-cloudflare build` | `npx wrangler deploy` |
| `as-admin`  | `apps/admin`  | `npx opennextjs-cloudflare build` | `npx wrangler deploy` |

> A compatibilidade `nodejs_compat` já está nos `wrangler.jsonc`. Domínios
> customizados: em cada Worker → **Settings → Domains & Routes** → Add custom domain
> (`andersonsilvapsicologo.com.br`, `portal.…`, `admin.…`). HTTPS é automático.

## 4. 👤 Variáveis de ambiente (em cada Worker → Settings → Variables)
Use o `.env.example` como mapa. Mínimo para o sistema **funcionar de verdade** (sair do demo):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PORTAL_URL`, `NEXT_PUBLIC_ADMIN_URL`
- `INTAKE_SECRET`, `CRON_SECRET` (os gerados acima)
- `PIX_KEY` (sua chave Nubank)

Para cada integração que quiser ligar:
- **E-mail (Resend)**: `RESEND_API_KEY`, `EMAIL_FROM` — e **verificar o domínio** (SPF/DKIM/DMARC) senão cai em spam.
- **WhatsApp (Meta)**: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` — conta verificada + **templates aprovados** pela Meta (os botões confirmar/cancelar dependem disso). Webhook: `…/api/webhooks/whatsapp`.
- **Google Calendar**: `GOOGLE_CALENDAR_CLIENT_ID/SECRET/REFRESH_TOKEN`.
- **Autentique**: `AUTENTIQUE_TOKEN` (o novo, rotacionado).
- **NFS-e Osasco (Focus NFe)**: `FOCUS_NFE_TOKEN`, `FOCUS_NFE_AMBIENTE` (`homologacao`→`producao`), `NFSE_PRESTADOR_CNPJ`, `NFSE_INSCRICAO_MUNICIPAL`.
- **Erros (opcional)**: `SENTRY_DSN`.

## 5. Crons (GitHub Actions — grátis, independem do host)
Já configurados em `.github/workflows/`:
- **`daily-agenda.yml`** — e-mail da agenda às 8h (BRT).
- **`reminders.yml`** — lembretes a cada 15 min.
- **`backup-db.yml`** — backup do banco aos domingos.

No GitHub → **Settings → Secrets and variables → Actions**, crie os secrets:
`CRON_SECRET`, `DAILY_AGENDA_URL` (`https://admin.SEU-DOMINIO/api/cron/daily-agenda`),
`REMINDERS_URL` (`…/api/cron/reminders`) e `SUPABASE_DB_URL` (string de conexão do banco, para o backup).

## 6. ✅ Smoke test pós-deploy (faça com 1 paciente de teste)
1. Login no admin com 2FA.
2. `+ Novo paciente` → gerar link de cadastro → preencher pelo portal → **contrato chega no Autentique**.
3. Agendar sessão online → confere **link do Meet** + e-mail de confirmação.
4. Marcar pagamento → baixar **recibo** e o **informe de IR**.
5. Cancelar/remarcar uma sessão → paciente recebe aviso; agenda reflete.
6. Conferir o painel **“Saúde do sistema”** (Configurações): todas as integrações conectadas.

## 7. Operacional contínuo
- Backups automáticos do Supabase (plano pago recomendado p/ retenção de 5 anos — CFP).
- Acompanhar erros (Sentry) e os logs de auditoria (`audit_logs`).
- Manter a **Política de Privacidade** (`/privacidade`) e os termos atualizados.
