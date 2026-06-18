"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { logAudit } from "../../lib/audit";

/* ───────── Evolução de sessão (SOAP) + escala clínica ───────── */

const evolutionSchema = z.object({
  patientId: z.string().min(1),
  subjetivo: z.string().max(4000).optional(),
  objetivo: z.string().max(4000).optional(),
  avaliacao: z.string().max(4000).optional(),
  plano: z.string().max(4000).optional(),
  // escala opcional aplicada na mesma sessão
  instrument: z.string().max(40).optional(),
  score: z.string().optional(),
  scoreMax: z.string().optional(),
});

export type RecordActionState = { ok: boolean; demo?: boolean; error?: string };

/** Monta o texto SOAP a partir das partes preenchidas. */
function soapContent(d: { subjetivo?: string; objetivo?: string; avaliacao?: string; plano?: string }): string {
  const parts: string[] = [];
  if (d.subjetivo?.trim()) parts.push(`S (relato): ${d.subjetivo.trim()}`);
  if (d.objetivo?.trim()) parts.push(`O (observação): ${d.objetivo.trim()}`);
  if (d.avaliacao?.trim()) parts.push(`A (avaliação): ${d.avaliacao.trim()}`);
  if (d.plano?.trim()) parts.push(`P (plano/conduta): ${d.plano.trim()}`);
  return parts.join("\n");
}

/** Registra uma evolução de sessão (e, opcionalmente, a escala aplicada). */
export async function addEvolution(_prev: RecordActionState, formData: FormData): Promise<RecordActionState> {
  const parsed = evolutionSchema.safeParse({
    patientId: formData.get("patientId"),
    subjetivo: formData.get("subjetivo") ?? undefined,
    objetivo: formData.get("objetivo") ?? undefined,
    avaliacao: formData.get("avaliacao") ?? undefined,
    plano: formData.get("plano") ?? undefined,
    instrument: formData.get("instrument") ?? undefined,
    score: formData.get("score") ?? undefined,
    scoreMax: formData.get("scoreMax") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const content = soapContent(d);
  if (!content) return { ok: false, error: "Preencha pelo menos um campo da evolução." };

  // escala (se informada)
  const score = d.score ? Number(d.score) : NaN;
  const maxScore = d.scoreMax ? Number(d.scoreMax) : NaN;
  const hasScale = Boolean(d.instrument) && Number.isFinite(score);
  if (d.instrument && !Number.isFinite(score)) return { ok: false, error: "Informe a pontuação da escala." };
  if (hasScale && (score < 0 || score > maxScore)) return { ok: false, error: `Pontuação deve ficar entre 0 e ${maxScore}.` };

  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.from("record_entries").insert({
    patient_id: d.patientId,
    kind: "EVOLUCAO",
    title: `Evolução de sessão — ${new Date().toLocaleDateString("pt-BR")}`,
    content,
  });
  if (error) return { ok: false, error: "Não foi possível salvar a evolução." };

  if (hasScale) {
    await supabase.from("clinical_scales").insert({
      patient_id: d.patientId,
      instrument: d.instrument,
      score,
      max_score: maxScore,
      applied_at: new Date().toISOString(),
    });
  }

  await logAudit("record.evolution", "record_entries", d.patientId, hasScale ? { instrument: d.instrument, score } : {});
  revalidatePath(`/pacientes/${d.patientId}`);
  return { ok: true };
}
