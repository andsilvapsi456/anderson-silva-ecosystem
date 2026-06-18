/**
 * Feriados do Brasil — nacionais + Estado de São Paulo + cidade de São Paulo.
 * Inclui os móveis (Sexta-feira Santa, Carnaval, Corpus Christi) calculados a
 * partir da Páscoa (algoritmo de Meeus/Jones/Butcher). Datas em horário local.
 */

export interface Holiday {
  date: string; // YYYY-MM-DD (local)
  name: string;
  scope: "nacional" | "estadual-sp" | "municipal-sp";
}

function ymd(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** Domingo de Páscoa (Gregoriano). */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=março, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/** Feriados (nacional + SP estado + SP cidade) de um ano. */
export function holidaysForYear(year: number): Holiday[] {
  const easter = easterSunday(year);
  const goodFriday = addDays(easter, -2);
  const carnivalTue = addDays(easter, -47);
  const carnivalMon = addDays(easter, -48);
  const corpusChristi = addDays(easter, 60);
  const iso = (d: Date) => ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());

  return [
    // ── Nacionais (fixos) ──
    { date: ymd(year, 1, 1), name: "Confraternização Universal", scope: "nacional" },
    { date: ymd(year, 4, 21), name: "Tiradentes", scope: "nacional" },
    { date: ymd(year, 5, 1), name: "Dia do Trabalho", scope: "nacional" },
    { date: ymd(year, 9, 7), name: "Independência do Brasil", scope: "nacional" },
    { date: ymd(year, 10, 12), name: "Nossa Senhora Aparecida", scope: "nacional" },
    { date: ymd(year, 11, 2), name: "Finados", scope: "nacional" },
    { date: ymd(year, 11, 15), name: "Proclamação da República", scope: "nacional" },
    { date: ymd(year, 11, 20), name: "Consciência Negra", scope: "nacional" },
    { date: ymd(year, 12, 25), name: "Natal", scope: "nacional" },
    // ── Nacionais (móveis) ──
    { date: iso(carnivalMon), name: "Carnaval (segunda)", scope: "nacional" },
    { date: iso(carnivalTue), name: "Carnaval", scope: "nacional" },
    { date: iso(goodFriday), name: "Sexta-feira Santa", scope: "nacional" },
    { date: iso(corpusChristi), name: "Corpus Christi", scope: "nacional" },
    // ── Estado de São Paulo ──
    { date: ymd(year, 7, 9), name: "Revolução Constitucionalista de 1932", scope: "estadual-sp" },
    // ── Cidade de São Paulo ──
    { date: ymd(year, 1, 25), name: "Aniversário da cidade de São Paulo", scope: "municipal-sp" },
  ];
}

/** Feriados que caem dentro do intervalo [from, to] (datas, ignora hora). */
export function holidaysInRange(from: Date, to: Date): Holiday[] {
  const years = new Set<number>();
  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) years.add(y);
  const fromYmd = ymd(from.getFullYear(), from.getMonth() + 1, from.getDate());
  const toYmd = ymd(to.getFullYear(), to.getMonth() + 1, to.getDate());
  return [...years]
    .flatMap(holidaysForYear)
    .filter((h) => h.date >= fromYmd && h.date <= toYmd)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** O dia (YYYY-MM-DD) é feriado? Retorna o nome ou null. */
export function holidayOn(dateYmd: string): Holiday | null {
  const year = Number(dateYmd.slice(0, 4));
  return holidaysForYear(year).find((h) => h.date === dateYmd) ?? null;
}
