"use client";

import * as React from "react";
import { Button, Field, IconInput, Input } from "@as/ui";
import { createBrowserSupabase } from "@as/auth/client";
import { OAuthButtons } from "./oauth-buttons";

const labelCls = "block text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)] mb-1.5";
const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 6 9 7 9-7" />
  </svg>
);
const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/**
 * Login do painel com 2FA: senha → (se TOTP ativo) código do app
 * autenticador → sessão elevada a AAL2. Tudo via Supabase Auth.
 */
export function LoginForm({ demo = false }: { demo?: boolean }) {
  const [step, setStep] = React.useState<"creds" | "mfa">("creds");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const mfaRef = React.useRef<{ factorId: string; challengeId: string } | null>(null);
  // criação preguiçosa: evita instanciar o client no prerender (demo sem env)
  const clientRef = React.useRef<ReturnType<typeof createBrowserSupabase> | null>(null);
  const getClient = () => (clientRef.current ??= createBrowserSupabase());

  async function submitCreds(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (demo) {
      window.location.assign("/");
      return;
    }
    setBusy(true);
    setError("");
    const supabase = getClient();
    const fd = new FormData(e.currentTarget);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    if (signErr) {
      setBusy(false);
      setError("E-mail ou senha incorretos.");
      return;
    }
    // 2FA ativo? eleva a sessão para AAL2 antes de entrar
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp) {
        const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
        if (chErr || !challenge) {
          setBusy(false);
          setError("Não foi possível iniciar o 2FA. Tente novamente.");
          return;
        }
        mfaRef.current = { factorId: totp.id, challengeId: challenge.id };
        setStep("mfa");
        setBusy(false);
        return;
      }
    }
    window.location.assign("/");
  }

  async function submitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaRef.current) return;
    setBusy(true);
    setError("");
    const code = String(new FormData(e.currentTarget).get("code"));
    const { error: vErr } = await getClient().auth.mfa.verify({ ...mfaRef.current, code });
    if (vErr) {
      setBusy(false);
      setError("Código inválido ou expirado. Confira o app autenticador.");
      return;
    }
    window.location.assign("/");
  }

  if (step === "mfa") {
    return (
      <form onSubmit={submitCode} className="space-y-4">
        <p className="text-sm text-[var(--text-soft)]">
          🔐 Segunda etapa: digite o código de 6 dígitos do seu app autenticador.
        </p>
        <Field label="Código 2FA">
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            className="text-center text-2xl font-extrabold tracking-[0.4em]"
            autoFocus
            required
          />
        </Field>
        {error && <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Verificando…" : "Confirmar e entrar"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <OAuthButtons demo={demo} />
      <form onSubmit={submitCreds} className="space-y-4">
        <div>
          <label className={labelCls}>E-mail</label>
          <IconInput icon={MailIcon} name="email" type="email" placeholder="voce@clinica.com" autoComplete="email" required />
        </div>
        <div>
          <label className={labelCls}>Senha</label>
          <IconInput icon={LockIcon} name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
        </div>
        {error && <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Entrando…" : "Entrar no painel"}
        </Button>
      </form>
    </div>
  );
}
