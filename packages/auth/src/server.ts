/**
 * Cliente Supabase para Server Components / Server Actions / Route Handlers.
 * Uso: const supabase = await createServerSupabase(cookies);
 */
import { createServerClient } from "@supabase/ssr";

type CookieStore = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
};

export function createServerSupabase(cookieStore: CookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component sem permissão de escrita — middleware cuida do refresh
          }
        },
      },
    }
  );
}

/** Busca usuário autenticado + perfil/papel. Retorna null se não logado. */
export async function getSessionUser(cookieStore: CookieStore) {
  const supabase = createServerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return {
    id: profile.id as string,
    email: profile.email as string,
    name: profile.full_name as string,
    role: profile.role as "ADMIN" | "PSYCHOLOGIST" | "SECRETARY" | "COORDINATOR" | "PATIENT",
  };
}
