/**
 * Link de cadastro do paciente (intake) — token assinado, sem login.
 * Formato: base64url("patientId.expiraEm.hmac") — o servidor valida a
 * assinatura HMAC e a validade; nada fica armazenado no banco.
 * Segredo: INTAKE_SECRET (fallback CRON_SECRET; demo usa valor fixo).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.INTAKE_SECRET ?? process.env.CRON_SECRET ?? "demo-intake-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

export function signIntakeToken(patientId: string, validDays = 7): string {
  const expiresAt = Date.now() + validDays * 86_400_000;
  const payload = `${patientId}.${expiresAt}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyIntakeToken(token: string): { patientId: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [patientId, expStr, sig] = raw.split(".");
    if (!patientId || !expStr || !sig) return null;
    if (Number(expStr) < Date.now()) return null; // expirado
    const expected = sign(`${patientId}.${expStr}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { patientId };
  } catch {
    return null;
  }
}
