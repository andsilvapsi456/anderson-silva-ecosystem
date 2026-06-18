import { test } from "node:test";
import assert from "node:assert/strict";
import { valorPorExtenso } from "../packages/shared/src/extenso.ts";

test("valor inteiro: R$ 800,00", () => {
  assert.equal(valorPorExtenso(80000), "oitocentos reais");
});

test("um real", () => {
  assert.equal(valorPorExtenso(100), "um real");
});

test("com centavos", () => {
  assert.equal(valorPorExtenso(20050), "duzentos reais e cinquenta centavos");
});

test("só centavos", () => {
  assert.equal(valorPorExtenso(1), "um centavo");
});

test("milhar", () => {
  assert.equal(valorPorExtenso(120000), "mil e duzentos reais");
});

test("zero", () => {
  assert.equal(valorPorExtenso(0), "zero reais");
});
