# 🤍 Ecossistema Anderson Silva — Clínica de Psicologia

Plataforma digital completa para a clínica **Anderson Silva — Psicólogo Clínico (CRP 06/166223)**: site institucional, portal do paciente e painel administrativo com a mesma identidade visual (coral `#FF5A5A` · ink `#202020` · Montserrat · light/dark).

**Custo inicial: R$ 0** — Vercel Free + Supabase Free + GitHub Free, com **modo demo** que roda tudo localmente sem nenhuma conta externa.

## 🚀 Rodar agora (modo demo)

```bash
npm install
npm run dev
```

| App | URL | O que tem |
|---|---|---|
| 🌐 Site | http://localhost:3000 | Home, captura de leads → CRM, botão "Área do Paciente" |
| 🤍 Portal do Paciente | http://localhost:3001 | Dashboard, sessões + teleconsulta, pagamentos, recibos, mensagens, dados |
| 📊 Painel Admin | http://localhost:3002 | Dashboard executivo, agenda, pacientes + prontuário, CRM kanban, financeiro, documentos |

Sem `NEXT_PUBLIC_SUPABASE_URL` configurada, os apps usam dados fictícios. Para produção, siga [`docs/12-deploy.md`](docs/12-deploy.md).

## 📚 Documentação (entregáveis)

| Doc | Conteúdo |
|---|---|
| [01](docs/01-arquitetura.md) | Arquitetura completa e decisões |
| [02](docs/02-monorepo.md) | Estrutura do monorepo |
| [03](docs/03-banco-de-dados.md) | Banco de dados + **diagrama ER** (a modelagem Prisma está em [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma)) |
| [04](docs/04-apis.md) | APIs — Server Actions e Route Handlers |
| [05](docs/05-fluxos-navegacao.md) | Fluxos de navegação (lead → fidelização) |
| [06](docs/06-wireframes.md) | Wireframes de todas as telas |
| [07](docs/07-design-system.md) | Design System "Acolher" |
| [08](docs/08-roadmap.md) | Roadmap (fases 0–4) |
| [09](docs/09-backlog.md) | Backlog — 50 histórias priorizadas |
| [10](docs/10-permissoes.md) | Permissões (5 papéis, matriz + RLS) |
| [11](docs/11-seguranca-lgpd.md) | Segurança LGPD + ética CFP |
| [12](docs/12-deploy.md) | Deploy Vercel + Supabase + GitHub |
| [13](docs/13-mobile.md) | Plano do app mobile |

## 🏗️ Estrutura

```
apps/        site · portal · admin · future-mobile
packages/    design-system · ui · shared · database · auth
supabase/    migrations (RLS, triggers, auditoria)
docs/        01–13
```

## 🛡️ Segurança em uma linha

Row Level Security em todas as tabelas: paciente só vê o que é dele, secretária nunca lê prontuário, e toda ação sensível deixa trilha de auditoria. Detalhes em [`docs/11-seguranca-lgpd.md`](docs/11-seguranca-lgpd.md).
