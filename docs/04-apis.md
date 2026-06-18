# 04 · APIs — Server Actions e Route Handlers

Princípio: **mutações via Server Actions** (CSRF-safe, tipadas, sem endpoint público); **Route Handlers apenas para quem vem de fora** (webhooks, cron, downloads).

## Server Actions

| Ação | App | Entrada (Zod) | Efeito |
|---|---|---|---|
| `createLead` ✅ implementada | site | name, phone, email?, message? | Insere lead `NOVO` no CRM com origem `SITE` |
| `updateMyContact` | portal | phone, whatsapp, email, address | Paciente edita os próprios contatos (RLS) |
| `sendMessage` | portal/admin | threadId, body | Mensagem no canal seguro + realtime |
| `confirmAppointment` | portal | appointmentId | Paciente confirma presença |
| `answerNps` | portal | score 0–10, comment? | Registra NPS |
| `createPatient` / `updatePatient` | admin | cadastro completo | CRUD paciente + auditoria |
| `convertLead` | admin | leadId | Lead → Paciente (1 clique), marca `converted_at` |
| `moveLeadStage` | admin | leadId, stage | Move card no kanban |
| `createAppointment` / `rescheduleAppointment` | admin | patientId, startsAt, mode, RRULE? | Agenda + lembretes na fila |
| `setAppointmentStatus` | admin | id, status, motivo? | Confirmada/Realizada/Falta… |
| `createRecordEntry` / `updateRecordEntry` | admin | kind, title, content | Prontuário (versão + auditoria via trigger) |
| `summarizeSession` (IA) | admin | entryId | Gera `ai_summary` via Claude — **sempre revisão humana** |
| `createTransaction` / `markPaid` | admin | valores, método | Financeiro; `markPaid` emite recibo numerado |
| `generateDocument` | admin | templateId, patientId | Renderiza placeholders → PDF no Storage |
| `signDocument` | admin | documentId | Assinatura eletrônica (hash + timestamp) |

## Route Handlers

| Rota | Método | Função |
|---|---|---|
| `/api/webhooks/whatsapp` | POST | Recebe mensagens/status da WhatsApp Cloud API (Fase 3); cria lead com origem `WHATSAPP` |
| `/api/webhooks/payment` | POST | Confirmação PIX/cartão do gateway (Fase 3) → `markPaid` |
| `/api/cron/reminders` | GET | **Vercel Cron** (a cada 15 min): processa fila `reminders`, marca atrasados |
| `/api/calendar/sync` | POST | Sincronização Google Calendar (OAuth, Fase 2) |
| `/api/webhooks/autentique` | POST | Status de assinatura de documentos (Autentique) → marca `documents.signed_at` |
| `/api/files/[id]` | GET | Gera URL assinada (60 s) do Storage após checar permissão — arquivos nunca são públicos |
| `/auth/login` · `/auth/callback` · `/auth/logout` | POST/GET | Fluxo Supabase Auth (PKCE) |

## Google Calendar + Meet — link fixo por paciente

Implementado em `apps/admin/lib/google-calendar.ts`. Ao agendar uma sessão **online recorrente**:

1. `createWeeklyMeetEvent()` cria **um evento recorrente** (`RRULE:FREQ=WEEKLY`) no calendário do psicólogo
   com o paciente em `attendees` → o convite entra automaticamente na agenda dele;
2. `conferenceData.createRequest` (com `conferenceDataVersion=1`) gera **uma sala do Meet para a série inteira**
   — o link é o mesmo em todas as ocorrências, para sempre;
3. `event.id` → `appointments.google_event_id` · `event.hangoutLink` → `appointments.video_link`;
4. Reagendamento usa `rescheduleSeries()` (PATCH no mesmo evento) → **o link não muda**;
5. `guestsCanInviteOthers: false` preserva o sigilo (só psicólogo e paciente).

Requisitos gratuitos: projeto no Google Cloud + OAuth (escopo `calendar.events`) + refresh token obtido no fluxo
"Conectar Google Agenda" em Configurações. Sem credenciais, o modo demo devolve um link estável de exemplo.

## Convenções

- Toda entrada validada com **Zod** antes de tocar o banco.
- Toda action sensível grava em `audit_logs` (quem, o quê, quando, IP).
- Erros retornam mensagens humanizadas em pt-BR; detalhes técnicos só no log do servidor.
- `revalidatePath()` após mutações para atualizar os RSC.
