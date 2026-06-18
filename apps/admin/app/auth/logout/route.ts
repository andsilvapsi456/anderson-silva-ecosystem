import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";

export async function GET(request: Request) {
  if (!isDemoMode()) {
    const supabase = createServerSupabase(await cookies());
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}
