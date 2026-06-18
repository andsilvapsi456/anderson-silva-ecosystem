"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";

const entrySchema = z
  .object({
    mood: z.coerce.number().int().min(1).max(5).nullable(),
    note: z.string().max(2000).transform((s) => s.trim() || null),
  })
  .refine((d) => d.mood !== null || d.note !== null, {
    message: "Escolha como você está se sentindo ou escreva uma anotação.",
  });

export type DiaryState = { ok: boolean; demo?: boolean; error?: string };

export async function saveDiaryEntry(_prev: DiaryState, formData: FormData): Promise<DiaryState> {
  const moodRaw = formData.get("mood");
  const parsed = entrySchema.safeParse({
    mood: moodRaw ? Number(moodRaw) : null,
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  if (isDemoMode()) return { ok: true, demo: true };

  // RLS garante: o paciente só insere no próprio diário
  const supabase = createServerSupabase(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("patients").select("id").eq("profile_id", user!.id).single();
  if (!me) return { ok: false, error: "Cadastro não encontrado." };

  const { error } = await supabase
    .from("diary_entries")
    .insert({ patient_id: me.id, mood: parsed.data.mood, note: parsed.data.note });
  if (error) return { ok: false, error: "Não foi possível salvar agora. Tente de novo." };

  revalidatePath("/diario");
  return { ok: true };
}
