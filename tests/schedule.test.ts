import { test } from "node:test";
import assert from "node:assert/strict";
import { overlaps, findConflict, findBlock, isWithinWorkingHours, DEFAULT_WORKING_HOURS } from "../packages/shared/src/schedule.ts";

const at = (h: number, m = 0) => {
  const d = new Date(2026, 5, 15, h, m, 0, 0); // 2026-06-15 (segunda)
  return d.toISOString();
};

test("overlaps: sessões que se cruzam conflitam", () => {
  assert.equal(overlaps(at(14), at(15), at(14, 30), at(15, 30)), true);
});

test("findBlock: detecta sessão caindo em bloqueio (ex.: almoço)", () => {
  const blocks = [{ title: "Almoço", startsAt: at(12), endsAt: at(13) }];
  assert.equal(findBlock(at(12, 30), at(13, 20), blocks)?.title, "Almoço");
  assert.equal(findBlock(at(14), at(15), blocks), null);
});

test("overlaps: bordas que só se tocam NÃO conflitam", () => {
  assert.equal(overlaps(at(14), at(15), at(15), at(16)), false);
});

test("overlaps: horários separados não conflitam", () => {
  assert.equal(overlaps(at(14), at(15), at(16), at(17)), false);
});

test("findConflict: detecta a sessão sobreposta", () => {
  const existing = [{ startsAt: at(16), endsAt: at(17), status: "CONFIRMADA" }];
  const c = findConflict(at(16, 30), at(17, 30), existing);
  assert.ok(c);
});

test("findConflict: ignora sessões canceladas", () => {
  const existing = [{ startsAt: at(16), endsAt: at(17), status: "CANCELADA" }];
  assert.equal(findConflict(at(16, 30), at(17, 30), existing), null);
});

test("isWithinWorkingHours: dentro do expediente (seg 14h)", () => {
  assert.equal(isWithinWorkingHours(at(14), at(14, 50), DEFAULT_WORKING_HOURS), true);
});

test("isWithinWorkingHours: fora do expediente (seg 23h)", () => {
  assert.equal(isWithinWorkingHours(at(23), at(23, 50), DEFAULT_WORKING_HOURS), false);
});

test("isWithinWorkingHours: domingo não atende", () => {
  const dom = new Date(2026, 5, 14, 14, 0).toISOString(); // domingo
  const domEnd = new Date(2026, 5, 14, 14, 50).toISOString();
  assert.equal(isWithinWorkingHours(dom, domEnd, DEFAULT_WORKING_HOURS), false);
});
