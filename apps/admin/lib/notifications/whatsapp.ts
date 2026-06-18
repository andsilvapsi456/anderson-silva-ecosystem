/**
 * WhatsApp Business Cloud API (Meta).
 * Sem WHATSAPP_API_TOKEN/WHATSAPP_PHONE_NUMBER_ID → modo demo (loga).
 *
 * Importante (regra do WhatsApp): mensagens iniciadas pela clínica fora da
 * janela de 24h precisam usar um TEMPLATE aprovado no Meta Business
 * (categoria "utility" — confirmação de compromisso e cobrança se enquadram).
 * Os corpos abaixo correspondem aos templates a registrar:
 *   • confirmacao_sessao (botões: Confirmar / Preciso remarcar)
 *   • lembrete_sessao_2h
 *   • cobranca_acolhedora
 */

const API = "https://graph.facebook.com/v21.0";

export interface WaResult {
  ok: boolean;
  demo?: boolean;
  error?: string;
}

function configured(): boolean {
  return Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Só dígitos, com DDI (ex.: 5511992471876). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length <= 11 ? `55${digits}` : digits;
}

async function post(payload: Record<string, unknown>): Promise<WaResult> {
  const res = await fetch(`${API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  if (!res.ok) {
    const error = await res.text();
    console.error("WhatsApp falhou:", error);
    return { ok: false, error };
  }
  return { ok: true };
}

export async function sendWhatsAppText(to: string, body: string): Promise<WaResult> {
  if (!configured()) {
    console.info(`[DEMO] WhatsApp → ${to}:\n${body}`);
    return { ok: true, demo: true };
  }
  return post({ to: normalizePhone(to), type: "text", text: { body } });
}

/**
 * Lembrete de sessão com botões "Confirmar" / "Preciso remarcar".
 * A resposta chega no webhook /api/webhooks/whatsapp com o id
 * CONFIRM_<appointmentId> ou RESCHEDULE_<appointmentId>.
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

  if (!configured()) {
    console.info(`[DEMO] WhatsApp (botões) → ${to}:\n${body}\n[Confirmar ✅] [Remarcar] [Cancelar ❌]`);
    return { ok: true, demo: true };
  }

  return post({
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
