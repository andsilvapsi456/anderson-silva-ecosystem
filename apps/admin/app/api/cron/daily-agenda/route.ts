/**
 * CRON · AGENDA DIÁRIA — todo dia às 8h (América/São_Paulo).
 * Envia ao psicólogo um e-mail com as sessões do dia: horário,
 * nome completo do paciente e link da sala (Meet fixo) ou sala física.
 *
 * Agendamento: Vercel Cron (apps/admin/vercel.json → "0 11 * * *" UTC).
 * Teste local: GET /api/cron/daily-agenda?preview=1
 */
import { NextResponse } from "next/server";
import { getAppointments } from "../../../../lib/data";
import { getNotificationSettings } from "../../../../lib/notifications/settings";
import { composeDailyAgendaEmail } from "../../../../lib/notifications/messages";
import { sendEmail } from "../../../../lib/notifications/mailer";

function authorized(request: Request): boolean {
  if (!process.env.CRON_SECRET) return true; // dev/demo
  const header = request.headers.get("authorization");
  return header === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await getNotificationSettings();
  if (!settings.dailyAgendaEnabled) {
    return NextResponse.json({ ok: true, skipped: "agenda diária desativada nas configurações" });
  }

  const today = new Date();
  const sessions = (await getAppointments()).filter((a) => {
    const d = new Date(a.startsAt);
    return d.toDateString() === today.toDateString() && a.status !== "CANCELADA";
  });

  const { subject, html } = composeDailyAgendaEmail(today, sessions);
  const result = await sendEmail(settings.dailyAgendaEmail, subject, html);

  const preview = new URL(request.url).searchParams.get("preview");
  return NextResponse.json({
    ok: result.ok,
    demo: result.demo ?? false,
    to: settings.dailyAgendaEmail,
    subject,
    sessions: sessions.map((s) => ({
      time: new Date(s.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      patient: s.patientName,
      mode: s.mode,
      link: s.videoLink ?? s.room ?? null,
    })),
    ...(preview ? { html } : {}),
  });
}
