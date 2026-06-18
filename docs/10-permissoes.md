# 10 · Estrutura de Permissões

5 papéis (`profiles.role`), aplicados em **duas camadas independentes**: middleware/UI (experiência) e **RLS no Postgres** (garantia real — mesmo com bug no app, o banco nega).

## Matriz de permissões

| Recurso | Admin | Psicólogo | Secretária | Coordenador | Paciente |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard executivo | ✅ | ✅ | 👁️ parcial | ✅ | — |
| Leads / CRM | ✅ | ✅ | ✅ | ✅ | — |
| Pacientes (cadastro) | ✅ | ✅ | ✅ | ✅ | 👁️✏️ o próprio (contatos) |
| **Prontuário (conteúdo clínico)** | ✅ | ✅ | ❌ **nunca** | ❌ **nunca** | ❌* |
| Agenda | ✅ | ✅ | ✅ | ✅ | 👁️ as próprias |
| Financeiro | ✅ | ✅ | ✅ | ✅ | 👁️ as próprias |
| Recibos | ✅ emite | ✅ emite | ✅ emite | 👁️ | 👁️⬇ os próprios |
| Documentos/templates | ✅ | ✅ | ✅ gera | 👁️ | 👁️⬇ os próprios |
| Mensagens | ✅ | ✅ | ✅ | ✅ | ✅ as próprias |
| Avisos | ✅ | ✅ | ✅ | ✅ | 👁️ |
| Tarefas internas | ✅ | ✅ | ✅ | ✅ | — |
| NPS | 👁️ | 👁️ | 👁️ | 👁️ | ✍️ responde |
| Auditoria | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestão de usuários/papéis | ✅ | ❌ | ❌ | ❌ | ❌ |

`✅` total · `👁️` leitura · `✏️` edição parcial · `⬇` download · `❌` negado

\* O paciente tem **direito legal de acesso ao registro** (CFP Res. 01/2009, art. 8º): atendido por solicitação formal mediante entrega supervisionada pelo psicólogo, não por acesso direto ao sistema.

## Fundamento ético do bloqueio clínico

O Código de Ética (art. 9º) e as resoluções do CFP exigem sigilo do material clínico. Por isso `record_entries` tem RLS `is_clinical()` — **somente ADMIN (o próprio psicólogo, dono da clínica) e PSYCHOLOGIST**. Secretária e coordenador veem que a sessão existiu (agenda), nunca o conteúdo.

## Implementação (3 camadas)

1. **RLS** (`supabase/migrations/0001_init.sql`): policies por tabela usando `current_role()`, `is_staff()`, `is_clinical()`, `my_patient_id()`.
2. **Middleware Next.js**: portal exige sessão; admin exige papel de equipe; paciente em rota admin → redirect.
3. **UI**: navegação e botões renderizados conforme papel (nunca como única defesa).

## Auditoria

Toda ação sensível grava `audit_logs` (ator, ação, entidade, IP, timestamp). Prontuário tem trigger automático — inclusive leituras via action dedicada. Somente o Admin lê a trilha; ninguém a edita (sem policy de UPDATE/DELETE).
