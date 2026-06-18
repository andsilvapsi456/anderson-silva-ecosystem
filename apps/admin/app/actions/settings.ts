"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { logAudit } from "../../lib/audit";
import type { NotificationSettings } from "../../lib/notifications/settings";

const schema = z.object({
  dailyAgendaEnabled: z.boolean(),
  dailyAgendaHour: z.number().int().min(5).max(12),
  dailyAgendaEmail: z.string().email(),
  remind24hEmail: z.boolean(),
  remind24hWhatsapp: z.boolean(),
  remind2hEmail: z.boolean(),
  remind2hWhatsapp: z.boolean(),
  billingEmail: z.boolean(),
  billingWhatsapp: z.boolean(),
  billingRetryDays: z.number().int().min(1).max(30),
});

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  const parsed = schema.safeParse(settings);
  if (!parsed.success) return { ok: false, error: "Verifique os campos — e-mail e dias precisam ser válidos." };

  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const d = parsed.data;
  const { error } = await supabase.from("clinic_settings").upsert(
    {
      singleton: true,
      daily_agenda_enabled: d.dailyAgendaEnabled,
      daily_agenda_hour: d.dailyAgendaHour,
      daily_agenda_email: d.dailyAgendaEmail,
      remind_24h_email: d.remind24hEmail,
      remind_24h_whatsapp: d.remind24hWhatsapp,
      remind_2h_email: d.remind2hEmail,
      remind_2h_whatsapp: d.remind2hWhatsapp,
      billing_email: d.billingEmail,
      billing_whatsapp: d.billingWhatsapp,
      billing_retry_days: d.billingRetryDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "singleton" }
  );
  if (error) return { ok: false, error: "Não foi possível salvar as configurações." };

  await logAudit("clinic_settings.update", "clinic_settings", null);
  revalidatePath("/configuracoes");
  return { ok: true };
}
