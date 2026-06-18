"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input } from "@as/ui";
import { createBrowserSupabase } from "@as/auth/client";

type State =
  | { phase: "loading" }
  | { phase: "demo" }
  | { phase: "inactive" }
  | { phase: "enrolling"; factorId: string; qr: string; secret: string }
  | { phase: "active"; factorId: string }
  | { phase: "error"; message: string };

/**
 * Autenticação em dois fatores (TOTP) — Supabase MFA.
 * Ativa com QR code (Google Authenticator, 1Password, Authy…);
 * a partir daí o login exige o código de 6 dígitos (AAL2).
 */
export function MfaSetup({ demo }: { demo: boolean }) {
  const [state, setState] = React.useState<State>(demo ? { phase: "demo" } : { phase: "loading" });
  const [busy, setBusy] = React.useState(false);
  const supabase = React.useMemo(() => (demo ? null : createBrowserSupabase()), [demo]);

  const refresh = React.useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return setState({ phase: "error", message: "Faça login para gerenciar o 2FA." });
    const totp = data?.totp?.find((f) => f.status === "verified");
    setState(totp ? { phase: "active", factorId: totp.id } : { phase: "inactive" });
  }, [supabase]);

  React.useEffect(() => {
    if (!demo) refresh();
  }, [demo, refresh]);

  async function enroll() {
    if (!supabase) return;
    setBusy(true);
    // remove rascunhos não verificados antes de criar um novo
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "App autenticador" });
    setBusy(false);
    if (error || !data) return setState({ phase: "error", message: "Não foi possível iniciar o 2FA." });
    setState({ phase: "enrolling", factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || state.phase !== "enrolling") return;
    setBusy(true);
    const code = String(new FormData(e.currentTarget).get("code"));
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: state.factorId });
    if (!challenge) {
      setBusy(false);
      return setState({ phase: "error", message: "Falha no desafio 2FA." });
    }
    const { error } = await supabase.auth.mfa.verify({ factorId: state.factorId, challengeId: challenge.id, code });
    setBusy(false);
    if (error) return alert("Código inválido — confira o app e tente de novo.");
    refresh();
  }

  async function disable() {
    if (!supabase || state.phase !== "active") return;
    if (!confirm("Desativar o 2FA? Sua conta ficará protegida apenas pela senha.")) return;
    setBusy(true);
    await supabase.auth.mfa.unenroll({ factorId: state.factorId });
    setBusy(false);
    refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔐 Autenticação em dois fatores (2FA)</CardTitle>
        {state.phase === "active" && <Badge tone="success">Ativo</Badge>}
        {state.phase === "inactive" && <Badge tone="warning">Inativo</Badge>}
        {state.phase === "demo" && <Badge tone="info">Demo</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--text-soft)]">
          Mesmo que alguém descubra sua senha, não entra sem o código de 6 dígitos do seu celular. Essencial para
          quem guarda prontuários — funciona com Google Authenticator, 1Password, Authy etc.
        </p>

        {state.phase === "demo" && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-4 py-3 text-sm text-[var(--info)]">
            Disponível assim que o Supabase estiver conectado — o fluxo completo (QR code → código → login em duas
            etapas) já está implementado.
          </p>
        )}

        {state.phase === "loading" && <p className="text-sm text-[var(--text-soft)]">Carregando…</p>}
        {state.phase === "error" && <p className="text-sm font-semibold text-[var(--danger)]">{state.message}</p>}

        {state.phase === "inactive" && (
          <Button onClick={enroll} disabled={busy}>
            {busy ? "Gerando QR…" : "Ativar 2FA"}
          </Button>
        )}

        {state.phase === "enrolling" && (
          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <img
              src={state.qr}
              alt="QR code para o app autenticador"
              className="h-40 w-40 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-2"
            />
            <form onSubmit={verify} className="space-y-3">
              <p className="text-sm">
                1. Escaneie o QR no seu app autenticador
                <br />
                2. Digite o código de 6 dígitos para confirmar
              </p>
              <p className="break-all text-xs text-[var(--text-soft)]">
                Sem câmera? Chave manual: <code className="font-mono">{state.secret}</code>
              </p>
              <Field label="Código do app">
                <Input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? "Confirmando…" : "Confirmar e ativar"}
              </Button>
            </form>
          </div>
        )}

        {state.phase === "active" && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--success)]">
              ✓ Seu login exige senha + código do app (AAL2).
            </p>
            <Button variant="danger" size="sm" onClick={disable} disabled={busy}>
              Desativar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
