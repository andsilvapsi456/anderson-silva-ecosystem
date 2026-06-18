import * as React from "react";

const fieldBase =
  "w-full bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] " +
  "rounded-[var(--radius-sm)] px-4 text-sm placeholder:text-[var(--text-soft)] " +
  "transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldBase} h-11 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldBase} py-3 min-h-28 resize-y ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldBase} h-11 ${className}`} {...props} />;
}

export function Label({ className = "", ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)] mb-1.5 ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Input com ícone à esquerda — usado nos formulários de login (campo preenchido). */
export function IconInput({
  icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="group relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] transition-colors group-focus-within:text-[var(--accent)]">
        {icon}
      </span>
      <input
        className={
          "h-12 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] pl-11 pr-4 " +
          "text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] transition-all " +
          "focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-soft)] " +
          className
        }
        {...props}
      />
    </div>
  );
}
