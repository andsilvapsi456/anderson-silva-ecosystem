/** Callback OAuth (Google/Facebook) e magic-link do Supabase. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@as/auth/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createServerSupabase(await cookies());
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, request.url));
}
