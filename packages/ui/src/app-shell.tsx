"use client";

import * as React from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Avatar } from "./avatar";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

function DoorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

/**
 * Casca de aplicação compartilhada entre Portal do Paciente e Painel Admin.
 * Sidebar fixa no desktop, barra inferior no mobile — mesma identidade do site.
 */
export function AppShell({
  nav,
  activeHref,
  userName,
  userRole,
  children,
  LinkComponent = "a" as any,
  logoutHref,
  logoSubtitle,
  searchable = false,
}: {
  nav: NavItem[];
  activeHref: string;
  userName: string;
  userRole: string;
  children: React.ReactNode;
  LinkComponent?: React.ElementType;
  /** rota de logout — renderizada como <a> puro (sem prefetch do next/link) */
  logoutHref?: string;
  /** subtítulo do logo (ex.: "Painel administrativo · CRP 06/166223") */
  logoSubtitle?: string;
  /** mostra o gatilho de busca global (⌘K) — o app deve montar <CommandPalette/> */
  searchable?: boolean;
}) {
  const Link = LinkComponent;
  const openSearch = () => window.dispatchEvent(new Event("open-command-palette"));
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <Logo subtitle={logoSubtitle} />
        </div>
        {searchable && (
          <div className="px-3 pt-3">
            <button
              onClick={openSearch}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-alt)] px-3 py-2 text-sm text-[var(--text-soft)] transition-colors hover:border-[var(--accent)] cursor-pointer"
            >
              <span aria-hidden>🔍</span>
              <span className="flex-1 text-left">Buscar…</span>
              <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-bold">⌘K</kbd>
            </button>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map((item) => {
            const active = activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-soft)] hover:bg-[var(--bg-alt)] hover:text-[var(--text)]"
                }`}
              >
                <span aria-hidden className="w-5 text-center">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-3 px-1">
            <Avatar name={userName} size={38} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{userName}</p>
              <p className="text-[11px] text-[var(--text-soft)] font-semibold uppercase tracking-wide">{userRole}</p>
            </div>
            <span className="ml-auto">
              <ThemeToggle />
            </span>
          </div>
          {logoutHref && (
            <a
              href={logoutHref}
              className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm font-bold text-[var(--text-soft)] transition-colors hover:border-[var(--danger)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
            >
              <DoorIcon /> Sair do sistema
            </a>
          )}
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar mobile */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <Logo subtitle={logoSubtitle} />
          <span className="flex items-center gap-2">
            {searchable && (
              <button
                onClick={openSearch}
                aria-label="Buscar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--text-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                🔍
              </button>
            )}
            <ThemeToggle />
            {logoutHref && (
              <a
                href={logoutHref}
                aria-label="Sair do sistema"
                title="Sair"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] text-[var(--text-soft)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)]"
              >
                <DoorIcon />
              </a>
            )}
          </span>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Tab bar mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex border-t border-[var(--border)] bg-[var(--surface)]">
          {nav.slice(0, 5).map((item) => {
            const active = activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${
                  active ? "text-[var(--accent)]" : "text-[var(--text-soft)]"
                }`}
              >
                <span aria-hidden className="text-base">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/** Cabeçalho de página padrão dentro do AppShell. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-soft)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
