/** Composição das mensagens — tom profissional e acolhedor da marca. */
import { formatBRL, formatTime, type Appointment, type Transaction } from "@as/shared";
import { signActionToken } from "@as/auth/action";
import { emailLayout } from "./mailer";

/** Escapa dados do usuário interpolados em e-mail HTML (nome, motivo, descrição…) —
 *  sem isso, um nome como `<a href=…>` viraria markup/phishing dentro do e-mail. */
function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Só aceita URL http(s) como href — qualquer outra coisa vira texto. */
function safeUrl(u: string | null | undefined): string | null {
  const s = String(u ?? "");
  return /^https?:\/\//i.test(s) ? s : null;
}

/** Botões de confirmar/cancelar a sessão pelo e-mail (link tokenizado, sem login). */
function sessionActionButtons(appointmentId: string): string {
  const base = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";
  const confirmUrl = `${base}/api/sessao?t=${signActionToken(appointmentId, "confirmar")}`;
  const cancelUrl = `${base}/api/sessao?t=${signActionToken(appointmentId, "cancelar")}`;
  return `<table cellpadding="0" cellspacing="0" style="margin:18px 0 0"><tr>
    <td style="padding-right:10px">
      <a href="${confirmUrl}" style="display:inline-block;background:#19a974;color:#fff;font-weight:700;
         text-decoration:none;border-radius:999px;padding:11px 22px;font-size:14px">✓ Confirmar presença</a>
    </td>
    <td>
      <a href="${cancelUrl}" style="display:inline-block;background:#f4f4f5;color:#202020;font-weight:700;
         text-decoration:none;border-radius:999px;padding:11px 22px;font-size:14px">Preciso cancelar</a>
    </td>
  </tr></table>`;
}

const WEEKDAYS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/* ───────── E-mail diário das 8h: a agenda do dia do psicólogo ───────── */

