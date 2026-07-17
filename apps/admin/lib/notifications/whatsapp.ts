/**
 * Envio de WhatsApp — dois provedores, escolhidos por variável de ambiente:
 *
 *  1. EVOLUTION (preferido) — Evolution API conectada ao WhatsApp normal do
 *     Anderson via QR Code (WhatsApp Web). Sem burocracia da Meta, sem
 *     template aprovado, sem janela de 24h. Vars:
 *       EVOLUTION_API_URL      ex.: https://evo.seuservidor.com
 *       EVOLUTION_API_KEY      apikey da instância (ou global)
 *       EVOLUTION_INSTANCE     nome da instância conectada
 *  2. META (fallback) — WhatsApp Business Cloud API. Vars:
 *       WHATSAPP_API_TOKEN + WHATSAPP_PHONE_NUMBER_ID
 *  3. Nenhum configurado → modo demo (loga).
 */

const META_API = "https://graph.facebook.com/v21.0";

export interface WaResult {
  ok: boolean;
  demo?: boolean;
  error?: string;
}

function evolutionConfigured(): boolean {
  return Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE);
}
function metaConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Só dígitos, com DDI (ex.: 5511992471876). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}

/* ───────────── Evolution API (WhatsApp Web) ───────────── */

async function evolutionSendText(to: string, text: string): Promise<WaResult> {
  const base = process.env.EVOLUTION_API_URL!.replace(/\/+$/, "");
  const instance = encodeURIComponent(process.env.EVOLUTION_INSTANCE!);
  try {
    const res = await fetch(`${base}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
      body: JSON.stringify({ number: normalizePhone(to), text }),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("Evolution WhatsApp falhou:", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.error("Evolution WhatsApp erro de rede:", e);
    return { ok: false, error: String(e) };
  }
}

/* ───────────── Meta Cloud API ───────────── */

async function metaPost(payload: Record<string, unknown>): Promise<WaResult> {
  const res = await fetch(`${META_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) {
    const error = await res.text();
    console.error("WhatsApp (Meta) falhou:", error);
    return { ok: false, error };
  }
  return { ok: true };
}

/* ───────────── API pública (mesma assinatura de antes) ───────────── */

export async function sendWhatsAppText(to: string, body: string): Promise<WaResult> {
  if (evolutionConfigured()) return evolutionSendText(to, body);
  if (metaConfigured()) return metaPost({ to: normalizePhone(to), type: "text", text: { body } });
  console.info(`[DEMO] WhatsApp → ${to}:\n${body}`);
  return { ok: true, demo: true };
}

/**
 * Lembrete de sessão pedindo confirmação de presença.
 * • Meta: botões nativos (id CONFIRM_/RESCHEDULE_/CANCEL_ chegam no webhook).
 * • Evolution: WhatsApp Web não tem botões confiáveis → manda texto pedindo
 *   a resposta em palavra (a leitura da resposta é um passo futuro).
 */
export async function sendSessionConfirmRequest(
  to: string,
  args: { firstName: string; date: string; time: string; mode: string; appointmentId: string }
): Promise<WaResult> {
  const body =
    `Olá, ${args.firstName}! Tudo bem? 😊\n\n` +
    `Passando para lembrar da sua sessão ${args.mode === "ONLINE" ? "online " : ""}` +
    `*${args.date} às ${args.time}*.\n\n` +
    `Você confirma sua presença?`;

  if (evolutionConfigured()) {
    return evolutionSendText(to, `${body}\n\nResponda *SIM* para confirmar ou me chame para remarcar. ❤️`);
  }

  if (!metaConfigured()) {
    console.info(`[DEMO] WhatsApp (botões) → ${to}:\n${body}\n[Confirmar ✅] [Remarcar] [Cancelar ❌]`);
    return { ok: true, demo: true };
  }

  return metaPost({
    to: normalizePhone(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: [
          { type: "reply", reply: { id: `CONFIRM_${args.appointmentId}`, title: "Confirmar ✅" } },
          { type: "reply", reply: { id: `RESCHEDULE_${args.appointmentId}`, title: "Remarcar" } },
          { type: "reply", reply: { id: `CANCEL_${args.appointmentId}`, title: "Cancelar ❌" } },
        ],
      },
    },
  });
}
