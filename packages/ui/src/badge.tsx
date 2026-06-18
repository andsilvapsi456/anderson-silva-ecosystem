import * as React from "react";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--bg-alt)] text-[var(--text-soft)]",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  info: "bg-[var(--info-soft)] text-[var(--info)]",
};

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

/** Mapeia status de domínio → tom visual, para uso consistente nos três apps. */
export const statusTone: Record<string, BadgeTone> = {
  CONFIRMADA: "success",
  REALIZADA: "info",
  PENDENTE: "warning",
  CANCELADA: "neutral",
  FALTA: "danger",
  PAGO: "success",
  ATRASADO: "danger",
  CANCELADO: "neutral",
  NOVO: "accent",
  PRIMEIRO_CONTATO: "info",
  TRIAGEM: "warning",
  AGENDAMENTO: "accent",
  EM_ATENDIMENTO: "success",
  ALTA: "neutral",
  PERDIDO: "danger",
};

export const statusLabel: Record<string, string> = {
  CONFIRMADA: "Confirmada",
  REALIZADA: "Realizada",
  PENDENTE: "Pendente",
  CANCELADA: "Cancelada",
  FALTA: "Falta",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
  NOVO: "Novo lead",
  PRIMEIRO_CONTATO: "1º contato",
  TRIAGEM: "Triagem",
  AGENDAMENTO: "Agendamento",
  EM_ATENDIMENTO: "Em atendimento",
  ALTA: "Alta",
  PERDIDO: "Perdido",
  ONLINE: "Online",
  PRESENCIAL: "Presencial",
};
