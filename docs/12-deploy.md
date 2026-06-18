# 12 · Deploy — Vercel + Supabase + GitHub (R$ 0)

## Passo a passo do zero

### 1. GitHub
```bash
cd anderson-silva-ecosystem
git init && git add -A && git commit -m "feat: ecossistema inicial"
gh repo create anderson-silva-ecosystem --private --source=. --push
```

### 2. Supabase (free)
1. [supabase.com](https://supabase.com) → New project (região `sa-east-1` São Paulo).
2. Copie de **Settings → API**: `URL`, `anon key`, `service_role key`.
3. Copie de **Settings → Database**: connection strings (pooler 6543 → `DATABASE_URL`; direta 5432 → `DIRECT_URL`).
4. Crie as tabelas e aplique a segurança:
```bash
cp .env.example .env   # preencha as variáveis
npm install
npm run db:push        # Prisma cria as 21 tabelas
# SQL Editor do Supabase → cole e execute supabase/migrations/0001_init.sql
```
5. **Authentication → Providers**: habilite Email; configure templates em pt-BR.
6. Crie seu usuário admin: Authentication → Add user → depois `update profiles set role = 'ADMIN' where email = 'seu@email';`

### 3. Vercel (free) — 3 projetos do mesmo repo

| Projeto | Root Directory | Domínio |
|---|---|---|
| `as-site` | `apps/site` | `andersonsilvapsicologo.com.br` |
| `as-portal` | `apps/portal` | `portal.andersonsilvapsicologo.com.br` |
| `as-admin` | `apps/admin` | `admin.andersonsilvapsicologo.com.br` |

Para cada projeto: Import do repo GitHub → Root Directory conforme tabela (a Vercel detecta Turborepo e builda só o app afetado) → cole as env vars do `.env.example`.

DNS no seu provedor: `CNAME portal → cname.vercel-dns.com` (idem `admin`); apex via `A 76.76.21.21`. HTTPS automático.

### 4. Cron de lembretes (free: 2 crons)
`vercel.json` no projeto portal ou admin:
```json
{ "crons": [{ "path": "/api/cron/reminders", "schedule": "*/15 8-21 * * *" }] }
```

## CI/CD

- **Push na `main`** → Vercel builda e publica os 3 apps (só os afetados, graças ao Turborepo).
- **Pull Request** → Preview Deployment com URL única para revisar antes de publicar.
- Recomendado: branch protection na `main` + GitHub Action de `turbo build lint` como check.

## Modo demo vs produção

| | Demo (hoje) | Produção |
|---|---|---|
| Supabase | não precisa | projeto free |
| Login | botão demo | Supabase Auth + MFA |
| Dados | mocks `@as/shared` | Postgres com RLS |
| Custo | R$ 0 | **R$ 0** (free tiers) |

A troca é deliberadamente pequena: preencher `.env` e substituir as funções de `lib/data.ts` pelas queries (as assinaturas já são as finais).
