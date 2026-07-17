/** Aniversário automático — matcher de data no fuso da clínica. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBirthdayToday } from "../packages/shared/src/format.ts";

test("bate quando mês e dia coincidem", () => {
  assert.equal(isBirthdayToday("1990-07-06", "2026-07-06"), true);
  assert.equal(isBirthdayToday("1985-12-25", "2026-12-25"), true);
});

test("não bate em outro dia", () => {
  assert.equal(isBirthdayToday("1990-07-06", "2026-07-07"), false);
  assert.equal(isBirthdayToday("1990-08-06", "2026-07-06"), false);
});

test("ignora nulos e formatos quebrados", () => {
  assert.equal(isBirthdayToday(null, "2026-07-06"), false);
  assert.equal(isBirthdayToday(undefined, "2026-07-06"), false);
  assert.equal(isBirthdayToday("", "2026-07-06"), false);
  assert.equal(isBirthdayToday("07-06", "2026-07-06"), false);
});

test("aceita timestamp completo na data de nascimento", () => {
  assert.equal(isBirthdayToday("1990-07-06T00:00:00.000Z", "2026-07-06"), true);
});

test("29/02: celebra em 01/03 nos anos não bissextos", () => {
  assert.equal(isBirthdayToday("1992-02-29", "2026-03-01"), true); // 2026 não é bissexto
  assert.equal(isBirthdayToday("1992-02-29", "2028-03-01"), false); // 2028 é bissexto…
  assert.equal(isBirthdayToday("1992-02-29", "2028-02-29"), true); // …celebra no dia exato
  assert.equal(isBirthdayToday("1990-03-01", "2026-03-01"), true); // nascido em 01/03 segue normal
});
