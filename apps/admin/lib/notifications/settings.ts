/** Configurações de notificações — linha única em clinic_settings. */
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { BRAND } from "@as/shared";

export interface NotificationSettings {
  dailyAgendaEnabled: boolean;
  dailyAgendaHour: number;
  dailyAgendaEmail: string;
  remind24hEmail: boolean;
  remind24hWhatsapp: boolean;
  remind2hEmail: boolean;
  remind2hWhatsapp: boolean;
  billingEmail: boolean;
  billingWhatsapp: boolean;
  billingRetryDays: number;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  dailyAgendaEnabled: true,
  dailyAgendaHour: 8,
  dailyAgendaEmail: BRAND.email,
  remind24hEmail: true,
  remind24hWhatsapp: true,
  remind2hEmail: false,
  remind2hWhatsapp: true,
  billingEmail: true,
  billingWhatsapp: true,
  billingRetryDays: 5,
};

/** Linha do banco → settings (compartilhado com a variante service dos crons). */
export function mapNotificationSettings(data: any): NotificationSettings {
  return {
    dailyAgendaEnabled: data.daily_agenda_enabled,
    dailyAgendaHour: data.daily_agenda_hour,
    dailyAgendaEmail: data.daily_agenda_email ?? BRAND.email,
    remind24hEmail: data.remind_24h_email,
    remind24hWhatsapp: data.remind_24h_whatsapp,
    remind2hEmail: data.remind_2h_email,
    remind2hWhatsapp: data.remind_2h_whatsapp,
    billingEmail: data.billing_email,
    billingWhatsapp: data.billing_whatsapp,
    billingRetryDays: data.billing_retry_days,
  };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (isDemoMode()) return DEFAULT_SETTINGS;

  const supabase = createServerSupabase(await cookies());
  const { data } = await supabase.from("clinic_settings").select("*").eq("singleton", true).maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return mapNotificationSettings(data);
}
