/**
 * Gerador de PDF de texto — zero dependências.
 * Helvetica + WinAnsiEncoding (cobre acentos do pt-BR), múltiplas páginas,
 * quebra de linha automática. Suficiente para contratos e recibos enviados
 * ao Autentique; layout rico em PDF fica para a Fase 3 (papel timbrado).
 */

const PAGE_W = 595; // A4 em pontos
const PAGE_H = 842;
const MARGIN = 56;
const FONT_SIZE = 11;
const LEADING = 16;
const TITLE_SIZE = 14;
const MAX_CHARS = 88;
const LINES_PER_PAGE = Math.floor((PAGE_H - MARGIN * 2) / LEADING);

/** Pontuação tipográfica → posições do Windows-1252 (0x80–0x9F). */
const WIN1252: Record<number, number> = {
  0x20ac: 0x80, // €
  0x201a: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201e: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02c6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x2039: 0x8b, // ‹
  0x2018: 0x91, // ‘
  0x2019: 0x92, // ’
  0x201c: 0x93, // “
  0x201d: 0x94, // ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –  (en dash)
  0x2014: 0x97, // —  (em dash)
  0x02dc: 0x98, // ˜
  0x2122: 0x99, // ™
  0x203a: 0x9b, // ›
};

/** UTF-8 → bytes WinAnsi (Windows-1252). Mapeia travessões/aspas/reticências. */
function toLatin1(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    out[i] = c <= 0xff ? c : WIN1252[c] ?? 0x3f;
  }
  return out;
}

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string): { text: string; bold: boolean }[] {
  const lines: { text: string; bold: boolean }[] = [];
  for (const raw of text.split("\n")) {
    const bold = /^[0-9]+º|^[A-ZÀ-Ü –—·0-9]{8,}$/.test(raw.trim()); // títulos/cláusulas
    if (raw.trim() === "") {
      lines.push({ text: "", bold: false });
      continue;
    }
    let line = "";
    for (const word of raw.split(/\s+/)) {
      if ((line + " " + word).trim().length > MAX_CHARS) {
        lines.push({ text: line.trim(), bold });
        line = word;
      } else {
        line = `${line} ${word}`;
      }
    }
    if (line.trim()) lines.push({ text: line.trim(), bold });
  }
  return lines;
}

export function textToPdf(title: string, body: string): Buffer {
  const lines = wrap(body);
  const pages: { text: string; bold: boolean }[][] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let position = 0;
  const push = (s: string | Uint8Array) => {
    const bytes = typeof s === "string" ? toLatin1(s) : s;
    chunks.push(bytes);
    position += bytes.length;
  };
  const beginObj = (n: number) => {
    offsets[n] = position;
    push(`${n} 0 obj\n`);
  };

  const pageCount = pages.length;
  // objetos: 1 catálogo · 2 pages · 3 fonte · 4 fonte-bold · 5.. páginas/conteúdos
  const pageObj = (i: number) => 5 + i * 2;
  const contentObj = (i: number) => 6 + i * 2;

  push("%PDF-1.4\n");
  beginObj(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  beginObj(2);
  push(
    `<< /Type /Pages /Count ${pageCount} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] >>\nendobj\n`
  );
  beginObj(3);
  push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");
  beginObj(4);
  push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");

  pages.forEach((pageLines, i) => {
    beginObj(pageObj(i));
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj(i)} 0 R >>\nendobj\n`
    );

    let stream = "BT\n";
    let y = PAGE_H - MARGIN;
    if (i === 0) {
      stream += `/F2 ${TITLE_SIZE} Tf 1 0 0 1 ${MARGIN} ${y} Tm (${escapePdf(title)}) Tj\n`;
      y -= LEADING * 2;
    }
    for (const line of pageLines) {
      if (line.text) {
        stream += `/${line.bold ? "F2" : "F1"} ${FONT_SIZE} Tf 1 0 0 1 ${MARGIN} ${y} Tm (${escapePdf(line.text)}) Tj\n`;
      }
      y -= LEADING;
    }
    stream += `/F1 8 Tf 1 0 0 1 ${MARGIN} ${MARGIN / 2} Tm (Anderson V. V. Silva - Psicólogo - CRP 06/166223 - pág. ${i + 1}/${pageCount}) Tj\n`;
    stream += "ET";

    const streamBytes = toLatin1(stream);
    beginObj(contentObj(i));
    push(`<< /Length ${streamBytes.length} >>\nstream\n`);
    push(streamBytes);
    push("\nendstream\nendobj\n");
  });

  const totalObjs = 4 + pageCount * 2;
  const xrefAt = position;
  push(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let n = 1; n <= totalObjs; n++) {
    push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);

  return Buffer.concat(chunks);
}
