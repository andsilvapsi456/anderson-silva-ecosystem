/**
 * CRON · AGENDA DIÁRIA + ANIVERSÁRIOS — todo dia às 8h (América/São_Paulo).
 *
 *  1. E-mail ao psicólogo com as sessões do dia (horário, paciente, sala);
 *  2. 🎂 Parabéns automático aos pacientes aniversariantes do dia
 *     (e-mail + WhatsApp), com dedupe pela trilha de auditoria — rodar
 *     o job duas vezes não manda mensagem duplicada.
 *
 * Usa o SERVICE ROLE (lib/cron-data): sem sessão de usuário, a RLS
 * devolveria zero linhas com a chave anon.
 *
 * Agendamento: GitHub Action .github/workflows/daily-agenda.yml (11h UTC).
 * Teste local: GET /api/cron/daily-agenda?preview=1
 */
import { NextResponse } from "next/server";
import { isDemoMode } from "@as/auth";
import { isBirthdayToday, spDayKey } from "@as/shared";
import { safeEqual } from "@as/shared/webhook-signature";
import {
  getBirthdayAlreadySent,
  getCronAppointments,
  getCronNotificationSettings,
  getCronPatients,
  logBirthdaySent,
} from "../../../../lib/cron-data";
import { composeBirthdayEmail, composeBirthdayText, composeDailyAgendaEmail } from "../../../../lib/notifications/messages";
import { sendEmail } from "../../../../lib/notifications/mailer";
import { sendWhatsAppText } from "../../../../lib/notifications/whatsapp";

function authorized(request: Request): boolean {
  if (!process.env.CRON_SECRET) return true; // dev/demo
  // comparação em tempo constante — `===` vaza o prefixo por timing
  return safeEqual(request.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [settings, appointments, patients] = await Promise.all([
    getCronNotificationSettings(),
    getCronAppointments(),
    getCronPatients(),
  ]);

  const todayKey = spDayKey(new Date()); // dia da CLÍNICA (SP), não do servidor

  /* ── 1: agenda do dia para o psicólogo ── */
  let agendaResult: { ok: boolean; demo?: boolean } = { ok: true };
  let sessions: typeof appointments = [];
  if (settings.dailyAgendaEnabled) {
    sessions = appointments.filter((a) => spDayKey(a.startsAt) === todayKey && a.status !== "CANCELADA");
    const { subject, html } = composeDailyAgendaEmail(new Date(), sessions);
    agendaResult = await sendEmail(settings.dailyAgendaEmail, subject, html);
  }

  /* ── 2: 🎂 aniversariantes do dia ── */
  const birthdayPatients = patients.filter((p) => p.active && isBirthdayToday(p.birthDate, todayKey));
  const congratulated: string[] = [];
  if (birthdayPatients.length > 0) {
    const startOfDaySp = `${todayKey}T00:00:00-03:00`;
    const alreadySent = await getBirthdayAlreadySent(new Date(startOfDaySp).toISOString());
    for (const p of birthdayPatients) {
      if (alreadySent.has(p.id)) continue;
      const firstName = p.name.split(" ")[0];
      const channels: string[] = [];
      if (p.email) {
        const { subject, html } = composeBirthdayEmail(firstName);
        const r = await sendEmail(p.email, subject, html);
        if (r.ok) channels.push("EMAIL");
      }
      if (p.whatsapp || p.phone) {
        const r = await sendWhatsAppText(p.whatsapp ?? p.phone!, composeBirthdayText(firstName));
        if (r.ok) channels.push("WHATSAPP");
      }
      if (channels.length > 0) {
        await logBirthdaySent(p.id, channels);
        congratulated.push(`${p.name} (${channels.join("+")})`);
      }
    }
  }

  const preview = new URL(request.url).searchParams.get("preview");
  return NextResponse.json({
    ok: agendaResult.ok,
    demo: isDemoMode(),
    to: settings.dailyAgendaEnabled ? settings.dailyAgendaEmail : "(agenda diária desativada)",
    sessions: sessions.map((s) => ({
      time: new Date(s.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }),
      patient: s.patientName,
      mode: s.mode,
      link: s.videoLink ?? s.room ?? null,
    })),
    aniversariantes: congratulated,
    ...(preview ? { previewBirthday: birthdayPatients.map((p) => p.name) } : {}),
  });
}
