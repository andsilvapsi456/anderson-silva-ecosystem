/**
 * Formatadores pt-BR usados em todo o ecossistema.
 * O runtime (Cloudflare Workers) roda em UTC — todo formato de data/hora
 * precisa fixar o fuso da clínica, senão saudação e horários saem errados.
 */

const TZ = "America/Sao_Paulo";

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} às ${formatTime(iso)}`;
}

/** Dia AAAA-MM-DD no fuso da clínica — para agrupar/comparar datas no servidor (UTC). */
export function spDayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Hora (0–23) no fuso da clínica para um instante qualquer. */
export function spHour(d: Date | string): number {
  const date = typeof d === "string" ? new Date(d) : d;
  return Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: TZ }).format(date)) % 24;
}

/**
 * O aniversário cai hoje? `birthDate` é "YYYY-MM-DD" (coluna DATE) e
 * `todayKey` vem de spDayKey(). Nascidos em 29/02 são celebrados em
 * 01/03 nos anos não bissextos.
 */
export function isBirthdayToday(birthDate: string | null | undefined, todayKey: string): boolean {
  if (!birthDate) return false;
  const bd = birthDate.slice(0, 10);
  if (bd.length < 10) return false;
  const birthMD = bd.slice(5);
  const todayMD = todayKey.slice(5);
  if (birthMD === todayMD) return true;
  if (birthMD === "02-29" && todayMD === "03-01") {
    const y = Number(todayKey.slice(0, 4));
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return !leap;
  }
  return false;
}

/** Saudação humanizada conforme horário (da clínica, não do servidor). */
export function greeting(name?: string): string {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: TZ }).format(new Date())
  );
  const period = h >= 5 && h < 12 ? "Bom dia" : h >= 12 && h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${period}, ${name.split(" ")[0]}!` : `${period}!`;
}
