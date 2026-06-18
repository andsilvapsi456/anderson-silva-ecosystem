import { test } from "node:test";
import assert from "node:assert/strict";
import { splitInstallments } from "../apps/admin/lib/installments.ts";

test("divide 3x igual quando exato", () => {
  const p = splitInstallments(90000, 3, "2026-07-05");
  assert.equal(p.length, 3);
  assert.deepEqual(p.map((x) => x.amountCents), [30000, 30000, 30000]);
});

test("resto de centavos vai na 1ª parcela", () => {
  const p = splitInstallments(100000, 3, "2026-07-05"); // 100000/3 = 33333.33
  assert.equal(p[0].amountCents + p[1].amountCents + p[2].amountCents, 100000);
  assert.equal(p[0].amountCents, 33334);
  assert.equal(p[1].amountCents, 33333);
});

test("vencimentos avançam um mês a cada parcela", () => {
  const p = splitInstallments(60000, 3, "2026-07-05");
  assert.equal(p[0].dueDate, "2026-07-05");
  assert.equal(p[1].dueDate, "2026-08-05");
  assert.equal(p[2].dueDate, "2026-09-05");
});
