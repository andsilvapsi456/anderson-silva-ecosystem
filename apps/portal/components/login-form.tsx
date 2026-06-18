"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button, Field, IconInput, Input, Select } from "@as/ui";

const labelCls = "block text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]";
import { resetPassword, signIn, type LoginState } from "../app/login/actions";
import { OAuthButtons } from "./oauth-buttons";

const initial: LoginState = {};

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

export function LoginForm({ demo = false }: { demo?: boolean }) {
  const [mode, setMode] = React.useState<"login" | "reset" | "verify" | "done">("login");
  const [state, action, pending] = useActionState(signIn, initial);
  const [channel, setChannel] = React.useState("email");
  const [contact, setContact] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const backToLogin = (
    <button
      type="button"
      onClick={() => {
        setMode("login");
        setMsg(null);
      }}
      className="block w-full text-center text-sm font-bold text-[var(--accent)] cursor-pointer"
    >
      ← Voltar ao login
    </button>
  );

  // etapa 1 — pedir link (e-mail) ou código (WhatsApp/SMS)
  async function sendRecovery(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const ch = String(fd.get("channel"));
    const ct = String(fd.get("contact"));
    setChannel(ch);
    setContact(ct);

    if (ch === "email") {
      await resetPassword({}, fd);
      setMsg("Se este e-mail estiver cadastrado, você receberá o link em instantes.");
      setBusy(false);
      return;
    }
    const r = await fetch("/api/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: ch, contact: ct }),
    }).then((x) => x.json()).catch(() => ({}));
    setBusy(false);
    setMode("verify");
    setMsg(r.demo && r.code ? `Modo demo: seu código é ${r.code}` : `Enviamos um código por ${ch === "sms" ? "SMS" : "WhatsApp"}.`);
  }

  // etapa 2 — validar código + nova senha
  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/recovery/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, contact, code: String(fd.get("code")), newPassword: String(fd.get("newPassword")) }),
    }).then((x) => x.json()).catch(() => ({ ok: false }));
    setBusy(false);
    if (r.ok) setMode("done");
    else setMsg(r.error ?? "Não foi possível redefinir. Tente novamente.");
  }

  if (mode === "done") {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-6 font-bold text-[var(--success)]">
          Senha redefinida! ✓
        </p>
        {backToLogin}
      </div>
    );
  }

  if (mode === "verify") {
    return (
      <form onSubmit={verifyCode} className="space-y-4">
        <p className="text-sm text-[var(--text-soft)]">Digite o código que você recebeu e crie sua nova senha.</p>
        {msg && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-4 py-3 text-sm font-semibold text-[var(--info)]">{msg}</p>
        )}
        <Field label="Código de 6 dígitos">
          <Input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required />
        </Field>
        <Field label="Nova senha">
          <Input name="newPassword" type="password" minLength={8} placeholder="mínimo 8 caracteres" required />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Redefinindo…" : "Redefinir senha"}
        </Button>
        {backToLogin}
      </form>
    );
  }

  if (mode === "reset") {
    return (
      <form onSubmit={sendRecovery} className="space-y-4">
        <p className="text-sm text-[var(--text-soft)]">
          Por onde você quer receber o link/código para criar uma nova senha?
        </p>
        <Field label="Canal de recuperação">
          <Select name="channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">📧 E-mail (link)</option>
            <option value="whatsapp">📱 WhatsApp (código)</option>
            <option value="sms">💬 SMS (código)</option>
          </Select>
        </Field>
        <Field label={channel === "email" ? "Seu e-mail" : "Seu telefone com DDD"}>
          <Input
            name="contact"
            type={channel === "email" ? "email" : "tel"}
            placeholder={channel === "email" ? "voce@email.com" : "(11) 9XXXX-XXXX"}
            required
          />
        </Field>
        {msg && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-4 py-3 text-sm font-semibold text-[var(--info)]">{msg}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Enviando…" : "Enviar recuperação"}
        </Button>
        {backToLogin}
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <OAuthButtons demo={demo} />
      <form action={action} className="space-y-4">
        <div>
          <label className={`${labelCls} mb-1.5`}>E-mail</label>
          <IconInput icon={MailIcon} name="email" type="email" placeholder="voce@email.com" autoComplete="email" required />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls}>Senha</label>
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="text-[11px] font-bold text-[var(--accent)] cursor-pointer hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
          <IconInput icon={LockIcon} name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
        </div>
        {state.error && <p className="text-sm font-semibold text-[var(--danger)]">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
        <p className="text-center text-xs text-[var(--text-soft)]">
          Primeiro acesso? Você recebe o convite por e-mail após o cadastro na clínica.
        </p>
      </form>
    </div>
  );
}
