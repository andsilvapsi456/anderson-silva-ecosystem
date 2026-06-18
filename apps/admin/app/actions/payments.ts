"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { logAudit } from "../../lib/audit";

export type PaymentStatusTarget = "PAGO" | "PAGAR" | "ISENTO";

/**
 * Altera a situação de pagamento de uma sessão direto pelo painel.
 *  PAGO   → marca a cobrança como paga (paid_at = agora)
 *  PAGAR  → reabre como pendente
 *  ISENTO → cancela a cobrança vinculada (sessão social/isenta)
 * Procura primeiro a transação ligada à sessão; senão, a cobrança
 * aberta mais antiga do paciente.
 */
export async function setSessionPayment(
  appointmentId: string,
  patientId: string,
  target: PaymentStatusTarget
): Promise<{ ok: boolean; demo?: boolean; error?: string }> {
  if (isDemoMode()) return { ok: true, demo: true };

  const supabase = createServerSupabase(await cookies());

  let { data: tx } = await supabase
    .from("transactions")
    .select("id, status")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (!tx) {
    const { data } = await supabase
      .from("transactions")
      .select("id, status")
      .eq("patient_id", patientId)
      .eq("kind", "RECEITA")
      .in("status", ["PENDENTE", "ATRASADO"])
      .order("due_date")
      .limit(1)
      .maybeSingle();
    tx = data;
  }
  if (!tx) return { ok: false, error: "Nenhuma cobrança encontrada para esta sessão." };

  const update =
    target === "PAGO"
      ? { status: "PAGO", paid_at: new Date().toISOString() }
      : target === "PAGAR"
        ? { status: "PENDENTE", paid_at: null }
        : { status: "CANCELADO", paid_at: null };

  const { error } = await supabase.from("transactions").update(update).eq("id", tx.id);
  if (error) return { ok: false, error: "Não foi possível atualizar o pagamento." };

  // recibo oficial numerado (REC-AAAA-NNNN) na confirmação do pagamento
  if (target === "PAGO") {
    const { data: existing } = await supabase
      .from("receipts")
      .select("id")
      .eq("transaction_id", tx.id)
      .maybeSingle();
    if (!existing) {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from("receipts")
        .select("id", { count: "exact", head: true })
        .like("number", `REC-${year}-%`);
      const number = `REC-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
      await supabase.from("receipts").insert({ transaction_id: tx.id, number });
      await logAudit("receipt.issue", "receipts", tx.id, { number });
    }
  }

  await logAudit("transaction.set_status", "transactions", tx.id, { target, appointmentId });
  revalidatePath("/");
  revalidatePath("/financeiro");
  return { ok: true };
}
