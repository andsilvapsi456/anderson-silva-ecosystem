/** Constantes da marca — fonte única de verdade para os três apps.
 *  Alinhadas ao site real andersonsilvapsicologo.com.br. */

export const BRAND = {
  name: "Anderson Silva",
  fullName: "Anderson Victor Vieira Silva",
  title: "Psicólogo",
  crp: "CRP 06/166223",
  cpf: "440.820.918-07", // do prestador — aparece em recibos e informe de IR
  city: "Osasco/SP",
  tagline: "Se a terapia nunca deu certo antes, talvez faltasse o lugar certo.",
  positioning:
    "Psicoterapia online para adultos, no Brasil e no exterior. Escuta acolhedora e sem preconceitos, com experiência em trauma e situações de violência.",
  whatsapp: "5511992471876",
  whatsappDisplay: "(11) 99247-1876",
  email: "hello@andersonsilvapsicologo.com.br",
  instagram: "@andsilvapsi",
  instagramUrl: "https://www.instagram.com/andsilvapsi/",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://andersonsilvapsicologo.com.br",
  portalUrl: process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001",
  adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002",
  colors: {
    coral: "#FF5A5A",
    ink: "#202020",
    white: "#FFFFFF",
    gray50: "#F8F9FA",
    gray200: "#EAEAEA",
  },
} as const;

export function whatsappLink(text: string): string {
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
}
