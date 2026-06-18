"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { logAudit } from "../../lib/audit";

const patientSchema = z.object({
  name: z.string().min(2, "Informe o nome completo").max(120),
  socialName: z.string().max(120).optional(),
  cpf: z.string().max(20).optional(),
  rg: z.string().max(20).optional(),
  birthDate: z.string().optional(), // yyyy-mm-dd
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  address: z.string().max(200).optional(),
  financialGuardian: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  photoDataUrl: z
    .string()
    .max(200_000)
    .refine((s) => !s || s.startsWith("data:image/"), "Foto inválida")
    .optional(),
});

export type PatientActionState = { ok: boolean; demo?: boolean; error?: string; patientId?: string };

function parsePatient(formData: FormData) {
  return patientSchema.safeParse({
    name: formData.get("name"),
    socialName: formData.get("socialName") ?? "",
    cpf: formData.get("cpf") ?? "",
    rg: formData.get("rg") ?? "",
    birthDate: formData.get("birthDate") ?? "",
    phone: formData.get("phone") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    financialGuardian: formData.get("financialGuardian") ?? "",
    notes: formData.get("notes") ?? "",
    photoDataUrl: formData.get("photoDataUrl") ?? "",
  });
}

function toRow(d: z.infer<typeof patientSchema>) {
  return {
    name: d.name,
    social_name: d.socialName || null,
    cpf: d.cpf || null,
    rg: d.rg || null,
    birth_date: d.birthDate || null,
    phone: d.phone || null,
    whatsapp: d.whatsapp || null,
    email: d.email || null,
    address_street: d.address || null,
    financial_guardian: d.financialGuardian || null,
    notes: d.notes || null,
    photo_url: d.photoDataUrl || null,
  };
}

export async function createPatient(_prev: PatientActionState, formData: FormData): Promise<PatientActionState> {
  const parsed = parsePatient(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  if (isDemoMode()) return { ok: true, demo: true, patientId: "pat-1" }; // id demo p/ gerar o link

  const supabase = createServerSupabase(await cookies());
  const { data, error } = await supabase.from("patients").insert(toRow(parsed.data)).select("id").single();
  if (error) return { ok: false, error: "Não foi possível salvar. Verifique se o CPF já está cadastrado." };

  await logAudit("patient.create", "patients", data.id);
  revalidatePath("/pacientes");
  return { ok: true, patientId: data.id };
}

/**
 * Exclui um pré-cadastro — usado quando o paciente decide NÃO seguir.
 * Apaga o cadastro e o prontuário ainda vazio (LGPD: minimização de dados).
 */
export async function deletePatient(patientId: string): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  if (error) return { ok: false, error: "Não foi possível excluir o pré-cadastro." };

  await logAudit("patient.delete_precadastro", "patients", patientId);
  revalidatePath("/pacientes");
  return { ok: true };
}

/** Foto do prontuário — trocada pelo paciente no portal ou pela clínica aqui. */
export async function updatePatientPhoto(
  patientId: string,
  dataUrl: string
): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > 200_000) {
    return { ok: false, error: "Imagem inválida ou grande demais." };
  }
  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.from("patients").update({ photo_url: dataUrl }).eq("id", patientId);
  if (error) return { ok: false, error: "Não foi possível salvar a foto." };

  await logAudit("patient.update_photo", "patients", patientId);
  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/pacientes");
  return { ok: true };
}

export async function updatePatient(
  patientId: string,
  _prev: PatientActionState,
  formData: FormData
): Promise<PatientActionState> {
  const parsed = parsePatient(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.from("patients").update(toRow(parsed.data)).eq("id", patientId);
  if (error) return { ok: false, error: "Não foi possível atualizar o cadastro." };

  await logAudit("patient.update", "patients", patientId);
  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/pacientes");
  return { ok: true, patientId };
}