export function composeDailyAgendaEmail(date: Date, sessions: Appointment[]): { subject: string; html: string } {
  const dateLabel = `${WEEKDAYS[date.getDay()]}, ${date.toLocaleDateString("pt-BR")}`;
  const subject =
    sessions.length === 0
      ? `Sua agenda de hoje (${date.toLocaleDateString("pt-BR")}) — dia livre 🌱`
      : `Sua agenda de hoje (${date.toLocaleDateString("pt-BR")}) — ${sessions.length} sessã${sessions.length > 1 ? "es" : "o"}`;

  const rows = sessions
    .map((s) => {
      const url = safeUrl(s.videoLink);
      const link = url
        ? `<a href="${esc(url)}" style="color:#FF5A5A;font-weight:700">Entrar na sala →</a>`
        : esc(s.room ?? "Presencial");
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eaeaea;font-weight:800;white-space:nowrap">${formatTime(s.startsAt)}–${formatTime(s.endsAt)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eaeaea">${s.mode === "ONLINE" ? "📹" : "🏢"} <strong>${esc(s.patientName)}</strong></td>
        <td style="padding:10px 12px;border-bottom:1px solid #eaeaea">${link}</td>
      </tr>`;
    })
    .join("");

  const body =
    sessions.length === 0
      ? `<p style="margin:0;line-height:1.6">Nenhuma sessão marcada para hoje. Bom descanso — ou um bom dia de estudos. ❤️</p>`
      : `<p style="margin:0 0 14px;line-height:1.6">Bom dia! Estas são as suas sessões de hoje, <strong>${dateLabel}</strong>:</p>
         <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table>
         <p style="margin:16px 0 0;font-size:13px;color:#6a7178">Os links levam direto à sala fixa de cada paciente no Google Meet.</p>`;

  return { subject, html: emailLayout("Sua agenda de hoje", body) };
}

/* ───────── Cancelamento PELO PSICÓLOGO → avisa o PACIENTE ───────── */

export function composeCancellationText(firstName: string, s: Appointment, reason?: string | null): string {
  const date = new Date(s.startsAt);
  const quando = `${date.toLocaleDateString("pt-BR")} às ${formatTime(s.startsAt)}`;
  return (
    `Olá, ${firstName}! Tudo bem? 😊\n\n` +
    `Preciso cancelar a nossa sessão de *${quando}* — não poderei te atender nesse horário.` +
    (reason ? `\nMotivo: ${reason}` : "") +
    `\n\nMe desculpe pelo imprevisto. Quando quiser, me chama por aqui que a gente já encontra um novo horário. ` +
    `O seu cuidado continua sendo prioridade. ❤️\n\n` +
    `Um abraço,\nAnderson V. V. Silva · Psicólogo · CRP 06/166223`
  );
}

export function composeCancellationEmail(
  firstName: string,
  s: Appointment,
  reason?: string | null
): { subject: string; html: string } {
  const date = new Date(s.startsAt);
  const quando = `${date.toLocaleDateString("pt-BR")} às ${formatTime(s.startsAt)}`;
  const subject = `Precisei cancelar nossa sessão de ${quando}`;
  const body = `<p style="margin:0;line-height:1.7">Olá, ${esc(firstName)}! Preciso cancelar a nossa sessão de
    <strong>${quando}</strong> — não poderei te atender nesse horário.${reason ? `<br/>Motivo: ${esc(reason)}` : ""}</p>
    <p style="margin:14px 0 0;line-height:1.7">Me desculpe pelo imprevisto. Quando quiser, é só responder este e-mail
    ou chamar no WhatsApp que já encontramos um novo horário. O seu cuidado continua sendo prioridade. ❤️</p>`;
  return { subject, html: emailLayout("Precisei cancelar nossa sessão", body) };
}

/* ───────── Remarcação PELO PSICÓLOGO → avisa o PACIENTE ───────── */

function quandoStr(iso: string): string {
  return `${new Date(iso).toLocaleDateString("pt-BR")} às ${formatTime(iso)}`;
}

export function composeRescheduleText(firstName: string, fromIso: string, toIso: string): string {
  return (
    `Olá, ${firstName}! Tudo bem? 😊\n\n` +
    `Precisei remarcar a nossa sessão: de *${quandoStr(fromIso)}* para *${quandoStr(toIso)}*.\n\n` +
    `Se esse novo horário não ficar bom pra você, é só me avisar por aqui que a gente ajusta. ` +
    `O link da sala e os lembretes continuam os mesmos. ❤️\n\n` +
    `Um abraço,\nAnderson V. V. Silva · Psicólogo · CRP 06/166223`
  );
}

export function composeRescheduleEmail(
  firstName: string,
  fromIso: string,
  toIso: string
): { subject: string; html: string } {
  const subject = `Sua sessão foi remarcada para ${quandoStr(toIso)}`;
  const body = `<p style="margin:0;line-height:1.7">Olá, ${esc(firstName)}! Precisei remarcar a nossa sessão:
    de <strong>${quandoStr(fromIso)}</strong> para <strong>${quandoStr(toIso)}</strong>.</p>
    <p style="margin:14px 0 0;line-height:1.7">Se o novo horário não ficar bom pra você, é só responder este
    e-mail ou chamar no WhatsApp que a gente ajusta. O link da sala e os lembretes continuam os mesmos. ❤️</p>`;
  return { subject, html: emailLayout("Sua sessão foi remarcada", body) };
}

/* ───────── Lembrete de sessão (e-mail para o paciente) ───────── */

export function composeSessionReminderEmail(
  s: Appointment,
  kind: "24h" | "2h"
): { subject: string; html: string } {
  const date = new Date(s.startsAt);
  const when = kind === "24h" ? "amanhã" : "daqui a pouco";
  const subject = `Lembrete: sua sessão é ${when}, ${date.toLocaleDateString("pt-BR")} às ${formatTime(s.startsAt)}`;
  const reminderUrl = safeUrl(s.videoLink);
  const linkRow =
    s.mode === "ONLINE"
      ? `<p style="margin:14px 0 0">📹 A sessão é online — sua sala fixa está sempre disponível na <strong>Área do Paciente</strong>${reminderUrl ? `: <a href="${esc(reminderUrl)}" style="color:#FF5A5A;font-weight:700">entrar na sala →</a>` : "."}</p>`
      : `<p style="margin:14px 0 0">🏢 A sessão é presencial${s.room ? ` — ${esc(s.room)}` : ""}.</p>`;
  const body = `<p style="margin:0;line-height:1.7">Olá! Passando para lembrar com carinho da sua sessão
    <strong>${when}, ${date.toLocaleDateString("pt-BR")} às ${formatTime(s.startsAt)}</strong>.</p>
    ${linkRow}
    ${sessionActionButtons(s.id)}
    <p style="margin:16px 0 0;line-height:1.7;font-size:13px;color:#6a7178">Os botões acima atualizam sua sessão na hora. Se preferir, é só responder este e-mail ou chamar no WhatsApp. Até lá! ❤️</p>`;
  return { subject, html: emailLayout("Lembrete de sessão", body) };
}

/* ───────── Cobrança acolhedora (e-mail e WhatsApp) ───────── */

export function composeBillingText(t: Transaction, pixKey: string): string {
  const firstName = (t.patientName ?? "").split(" ")[0];
  const due = new Date(t.dueDate).toLocaleDateString("pt-BR");
  return (
    `Olá, ${firstName}! Tudo bem? 😊\n\n` +
    `Passando para lembrar com carinho da sua ${t.description.toLowerCase()}, ` +
    `no valor de ${formatBRL(t.amountCents)}, combinada para ${due}.\n\n` +
    `Você pode pagar por PIX usando a chave:\n🔑 ${pixKey}\n\n` +
    `Assim que o pagamento for identificado, o recibo fica disponível na sua Área do Paciente. ` +
    `Se este mês estiver mais apertado, me chama — a gente sempre encontra um caminho juntos. ❤️\n\n` +
    `Um abraço,\nAnderson V. V. Silva · Psicólogo · CRP 06/166223`
  );
}

export function composeBillingEmail(t: Transaction, pixKey: string): { subject: string; html: string } {
  const subject = `Lembrete de pagamento — ${formatBRL(t.amountCents)} · vence ${new Date(t.dueDate).toLocaleDateString("pt-BR")}`;
  const body = `<p style="margin:0;white-space:pre-line;line-height:1.7">${esc(composeBillingText(t, pixKey))}</p>`;
  return { subject, html: emailLayout("Lembrete de pagamento", body) };
}

/* ───────── Aniversário do paciente: parabéns automático 🎂 ───────── */

export function composeBirthdayText(firstName: string): string {
  return (
    `Feliz aniversário, ${firstName}! 🎂🎉\n\n` +
    `Hoje o dia é seu — e eu não podia deixar passar sem te desejar um novo ciclo ` +
    `com saúde, leveza e bons encontros. Que você siga cuidando de si com o mesmo ` +
    `carinho que dedica à sua caminhada.\n\n` +
    `Um abraço grande,\nAnderson V. V. Silva · Psicólogo · CRP 06/166223`
  );
}

export function composeBirthdayEmail(firstName: string): { subject: string; html: string } {
  const subject = `Feliz aniversário, ${firstName}! 🎂`;
  const body = `<p style="margin:0;white-space:pre-line;line-height:1.7">${esc(composeBirthdayText(firstName))}</p>`;
  return { subject, html: emailLayout(`Feliz aniversário, ${esc(firstName)}! 🎉`, body) };
}
