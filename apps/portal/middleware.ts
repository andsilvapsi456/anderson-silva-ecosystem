import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@as/auth/middleware";
import { contentSecurityPolicy } from "@as/shared/security-headers";

const PUBLIC_PATHS = ["/login", "/auth", "/cadastro", "/api/intake"];
const dev = process.env.NODE_ENV !== "production";

/** Nonce por request (edge runtime: Web Crypto + btoa disponíveis). */
function makeNonce(): string {
  return btoa(crypto.randomUUID());
}

export async function middleware(request: NextRequest) {
  // CSP com nonce: o Next carimba o nonce nos próprios scripts e o
  // 'strict-dynamic' bloqueia qualquer script injetado (proteção XSS máxima).
  const nonce = makeNonce();
  const csp = contentSecurityPolicy({ profile: "app", dev, nonce });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const withCsp = (res: NextResponse) => {
    res.headers.set("content-security-policy", csp);
    return res;
  };

  // Modo demo: sem Supabase configurado, tudo é público — mas já com a CSP.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const { response, user } = await updateSession(request, requestHeaders);
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) return withCsp(NextResponse.redirect(new URL("/login", request.url)));
  if (user && pathname === "/login") return withCsp(NextResponse.redirect(new URL("/", request.url)));

  return withCsp(response);
}

export const config = {
  // tudo, exceto estáticos do Next e arquivos com extensão
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
