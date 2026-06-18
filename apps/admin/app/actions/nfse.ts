"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@as/auth";
import { getPatient, getTransactions } from "../../lib/data";
import { emitNfse, type NfseResult } from "../../lib/nfse";
import { logAudit } from "../../lib/audit";

/** Emite a NFS-e (Osasco) de uma cobrança paga. */
export async function emitNfseForTransaction(transactionId: string): Promise<NfseResult> {
  const tx = (await getTransactions()).find((t) => t.id === transactionId);
  if (!tx) return { ok: false, error: "Cobrança não encontrada." };
  if (tx.status !== "PAGO") return { ok: false, error: "A NFS-e só é emitida após o pagamento." };
  if (!tx.patientId) return { ok: false, error: "Cobrança sem paciente vinculado." };

  const patient = await getPatient(tx.patientId);
  if (!patient?.cpf) return { ok: false, error: "Cadastre o CPF do paciente para emitir a nota." };

  const result = await emitNfse({
    ref: tx.id,
    amountCents: tx.amountCents,
    description: `Serviços de psicologia — ${tx.description}`,
    tomador: { cpf: patient.cpf, nome: patient.name, email: patient.email },
  });

  if (result.ok && !isDemoMode()) {
    await logAudit("nfse.emit", "transactions", tx.id, { numero: result.numero, status: result.status });
    revalidatePath("/financeiro/nota-fiscal");
  }
  return result;
}
