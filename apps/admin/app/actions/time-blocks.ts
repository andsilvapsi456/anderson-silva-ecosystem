"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { logAudit } from "../../lib/audit";

const blockSchema = z.object({
  title: z.string().min(2, "Dê um nome ao bloqueio").max(80),
  kind: z.enum(["FERIAS", "FOLGA", "FERIADO", "ALMOCO", "OUTRO"]),
  start: z.string().min(10, "Informe o início"),
  end: z.string().min(10, "Informe o fim"),
});

export type TimeBlockActionState = { ok: boolean; demo?: boolean; error?: string };

/** Cria um bloqueio de agenda (férias/folga/feriado/almoço). */
export async function addTimeBlock(_prev: TimeBlockActionState, formData: FormData): Promise<TimeBlockActionState> {
  const parsed = blockSchema.safeParse({
    title: formData.get("title"),
    kind: formData.get("kind"),
    start: formData.get("start"),
    end: formData.get("end"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const startsAt = new Date(parsed.data.start);
  const endsAt = new Date(parsed.data.end);
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) return { ok: false, error: "Datas inválidas." };
  if (endsAt <= startsAt) return { ok: false, error: "O fim deve ser depois do início." };

  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.from("time_blocks").insert({
    title: parsed.data.title,
    kind: parsed.data.kind,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  if (error) return { ok: false, error: "Não foi possível salvar o bloqueio." };

  await logAudit("time_block.create", "time_blocks", null, { kind: parsed.data.kind });
  revalidatePath("/agenda");
  revalidatePath("/configuracoes");
  return { ok: true };
}

/* ───────── Preferências da agenda: almoço recorrente + feriados ───────── */

const prefsSchema = z.object({
  lunchEnabled: z.boolean(),
  lunchStart: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  lunchEnd: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  weekdays: z.array(z.number().int().min(0).max(6)),
  blockHolidays: z.boolean(),
});

export async function saveAgendaPrefs(input: {
  lunchEnabled: boolean;
  lunchStart: string;
  lunchEnd: string;
  weekdays: number[];
  blockHolidays: boolean;
}): Promise<TimeBlockActionState> {
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  if (parsed.data.lunchEnabled && parsed.data.lunchEnd <= parsed.data.lunchStart) {
    return { ok: false, error: "O fim do almoço deve ser depois do início." };
  }

  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase
    .from("clinic_settings")
    .update({
      lunch_enabled: parsed.data.lunchEnabled,
      lunch_start: parsed.data.lunchStart,
      lunch_end: parsed.data.lunchEnd,
      lunch_weekdays: parsed.data.weekdays,
      block_holidays: parsed.data.blockHolidays,
    })
    .eq("singleton", true);
  if (error) return { ok: false, error: "Não foi possível salvar as preferências." };

  await logAudit("agenda.prefs", "clinic_settings", null, parsed.data);
  revalidatePath("/agenda");
  revalidatePath("/configuracoes");
  return { ok: true };
}

/** Remove um bloqueio de agenda. */
export async function removeTimeBlock(id: string): Promise<TimeBlockActionState> {
  if (isDemoMode()) return { ok: true, demo: true };
  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.from("time_blocks").delete().eq("id", id);
  if (error) return { ok: false, error: "Não foi possível remover." };
  await logAudit("time_block.delete", "time_blocks", id);
  revalidatePath("/agenda");
  revalidatePath("/configuracoes");
  return { ok: true };
}
