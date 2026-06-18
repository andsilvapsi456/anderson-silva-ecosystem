"use client";

import * as React from "react";

/** Alterna Light/Dark persistindo em localStorage; aplica data-theme no <html>. */
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const saved = (localStorage.getItem("as-theme") as "light" | "dark") ?? "light";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("as-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-sm transition-colors hover:border-[var(--accent)] cursor-pointer"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
