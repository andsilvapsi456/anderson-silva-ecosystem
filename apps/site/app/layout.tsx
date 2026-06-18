import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://andersonsilvapsicologo.com.br"),
  title: "Psicólogo Online | Anderson V. V. Silva · Terapia para adultos no Brasil e no exterior",
  description:
    "Terapia online com psicólogo CRP 06/166223 para adultos no Brasil e no exterior. Abordagem psicanalítica e experiência sólida em trauma e situações de violência. Agende uma conversa.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Anderson V. V. Silva · Psicólogo",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Atributos idênticos ao site original (tema "clean", cantos arredondados)
    <html lang="pt-BR" data-theme="clean" data-corners="round" data-pattern="off" className="js">
      <body>
        {/* CSS e fontes originais do site — React faz o hoist para o <head> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&family=Caveat:wght@600;700&display=swap"
        />
        <link rel="stylesheet" href="/styles.css?v=50" />
        {/* botão do portal: no mobile ele vive no menu, não no header.
            .nav a sem quebra + redesign do menu mobile (marca, pílulas, CTAs) */}
        <style>{`@media (max-width:880px){.portal-desktop{display:none}}
.nav a{white-space:nowrap}

/* ───── Menu mobile · redesign ───── */
.mobile-menu{padding:84px 22px 30px;gap:4px}
.mm-brand{margin:-26px 0 16px}
.mm-brand img{height:56px;width:auto}
.mobile-menu .logo-white{display:none}
[data-theme="dark"] .mobile-menu .logo-color{display:none}
[data-theme="dark"] .mobile-menu .logo-white{display:block}
.mobile-menu a:not(.btn){font-size:1.18rem;font-weight:700;padding:15px 16px;border-bottom:0;
  border-radius:14px;display:flex;align-items:center;justify-content:space-between;
  transition:background .2s,color .2s}
.mobile-menu a:not(.btn)::after{content:"\\203A";font-weight:800;font-size:1.15em;
  color:var(--border-strong);transition:color .2s,transform .2s}
/* hover/foco: item ganha cor da marca com leve deslize — animação suave */
.mobile-menu a:not(.btn):hover,.mobile-menu a:not(.btn):focus-visible{
  background:var(--accent-soft);color:var(--accent);transform:translateX(4px)}
.mobile-menu a:not(.btn):hover::after,.mobile-menu a:not(.btn):focus-visible::after{
  color:var(--accent);transform:translateX(4px)}
.mobile-menu a:not(.btn):active{background:var(--accent-soft);transform:scale(.99)}
.mobile-menu a.is-active{background:var(--accent-soft);color:var(--accent)}
.mobile-menu a.is-active::after{color:var(--accent);transform:translateX(2px)}
/* desktop: anima a navegação principal também */
.nav a{transition:color .2s,background .2s,transform .2s}
.nav a:hover{transform:translateY(-1px)}
.mm-cta-label{margin-top:auto;padding-top:26px;font-weight:800;font-size:1.05rem;line-height:1.3}
.mm-cta-label span{display:block;font-size:.8rem;font-weight:600;color:var(--text-soft);margin-top:2px}
.mobile-menu .mm-portal{margin-top:12px;background:transparent;border:2px solid var(--text);
  color:var(--text);font-weight:800;justify-content:center}
.mobile-menu .btn-primary{margin-top:10px}
.mobile-menu .btn{font-size:1.02rem;padding-inline:18px;gap:10px}
.mobile-menu .btn svg{width:20px;height:20px;flex:none}
.mm-foot{margin-top:16px;text-align:center;font-size:.72rem;font-weight:600;
  color:var(--text-soft);letter-spacing:.03em}
/* entrada em cascata */
.mobile-menu a,.mobile-menu .mm-cta-label,.mobile-menu .mm-foot{opacity:0;transform:translateY(10px)}
.mobile-menu.open a,.mobile-menu.open .mm-cta-label,.mobile-menu.open .mm-foot{
  opacity:1;transform:none;transition:opacity .35s var(--ease),transform .35s var(--ease),
  background .2s,color .2s}
.mobile-menu.open a:nth-of-type(2){transition-delay:.04s}
.mobile-menu.open a:nth-of-type(3){transition-delay:.08s}
.mobile-menu.open a:nth-of-type(4){transition-delay:.12s}
.mobile-menu.open a:nth-of-type(5){transition-delay:.16s}
.mobile-menu.open .mm-cta-label{transition-delay:.2s}
.mobile-menu.open .mm-portal{transition-delay:.24s}
.mobile-menu.open .btn-primary{transition-delay:.28s}
.mobile-menu.open .mm-foot{transition-delay:.32s}`}</style>

        {children}

        {/* comportamentos originais + captura de lead para o CRM */}
        <Script src="/site.js?v=1" strategy="afterInteractive" />
        <Script src="/lead-capture.js?v=1" strategy="afterInteractive" />
      </body>
    </html>
  );
}
