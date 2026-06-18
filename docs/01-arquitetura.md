# 01 · Arquitetura Completa

## Visão geral

Um único produto, três superfícies, um backend — tudo com a mesma identidade visual:

```
                         ┌──────────────────────────────────────────┐
                         │                VERCEL (free)             │
                         │                                          │
 andersonsilva.com.br ──▶│  apps/site      Next.js 15 (SSG/ISR)     │
 portal.andersonsilva ──▶│  apps/portal    Next.js 15 (SSR + RSC)   │
 admin.andersonsilva  ──▶│  apps/admin     Next.js 15 (SSR + RSC)   │
                         │                                          │
                         │  Server Actions + Route Handlers = API   │
                         └───────────────┬──────────────────────────┘
                                         │ HTTPS (TLS 1.3)
                         ┌───────────────▼──────────────────────────┐
                         │              SUPABASE (free)             │
                         │  PostgreSQL  · Auth (MFA) · Storage      │
                         │  Row Level Security em TODAS as tabelas  │
                         │  Realtime (mensagens) · Edge Functions   │
                         └──────────────────────────────────────────┘
                                         ▲
                         ┌───────────────┴──────────────────────────┐
                         │              GITHUB (free)               │
                         │  Monorepo · PRs · Actions (CI) · Deploy  │
                         └──────────────────────────────────────────┘
```

## Decisões e justificativas

| Decisão | Justificativa |
|---|---|
| **3 apps Next.js separados** (não 1 app com rotas) | Deploys independentes, domínios próprios (`portal.`, `admin.`), bundles menores, superfícies de ataque isoladas (o admin nunca expõe código ao público). Vercel free permite múltiplos projetos. |
| **Backend = Next.js (Server Actions + Route Handlers)** | Zero servidores para manter. NestJS adicionaria custo e complexidade sem ganho na escala atual (1 clínica). A migração futura é viável porque a lógica de domínio vive em `packages/`. |
| **Supabase como BaaS** | Postgres gerenciado + Auth + Storage + Realtime num único free tier. RLS faz a autorização no banco — mesmo um bug no app não vaza dados de outro paciente. |
| **Prisma + SQL nativo** | Prisma para DX e tipagem; migrations SQL nativas para o que o Prisma não cobre (RLS, triggers, buckets). |
| **Monorepo Turborepo + npm workspaces** | Design system e tipos compartilhados garantem a exigência nº 1: sair do site e entrar no sistema **sem perceber mudança visual**. |
| **Modo demo embutido** | Sem `NEXT_PUBLIC_SUPABASE_URL`, os apps rodam com dados fictícios. Você avalia o produto inteiro antes de criar qualquer conta. |

## Camadas

1. **Apresentação** — React Server Components por padrão; client components apenas onde há interação (formulários, kanban, agenda, toggle de tema).
2. **Aplicação** — Server Actions (mutações) e Route Handlers (webhooks: WhatsApp, pagamentos, Google Calendar). Validação com Zod em toda entrada.
3. **Domínio** — `packages/shared` (tipos/regras) e `packages/database` (Prisma).
4. **Dados** — Postgres com RLS; Storage com buckets privados e URLs assinadas; auditoria via trigger.

## Limites do free tier e plano de crescimento

| Recurso | Limite free | Suficiente para | Quando estourar |
|---|---|---|---|
| Supabase DB | 500 MB | ~anos de prontuários em texto | Pro US$ 25/mês |
| Supabase Storage | 1 GB | centenas de PDFs | Pro |
| Vercel | 100 GB-h/mês | tráfego de 1 clínica com folga | Pro US$ 20/mês |
| Supabase Auth | 50k MAU | décadas 🙂 | — |

Integrações pagas só na Fase 3+ (WhatsApp Business API, gateway de pagamento) — e cada uma é plugável sem refatorar.
