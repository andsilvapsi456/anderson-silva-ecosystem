/**
 * Headers de segurança HTTP — fonte única para os 3 apps (site/admin/portal).
 * Importado pelos next.config.ts (arquivo .mjs puro para não depender de
 * transpilação no carregamento da config).
 *
 * Perfis:
 *  • "public" → site institucional: permite Google Fonts e imagens externas
 *    (thumbnails do YouTube etc.); pode ser exibido em iframe do próprio domínio.
 *  • "app"    → admin/portal (dados clínicos sensíveis): trava tudo no próprio
 *    origin + Supabase; nunca pode ser embedado (clickjacking).
 *
 * CSP sem 'unsafe-eval' em produção (o Next só precisa de eval no dev/HMR).
 *
 * `nonce`: quando o middleware passa um nonce por request (admin/portal),
 * o script-src usa 'nonce-…' + 'strict-dynamic' e DROPA o 'unsafe-inline'
 * — só scripts assinados pelo Next rodam (proteção máxima contra XSS).
 */

/**
 * @param {{ profile: "public" | "app", dev?: boolean, nonce?: string }} opts
 * @returns {string} valor do header Content-Security-Policy
 */
export function contentSecurityPolicy({ profile, dev = false, nonce }) {
  const supabase = "https://*.supabase.co https://*.supabase.in wss://*.supabase.co";
  const devConnect = dev ? " ws://localhost:* http://localhost:*" : "";
  const scriptExtra = dev ? " 'unsafe-eval'" : ""; // HMR do Next precisa de eval só no dev
  // Com nonce: 'strict-dynamic' faz o browser ignorar 'unsafe-inline'/host-list e
  // confiar só nos scripts com o nonce (e nos que eles carregam). Sem nonce: fallback.
  const scriptSrc = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${scriptExtra}`
    : `script-src 'self' 'unsafe-inline'${scriptExtra}`;

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "upgrade-insecure-requests",
  ];

  if (profile === "app") {
    // painel/portal: zero embed, conexões só ao próprio origin + Supabase
    directives.push("frame-ancestors 'none'");
    directives.push("frame-src 'none'");
    directives.push(`connect-src 'self' ${supabase}${devConnect}`);
  } else {
    // site público: pode embedar no próprio domínio; embeds de vídeo previstos
    directives.push("frame-ancestors 'self'");
    directives.push("frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com");
    directives.push(`connect-src 'self'${devConnect}`);
  }

  return directives.join("; ");
}

/**
 * Conjunto completo de headers de segurança para o next.config.
 * `csp: false` → omite a CSP (quando o middleware a define por request, com nonce).
 * @param {{ profile: "public" | "app", dev?: boolean, csp?: boolean }} opts
 * @returns {{ key: string, value: string }[]}
 */
export function buildSecurityHeaders({ profile, dev = false, csp = true }) {
  return [
    ...(csp ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy({ profile, dev }) }] : []),
    // X-Frame-Options é redundante com frame-ancestors, mas cobre navegadores antigos
    { key: "X-Frame-Options", value: profile === "app" ? "DENY" : "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // sem câmera/mic/geo no próprio origin (a teleconsulta abre o Meet em outra aba);
    // interest-cohort=() opta por sair do rastreamento FLoC/Topics
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ];
}
