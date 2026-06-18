"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, type NavItem } from "@as/ui";

const nav: NavItem[] = [
  { href: "/", label: "Início", icon: "🏠" },
  { href: "/sessoes", label: "Sessões", icon: "📅" },
  { href: "/diario", label: "Diário", icon: "📔" },
  { href: "/pagamentos", label: "Pagamentos", icon: "💳" },
  { href: "/recibos", label: "Recibos", icon: "🧾" },
  { href: "/dados", label: "Meus dados", icon: "👤" },
];

export function PortalShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AppShell
      nav={nav}
      activeHref={pathname}
      userName={userName}
      userRole="Paciente"
      LinkComponent={Link}
      logoutHref="/auth/logout"
      logoSubtitle="Área do Paciente · CRP 06/166223"
    >
      {children}
    </AppShell>
  );
}
