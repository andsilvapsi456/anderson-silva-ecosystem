# 06 · Wireframes de Todas as Telas

> Os wireframes abaixo correspondem 1:1 às telas já implementadas no código. Tokens: coral `#FF5A5A`, ink `#202020`, Montserrat, raios 16px, light/dark.

## SITE — andersonsilvapsicologo.com.br (design original portado 1:1)

O app `apps/site` serve o HTML/CSS/JS **do site real** (em `apps/site/content/`),
com três integrações do ecossistema injetadas pelo loader (`lib/static-page.ts`):

```
┌────────────────────────────────────────────────────────────┐
│ [logo manuscrito]  Início Sobre Serviços Dúvidas Contato   │
│                      ✚[Área do Paciente] [Agendar]         │ ← injetado
├────────────────────────────────────────────────────────────┤
│  Se a terapia *nunca deu certo* antes,    ╭──────────────╮ │
│  talvez faltasse o lugar certo.           │ foto Anderson│ │
│  Psicoterapia online para adultos…        │ ┌5,0 Google┐ │ │
│  [Agendar uma conversa] [Conhecer o       │ └+500 pessoas┘ │
│   Anderson]      ★★★★★ 5,0 no Google      ╰──────────────╯ │
├────────────────────────────────────────────────────────────┤
│ CRP 06/166223 · +500 pessoas · 2 pós · Brasil & exterior   │
├────────────────────────────────────────────────────────────┤
│  Formas de atendimento: Terapia online · Brasileiros no    │
│  exterior · Trauma & violência · Carreira & corporativo    │
├────────────────────────────────────────────────────────────┤
│  9 temas (cards → WhatsApp) · Sobre · Contato + formulário │
│  formulário → WhatsApp (original) ✚ lead no CRM (beacon)   │ ← injetado
├────────────────────────────────────────────────────────────┤
│ footer: nav (✚ Área do Paciente) · contato · LGPD          │ ← injetado
└────────────────────────────────────────────────────────────┘
Páginas: / · /sobre · /servicos · /faq · /contato · /privacidade
Temas do site original preservados (clean/warm/dark via data-theme).
```

## PORTAL — Login

```
┌──────────────────────────────┐
│           [AS logo]          │
│       Área do Paciente       │
│  ┌────────────────────────┐  │
│  │ E-mail                 │  │
│  │ Senha                  │  │
│  │ [      Entrar      ]   │  │
│  │ Primeiro acesso? convite│ │
│  └────────────────────────┘  │
│  ← Voltar ao site · 🔒 CRP   │
└──────────────────────────────┘
```

## PORTAL — Dashboard

```
┌─────────┬──────────────────────────────────────────────────┐
│ [AS]    │  Bom dia, Mariana!                               │
│ 🏠 Início│  Que bom ter você por aqui. 🤍                   │
│ 📅 Sessões│ ┌─ Próxima sessão ───────────┐ ┌─ Financeiro ─┐ │
│ 💳 Pagam.│ │ sexta, 12 de junho [CONF.] │ │ R$ 200,00    │ │
│ 🧾 Recibos│ │ 14:00–14:50 · 💻 Online    │ │ 1 em aberto  │ │
│ 💬 Mensag.│ │      [Entrar na sessão →]  │ │ Ver pagam. → │ │
│ 👤 Dados │ └────────────────────────────┘ └──────────────┘ │
│         │ ┌─ Última sessão ─┐ ┌─ Avisos da clínica ──────┐ │
│ ┌─────┐ │ │ 5 de junho      │ │ ▪ Recesso de julho…      │ │
│ │ M.C.│ │ │ [REALIZADA]     │ │                          │ │
│ │ 🌙  │ │ └─────────────────┘ └──────────────────────────┘ │
└─────────┴──────────────────────────────────────────────────┘
   (mobile: sidebar vira tab bar inferior com 5 ícones)
```

## PORTAL — Minhas Sessões

```
│ Minhas sessões                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 12/06  14:00 │ 💻 Sessão online ↻ │ [CONFIRMADA]     │   │
│ │              │      [Entrar na sessão →] (≤15min)    │   │
│ │ 05/06  14:00 │ 💻 Sessão online ↻ │ [REALIZADA]      │   │
│ │ 29/05  14:00 │ 🏢 Sala 1          │ [CANCELADA]      │   │
│ └──────────────────────────────────────────────────────┘   │
│ Precisa remarcar? → Mensagens ou WhatsApp                  │
```

