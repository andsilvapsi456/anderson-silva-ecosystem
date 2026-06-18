/** Formatadores pt-BR usados em todo o ecossistema. */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} às ${formatTime(iso)}`;
}

/** Saudação humanizada conforme horário. */
export function greeting(name?: string): string {
  const h = new Date().getHours();
  const period = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return name ? `${period}, ${name.split(" ")[0]}!` : `${period}!`;
}
