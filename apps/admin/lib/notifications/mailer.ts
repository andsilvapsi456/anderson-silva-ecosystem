/**
 * E-mail transacional via Resend (free: 100/dia — suficiente para a clínica).
 * Sem RESEND_API_KEY configurada → modo demo (loga e devolve preview).
 */

export interface MailResult {
  ok: boolean;
  demo?: boolean;
  error?: string;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<MailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[DEMO] E-mail para ${to} · "${subject}"`);
    return { ok: true, demo: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Clínica Anderson Silva <agenda@andersonsilvapsicologo.com.br>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Resend falhou:", error);
    return { ok: false, error };
  }
  return { ok: true };
}

/** Layout base dos e-mails — coral/Montserrat, igual ao resto do ecossistema. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f8f9fa;font-family:Montserrat,Arial,sans-serif;color:#202020">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <span style="display:inline-block;width:34px;height:34px;border-radius:12px;background:#FF5A5A;color:#fff;font-weight:800;text-align:center;line-height:34px;font-size:14px">AS</span>
      <strong style="font-size:15px">Anderson V. V. Silva · Psicólogo</strong>
    </div>
    <div style="background:#ffffff;border:1px solid #eaeaea;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px;letter-spacing:-0.01em">${title}</h1>
      ${bodyHtml}
    </div>
    <img src="${process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002"}/brand/assinatura-email.png"
         alt="Anderson V. V. Silva · Psicólogo · CRP 06/166223"
         style="max-width:260px;margin:20px 4px 0;display:block" />
    <p style="margin:10px 4px 0;font-size:12px;color:#6a7178">
      Este e-mail é confidencial. Dados tratados conforme a LGPD.
    </p>
  </div>
</body></html>`;
}
