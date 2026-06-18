"use client";

import * as React from "react";
import { createBrowserSupabase } from "@as/auth/client";

const G = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

const F = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
    <path fill="#1877F2" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z" />
  </svg>
);

const btn =
  "flex h-12 w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-sm font-bold text-[var(--text)] transition-colors hover:bg-[var(--bg-alt)] disabled:opacity-50 cursor-pointer";

/** Entrar com Google / Facebook via OAuth (Supabase). Em demo, avisa para configurar. */
export function OAuthButtons({ demo }: { demo: boolean }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function signIn(provider: "google" | "facebook") {
    if (demo) {
      setMsg("Login social disponível assim que o Supabase + OAuth forem conectados.");
      setTimeout(() => setMsg(null), 3500);
      return;
    }
    setBusy(provider);
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className={btn} disabled={busy !== null} onClick={() => signIn("google")}>
          {G} Google
        </button>
        <button type="button" className={btn} disabled={busy !== null} onClick={() => signIn("facebook")}>
          {F} Facebook
        </button>
      </div>
      {msg && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-3 py-2 text-xs font-semibold text-[var(--info)]">
          {msg}
        </p>
      )}
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs font-semibold text-[var(--text-soft)]">ou com e-mail</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
    </div>
  );
}
