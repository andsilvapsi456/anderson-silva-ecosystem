# 11 · Estratégia de Segurança e LGPD

Dados de saúde são **dados sensíveis** (LGPD art. 5º, II; tratamento regido pelo art. 11). Somado a isso, o Código de Ética do Psicólogo impõe sigilo profissional (arts. 9º–14) e guarda de registros conforme resoluções do CFP. A estratégia abaixo cobre os dois regimes.

## 1. Bases legais do tratamento

| Dado | Base legal |
|---|---|
| Cadastro do lead (nome, contato) | Consentimento (formulário com aviso) + legítimo interesse para retorno do contato |
| Cadastro do paciente | Execução de contrato (serviço de psicoterapia) |
| **Prontuário** | Art. 11, II, "f" — tutela da saúde por profissional de saúde; guarda obrigatória CFP (mín. 5 anos, Res. CFP 01/2009) |
| Financeiro/recibos | Obrigação legal (fiscal) |
| NPS/avisos | Consentimento, revogável |

## 2. Medidas técnicas

| Medida | Implementação |
|---|---|
| Criptografia em trânsito | TLS 1.3 (Vercel/Supabase, default) |
| Criptografia em repouso | AES-256 no Postgres e Storage (Supabase, default) |
| Autorização no banco | **RLS em 21 tabelas** — vazamento entre pacientes é impossível mesmo com bug no app |
| Sigilo clínico | Policy `is_clinical()` — prontuário invisível para não-clínicos |
| MFA | Supabase Auth TOTP, obrigatório para equipe (Fase 2) |
| Arquivos | Buckets privados; download só por URL assinada de 60s gerada no servidor após checagem de permissão |
| Auditoria | `audit_logs` imutável + trigger automático no prontuário |
| Versionamento clínico | `record_entry_versions` — nada se perde, tudo é rastreável |
| Backup | Supabase: backup diário automático (free); PITR no plano Pro. Adicional: GitHub Action semanal de `pg_dump` criptografado |
| Segredos | Variáveis de ambiente Vercel; `SERVICE_ROLE_KEY` jamais no cliente; `.env` no `.gitignore` |
| Sessões | Cookies httpOnly + SameSite (Supabase SSR); área logada com `robots: noindex` |
| Validação | Zod em toda entrada; queries parametrizadas (Prisma/PostgREST) |

## 3. Direitos dos titulares (LGPD art. 18)

| Direito | Como o sistema atende |
|---|---|
| Acesso / portabilidade | Exportação dos dados cadastrais e financeiros via portal (Fase 2); prontuário por solicitação formal com entrega supervisionada (CFP) |
| Correção | Paciente edita contatos no portal; demais via clínica |
| Eliminação | Dados cadastrais/marketing: anonimização sob demanda. **Prontuário: retenção obrigatória CFP prevalece** (art. 16, I — cumprimento de obrigação legal/regulatória) — o titular é informado disso |
| Revogação de consentimento | `consents.revoked_at` versionado, com trilha de IP e data |
| Informação | Política de privacidade no site; microcopy nos formulários; consentimentos visíveis no portal |

## 4. Governança

- **Controlador**: Anderson V. V. Silva (CRP 06/166223). Em clínica unipessoal, o titular acumula papel de DPO/encarregado — contato publicado na política de privacidade.
- **Minimização**: só se coleta o que o atendimento exige; campos opcionais explícitos.
- **Incidentes**: detectar (logs Supabase/Vercel) → conter (revogar chaves/sessões) → avaliar risco → comunicar ANPD e titulares quando houver risco relevante (art. 48) → registrar lições.
- **Teleatendimento**: registrado (participantes, início/fim, duração) conforme Resolução CFP nº 09/2024; consentimento específico (`consents.kind = 'teleatendimento'`).
- **IA assistiva**: opcional, com consentimento; conteúdo enviado minimizado/pseudonimizado; saída sempre revisada pelo profissional; nunca decide nada sozinha.

## 5. Autenticação em camadas (estado atual)

| Camada | Admin | Portal do Paciente |
|---|---|---|
| Identidade | Supabase Auth (e-mail+senha, JWT validado no servidor a cada request) | idem |
| Middleware | sessão obrigatória; renova token; `/login` e `/auth` públicos | idem + `/cadastro` e `/api/intake` públicos (token HMAC) |
| Papel | layout exige equipe; `PATIENT` → redirect ao portal | RLS limita tudo ao próprio paciente |
| Banco (RLS) | `is_staff()`/`is_clinical()` — prontuário e **diário** só para clínicos | `my_patient_id()` em todas as tabelas |
| Server Actions | validação Zod + auditoria em toda escrita | idem (contatos, diário) |
| Links públicos | — | cadastro via token HMAC assinado, validade 7 dias, gravação só via service role no servidor |
| Headers | X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-Policy | idem |
| Sessões | cookies httpOnly + SameSite; `noindex` | idem |

**Pendências recomendadas para o go-live:** MFA (TOTP) obrigatório para a equipe (Supabase Auth → MFA, Fase 2);
rate-limit de login (Supabase já aplica em `/auth`); senha mínima 12 caracteres no provider; revisão trimestral
dos logs de auditoria; e teste de RLS com um usuário de cada papel (roteiro no checklist abaixo).

## 6. Checklist antes do go-live

- [ ] Migração RLS aplicada e testada com 1 usuário de cada papel
- [ ] MFA ativo para todas as contas de equipe
- [ ] Política de privacidade publicada no site
- [ ] Termo de consentimento LGPD v1 cadastrado e fluxo de aceite testado
- [ ] Backup testado (restore real, não só dump)
- [ ] `SERVICE_ROLE_KEY` só nas env vars do servidor
- [ ] Domínios com HTTPS forçado
