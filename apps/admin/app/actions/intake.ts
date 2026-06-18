"use server";

import { signIntakeToken } from "@as/auth/intake";
import { logAudit } from "../../lib/audit";

/** Gera o link de cadastro do paciente (válido por 7 dias). */
export async function generateIntakeLink(patientId: string): Promise<{ url: string }> {
  const token = signIntakeToken(patientId, 7);
  const base = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
  await logAudit("patient.intake_link_generated", "patients", patientId);
  return { url: `${base}/cadastro/${token}` };
}
