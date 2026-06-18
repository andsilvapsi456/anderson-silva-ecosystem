/**
 * Bloqueios efetivos da agenda = avulsos (férias/folgas) + almoço recorrente
 * + feriados (nacionais + SP estado + SP cidade), expandidos por dia.
 * Usado tanto na renderização da agenda quanto na prevenção de conflito.
 */
import type { TimeBlock } from "./types";
import { holidaysInRange } from "./holidays";

export interface LunchConfig {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  weekdays: number[]; // 0=dom … 6=sáb
}

export const DEFAULT_LUNCH: LunchConfig = {
  enabled: true,
  start: "12:00",
  end: "13:00",
  weekdays: [1, 2, 3, 4, 5], // seg–sex
};

function atTime(day: Date, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0).toISOString();
}

function dayBounds(day: Date): { start: string; end: string } {
  const s = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const e = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0);
  return { start: s.toISOString(), end: e.toISOString() };
}

function eachDay(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const last = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (d <= last) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Todos os bloqueios concretos no intervalo [from, to].
 * `oneOff`: bloqueios avulsos do banco. `lunch`: almoço recorrente.
 * `blockHolidays`: se true, gera feriados como bloqueios de dia inteiro.
 */
export function effectiveBlocks(opts: {
  from: Date;
  to: Date;
  oneOff?: TimeBlock[];
  lunch?: LunchConfig;
  blockHolidays?: boolean;
}): TimeBlock[] {
  const { from, to, oneOff = [], lunch = DEFAULT_LUNCH, blockHolidays = true } = opts;
  const blocks: TimeBlock[] = [...oneOff];

  // almoço recorrente
  if (lunch.enabled) {
    for (const day of eachDay(from, to)) {
      if (!lunch.weekdays.includes(day.getDay())) continue;
      blocks.push({
        id: `lunch-${day.toISOString().slice(0, 10)}`,
        title: "Almoço",
        kind: "ALMOCO",
        startsAt: atTime(day, lunch.start),
        endsAt: atTime(day, lunch.end),
      });
    }
  }

  // feriados (dia inteiro)
  if (blockHolidays) {
    for (const h of holidaysInRange(from, to)) {
      const [y, m, d] = h.date.split("-").map(Number);
      const { start, end } = dayBounds(new Date(y, m - 1, d));
      blocks.push({ id: `holiday-${h.date}`, title: `Feriado — ${h.name}`, kind: "FERIADO", startsAt: start, endsAt: end });
    }
  }

  return blocks;
}
