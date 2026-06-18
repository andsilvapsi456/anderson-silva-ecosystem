/**
 * CRON · LEMBRETES — a cada 15 min (GitHub Action, pois o Vercel Hobby
 * só roda crons diários). Processa:
 *
 *  1. Sessões em ~24h → e-mail e/ou WhatsApp com botões de CONFIRMAÇÃO
 *     (a resposta volta pelo webhook e marca a sessão como CONFIRMADA);
 *  2. Sessões em ~2h  → lembrete final (com aviso do link no portal);
 *  3. Cobranças vencendo hoje ou atrasadas → mensagem acolhedora com PIX
 *     (reenvio a cada N dias, configurável).
 *
 * Dedupe em modo real: tabela `reminders` (uma linha por sessão+tipo).
 * Teste local: GET /api/cron/reminders
 */
import { NextResponse } from "next/server";
import { isDemoMode } from "@as/auth";
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { formatTime, mockPatients } from "@as/shared";
import { getAppointments, getPatient, getTransactions } from "../../../../lib/data";
import { getNotificationSettings } from "../../../../lib/notifications/settings";
import { composeBillingEmail, composeBillingText, composeSessionReminderEmail } from "../../../../lib/notifications/messages";
import { sendEmail } from "../../../../lib/notifications/mailer";
import { sendSessionConfirmRequest, sendWhatsAppText } from "../../../../lib/notifications/whatsapp";

const PIX_KEY = process.env.PIX_KEY ?? "hello@andersonsilvapsicologo.com.br";
const WINDOW_MIN = 20; // tolerância da janela (cron roda a cada 15 min)

function authorized(request: Request): boolean {
  if (!process.env.CRON_SECRET) return true;
  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

function inWindow(startsAt: string, hoursBefore: number): boolean {
  const target = new Date(startsAt).getTime() - hoursBefore * 3600_000;
  const diffMin = (target - Date.now()) / 60000;
  return diffMin <= 0 && diffMin > -WINDOW_MIN;
}

async function alreadySent(appointmentId: string, kind: string): Promise<boolean> {
  if (isDemoMode()) return false;
  const supabase = createServerSupabase(await cookies());
  const { data } = await supabase
    .from("reminders")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("kind", kind)
    .not("sent_at", "is", null)
    .maybeSingle();
  return Boolean(data);
}

async function markSent(appointmentId: string, kind: string, channel: string) {
  if (isDemoMode()) return;
  const supabase = createServerSupabase(await cookies());
  await supabase.from("reminders").insert({
    appointment_id: appointmentId,
    kind,
    channel,
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await getNotificationSettings();
  const sent: Record<string, string[]> = { sessao_24h: [], sessao_2h: [], cobranca: [] };

  /* ── 1 & 2: lembretes de sessão ── */
  const appointments = (await getAppointments()).filter(
    (a) => a.status === "PENDENTE" || a.status === "CONFIRMADA"
  );

  for (const a of appointments) {
    for (const kind of ["24h", "2h"] as const) {
      const wantEmail = kind === "24h" ? settings.remind24hEmail : settings.remind2hEmail;
      const wantWa = kind === "24h" ? settings.remind24hWhatsapp : settings.remind2hWhatsapp;
      if (!wantEmail && !wantWa) continue;
      if (!inWindow(a.startsAt, kind === "24h" ? 24 : 2)) continue;
      if (await alreadySent(a.id, `lembrete_${kind}`)) continue;

      const patient = isDemoMode()
        ? mockPatients.find((p) => p.id === a.patientId)
        : await getPatient(a.patientId);
      if (!patient) continue;

      if (wantEmail && patient.email) {
        const { subject, html } = composeSessionReminderEmail(a, kind);
        await sendEmail(patient.email, subject, html);
      }
      if (wantWa && (patient.whatsapp || patient.phone)) {
        const phone = patient.whatsapp ?? patient.phone!;
        if (kind === "24h") {
          // 24h antes: pede CONFIRMAÇÃO com botões — resposta volta no webhook
          await sendSessionConfirmRequest(phone, {
            firstName: patient.name.split(" ")[0],
            date: new Date(a.startsAt).toLocaleDateString("pt-BR"),
            time: formatTime(a.startsAt),
            mode: a.mode,
            appointmentId: a.id,
          });
        } else {
          await sendWhatsAppText(
            phone,
            `Olá, ${patient.name.split(" ")[0]}! Sua sessão é daqui a pouco, às ${formatTime(a.startsAt)}. ` +
              (a.mode === "ONLINE" && a.videoLink
                ? `Sua sala: ${a.videoLink} — também está na sua Área do Paciente. Até já! ❤️`
                : `Até já! ❤️`)
          );
        }
      }
      await markSent(a.id, `lembrete_${kind}`, wantWa ? "WHATSAPP" : "EMAIL");
      sent[`sessao_${kind}`].push(`${a.patientName} (${formatTime(a.startsAt)})`);
    }
  }

  /* ── 3: cobranças ── */
  if (settings.billingEmail || settings.billingWhatsapp) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const receivables = (await getTransactions()).filter(
      (t) => t.kind === "RECEITA" && (t.status === "PENDENTE" || t.status === "ATRASADO")
    );

    for (const t of receivables) {
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      const daysLate = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
      // envia no vencimento e reenvia a cada N dias de atraso
      const shouldSend = daysLate === 0 || (daysLate > 0 && daysLate % settings.billingRetryDays === 0);
      if (!shouldSend || !t.patientId) continue;

      const patient = isDemoMode()
        ? mockPatients.find((p) => p.id === t.patientId)
        : await getPatient(t.patientId);
      if (!patient) continue;

      if (settings.billingEmail && patient.email) {
        const { subject, html } = composeBillingEmail(t, PIX_KEY);
        await sendEmail(patient.email, subject, html);
      }
      if (settings.billingWhatsapp && (patient.whatsapp || patient.phone)) {
        await sendWhatsAppText(patient.whatsapp ?? patient.phone!, composeBillingText(t, PIX_KEY));
      }
      sent.cobranca.push(`${t.patientName} — ${t.description} (${daysLate === 0 ? "vence hoje" : `${daysLate}d atraso`})`);
    }
  }

  return NextResponse.json({ ok: true, demo: isDemoMode(), sent });
}
