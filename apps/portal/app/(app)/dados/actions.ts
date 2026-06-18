"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";

const contactSchema = z.object({
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().max(200).optional(),
});

/** Paciente troca a própria foto (data URL ≤ ~150KB, já redimensionada no cliente). */
export async function updateMyPhoto(dataUrl: string): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > 200_000) {
    return { ok: false, error: "Imagem inválida ou grande demais." };
  }
  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("patients").update({ photo_url: dataUrl }).eq("profile_id", user!.id);
  if (error) return { ok: false, error: "Não foi possível salvar a foto." };
  revalidatePath("/dados");
  revalidatePath("/");
  return { ok: true };
}

/** Paciente edita os próprios contatos — a RLS garante o escopo no banco. */
export async function updateMyContact(formData: FormData) {
  const parsed = contactSchema.safeParse({
    phone: formData.get("phone") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
  });
  if (!parsed.success) redirect("/dados?erro=1");

  if (!isDemoMode()) {
    const supabase = createServerSupabase(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("patients")
      .update({
        phone: parsed.data.phone || null,
        whatsapp: parsed.data.whatsapp || null,
        email: parsed.data.email || null,
        address_street: parsed.data.address || null,
      })
      .eq("profile_id", user!.id);
  }

  revalidatePath("/dados");
  redirect("/dados?ok=1");
}
