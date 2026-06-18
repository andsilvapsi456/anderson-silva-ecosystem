# 14 · Testes e Observabilidade

## Testes automatizados

Rodar: `npm test` (usa o `node:test` nativo — zero dependências).

| Arquivo | Cobre |
|---|---|
| `tests/schedule.test.ts` | sobreposição de horários, detecção de conflito (ignora canceladas), horário de atendimento |
| `tests/extenso.test.ts` | valor por extenso dos recibos (pegou um bug real: "mil **e** duzentos") |
| `tests/tokens.test.ts` | tokens HMAC de cadastro e de ação (round-trip, adulteração, expiração) |
| `tests/installments.test.ts` | parcelamento (rateio de centavos, vencimentos mensais) |

**23 testes, todos passando.** Cobrem a lógica pura mais sensível (dinheiro, segurança de links, agenda).

## Checklist de RLS (teste manual antes do go-live)

A RLS é a defesa real do sistema. Após aplicar as migrations, teste com **um usuário de cada papel** (criar via Supabase Auth + ajustar `profiles.role`):

- [ ] **Paciente** vê só os próprios: `appointments`, `transactions`, `diary_entries`, `documents`, `messages`. Não vê de outro paciente (trocar o id na URL/API → 0 linhas).
- [ ] **Paciente** NÃO lê `record_entries` (prontuário) nem `audit_logs`.
- [ ] **Secretária/Coordenador** NÃO leem `record_entries` nem `diary_entries` (só clínicos) — confirmar retorno vazio.
- [ ] **Psicólogo/Admin** leem prontuário e diário; secretária vê agenda mas não conteúdo clínico.
- [ ] **Admin** lê `audit_logs`; demais papéis não.
- [ ] Inserção anônima em `leads`/`patients` é negada (só via service role no servidor).
- [ ] Constraint `appointments_sem_sobreposicao`: tentar inserir duas sessões sobrepostas → erro do banco.

## Observabilidade

- **Captura de erros**: `apps/*/lib/observability.ts` — `reportError()` envia ao Sentry quando `SENTRY_DSN` estiver definido; senão, loga. Use em `catch` de rotas/crons críticos.
- **Painel de saúde**: Admin → Configurações → "Saúde do sistema" mostra quais integrações estão conectadas (Supabase, Resend, WhatsApp, Autentique, Google, NFS-e) e lembra de configurar as faltantes.
- **Crons**: cada execução loga um resumo (`sent: {...}`). Em produção, o GitHub Action de lembretes falha visível se o endpoint retornar erro.
- **Próximo passo recomendado**: Sentry (free tier) + Better Uptime para ping dos crons.
