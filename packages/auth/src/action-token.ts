/**
 * Token de ação assinado (HMAC) para links de e-mail sem login —
 * confirmar/cancelar sessão pelo botão do e-mail. Mesmo segredo do intake.
 * Formato: base64url("appointmentId.action.expiraEm.hmac").
 */
import { createHmac, timingSafeEqual } from "node:crypto";

type Action = "confirmar" | "cancelar";

function secret(): string {
  return process.env.INTAKE_SECRET ?? process.env.CRON_SECRET ?? "demo-intake-secret";
}
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

export function signActionToken(appointmentId: string, action: Action, validDays = 3): string {
  const expiresAt = Date.now() + validDays * 86_400_000;
  const payload = `${appointmentId}.${action}.${expiresAt}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyActionToken(token: string): { appointmentId: string; action: Action } | null {
  try {
    const [appointmentId, action, expStr, sig] = Buffer.from(token, "base64url").toString("utf8").split(".");
    if (!appointmentId || !action || !expStr || !sig) return null;
    if (Number(expStr) < Date.now()) return null;
    if (action !== "confirmar" && action !== "cancelar") return null;
    const expected = sign(`${appointmentId}.${action}.${expStr}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { appointmentId, action };
  } catch {
    return null;
  }
}
