# 03 · Banco de Dados + Diagrama ER

A modelagem Prisma completa está em [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma). A migração com RLS, triggers e buckets está em [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql).

## Diagrama ER (Mermaid)

```mermaid
erDiagram
    PROFILES ||--o| PATIENTS : "login do portal"
    LEADS ||--o| PATIENTS : "converte em"
    PATIENTS ||--o{ APPOINTMENTS : "agenda"
    PATIENTS ||--o{ RECORD_ENTRIES : "prontuário"
    PATIENTS ||--o{ TRANSACTIONS : "cobranças"
    PATIENTS ||--o{ DOCUMENTS : "documentos"
    PATIENTS ||--o{ ATTACHMENTS : "anexos"
    PATIENTS ||--o{ MESSAGE_THREADS : "conversas"
    PATIENTS ||--o{ CONSENTS : "consentimentos LGPD"
    PATIENTS ||--o{ NPS_RESPONSES : "avaliações"
    PROFILES ||--o{ RECORD_ENTRIES : "autoria"
    PROFILES ||--o{ APPOINTMENTS : "clínico responsável"
    PROFILES ||--o{ MESSAGES : "envia"
    PROFILES ||--o{ AUDIT_LOGS : "ações"
    PROFILES ||--o{ TASKS : "responsável"
    ROOMS ||--o{ APPOINTMENTS : "sala"
    APPOINTMENTS ||--o{ REMINDERS : "lembretes"
    APPOINTMENTS ||--o{ TRANSACTIONS : "gera cobrança"
    RECORD_ENTRIES ||--o{ RECORD_ENTRY_VERSIONS : "histórico"
    RECORD_TEMPLATES ||..o{ RECORD_ENTRIES : "modelo"
    TRANSACTIONS ||--o| RECEIPTS : "recibo"
    DOCUMENT_TEMPLATES ||--o{ DOCUMENTS : "gera"
    MESSAGE_THREADS ||--o{ MESSAGES : "contém"

    PROFILES {
        uuid id PK "= auth.users.id"
        enum role "ADMIN|PSYCHOLOGIST|SECRETARY|COORDINATOR|PATIENT"
        string full_name
        string email UK
        bool mfa_enabled
    }
    LEADS {
        uuid id PK
        enum source "SITE|WHATSAPP|INSTAGRAM|FACEBOOK"
        enum stage "NOVO→…→ALTA"
        datetime converted_at
    }
    PATIENTS {
        uuid id PK
        uuid profile_id FK
        uuid lead_id FK
        string name
        string social_name "nome social"
        string cpf UK
        string rg
        date birth_date
        string insurance "convênio"
        string financial_guardian
    }
    APPOINTMENTS {
        uuid id PK
        uuid patient_id FK
        datetime starts_at
        enum mode "PRESENCIAL|ONLINE"
        enum status "PENDENTE|CONFIRMADA|REALIZADA|CANCELADA|FALTA"
        string recurrence_rule "RRULE"
        string google_event_id
        string video_link
        datetime video_started_at
        datetime video_ended_at
    }
    RECORD_ENTRIES {
        uuid id PK
        uuid patient_id FK
        uuid author_id FK
        enum kind "ANAMNESE|EVOLUCAO|PLANO_TERAPEUTICO|…"
        string content "sigiloso — RLS clínica"
        string ai_summary "IA assistiva opcional"
    }
    TRANSACTIONS {
        uuid id PK
        enum kind "RECEITA|DESPESA"
        enum status "PENDENTE|PAGO|ATRASADO|CANCELADO"
        enum method "PIX|CARTAO|BOLETO|…"
        int amount_cents
        date due_date
    }
    RECEIPTS {
        uuid id PK
        string number UK "REC-2026-0001"
        string pdf_path "Supabase Storage"
    }
    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string action
        string entity
        json metadata
    }
```

## Destaques da modelagem

- **`social_name` e `pronouns`** no paciente — respeito à identidade é requisito de produto, não detalhe.
- **Prontuário versionado por trigger**: todo `UPDATE` em `record_entries` grava o conteúdo anterior em `record_entry_versions` e registra em `audit_logs` automaticamente — exigência ética do CFP de inalterabilidade rastreável.
- **Dinheiro em centavos (`amount_cents`)** — nunca float.
- **Recorrência via RRULE (RFC 5545)** — compatível com Google Calendar desde o dia 1.
- **`reminders` como fila** — o Vercel Cron processa lembretes pendentes (24h/2h) e marca `sent_at`; trocar o canal (WhatsApp/e-mail) não muda o modelo.
- **Lead → Paciente** preserva o lead original (`patients.lead_id`), mantendo a origem para métricas de conversão.
