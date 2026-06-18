import * as React from "react";

/** Logotipo tipográfico da marca. Variante "mark" mostra apenas o monograma. */
export function Logo({
  variant = "full",
  name = "Anderson V. V. Silva",
  subtitle,
}: {
  variant?: "full" | "mark";
  name?: string;
  subtitle?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background: "var(--accent)",
          color: "var(--on-accent)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: "-0.02em",
        }}
      >
        AS
      </span>
      {variant === "full" && (
        <span style={{ lineHeight: 1.1 }}>
          <span style={{ display: "block", fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            {name}
          </span>
          <span style={{ display: "block", fontSize: 11, color: "var(--text-soft)", fontWeight: 600 }}>
            {subtitle ?? "Psicólogo · CRP 06/166223"}
          </span>
        </span>
      )}
    </span>
  );
}
