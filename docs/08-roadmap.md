# 08 · Roadmap de Desenvolvimento

> Custo zero nas fases 0–2. Custos opcionais só aparecem na fase 3 (WhatsApp API, gateway de pagamento).

## Fase 0 — Fundação ✅ (entregue neste repositório)
- [x] Monorepo Turborepo + 5 packages compartilhados
- [x] Design system (tokens, light/dark, componentes)
- [x] Schema Prisma completo (21 modelos) + migração RLS
- [x] Site institucional com captura de leads → CRM
- [x] Portal do Paciente (6 telas) em modo demo
- [x] Painel Admin (7 telas) em modo demo
- [x] Documentação completa

## Fase 1 — Produção mínima (2–3 semanas)
**Objetivo: primeiro paciente real usando o portal.**
1. Criar projeto Supabase + rodar `db:push` + migração RLS ← **único passo manual restante**
2. ~~Login real (Supabase Auth) + middleware por papel~~ ✅ implementado (portal e admin; paciente é
   redirecionado ao portal; logout; redefinição de senha; callback de convite)
3. ~~Trocar `lib/data.ts` demo → queries Supabase~~ ✅ implementado com fallback demo automático
   (portal: cadastro/sessões/financeiro/mensagens/avisos + edição de contatos por Server Action;
   admin: pacientes/agenda/leads/transações/prontuário)
4. ~~CRUD pacientes~~ ✅ implementado (modal de cadastro completo; auditoria em toda escrita).
   ⚠️ Módulo CRM/kanban **removido por decisão de produto** em 11/06/2026 — clínica solo não precisa
   de funil; o formulário do site continua gravando leads na tabela `leads` para consulta futura
5. ~~Agenda: criar sessão + status~~ ✅ implementado (modal ligado ao banco; online + recorrente
   cria evento no Google Agenda com Meet fixo quando conectado; status pelo dashboard)
6. Deploy Vercel (3 projetos) + domínios `portal.` e `admin.`
7. Convite de paciente por e-mail (Supabase invite — callback já pronto)

## Fase 2 — Operação completa (4–6 semanas)
1. Prontuário: editor de evolução/anamnese com templates e versões
2. Financeiro: lançamentos, recibo PDF numerado no Storage
3. Mensagens em tempo real (Supabase Realtime)
4. Agenda: drag-and-drop (dnd-kit), recorrência RRULE, salas
5. Google Calendar sync (OAuth)
6. Vercel Cron: lembretes por e-mail (Resend free 100/dia)
7. Anexos no Storage com URL assinada
8. MFA (TOTP) para perfis de equipe

## Fase 3 — Diferenciais (6–8 semanas)
1. WhatsApp Cloud API: confirmação, lembretes 24h/2h, cobrança 💰
2. Gateway de pagamento PIX/cartão (Mercado Pago/Stripe) 💰
3. IA assistiva (Claude API): resumo de sessão, organização de anotações — com revisão humana obrigatória 💰 (~centavos/uso)
4. Editor de documentos rich-text (Tiptap) + assinatura eletrônica
5. NPS automático pós-sessão + dashboard de satisfação
6. Central de tarefas da equipe + chat interno
7. Relatórios financeiros exportáveis (PDF/CSV)

## Fase 4 — Mobile (8+ semanas)
Ver [`docs/13-mobile.md`](./13-mobile.md) — Expo/React Native reutilizando o backend inteiro.

## Critérios de pronto (DoD) por feature
Código revisado · validação Zod · RLS testada com usuário de cada papel · auditoria gravada · responsivo mobile · dark mode · microcopy pt-BR humanizada.
