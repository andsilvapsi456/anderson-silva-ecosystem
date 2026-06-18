"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups: { title: string; items: { href: string; label: string; badge?: string }[] }[] = [
  {
    title: "Transações",
    items: [
      { href: "/financeiro", label: "Painel financeiro" },
      { href: "/financeiro/receitas", label: "Receitas" },
      { href: "/financeiro/despesas", label: "Despesas" },
      { href: "/financeiro/extrato", label: "Extrato" },
      { href: "/financeiro/fluxo", label: "Fluxo de caixa", badge: "Novo" },
    ],
  },
  {
    title: "Cobranças",
    items: [
      { href: "/financeiro/cobrancas", label: "Cobranças geradas" },
      { href: "/financeiro/configuracao-cobranca", label: "Configuração por cliente" },
    ],
  },
  {
    title: "Fiscal",
    items: [{ href: "/financeiro/nota-fiscal", label: "Nota fiscal & Receita Saúde" }],
  },
];

export function FinanceNav() {
  const pathname = usePathname();
  return (
    <nav className="w-full lg:w-56 shrink-0 space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-soft)]">
            {g.title}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--text-soft)] hover:bg-[var(--bg-alt)] hover:text-[var(--text)]"
                    }`}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--on-accent)]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
