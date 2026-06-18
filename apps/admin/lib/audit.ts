/** Trilha de auditoria — toda escrita sensível registra quem/o quê/quando. */
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | null,
  metadata?: Record<string, unknown>
) {
  if (isDemoMode()) return;
  const supabase = createServerSupabase(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    actor_id: user?.id ?? null,
    action,
    entity,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
}
