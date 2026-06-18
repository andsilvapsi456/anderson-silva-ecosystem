/**
 * Confirmar / cancelar sessão pelo link do e-mail (sem login).
 * O token HMAC carrega o appointmentId + ação; a atualização usa a
 * SERVICE_ROLE no servidor e reflete imediatamente no sistema.
 * Retorna uma página amigável com a identidade da marca.
 */
import { verifyActionToken } from "@as/auth/action";
import { isDemoMode } from "@as/auth";
import { rateLimit, clientIp } from "@as/shared";

function page(title: string, message: string, tone: "ok" | "warn" | "err"): Response {
  const color = tone === "ok" ? "#19a974" : tone === "warn" ? "#e8a317" : "#d63a34";
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&display=swap"/>
  </head><body style="margin:0;background:#f8f9fa;font-family:Montserrat,Arial,sans-serif;color:#202020;
    display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">
    <div style="max-width:440px;width:100%;background:#fff;border:1px solid #eaeaea;border-radius:20px;
      padding:40px 32px;text-align:center;box-shadow:0 18px 50px -28px rgba(60,40,30,.4)">
      <div style="width:64px;height:64px;border-radius:18px;background:${color}1a;color:${color};
        display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 18px">
        ${tone === "ok" ? "✓" : tone === "warn" ? "↺" : "!"}
      </div>
      <h1 style="margin:0 0 10px;font-size:22px">${title}</h1>
      <p style="margin:0;font-size:15px;line-height:1.6;color:#6a7178">${message}</p>
      <p style="margin:24px 0 0;font-size:12px;color:#a8a097">Anderson V. V. Silva · Psicólogo · CRP 06/166223</p>
    </div>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request) {
  // anti-força-bruta de tokens: no máx. 20 tentativas/min por IP
  if (!rateLimit(`sessao:${clientIp(request)}`, 20)) {
    return page("Muitas tentativas", "Aguarde um instante e tente novamente, ou chame a clínica no WhatsApp.", "warn");
  }

  const token = new URL(request.url).searchParams.get("t") ?? "";
  const verified = verifyActionToken(token);
  if (!verified) {
    return page("Link inválido ou expirado", "Por segurança, este link expira em 3 dias. Chame a clínica no WhatsApp para confirmar ou remarcar.", "err");
  }

  const confirmou = verified.action === "confirmar";

  if (!isDemoMode()) {
    const update = confirmou
      ? { status: "CONFIRMADA" }
      : { status: "CANCELADA", cancel_reason: "Cancelada pelo paciente pelo e-mail" };
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/appointments?id=eq.${verified.appointmentId}`,
      {
        method: "PATCH",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(update),
      }
    );
    if (!res.ok) {
      return page("Ops, algo deu errado", "Não foi possível atualizar agora. Tente novamente ou chame a clínica no WhatsApp.", "err");
    }
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audit_logs`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        action: `appointment.${confirmou ? "confirm" : "cancel"}_via_email`,
        entity: "appointments",
        entity_id: verified.appointmentId,
      }),
    }).catch(() => {});
  }

  return confirmou
    ? page("Presença confirmada! ❤️", "Que bom! Sua sessão está confirmada e já aparece como confirmada no sistema. Até lá.", "ok")
    : page("Sessão cancelada", "Sem problema — sua sessão foi cancelada no sistema. Quando quiser remarcar, é só chamar no WhatsApp. Cuide-se. ❤️", "warn");
}
