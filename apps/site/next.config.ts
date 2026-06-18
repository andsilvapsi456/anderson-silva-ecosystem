import type { NextConfig } from "next";
import { buildSecurityHeaders } from "@as/shared/security-headers";

/** Site público: segurança + cache agressivo de assets (performance). */
const dev = process.env.NODE_ENV !== "production";
const securityHeaders = buildSecurityHeaders({ profile: "public", dev });

const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const config: NextConfig = {
  transpilePackages: ["@as/ui", "@as/shared", "@as/auth", "@as/design-system"],
  poweredByHeader: false,
  async redirects() {
    // /portal no domínio principal leva ao Portal do Paciente
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
    return [{ source: "/portal", destination: portal, permanent: false }];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // assets versionados (?v=) ou imutáveis por natureza → 1 ano de cache
      { source: "/brand/:path*", headers: immutable },
      { source: "/img/:path*", headers: immutable },
      { source: "/styles.css", headers: immutable },
      { source: "/site.js", headers: immutable },
      { source: "/lead-capture.js", headers: immutable },
    ];
  },
};

export default config;
