/**
 * Middleware de sessão Supabase (padrão SSR oficial):
 * renova o token a cada request e devolve o usuário autenticado.
 * Os apps decidem o que fazer (redirect, gate por papel etc.).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  // Quando o app injeta headers (ex.: nonce da CSP), eles precisam chegar ao
  // render do RSC via `request.headers` — por isso recriamos o next() com eles.
  const next = () =>
    requestHeaders ? NextResponse.next({ request: { headers: requestHeaders } }) : NextResponse.next({ request });
  let response = next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = next();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() valida o JWT no servidor do Supabase (nunca confiar só no cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
