import { test } from "node:test";
import assert from "node:assert/strict";
import { easterSunday, holidaysForYear, holidayOn } from "../packages/shared/src/holidays.ts";

test("Páscoa 2026 cai em 05/04 (validação do algoritmo)", () => {
  const e = easterSunday(2026);
  assert.equal(e.getMonth(), 3); // abril
  assert.equal(e.getDate(), 5);
});

test("feriados incluem nacional + SP estado + SP cidade", () => {
  const hs = holidaysForYear(2026);
  assert.ok(hs.some((h) => h.date === "2026-01-01" && h.scope === "nacional"));
  assert.ok(hs.some((h) => h.date === "2026-07-09" && h.scope === "estadual-sp"));
  assert.ok(hs.some((h) => h.date === "2026-01-25" && h.scope === "municipal-sp"));
  // Corpus Christi 2026 = Páscoa(05/04) + 60 = 04/06
  assert.ok(hs.some((h) => h.date === "2026-06-04" && /Corpus/.test(h.name)));
});

test("holidayOn detecta o Natal", () => {
  assert.equal(holidayOn("2026-12-25")?.name, "Natal");
  assert.equal(holidayOn("2026-12-26"), null);
});
