"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, CommandPalette, type CommandItem, type NavItem } from "@as/ui";

const nav: NavItem[] = [
  { href: "/", label: "Início", icon: "📊" },
  { href: "/agenda", label: "Agenda", icon: "📅" },
  { href: "/pacientes", label: "Pacientes", icon: "❤️" },
  { href: "/financeiro", label: "Financeiro", icon: "💰" },
  { href: "/relatorios", label: "Relatórios", icon: "📈" },
  { href: "/documentos", label: "Documentos", icon: "📄" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function AdminShell({
  children,
  userName = "Anderson V. V. Silva",
  userRole = "Psicólogo · Admin",
  patients = [],
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  patients?: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  const items: CommandItem[] = [
    ...nav.map((n) => ({ label: n.label, href: n.href, icon: n.icon, hint: "Página" })),
    ...patients.map((p) => ({ label: p.name, href: `/pacientes/${p.id}`, icon: "🧑", hint: "Paciente" })),
  ];

  return (
    <>
      <AppShell
        nav={nav}
        activeHref={pathname}
        userName={userName}
        userRole={userRole}
        LinkComponent={Link}
        logoutHref="/auth/logout"
        logoSubtitle="Painel admin · CRP 06/166223"
        searchable
      >
        {children}
      </AppShell>
      <CommandPalette items={items} onNavigate={(href) => router.push(href)} />
    </>
  );
}
