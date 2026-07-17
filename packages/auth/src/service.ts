/**
 * Cliente Supabase com SERVICE ROLE — exclusivo para CRONS e rotas de
 * sistema (sem usuário logado). A RLS exige is_staff(); sem sessão, a
 * chave anon devolve zero linhas — por isso os jobs usam esta chave.
 * NUNCA importar em página/componente: ela ignora a RLS.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
