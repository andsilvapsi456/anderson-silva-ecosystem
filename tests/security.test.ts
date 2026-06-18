import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyMetaSignature } from "../packages/shared/src/webhook-signature.ts";
import { contentSecurityPolicy, buildSecurityHeaders } from "../packages/shared/src/security-headers.mjs";

// ── Assinatura de webhook (Meta/WhatsApp) ──
test("verifyMetaSignature: aceita assinatura correta", () => {
  const body = '{"entry":[{"id":"1"}]}';
  const secret = "app-secret-123";
  const header = "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
  assert.equal(verifyMetaSignature(body, header, secret), true);
});

test("verifyMetaSignature: rejeita corpo adulterado", () => {
  const secret = "app-secret-123";
  const header = "sha256=" + createHmac("sha256", secret).update('{"a":1}', "utf8").digest("hex");
  assert.equal(verifyMetaSignature('{"a":2}', header, secret), false);
});

test("verifyMetaSignature: rejeita header ausente ou segredo vazio", () => {
  assert.equal(verifyMetaSignature("{}", null, "s"), false);
  assert.equal(verifyMetaSignature("{}", "sha256=abc", ""), false);
});

// ── Content-Security-Policy ──
test("CSP app: trava clickjacking e objetos, sem eval em produção", () => {
  const csp = contentSecurityPolicy({ profile: "app", dev: false });
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /base-uri 'self'/);
  assert.ok(!csp.includes("unsafe-eval"), "produção não pode liberar unsafe-eval");
  assert.match(csp, /connect-src 'self' https:\/\/\*\.supabase\.co/);
});

test("CSP dev libera unsafe-eval (HMR do Next)", () => {
  assert.ok(contentSecurityPolicy({ profile: "app", dev: true }).includes("unsafe-eval"));
});

test("CSP com nonce: usa nonce + strict-dynamic e dropa unsafe-inline no script", () => {
  const csp = contentSecurityPolicy({ profile: "app", dev: false, nonce: "abc123" });
  assert.match(csp, /script-src 'self' 'nonce-abc123' 'strict-dynamic'/);
  assert.ok(!/script-src[^;]*unsafe-inline/.test(csp), "script-src não pode ter unsafe-inline com nonce");
});

test("buildSecurityHeaders csp:false omite a CSP (middleware assume)", () => {
  const keys = buildSecurityHeaders({ profile: "app", dev: false, csp: false }).map((h) => h.key);
  assert.ok(!keys.includes("Content-Security-Policy"));
  assert.ok(keys.includes("Strict-Transport-Security"), "demais headers continuam");
});

test("CSP public: permite Google Fonts e embed no próprio domínio", () => {
  const csp = contentSecurityPolicy({ profile: "public", dev: false });
  assert.match(csp, /frame-ancestors 'self'/);
  assert.match(csp, /style-src[^;]*fonts\.googleapis\.com/);
  assert.match(csp, /font-src[^;]*fonts\.gstatic\.com/);
});

test("buildSecurityHeaders: inclui CSP, COOP, HSTS preload e nosniff", () => {
  const keys = buildSecurityHeaders({ profile: "app", dev: false }).map((h) => h.key);
  for (const k of [
    "Content-Security-Policy",
    "Cross-Origin-Opener-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Permissions-Policy",
  ]) {
    assert.ok(keys.includes(k), `falta header ${k}`);
  }
  const hsts = buildSecurityHeaders({ profile: "app", dev: false }).find((h) => h.key === "Strict-Transport-Security");
  assert.match(hsts.value, /preload/);
});
