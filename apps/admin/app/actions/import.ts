"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { parseCsv, rowsToPatients, type ImportedPatient } from "@as/shared";
import { logAudit } from "../../lib/audit";

export interface ImportPreview {
  patients: ImportedPatient[];
  skipped: number;
  error?: string;
}

/** Lê o CSV e devolve a prévia (sem gravar) — para o usuário conferir. */
export async function previewImport(csvText: string): Promise<ImportPreview> {
  try {
    const { patients, skipped } = rowsToPatients(parseCsv(csvText));
    if (patients.length === 0) {
      return { patients: [], skipped, error: "Nenhum paciente reconhecido. Confira se há uma coluna 'Nome'." };
    }
    return { patients: patients.slice(0, 500), skipped };
  } catch {
    return { patients: [], skipped: 0, error: "Não consegui ler o arquivo. Exporte do PsicoManager como CSV." };
  }
}

export interface ImportResult {
  ok: boolean;
  demo?: boolean;
  imported: number;
  error?: string;
}

/** Importa de fato os pacientes (em massa). Demo: simula. */
export async function importPatients(csvText: string): Promise<ImportResult> {
  const { patients } = rowsToPatients(parseCsv(csvText));
  if (patients.length === 0) return { ok: false, imported: 0, error: "Nada para importar." };

  if (isDemoMode()) {
    console.info(`[DEMO] Importaria ${patients.length} paciente(s) do PsicoManager.`);
    return { ok: true, demo: true, imported: patients.length };
  }

  const supabase = createServerSupabase(await cookies());
  const rows = patients.map((p) => ({
    name: p.name,
    cpf: p.cpf || null,
    email: p.email || null,
    phone: p.phone || null,
    whatsapp: p.whatsapp || null,
    birth_date: p.birthDate || null,
    notes: p.notes ? `Importado do PsicoManager. ${p.notes}` : "Importado do PsicoManager.",
    active: true,
  }));

  // upsert por CPF evita duplicar quem já existe
  const { error } = await supabase.from("patients").upsert(rows, { onConflict: "cpf", ignoreDuplicates: true });
  if (error) return { ok: false, imported: 0, error: "Falha ao importar. Verifique o arquivo e tente de novo." };

  await logAudit("patients.import", "patients", null, { count: patients.length, source: "psicomanager" });
  revalidatePath("/pacientes");
  return { ok: true, imported: patients.length };
}
