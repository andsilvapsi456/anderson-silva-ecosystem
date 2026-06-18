/** Regras de agenda — funções puras, testáveis (prevenção de conflito + disponibilidade). */

export interface TimeSlot {
  startsAt: string; // ISO
  endsAt: string; // ISO
  status?: string;
}

/** Dois intervalos se sobrepõem? (bordas que só se tocam NÃO conflitam) */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = new Date(aStart).getTime();
  const ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime();
  const be = new Date(bEnd).getTime();
  return as < be && bs < ae;
}

/** Encontra a primeira sessão existente que conflita (ignora canceladas). */
export function findConflict(
  startsAt: string,
  endsAt: string,
  existing: TimeSlot[]
): TimeSlot | null {
  for (const e of existing) {
    if (e.status === "CANCELADA") continue;
    if (overlaps(startsAt, endsAt, e.startsAt, e.endsAt)) return e;
  }
  return null;
}

/** Bloqueio de agenda (férias/folga/feriado/almoço) que cobre o intervalo. */
export function findBlock<T extends { startsAt: string; endsAt: string }>(
  startsAt: string,
  endsAt: string,
  blocks: T[]
): T | null {
  for (const b of blocks) {
    if (overlaps(startsAt, endsAt, b.startsAt, b.endsAt)) return b;
  }
  return null;
}

export interface WorkingHours {
  /** 0=domingo … 6=sábado → "HH:MM-HH:MM" ou null (não atende) */
  [weekday: number]: { open: string; close: string } | null;
}

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  0: null,
  1: { open: "08:00", close: "21:00" },
  2: { open: "08:00", close: "21:00" },
  3: { open: "08:00", close: "21:00" },
  4: { open: "08:00", close: "21:00" },
  5: { open: "08:00", close: "21:00" },
  6: { open: "08:00", close: "13:00" },
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** A sessão cabe dentro do horário de atendimento daquele dia? */
export function isWithinWorkingHours(startsAt: string, endsAt: string, hours: WorkingHours): boolean {
  const d = new Date(startsAt);
  const window = hours[d.getDay()];
  if (!window) return false;
  const startMin = d.getHours() * 60 + d.getMinutes();
  const e = new Date(endsAt);
  const endMin = e.getHours() * 60 + e.getMinutes();
  return startMin >= toMinutes(window.open) && endMin <= toMinutes(window.close);
}
