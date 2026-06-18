/**
 * Parser de CSV — puro e testável. Lida com:
 *  • delimitador , ou ; (Excel pt-BR costuma usar ;)
 *  • campos entre aspas com vírgulas/quebras de linha
 *  • BOM do Excel
 * Usado para importar pacientes do PsicoManager (exportado como CSV).
 */

export function detectDelimiter(headerLine: string): "," | ";" {
  const semis = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semis > commas ? ";" : ",";
}

/** CSV → matriz de células (respeita aspas e o delimitador detectado). */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, ""); // remove BOM
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delim = detectDelimiter(firstLine);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } // aspas escapadas
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((x) => x.trim() !== "")) rows.push(row);
  }
  return rows;
}

export interface ImportedPatient {
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  birthDate?: string; // yyyy-mm-dd
  notes?: string;
}

/** Normaliza cabeçalhos variados do PsicoManager → campos do nosso sistema. */
const HEADER_MAP: Record<string, keyof ImportedPatient> = {
  nome: "name",
  paciente: "name",
  cliente: "name",
  "nome completo": "name",
  cpf: "cpf",
  email: "email",
  "e-mail": "email",
  telefone: "phone",
  celular: "whatsapp",
  whatsapp: "whatsapp",
  "data de nascimento": "birthDate",
  nascimento: "birthDate",
  "data nascimento": "birthDate",
  observacoes: "notes",
  observações: "notes",
  obs: "notes",
};

const norm = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Converte data dd/mm/aaaa (ou aaaa-mm-dd) → aaaa-mm-dd; senão devolve undefined. */
export function normalizeDate(v: string): string | undefined {
  const s = v.trim();
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  return undefined;
}

/** Matriz CSV → lista de pacientes (mapeando colunas pelos cabeçalhos). */
export function rowsToPatients(rows: string[][]): { patients: ImportedPatient[]; skipped: number } {
  if (rows.length < 2) return { patients: [], skipped: 0 };
  const headers = rows[0].map((h) => HEADER_MAP[norm(h)]);
  const patients: ImportedPatient[] = [];
  let skipped = 0;

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const p: ImportedPatient = { name: "" };
    headers.forEach((field, c) => {
      if (!field) return;
      const value = (cells[c] ?? "").trim();
      if (!value) return;
      if (field === "birthDate") p.birthDate = normalizeDate(value);
      else (p as any)[field] = value;
    });
    if (p.name.length >= 2) patients.push(p);
    else skipped++;
  }
  return { patients, skipped };
}
