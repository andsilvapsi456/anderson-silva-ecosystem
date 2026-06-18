/** Valor monetário por extenso (pt-BR) — para recibos oficiais. */

const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ateNovecentos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const parts: string[] = [];
  if (c) parts.push(CENTENAS[c]);
  if (resto >= 10 && resto < 20) parts.push(DEZ_A_DEZENOVE[resto - 10]);
  else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    if (d) parts.push(DEZENAS[d]);
    if (u) parts.push(UNIDADES[u]);
  }
  return parts.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const groups: string[] = [];
  if (milhoes) groups.push(milhoes === 1 ? "um milhão" : `${ateNovecentos(milhoes)} milhões`);
  if (milhares) groups.push(milhares === 1 ? "mil" : `${ateNovecentos(milhares)} mil`);
  if (resto) groups.push(ateNovecentos(resto));
  if (groups.length === 1) return groups[0];
  // "e" antes do último grupo quando ele é < 100 ou centena redonda (200, 300…)
  const usaE = resto > 0 && (resto < 100 || resto % 100 === 0);
  const last = groups[groups.length - 1];
  return groups.slice(0, -1).join(" ") + (usaE ? " e " : " ") + last;
}

/** Ex.: 80000 → "oitocentos reais" · 20050 → "duzentos reais e cinquenta centavos" */
export function valorPorExtenso(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const parts: string[] = [];
  if (reais > 0) parts.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`);
  if (centavos > 0) parts.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  return parts.length ? parts.join(" e ") : "zero reais";
}
