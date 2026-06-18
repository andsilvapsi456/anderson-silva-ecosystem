/**
 * GOOGLE CALENDAR + MEET — evento semanal com link fixo
 * ──────────────────────────────────────────────────────
 * Ao agendar uma sessão online recorrente, criamos UM evento recorrente
 * (RRULE semanal) no calendário do psicólogo com o paciente como convidado:
 *
 *  • o evento aparece automaticamente na agenda do paciente (convite Google);
 *  • `conferenceData.createRequest` gera UMA sala do Meet para a série —
 *    o link é o MESMO em todas as ocorrências, para sempre (link fixo);
 *  • o id retornado vai em `appointments.google_event_id` e o link em
 *    `appointments.video_link` (já modelados no Prisma);
 *  • reagendamentos usam PATCH no mesmo evento → o link não muda.
 *
 * Requisitos (gratuitos): projeto no Google Cloud, OAuth consent, escopo
 * `https://www.googleapis.com/auth/calendar.events` e refresh token do
 * psicólogo (fluxo "Conectar Google Agenda" em Configurações).
 */

export interface WeeklyMeetEventInput {
  patientName: string;
  patientEmail: string;
  /** primeira ocorrência (ISO) */
  startsAt: string;
  durationMinutes: number;
  /** "WEEKLY" | "FORTNIGHTLY" — quinzenal vira WEEKLY;INTERVAL=2 */
  frequency?: "WEEKLY" | "FORTNIGHTLY";
}

export interface WeeklyMeetEventResult {
  googleEventId: string;
  /** link do Meet — fixo para toda a série */
  meetLink: string;
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_REFRESH_TOKEN);
}

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`OAuth: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

export async function createWeeklyMeetEvent(input: WeeklyMeetEventInput): Promise<WeeklyMeetEventResult> {
  // MODO DEMO — sem credenciais, devolve um link estável de exemplo
  if (!isGoogleCalendarConfigured()) {
    return {
      googleEventId: `demo-${input.patientEmail}`,
      meetLink: "https://meet.google.com/exemplo-demo",
    };
  }

  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const rrule = input.frequency === "FORTNIGHTLY" ? "RRULE:FREQ=WEEKLY;INTERVAL=2" : "RRULE:FREQ=WEEKLY";

  const token = await getAccessToken();
  const res = await fetch(
    // conferenceDataVersion=1 é obrigatório para o Google criar a sala do Meet
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: `Sessão — ${input.patientName}`,
        description: "Sessão de psicoterapia · Anderson V. V. Silva (CRP 06/166223)",
        start: { dateTime: start.toISOString(), timeZone: "America/Sao_Paulo" },
        end: { dateTime: end.toISOString(), timeZone: "America/Sao_Paulo" },
        recurrence: [rrule],
        attendees: [{ email: input.patientEmail, displayName: input.patientName }],
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: true },
        guestsCanModify: false,
        guestsCanInviteOthers: false, // sigilo: só psicólogo e paciente
      }),
    }
  );
  if (!res.ok) throw new Error(`Calendar: ${await res.text()}`);
  const event = await res.json();
  return { googleEventId: event.id, meetLink: event.hangoutLink };
}

/** Reagenda a série inteira mantendo o MESMO link do Meet. */
export async function rescheduleSeries(googleEventId: string, newStartsAt: string, durationMinutes: number) {
  if (!isGoogleCalendarConfigured()) return;
  const start = new Date(newStartsAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const token = await getAccessToken();
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        start: { dateTime: start.toISOString(), timeZone: "America/Sao_Paulo" },
        end: { dateTime: end.toISOString(), timeZone: "America/Sao_Paulo" },
      }),
    }
  );
}
