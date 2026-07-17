import { PageHeader } from "@as/ui";
import { effectiveBlocks, holidaysInRange, spDayKey } from "@as/shared";
import { getAgendaPrefs, getAppointments, getPatients, getTimeBlocks } from "../../../lib/data";
import { AgendaToolbar } from "../../../components/agenda-toolbar";
import { AgendaGrid, type AgendaDay } from "../../../components/agenda-grid";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08h–19h
const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function weekDays(): Date[] {
  // "hoje" no fuso da clínica; âncora ao meio-dia UTC (9h SP) = mesmo dia nos 2 fusos
  const [y, m, d] = spDayKey(new Date()).split("-").map(Number);
  const today = new Date(Date.UTC(y, m - 1, d, 12));
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, i) => {
    const dd = new Date(monday);
    dd.setUTCDate(monday.getUTCDate() + i);
    return dd;
  });
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
  const todayKey = spDayKey(new Date());
  // feriados dos próximos ~3 meses, para o painel de bloqueios da agenda
  const upcomingHolidays = holidaysInRange(new Date(), new Date(Date.now() + 92 * 86_400_000));

  // dias serializados para o grid cliente (Date não cruza o boundary do RSC)
  const gridDays: AgendaDay[] = days.map((d) => {
    const dayKey = spDayKey(d);
    return {
      iso: d.toISOString(),
      dayKey,
      label: DAY_LABELS[d.getUTCDay()],
      dayNum: d.getUTCDate(),
      isToday: dayKey === todayKey,
    };
  });

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle="Clique num horário para agendar ou bloquear · numa sessão para remarcar ou cancelar"
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
      <AgendaGrid
        hours={HOURS}
        days={gridDays}
        appointments={appointments}
        blocks={blocks}
        patients={patients.map((p) => ({ id: p.id, name: p.name }))}
      />
    </>
  );
}
