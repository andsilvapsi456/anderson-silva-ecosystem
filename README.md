# ❤️ Ecossistema Anderson Silva — Clínica de Psicologia

Plataforma digital completa para a clínica **Anderson Silva — Psicólogo Clínico (CRP 06/166223)**: site institucional, portal do paciente e painel administrativo, com a mesma identidade visual (coral `#FF5A5A` · ink `#202020` · Montserrat · light/dark).

Feito para ser **melhor que o PsicoManager** e custar **R$ 0/mês**: Cloudflare Workers Free + Supabase Free + GitHub Free.

> **Status: no ar.** Admin e portal rodando em produção no Cloudflare, com banco Supabase real.
> O que ainda falta ligar (e-mail, WhatsApp, crons) está em [Integrações](#-integrações--o-que-está-ligado).

---

## 🚀 Rodar agora (modo demo, sem nenhuma conta externa)

```bash
npm install
npm run dev
```

Sem `NEXT_PUBLIC_SUPABASE_URL` no `.env`, os três apps sobem com dados fictícios completos (pacientes, agenda, financeiro) — dá para navegar por tudo sem banco.

| App | URL local | O que tem |
|---|---|---|
| 🌐 **Site** | http://localhost:3000 | Site institucional real da clínica + captura de leads + botão "Área do Paciente" |
| ❤️ **Portal do Paciente** | http://localhost:3001 | Início · Sessões · Diário · Pagamentos · Recibos · Meus dados |
| 📊 **Painel Admin** | http://localhost:3002 | Início · Agenda · Pacientes · Financeiro · Relatórios · Documentos · Configurações |

Rodar um app isolado: `npm run dev:admin` (ou `dev:portal`, `dev:site`).

---

## ✨ O que o sistema faz

### Agenda
- Grade semanal com sessões, status (pendente/confirmada/realizada/cancelada) e conflito de horário bloqueado no banco (constraint `EXCLUDE`) e na aplicação.
- **Remarcar** mantendo o mesmo link do Meet, com aviso automático ao paciente.
- **Cancelamento visível**: o cartão fica apagado com o motivo, e o horário volta a ficar livre para outra pessoa.
- **Bloqueios**: almoço configurável por dia da semana, feriados nacionais + SP calculados automaticamente (incluindo os móveis, via algoritmo de Páscoa) e bloqueios avulsos.
- Google Calendar + Meet: evento recorrente com link fixo da série.

### Pacientes e prontuário
- Ficha completa com foto, dados, financeiro e histórico.
- **Prontuário no padrão CFP** (Resolução 001/2009), em papel timbrado, pronto para imprimir.
- **Evolução pós-sessão** em formato SOAP + **escalas clínicas** (GAD-7, PHQ-9, humor, ansiedade) com gráfico de evolução.
- **Diário do paciente** com registro de humor — vira gráfico na ficha e nos relatórios.
- **Onboarding sem digitação**: link de cadastro com token → paciente preenche → contrato oficial gerado → assinatura digital pelo Autentique.
- **Importador do PsicoManager** (CSV) com pré-visualização antes de confirmar.

### Financeiro
- Cobranças com PIX, recibos numerados (`REC-AAAA-NNNN`) em PDF gerado do zero, sem dependências.
- **Informe anual de rendimentos** para o Imposto de Renda, por paciente e por ano.
- Parcelamento/renegociação com proposta acolhedora, cobrança na hora, NFS-e de Osasco (Focus NFe).

### Comunicação automática
- **Agenda do dia** por e-mail às 8h para o psicólogo.
- **Lembretes** 24h (pedindo confirmação) e 2h antes da sessão.
- **Parabéns de aniversário** 🎂 por e-mail e WhatsApp, sem repetir.
- Avisos de cancelamento e remarcação, sempre com texto humano — nunca robótico.

### Relatórios
Faturamento, sessões, taxa de comparecimento, faixa etária, sentimentos do diário — com filtros por ano, mês e paciente.

---

## 🔌 Integrações — o que está ligado

O sistema funciona sem nenhuma delas (cai em modo demo e registra no log). Cada uma liga sozinha quando as variáveis existem:

| Integração | Variáveis | Para quê |
|---|---|---|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Banco, login e RLS. A *service role* é obrigatória para os crons — sem ela os jobs não enxergam o banco |
| **WhatsApp · Evolution** | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` | Envia pelo **número normal** da clínica, via QR Code. Preferido — ver [`docs/17`](docs/17-whatsapp-evolution.md) |
| **WhatsApp · Meta** | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Alternativa oficial (fallback automático) |
| **E-mail · Resend** | `RESEND_API_KEY`, `EMAIL_FROM` | Todo e-mail do sistema |
| **Google Calendar** | `GOOGLE_CALENDAR_CLIENT_ID`, `..._CLIENT_SECRET`, `..._REFRESH_TOKEN` | Evento + sala do Meet |
| **Autentique** | `AUTENTIQUE_TOKEN` | Assinatura digital do contrato |
| **NFS-e Osasco** | `FOCUS_NFE_TOKEN` | Nota fiscal |

Valores de exemplo em [`.env.example`](.env.example). **Nenhum segredo vai para o Git.**

---

## ⏰ Automações (GitHub Actions)

| Workflow | Quando | O que faz |
|---|---|---|
| [`daily-agenda.yml`](.github/workflows/daily-agenda.yml) | 8h (SP) | E-mail da agenda do dia + aniversariantes |
| [`reminders.yml`](.github/workflows/reminders.yml) | a cada 15 min | Lembretes de sessão e cobranças |
| [`backup-db.yml`](.github/workflows/backup-db.yml) | diário | `pg_dump` do banco guardado como artefato |

Secrets necessários no repositório: `CRON_SECRET`, `DAILY_AGENDA_URL`, `REMINDERS_URL`, `SUPABASE_DB_URL`.

---

## 🏗️ Estrutura

```
apps/
  site       Next.js servindo o site real da clínica + captura de leads
  portal     Portal do paciente
  admin      Painel da clínica
packages/
  ui             componentes (AppShell, CommandPalette, gráficos…)
  design-system  tokens da marca
  shared         tipos, formatadores, PDF, mocks, regras de agenda
  auth           Supabase SSR, middleware, tokens assinados
  database       schema Prisma (documentação da modelagem)
supabase/
  bootstrap.sql  cria o banco inteiro do zero (use este)
  migrations/    0001–0008, histórico incremental
docs/            01–17
infra/evolution/ docker-compose do servidor de WhatsApp
```

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Turborepo · Tailwind · Supabase (Postgres + RLS) · Cloudflare Workers via OpenNext.

---

## 🧪 Testes

```bash
npm test
```

47 testes em `tests/` (`node:test`, sem framework): valor por extenso, conflito de agenda, feriados, CSV do importador, cabeçalhos de segurança, assinatura de webhook, aniversários.

---

## 🌐 Site institucional (HostGator)

O site público **não** é o app `apps/site`. No ar está HTML estático na pasta `public_html` da hospedagem compartilhada (HostGator), atrás do proxy do Cloudflare. São 8 páginas: `index`, `sobre`, `servicos`, `faq`, `contato`, `reembolso`, `privacidade` e `404`.

O pipeline que gera essas páginas vive **fora deste repositório**, em `site-publicar/` na máquina do Anderson: ele baixa para `live/` o HTML que está publicado, aplica as mudanças e escreve em `out/`. Parte sempre do que está no ar, nunca de uma cópia local defasada — o `apps/site/content/` daqui está desatualizado e não deve ser usado como fonte.

### Última publicação — 21/08/2026

| Mudança | Detalhe |
|---|---|
| Página `/reembolso.html` | **Nova.** Como pedir reembolso de psicoterapia ao convênio: o que mudou nas regras da ANS (RN 541/2022 derrubou o teto de sessões, RN 566/2022 fixou 10 dias úteis para atendimento e 30 dias para o pagamento), passo a passo, o que o recibo precisa ter e as operadoras que costumam ter livre escolha. Design próprio, com o CSS embutido na própria página para não mexer no `styles.css` compartilhado. |
| Aba **Reembolso** no menu | Em todas as páginas, ao lado de "Área do Paciente". O menu do topo só cabe 7 itens a partir de **1260px**; abaixo disso vira hambúrguer. |
| Política de privacidade | Reescrita em 12 seções: cookies e medição, formulário de contato, WhatsApp, Área do Paciente, recibos de reembolso e direitos da LGPD. |
| Banner de cookies | **Removido de todas as páginas.** Ver [Segurança e LGPD](#-segurança-e-lgpd). |
| `styles.css` | Corrigido um `;` solto ao fim de uma regra, que fazia o navegador **abandonar o resto do arquivo**: qualquer CSS novo no fim era ignorado em silêncio. |

### Como publicar

cPanel → Gerenciador de Arquivos → **Carregar**, com o checkbox *"Substitua os arquivos existentes"* marcado antes de mandar. O uploader do cPanel processa **um arquivo por vez** — mandar vários de uma vez sobe só o primeiro.

Para conferir depois, o caminho é bater **direto na origem**, furando o Cloudflare — que responde 403 a bots:

```bash
curl --resolve andersonsilvapsicologo.com.br:443:<IP-DE-ORIGEM> -k -s \
  https://andersonsilvapsicologo.com.br/reembolso.html | head -5
```

O IP de origem e o host do cPanel **não ficam neste repositório**, que é público: expor o IP de origem anula boa parte da proteção do Cloudflare, já que permite contornar o proxy. Eles estão nas anotações privadas do projeto.

Para ver o que o **visitante** recebe, use um navegador de verdade: o `fetch()` de dentro de uma aba já aprovada no challenge passa, o `curl` não.

---

## ☁️ Deploy (Cloudflare Workers)

**Admin** e **portal** rodam como Workers, com deploy automático a cada push na `main`. O **site** continua hospedado no HostGator (onde está o domínio `andersonsilvapsicologo.com.br`) — o `wrangler.jsonc` dele já existe caso um dia mude de casa.

A configuração que funciona no **Workers Builds**:

| Campo | Valor |
|---|---|
| Root directory | `/` |
| Build command | `cd apps/admin && npx opennextjs-cloudflare build` |
| Deploy command | `cd apps/admin && npx wrangler deploy` |

(trocando `apps/admin` por `apps/portal` no segundo Worker)

**Três armadilhas já pagas — não repita:**
1. As variáveis `NEXT_PUBLIC_*` precisam estar nas **Build variables**, não só nas runtime. Sem isso o login trava em "Entrando…" para sempre.
2. **Não** adicione `packageManager` ao `package.json` — o corepack quebra o build no Cloudflare.
3. Comandos por app (`cd apps/x && …`) em vez de `npm run build` na raiz, senão o turbo reclama de rodar fora do workspace.

Passo a passo completo: [`docs/16-go-live.md`](docs/16-go-live.md).

---

## 🛡️ Segurança e LGPD

Row Level Security em todas as tabelas: o paciente só vê o que é dele, a secretária nunca lê prontuário, e toda ação sensível deixa trilha de auditoria.

Além disso: CSP com **nonce por requisição** (sem `unsafe-inline` em script), HSTS, COOP, Permissions-Policy, 2FA (TOTP) no admin, rate limit nas rotas públicas, webhooks com assinatura HMAC validada em tempo constante e *fail-closed* em produção.

Detalhes em [`docs/11-seguranca-lgpd.md`](docs/11-seguranca-lgpd.md) e [`docs/15-blindagem-seguranca.md`](docs/15-blindagem-seguranca.md).

> ### ⚠️ Cookies do site institucional — mudança de postura (21/08/2026)
>
> O banner de consentimento foi **removido** a pedido do Anderson e o Consent Mode v2 passou a nascer `granted` nos quatro sinais. Isso preserva a medição do GA4 e as conversões do Google Ads, que morreriam se o banner saísse com o padrão `denied`.
>
> Em troca, a base legal da medição e da publicidade deixou de ser **consentimento** e passou a ser **legítimo interesse** (art. 7º, IX da LGPD), com recusa pelo navegador, pelo complemento do Analytics e pelo Google Ad Center — é assim que a política descreve hoje. Como a clínica lida com dado de saúde, este é o ponto do site que mais merece revisão jurídica.



---

## 📚 Documentação

| Doc | Conteúdo |
|---|---|
| [01](docs/01-arquitetura.md) | Arquitetura e decisões |
| [02](docs/02-monorepo.md) | Estrutura do monorepo |
| [03](docs/03-banco-de-dados.md) | Banco de dados + diagrama ER |
| [04](docs/04-apis.md) | Server Actions e Route Handlers |
| [05](docs/05-fluxos-navegacao.md) | Fluxos de navegação |
| [06](docs/06-wireframes.md) | Wireframes das telas |
| [07](docs/07-design-system.md) | Design System "Acolher" |
| [08](docs/08-roadmap.md) | Roadmap |
| [09](docs/09-backlog.md) | Backlog priorizado |
| [10](docs/10-permissoes.md) | Permissões e matriz RLS |
| [11](docs/11-seguranca-lgpd.md) | Segurança, LGPD e ética CFP |
| [12](docs/12-deploy.md) | Deploy (referência) |
| [13](docs/13-mobile.md) | Plano do app mobile *(fora do escopo atual)* |
| [14](docs/14-testes-e-observabilidade.md) | Testes e observabilidade |
| [15](docs/15-blindagem-seguranca.md) | Blindagem: threat model e checklist |
| [16](docs/16-go-live.md) | **Go-live**: runbook de produção |
| [17](docs/17-whatsapp-evolution.md) | **WhatsApp** via Evolution API (Oracle Cloud) |

---

<p align="center">
Feito com ❤️ para cuidar de quem cuida.
</p>
