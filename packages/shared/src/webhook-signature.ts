/**
 * Verificação de assinatura de webhooks (Meta/WhatsApp Cloud API).
 *
 * O Meta assina cada POST com HMAC-SHA256 do corpo CRU usando o App Secret,
 * no header `X-Hub-Signature-256: sha256=<hex>`. Sem essa checagem, qualquer
 * pessoa poderia forjar um POST e cancelar/confirmar sessões. A comparação é
 * timing-safe para não vazar o segredo por análise de tempo.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * @param rawBody corpo cru da requisição (string exata recebida, antes de JSON.parse)
 * @param header  valor de `X-Hub-Signature-256` (ex.: "sha256=abc123…")
 * @param appSecret App Secret do app Meta (WHATSAPP_APP_SECRET)
 */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !appSecret) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // timingSafeEqual exige comprimentos iguais — diferença de tamanho já é inválida
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Comparação de segredos em tempo constante (CRON_SECRET, verify tokens…).
 * `a === b` vaza o tamanho do prefixo coincidente por análise de tempo.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
