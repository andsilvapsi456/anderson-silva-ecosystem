"use client";

import * as React from "react";
import { Button, ButtonLink } from "@as/ui";

/**
 * Botão da teleconsulta: SEMPRE visível, mas o acesso só libera
 * 15 min antes do início (destrava sozinho, sem recarregar a página).
 * Janela: início−15min → fim+30min; depois disso não renderiza (sessão passada).
 */
export function SessionLinkButton({
  startsAt,
  endsAt,
  videoLink,
  size = "md",
}: {
  startsAt: string;
  endsAt: string;
  videoLink: string;
  size?: "sm" | "md" | "lg";
}) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const opensAt = new Date(startsAt).getTime() - 15 * 60_000;
  const closesAt = new Date(endsAt).getTime() + 30 * 60_000;

  if (now > closesAt) return null; // sessão encerrada

  if (now >= opensAt) {
    return (
      <ButtonLink href={videoLink} target="_blank" rel="noopener noreferrer" size={size}>
        Entrar na sessão →
      </ButtonLink>
    );
  }

  const opens = new Date(opensAt);
  const sameDay = opens.toDateString() === new Date(now).toDateString();
  const label = sameDay
    ? `libera às ${opens.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : "libera 15 min antes";

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <Button size={size} variant="secondary" disabled title={`O acesso ${label}`}>
        🔒 Entrar na sessão
      </Button>
      <span className="text-[11px] font-bold text-[var(--text-soft)]">{label}</span>
    </span>
  );
}
