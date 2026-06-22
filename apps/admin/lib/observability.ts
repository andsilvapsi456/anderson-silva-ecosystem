/**
 * Observabilidade — captura de erros e status das integrações.
 * `reportError` envia ao Sentry quando SENTRY_DSN existir; senão, loga.
 * (Mantido sem dependência: usa a Sentry HTTP API. Trocar por @sentry/nextjs
 * quando quiser stack traces ricos.)
 */
export async function reportError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error("[erro]", message, context ?? "");

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    // envio mínimo via store endpoint (best-effort, não bloqueia o fluxo)
    const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!m) return;
    const [, key, host, projectId] = m;
    await fetch(`https://${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        level: "error",
        platform: "node",
        extra: context,
        timestamp: Date.now() / 1000,
      }),
    });
  } catch {
    /* nunca deixar o monitoramento derrubar o fluxo */
  }
}

export interface IntegrationStatus {
  key: string;
  label: string;
  connected: boolean;
  hint: string;
}

/** Lê as env vars e resume o que está conectado (para o painel de saúde). */
export function getIntegrationStatus(): IntegrationStatus[] {
  const has = (...vars: string[]) => vars.every((v) => Boolean(process.env[v]));
  // NEXT_PUBLIC_* só é injetada pelo Next em acesso ESTÁTICO (literal). Lida via
  // process.env[v] dinâmico ela "some" no runtime do Cloudflare e dá falso-negativo.
  // Por isso a URL pública é lida estaticamente aqui (assada no build).
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return [
    { key: "supabase", label: "Banco & Auth (Supabase)", connected: hasSupabaseUrl && has("SUPABASE_SERVICE_ROLE_KEY"), hint: "Sem isso, o sistema roda em modo demonstração." },
    { key: "resend", label: "E-mail (Resend)", connected: has("RESEND_API_KEY"), hint: "Agenda diária, lembretes e cobranças por e-mail." },
    { key: "whatsapp", label: "WhatsApp Business", connected: has("WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"), hint: "Confirmação/cobrança e códigos por WhatsApp." },
    { key: "google", label: "Google Agenda + Meet", connected: has("GOOGLE_CALENDAR_REFRESH_TOKEN"), hint: "Sala fixa do Meet por paciente." },
    { key: "autentique", label: "Autentique (assinatura)", connected: has("AUTENTIQUE_TOKEN"), hint: "Contrato assinado digitalmente." },
    { key: "nfse", label: "NFS-e Osasco (Focus NFe)", connected: has("FOCUS_NFE_TOKEN"), hint: "Emissão automática de nota fiscal." },
    { key: "sentry", label: "Monitoramento de erros (Sentry)", connected: has("SENTRY_DSN"), hint: "Alerta quando algo falha em produção." },
  ];
}
