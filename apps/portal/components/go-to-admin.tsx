"use client";

import * as React from "react";

/** Redireciona no navegador para o painel admin (funciona entre domínios). */
export function GoToAdmin({ url }: { url: string }) {
  React.useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="text-center">
        <p className="text-sm text-[var(--text-soft)]">Levando você ao painel administrativo…</p>
        <a href={url} className="mt-3 inline-block text-sm font-bold text-[var(--accent)]">
          Clique aqui se não for automático →
        </a>
      </div>
    </main>
  );
}