## PORTAL — Pagamentos / Recibos / Mensagens / Dados

```
Pagamentos: [Em aberto R$200] [Pago no ano R$200]
            lista: descrição · vencimento · método · valor · status

Recibos:    🧾 REC-2026-0142 · Sessão junho · R$200 · [Baixar PDF ↓]

Mensagens:  balões estilo chat (paciente coral, clínica cinza)
            ⚠️ aviso CVV 188 no rodapé

Dados:      formulário contatos (RLS: só os próprios) +
            card Privacidade LGPD com consentimentos ativos
```

## ADMIN — Dashboard Executivo

```
┌─────────┬──────────────────────────────────────────────────┐
│ [AS]    │ Dashboard executivo                              │
│ 📊 Dash  │ [Pacientes 3 ▲] [Sessões 1] [Receita R$2.000 ▲]  │
│ 📅 Agenda│ [Anual R$12.0k] [Conversão 25%] [Faltas 50% ▼]   │
│ 🤍 Pacien│ [Ocupação 72%] [Novos 1]                         │
│ 🎯 CRM   │ ┌─ Receita 6 meses ─────┐ ┌─ Próximas sessões ─┐ │
│ 💰 Finan.│ │ ▂▄▃▅▆█ (barras coral) │ │ 12/06 Mariana 💻   │ │
│ 📄 Docs  │ └───────────────────────┘ │ 12/06 João 🏢      │ │
└─────────┴──────────────────────────────────────────────────┘
```

## ADMIN — Agenda (semana)

```
│ Agenda · Semana atual              [+ Nova sessão]         │
│      Seg 8   Ter 9   Qua 10  Qui 11  [Sex 12]  Sáb 13      │
│ 08h                                                        │
│ 09h                          ┌Alex 💻────┐                  │
│ 14h                                      ┌Mariana 💻─┐      │
│ 16h                                      ┌João Sala 1┐      │
│ 19h                                                        │
│  (hoje destacado em coral-soft · cards com borda coral)    │
```

## ADMIN — Paciente (ficha completa)

```
│ Mariana Costa            [Editar cadastro] [+ Nova evolução]│
│ ┌─ Cadastro ──────┐ ┌─ Prontuário 🔒 sigilo ──────────────┐ │
│ │ avatar + nome   │ │ ●─[EVOLUÇÃO] 05/06 · Anderson       │ │
│ │ CPF, RG, nasc.  │ │ │  Evolução — sessão 22…            │ │
│ │ tel, e-mail     │ │ ●─[PLANO] 12/05 · revisão semestral │ │
│ │ convênio        │ │ │  Objetivos: (1)… (2)… (3)…        │ │
│ │ resp. financeiro│ │ ●─[ANAMNESE] 13/12 · inicial        │ │
│ │ 📎 contrato.pdf │ │ ✨ IA assistiva: resumir/organizar   │ │
│ │ 📎 termo LGPD   │ │    (nunca substitui o profissional) │ │
│ └─────────────────┘ └─────────────────────────────────────┘ │
│ ┌─ Sessões (timeline) ────────┐ ┌─ Financeiro ────────────┐ │
└─────────────────────────────────────────────────────────────┘
```

## ADMIN — CRM (kanban)

```
│ CRM — Funil de acolhimento              [+ Novo lead]      │
│ NOVO(1)   1ºCONTATO(1)  TRIAGEM(1)  AGEND.(1)  ATEND.(0) ALTA(0)
│ ┌Fernanda┐ ┌Ricardo┐    ┌Beatriz┐   ┌Paulo┐                │
│ │🌐 site │ │📱 whats│    │📸 insta│   │👥 fb │                │
│ │"valores│ │"filho 9│    │"atende │   └─────┘                │
│ │e horár"│ │ anos"  │    │ trans?"│                          │
│ └────────┘ └────────┘    └────────┘                          │
```

## ADMIN — Financeiro / Documentos

```
Financeiro: [Recebida R$2.000] [A receber R$920 · inadimpl. R$720]
            [Lucro −R$500] [Ticket médio R$200]
            ┌─ Contas a receber ─┐  ┌─ Contas a pagar ─┐

Documentos: grade de templates com [Gerar documento]:
            📝 Contrato · 🧾 Recibo · 📄 Declaração ·
            📋 Relatório (CFP 06/2019) · ⚖️ Laudo · 🔒 Termo LGPD
```
