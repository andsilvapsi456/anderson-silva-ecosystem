import { Badge, Card, PageHeader, statusLabel, statusTone } from "@as/ui";
import { effectiveBlocks, formatTime, holidaysInRange, type Appointment, type TimeBlock } from "@as/shared";
import { getAgendaPrefs, getAppointments, getPatients, getTimeBlocks } from "../../../lib/data";
import { AgendaToolbar } from "../../../components/agenda-toolbar";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08h–19h
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function weekDays(): Date[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function appointmentsAt(appointments: Appointment[], day: Date, hour: number): Appointment[] {
  return appointments
    .filter((a) => {
      const s = new Date(a.startsAt);
      return s.toDateString() === day.toDateString() && s.getHours() === hour;
    })
    // sessões ativas em cima; canceladas/faltas vão para o rodapé da célula (apagadas)
    .sort((a, b) => Number(a.status === "CANCELADA") - Number(b.status === "CANCELADA"));
}

/** Um cartão de sessão na grade. Canceladas ficam apagadas e marcam "horário livre". */
function SlotCard({ a }: { a: Appointment }) {
  if (a.status === "CANCELADA") {
    return (
      <div
        className="mt-1 rounded-[var(--radius-xs)] border border-dashed border-[var(--border)] bg-[var(--bg-alt)] px-2 py-1 opacity-80"
        title={`Sessão cancelada${a.cancelReason ? ` — ${a.cancelReason}` : ""}. Este horário está livre para reagendar.`}
      >
        <p className="text-[11px] font-bold text-[var(--text-soft)] line-through truncate">
          {a.patientName} · {formatTime(a.startsAt)}
        </p>
        <p className="text-[10px] font-bold text-[var(--success)]">✕ Cancelada · horário livre</p>
        {a.cancelReason && (
          <p className="text-[10px] text-[var(--text-soft)] leading-tight truncate" title={a.cancelReason}>
            Motivo: {a.cancelReason}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-[var(--radius-xs)] bg-[var(--accent-soft)] border-l-[3px] border-[var(--accent)] px-2 py-1 cursor-pointer hover:opacity-80">
      <p className="text-[11px] font-bold truncate">{a.patientName}</p>
      <p className="text-[10px] text-[var(--text-soft)]">
        {formatTime(a.startsAt)} {a.mode === "ONLINE" ? "💻" : a.room ? `· ${a.room}` : ""}
      </p>
      <Badge tone={statusTone[a.status]} className="mt-0.5 !text-[9px] !px-1.5">
        {statusLabel[a.status]}
      </Badge>
    </div>
  );
}

/**
 * Agenda semanal (modelo Google Calendar).
 * Fase 2 do roadmap: drag-and-drop (dnd-kit), recorrência visual e
 * sincronização bidirecional com Google Calendar.
 */
/** Bloqueio que cobre a hora daquele dia (e se é a hora em que ele começa). */
function blockAt(blocks: TimeBlock[], day: Date, hour: number): { block: TimeBlock; isStart: boolean } | null {
  const cellStart = new Date(day);
  cellStart.setHours(hour, 0, 0, 0);
  const cellEnd = new Date(cellStart);
  cellEnd.setHours(hour + 1, 0, 0, 0);
  for (const b of blocks) {
    const bs = new Date(b.startsAt);
    const be = new Date(b.endsAt);
    if (bs < cellEnd && cellStart < be) {
      return { block: b, isStart: bs >= cellStart && bs < cellEnd };
    }
  }
  return null;
}

export default async function AgendaPage() {
  const [appointments, patients, oneOff, prefs] = await Promise.all([
    getAppointments(),
    getPatients(),
    getTimeBlocks(),
    getAgendaPrefs(),
  ]);
  const days = weekDays();
  // bloqueios efetivos da semana = avulsos + almoço recorrente + feriados (SP)
  const blocks = effectiveBlocks({
    from: days[0],
    to: days[days.length - 1],
    oneOff,
    lunch: prefs.lunch,
    blockHolidays: prefs.blockHolidays,
  });
  const today = new Date().toDateString();
  // feriados dos próximos ~3 meses, para o painel de bloqueios da agenda
  const upcomingHolidays = holidaysInRange(new Date(), new Date(Date.now() + 92 * 86_400_000));

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Semana atual · arraste para reagendar (em breve)"
        actions={
          <AgendaToolbar
            patients={patients.map((p) => ({ id: p.id, name: p.name }))}
            blocks={oneOff}
            lunch={prefs.lunch}
            blockHolidays={prefs.blockHolidays}
            holidays={upcomingHolidays}
          />
        }
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-175 border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-14 border-b border-[var(--border)] px-2 py-3" />
              {days.map((d) => (
                <th
                  key={d.toISOString()}
                  className={`border-b border-l border-[var(--border)] px-2 py-3 text-center ${
                    d.toDateString() === today ? "bg-[var(--accent-soft)]" : ""
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">
                    {DAY_LABELS[d.getDay()]}
                  </p>
                  <p className={`text-lg font-extrabold ${d.toDateString() === today ? "text-[var(--accent)]" : ""}`}>
                    {d.getDate()}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="border-b border-[var(--border)] px-2 py-1 text-right align-top text-[11px] font-bold text-[var(--text-soft)]">
                  {String(hour).padStart(2, "0")}h
                </td>
                {days.map((d) => {
                  const slot = appointmentsAt(appointments, d, hour);
                  const blocked = blockAt(blocks, d, hour);
                  return (
                    <td
                      key={d.toISOString()}
                      className={`h-14 border-b border-l border-[var(--border)] p-1 align-top ${
                        blocked ? "bg-[var(--bg-alt)] bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--border)_6px,var(--border)_7px)]" : ""
                      }`}
                      title={blocked ? `Bloqueado: ${blocked.block.title}` : undefined}
                    >
                      {blocked?.isStart && (
                        <p className="truncate rounded-[var(--radius-xs)] bg-[var(--text-soft)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-soft)]">
                          🚫 {blocked.block.title}
                        </p>
                      )}
                      {slot.map((a) => (
                        <SlotCard key={a.id} a={a} />
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
