import { test } from "node:test";
import assert from "node:assert/strict";
import { signActionToken, verifyActionToken } from "../packages/auth/src/action-token.ts";
import { signIntakeToken, verifyIntakeToken } from "../packages/auth/src/intake.ts";

test("action token: round-trip confirmar", () => {
  const t = signActionToken("apt-1", "confirmar");
  assert.deepEqual(verifyActionToken(t), { appointmentId: "apt-1", action: "confirmar" });
});

test("action token: adulterado é rejeitado", () => {
  const t = signActionToken("apt-1", "cancelar");
  const tampered = t.slice(0, -3) + "xxx";
  assert.equal(verifyActionToken(tampered), null);
});

test("action token: lixo é rejeitado", () => {
  assert.equal(verifyActionToken("nao-e-token"), null);
});

test("intake token: round-trip", () => {
  const t = signIntakeToken("pat-1", 7);
  assert.deepEqual(verifyIntakeToken(t), { patientId: "pat-1" });
});

test("intake token: expirado é rejeitado", () => {
  const t = signIntakeToken("pat-1", -1); // já expirado
  assert.equal(verifyIntakeToken(t), null);
});

test("intake token: assinatura trocada é rejeitada", () => {
  const t = signIntakeToken("pat-1", 7);
  // troca o último caractere do payload base64url
  const broken = "X" + t.slice(1);
  assert.equal(verifyIntakeToken(broken), null);
});
