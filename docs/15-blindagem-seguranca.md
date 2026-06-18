# 15 · Blindagem de segurança (cyber security)

Sistema que guarda **dados sensíveis de saúde** (prontuário, diário, financeiro) sob
sigilo profissional (CFP art. 9º) e LGPD. Este documento descreve a postura de
segurança em camadas — "defense in depth" — e o checklist de produção.

> Complementa o doc [11 · Segurança & LGPD](./11-seguranca-lgpd.md).

## 1. Camadas de defesa

| Camada | Mecanismo | Onde |
|---|---|---|
| Transporte | HTTPS forçado (HSTS `preload`), `upgrade-insecure-requests` | `config/security-headers.mjs` |
| Cabeçalhos | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP, sem `X-Powered-By` | os 3 `next.config.ts` |
| Autenticação | Supabase Auth (JWT httpOnly), **2FA TOTP (AAL2)** no admin | `packages/auth`, `components/login-form.tsx`, `mfa-setup.tsx` |
| Autorização | RLS no Postgres (deny-by-default), gate por papel no middleware/layout | migrações `0001…`, `middleware.ts` |
| Sessão | JWT revalidado a cada request no middleware SSR | `@as/auth/middleware` |
| Links sem-login | Tokens HMAC-SHA256 com expiração + comparação timing-safe | `@as/auth/{intake,action}` |
| Webhooks | Assinatura `X-Hub-Signature-256` (HMAC) verificada, fail-closed em produção | `webhook-signature.ts`, webhook WhatsApp |
| Crons | Bearer `CRON_SECRET` obrigatório | `api/cron/*` |
| Anti-abuso | Rate-limit por IP nos endpoints públicos | `@as/shared/rate-limit` |
| Dados | Minimização (LGPD), auditoria (`audit_logs`), recibo/PDF gerado on-the-fly (sem cache público) | schema + actions |
| Observabilidade | `reportError` (Sentry-ready), painel de saúde das integrações | `lib/observability.ts` |

## 2. Content-Security-Policy

Fonte única em `config/security-headers.mjs`, com dois perfis:

- **`app`** (admin/portal): `default-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
  `connect-src` só o próprio origin + Supabase. Nunca pode ser embedado (anti-clickjacking).
- **`public`** (site): mesma base, mas permite Google Fonts e embed de vídeo no
  próprio domínio.

`'unsafe-eval'` só é liberado em **dev** (HMR do Next). Em produção a política não
permite `eval`.

**Nonce por request (admin + portal):** o `middleware.ts` gera um nonce aleatório
por requisição (`btoa(crypto.randomUUID())`), monta a CSP com
`script-src 'self' 'nonce-…' 'strict-dynamic'` e o injeta nos request headers — o
Next carimba o mesmo nonce em todos os seus `<script>`. Resultado: **zero
`'unsafe-inline'` em scripts**; só código assinado pelo Next roda, e `'strict-dynamic'`
bloqueia qualquer `<script>` injetado por XSS. Os layouts raiz usam
`export const dynamic = "force-dynamic"` para renderizar por request (o nonce muda a
cada visita) — o que também evita cache de HTML autenticado. O `style-src` mantém
`'unsafe-inline'` (estilos inline têm risco muito menor que scripts). O site público
fica na CSP sem nonce (HTML estático com scripts inline próprios).

## 3. Superfície de ataque pública e mitigação

| Endpoint | Risco | Mitigação |
|---|---|---|
| `POST /api/webhooks/whatsapp` | Forjar cancelamento/confirmação de sessão | **HMAC `X-Hub-Signature-256`** + rate-limit + limite de corpo (100 KB); fail-closed em produção sem `WHATSAPP_APP_SECRET` |
| `GET /api/sessao?t=` | Força-bruta de token; confirmar/cancelar | Token HMAC (3 dias) timing-safe + **rate-limit 20/min/IP** |
| `POST /api/leads` | Spam de formulário | Rate-limit 6/min/IP + validação |
| `POST /api/intake` | Cadastro forjado | Token HMAC (7 dias) + consentimento LGPD + rate-limit |
| `POST /api/recovery[/verify]` | Enumeração/brute de OTP | OTP SHA-256 com expiração + tentativas + rate-limit 4/min |
| `GET /api/cron/*` | Disparo não-autorizado | Bearer `CRON_SECRET` |

> **GET que altera estado** (`/api/sessao`): aceitável por ser idempotente e assinado,
> mas atenção a *prefetchers* de e-mail. Fase 3: trocar por página com botão que faz POST.

## 4. Gestão de segredos

- Tudo server-side; só `NEXT_PUBLIC_*` (URL + anon key do Supabase) vai ao browser.
  A **service role key** nunca aparece no client.
- Segredos de assinatura (`INTAKE_SECRET`, `CRON_SECRET`, `WHATSAPP_APP_SECRET`):
  gerar com `openssl rand -hex 32`, um valor **único** por segredo.
- Em produção, ausência de segredo → comportamento seguro (webhook recusado; nunca
  cai silenciosamente no valor de demo em ambiente real).
- ⚠️ **Rotacionar o `AUTENTIQUE_TOKEN`** — foi colado no chat durante o desenvolvimento.

## 5. Checklist de produção (pré-golive)

- [ ] Todos os segredos preenchidos com valores fortes e únicos (`openssl rand -hex 32`).
- [ ] `WHATSAPP_APP_SECRET` configurado (senão o webhook é recusado).
- [ ] `CRON_SECRET` configurado e usado pelo Vercel Cron / GitHub Action.
- [ ] RLS habilitada em todas as tabelas; testar com usuário de outro paciente.
- [ ] 2FA ativado na conta do admin.
- [ ] HTTPS e HSTS confirmados (degustar headers com `curl -I`).
- [ ] `AUTENTIQUE_TOKEN` rotacionado.
- [ ] Backups automáticos do Supabase habilitados.
- [ ] Sentry (ou similar) conectado via `reportError`.
- [ ] Política de retenção do prontuário (guarda mínima 5 anos — CFP).

## 6. Como conferir os headers

```bash
curl -sI https://app.suaclinica.com.br | grep -i \
  'content-security-policy\|strict-transport\|x-frame\|cross-origin\|permissions-policy'
```

Testes automatizados da CSP e da assinatura de webhook: `tests/security.test.ts`
(`npm test`).
