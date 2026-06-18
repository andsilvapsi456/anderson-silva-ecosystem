import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Área do Paciente · Anderson Silva",
  description: "Portal do paciente da clínica Anderson Silva — sessões, pagamentos, recibos e mensagens.",
  robots: { index: false }, // área logada não deve ser indexada
};

// Render por request: aplica o nonce da CSP a cada página e evita que HTML
// autenticado fique em cache estático (boa prática de segurança).
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="light" suppressHydrationWarning>
      <body className={montserrat.variable}>{children}</body>
    </html>
  );
}
