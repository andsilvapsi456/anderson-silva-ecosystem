"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 " +
  "rounded-full cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--on-accent)] hover:bg-[var(--accent-hover)] shadow-[var(--shadow-sm)] hover:-translate-y-px",
  secondary:
    "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
  ghost: "bg-transparent text-[var(--text-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] hover:opacity-85",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px]",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-[15px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }: ButtonLinkProps) {
  return <a className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
