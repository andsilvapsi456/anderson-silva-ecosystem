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
2. **SQL Editor** → execute **na ordem** todas as migrações:
   `0001_init` → `0002_notifications` → `0003_intake_diario` → `0004_agenda_pagamento` →
   `0005_time_blocks` → `0006_clinical_scales` → `0007_agenda_prefs`.
   > As migrações SQL são a **fonte de verdade** do banco (RLS incluída). Não use `prisma db push` sozinho.
3. Garanta 1 linha em `clinic_settings`: `insert into clinic_settings (singleton) values (true) on conflict do nothing;`
4. **Authentication → Providers**: habilite Email (e Google/Facebook se quiser login social); templates em pt-BR.
5. **Crie seu usuário admin** e dê o papel:
   ```sql
   update profiles set role = 'ADMIN' where email = 'andersonvictor07@gmail.com';
   ```

## 3. 👤 Vercel (free) — 3 projetos, mesmo repo

| Projeto | Root Directory | Domínio |
|---|---|---|
| `as-site`   | `apps/site`   | `andersonsilvapsicologo.com.br` |
| `as-portal` | `apps/portal` | `portal.andersonsilvapsicologo.com.br` |
| `as-admin`  | `apps/admin`  | `admin.andersonsilvapsicologo.com.br` |

Em cada projeto: Import do GitHub → Root Directory conforme a tabela → cole as variáveis de ambiente (próximo passo).
DNS: `CNAME portal/admin → cname.vercel-dns.com`; apex `A 76.76.21.21`. HTTPS é automático.

## 4. 👤 Variáveis de ambiente (cole em cada projeto Vercel)
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

## 5. Crons (Vercel free = 2 crons no projeto admin)
`apps/admin/vercel.json` já agenda a **agenda diária 8h** (`0 11 * * *` UTC). Os **lembretes a cada 15 min** rodam por GitHub Action (Vercel Hobby só faz cron diário) chamando `…/api/cron/reminders` com `Authorization: Bearer $CRON_SECRET`.

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
