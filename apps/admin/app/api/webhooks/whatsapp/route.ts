/**
 * WEBHOOK · WHATSAPP — recebe a resposta dos botões de confirmação.
 *  • CONFIRM_<id>    → sessão marcada como CONFIRMADA + resposta gentil
 *  • RESCHEDULE_<id> → cria tarefa para a equipe entrar em contato
 *
 * GET: verificação do Meta (hub.challenge).
 * Configurar no Meta Business: URL deste endpoint + WHATSAPP_VERIFY_TOKEN.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { rateLimit, clientIp } from "@as/shared";
import { verifyMetaSignature } from "@as/shared/webhook-signature";
import { sendWhatsAppText } from "../../../../lib/notifications/whatsapp";

const MAX_BODY = 100_000; // ~100 KB: payloads do WhatsApp são pequenos

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(request: Request) {
  // 1) Anti-abuso: limite por IP (o Meta reentrega; 60/min é folgado)
  if (!rateLimit(`wh:${clientIp(request)}`, 60)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  // 2) Corpo cru (necessário para validar a assinatura HMAC) + limite de tamanho
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  // 3) Autenticidade: assinatura X-Hub-Signature-256 com o App Secret do Meta.
  //    Em produção é obrigatória; sem ela qualquer um forjaria cancelamentos.
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyMetaSignature(rawBody, signature, appSecret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production" && !isDemoMode()) {
    // fail-closed: produção real sem segredo configurado não aceita o webhook
    console.error("[SEGURANÇA] WHATSAPP_APP_SECRET ausente — webhook recusado em produção.");
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody || "null");
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const buttonId: string | undefined = message?.interactive?.button_reply?.id;
  const from: string | undefined = message?.from;

  if (!buttonId || !from) return NextResponse.json({ ok: true }); // eventos de status etc.

  const [action, appointmentId] = buttonId.split("_", 2);

  if (isDemoMode()) {
    console.info(`[DEMO] Webhook WhatsApp: ${action} para sessão ${appointmentId} (de ${from})`);
    return NextResponse.json({ ok: true, demo: true, action, appointmentId });
  }

  const supabase = createServerSupabase(await cookies());

  if (action === "CONFIRM") {
    await supabase.from("appointments").update({ status: "CONFIRMADA" }).eq("id", appointmentId);
    await supabase.from("audit_logs").insert({
      action: "appointment.confirm_via_whatsapp",
      entity: "appointments",
      entity_id: appointmentId,
    });
    await sendWhatsAppText(from, "Presença confirmada! Até lá. ❤️");
  } else if (action === "CANCEL") {
    await supabase
      .from("appointments")
      .update({ status: "CANCELADA", cancel_reason: "Cancelada pelo paciente via WhatsApp" })
      .eq("id", appointmentId);
    await supabase.from("audit_logs").insert({
      action: "appointment.cancel_via_whatsapp",
      entity: "appointments",
      entity_id: appointmentId,
    });
    await sendWhatsAppText(
      from,
      "Sessão cancelada. Sem problema — quando quiser remarcar, é só me chamar. Cuide-se. ❤️"
    );
  } else if (action === "RESCHEDULE") {
    await supabase.from("tasks").insert({
      title: `Reagendar sessão ${appointmentId} — paciente pediu pelo WhatsApp`,
      notes: `Contato: ${from}`,
    });
    await sendWhatsAppText(
      from,
      "Sem problema! Já avisei a clínica e entraremos em contato para encontrar um novo horário. 😊"
    );
  }

  return NextResponse.json({ ok: true });
}
