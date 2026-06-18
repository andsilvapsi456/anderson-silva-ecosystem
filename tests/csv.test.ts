import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, rowsToPatients, normalizeDate, detectDelimiter } from "../packages/shared/src/csv.ts";

test("detecta delimitador ; do Excel pt-BR", () => {
  assert.equal(detectDelimiter("Nome;CPF;Email"), ";");
  assert.equal(detectDelimiter("Nome,CPF,Email"), ",");
});

test("parseCsv: campos com aspas e vírgula interna", () => {
  const rows = parseCsv('Nome,Obs\n"Costa, Maria","veio, por indicação"');
  assert.deepEqual(rows[1], ["Costa, Maria", "veio, por indicação"]);
});

test("parseCsv: ignora BOM e linhas vazias", () => {
  const rows = parseCsv("﻿Nome,CPF\nMaria,123\n\n\nJoão,456\n");
  assert.equal(rows.length, 3);
});

test("normalizeDate: dd/mm/aaaa → aaaa-mm-dd", () => {
  assert.equal(normalizeDate("12/03/1990"), "1990-03-12");
  assert.equal(normalizeDate("1990-03-12"), "1990-03-12");
  assert.equal(normalizeDate("sem data"), undefined);
});

test("rowsToPatients: mapeia cabeçalhos do PsicoManager (com acento)", () => {
  const csv = "Nome;CPF;E-mail;Celular;Data de Nascimento\nMaria Silva;111;m@x.com;(11) 90000-0000;05/06/1988";
  const { patients, skipped } = rowsToPatients(parseCsv(csv));
  assert.equal(skipped, 0);
  assert.equal(patients.length, 1);
  assert.equal(patients[0].name, "Maria Silva");
  assert.equal(patients[0].email, "m@x.com");
  assert.equal(patients[0].whatsapp, "(11) 90000-0000");
  assert.equal(patients[0].birthDate, "1988-06-05");
});

test("rowsToPatients: pula linhas sem nome", () => {
  const csv = "Nome,CPF\nMaria,1\n,2\nJoão,3";
  const { patients, skipped } = rowsToPatients(parseCsv(csv));
  assert.equal(patients.length, 2);
  assert.equal(skipped, 1);
});
