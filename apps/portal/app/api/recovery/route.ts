/**
 * Recuperação de senha por WhatsApp / SMS — etapa 1: ENVIAR o código.
 * Gera OTP de 6 dígitos, guarda só o HASH (sha256) com expiração de 10 min
 * e envia pelo canal escolhido. Protegido por rate-limit.
 *
 * Produção: WhatsApp Cloud API + provedor de SMS. Sem credenciais → demo
 * (loga o código e o devolve no corpo apenas em modo demo, p/ teste).
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { clientIp, rateLimit } from "@as/shared";
import { isDemoMode } from "@as/auth";

const schema = z.object({
  channel: z.enum(["whatsapp", "sms"]),
  contact: z.string().min(8).max(30),
});

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const normalizePhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length <= 11 ? `55${d}` : d;
};

async function storeCode(contact: string, codeHash: string, channel: string) {
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/recovery_codes`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      contact,
      code_hash: codeHash,
      channel,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    }),
  }).catch(() => {});
}

export async function POST(request: Request) {
  if (!rateLimit(`recovery:${clientIp(request)}`, 4, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true }); // resposta neutra

  const { channel, contact } = parsed.data;
  const phone = normalizePhone(contact);
  const code = genCode();
  const text = `Anderson V. V. Silva · Psicólogo\nSeu código para redefinir a senha é: ${code}\nVálido por 10 minutos. Não compartilhe com ninguém.`;

  if (isDemoMode()) {
    console.info(`[DEMO] OTP ${channel} → ${phone}: ${code}`);
    return NextResponse.json({ ok: true, demo: true, code }); // code só em demo, p/ teste
  }

  await storeCode(phone, sha256(code), channel);

  const digits = phone.replace(/\D/g, "");
  const waNumber = digits.length <= 11 ? `55${digits}` : digits;
  if (channel === "whatsapp" && process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE) {
    // Evolution API (WhatsApp Web) — preferido
    const base = process.env.EVOLUTION_API_URL.replace(/\/+$/, "");
    const instance = encodeURIComponent(process.env.EVOLUTION_INSTANCE);
    await fetch(`${base}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY },
      body: JSON.stringify({ number: waNumber, text }),
    }).catch((e) => console.error("Evolution OTP falhou:", e));
  } else if (channel === "whatsapp" && process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: waNumber, type: "text", text: { body: text } }),
    }).catch((e) => console.error("WhatsApp OTP falhou:", e));
  } else if (channel === "sms") {
    console.info(`[SMS] enviar ${code} para ${phone}`); // integrar Twilio/Zenvia
  }

  return NextResponse.json({ ok: true });
}
