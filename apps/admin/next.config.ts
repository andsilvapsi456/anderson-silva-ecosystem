import type { NextConfig } from "next";
import { buildSecurityHeaders } from "@as/shared/security-headers";

/** Painel administrativo (dados clínicos): CSP rígida + nunca embeda. */
const dev = process.env.NODE_ENV !== "production";

const config: NextConfig = {
  transpilePackages: ["@as/ui", "@as/shared", "@as/auth", "@as/design-system"],
  poweredByHeader: false,
  async headers() {
    // csp:false → a CSP (com nonce por request) é definida no middleware
    return [{ source: "/(.*)", headers: buildSecurityHeaders({ profile: "app", dev, csp: false }) }];
  },
};

export default config;
