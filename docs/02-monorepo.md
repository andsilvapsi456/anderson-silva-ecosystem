# 02 · Estrutura do Monorepo

```
anderson-silva-ecosystem/
├── package.json              # npm workspaces + scripts turbo
├── turbo.json                # pipeline de build/dev/lint
├── tsconfig.base.json        # TS estrito compartilhado
├── .env.example              # todas as variáveis documentadas
│
├── apps/
│   ├── site/                 # 🌐 Site institucional (porta 3000)
│   │   ├── content/          #    HTML original do site real (fonte da verdade)
│   │   ├── public/           #    styles.css, site.js, fotos e marca originais
│   │   ├── lib/              #    loader que injeta "Área do Paciente" + CRM
│   │   └── app/              #    rotas /, /sobre, /servicos, /faq, /contato,
│   │                         #    /privacidade e POST /api/leads
│   │
│   ├── portal/               # 🤍 Portal do Paciente (porta 3001)
│   │   ├── app/login/        #    autenticação
│   │   ├── app/(app)/        #    dashboard, sessões, pagamentos,
│   │   │                     #    recibos, mensagens, dados
│   │   └── lib/data.ts       #    camada de dados (demo ⇄ Supabase)
│   │
│   ├── admin/                # 📊 Painel Administrativo (porta 3002)
│   │   ├── app/(app)/        #    dashboard, agenda, pacientes/[id],
│   │   │                     #    financeiro, relatórios, documentos,
│   │   │                     #    configurações (CRM removido por decisão —
│   │   │                     #    leads do site continuam indo para o banco)
│   │   └── lib/data.ts
│   │
│   └── future-mobile/        # 📱 Expo/React Native (Fase 4 — só README)
│
├── packages/
│   ├── design-system/        # 🎨 tokens.css — cores, tipografia, temas
│   ├── ui/                   # 🧩 Button, Card, Badge, Input, StatCard,
│   │                         #    Avatar, AppShell, ThemeToggle…
│   ├── shared/               # 📦 tipos, enums, formatadores pt-BR,
│   │                         #    constantes da marca, mocks de demo
│   ├── database/             # 🗄️ schema.prisma + cliente singleton
│   └── auth/                 # 🔐 Supabase SSR helpers + modo demo
│
├── supabase/
│   └── migrations/
│       └── 0001_init.sql     # triggers, RLS, buckets, auditoria
│
└── docs/                     # 📚 esta documentação (01–13)
```

## Regras de dependência

```
apps/* ──▶ packages/ui ──▶ packages/design-system
apps/* ──▶ packages/shared
apps/* ──▶ packages/auth ──▶ Supabase
apps/* ──▶ packages/database ──▶ Prisma ──▶ Postgres
packages/* nunca dependem de apps/*
```

## Comandos

```bash
npm install            # instala tudo (workspaces)
npm run dev            # os 3 apps em paralelo (turbo)
npm run dev:site       # só o site      → localhost:3000
npm run dev:portal     # só o portal    → localhost:3001
npm run dev:admin      # só o admin     → localhost:3002
npm run build          # build de produção dos 3
npm run db:generate    # prisma generate
npm run db:push        # cria as tabelas no Supabase
```
