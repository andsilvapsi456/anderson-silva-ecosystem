"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { formatBRL } from "@as/shared";
import { getPatient, getTransactions } from "../../lib/data";
import { getNotificationSettings } from "../../lib/notifications/settings";
import { composeBillingEmail, composeBillingText } from "../../lib/notifications/messages";
import { sendEmail } from "../../lib/notifications/mailer";
import { sendWhatsAppText } from "../../lib/notifications/whatsapp";
import { logAudit } from "../../lib/audit";
import { splitInstallments, type InstallmentPreview } from "../../lib/installments";

const PIX_KEY = process.env.PIX_KEY ?? "hello@andersonsilvapsicologo.com.br";

export type BillingActionState = { ok: boolean; demo?: boolean; error?: string; channels?: string[] };

/** "Cobrar agora": envia a mensagem acolhedora por e-mail e WhatsApp na hora. */
export async function sendChargeNow(transactionId: string): Promise<BillingActionState> {
  const tx = (await getTransactions()).find((t) => t.id === transactionId);
  if (!tx || !tx.patientId) return { ok: false, error: "Cobrança não encontrada." };

  const patient = await getPatient(tx.patientId);
  if (!patient) return { ok: false, error: "Paciente não encontrado." };

  const settings = await getNotificationSettings();
  const channels: string[] = [];

  if (settings.billingEmail && patient.email) {
    const { subject, html } = composeBillingEmail(tx, PIX_KEY);
    const r = await sendEmail(patient.email, subject, html);
    if (r.ok) channels.push("e-mail");
  }
  if (settings.billingWhatsapp && (patient.whatsapp || patient.phone)) {
    const r = await sendWhatsAppText(patient.whatsapp ?? patient.phone!, composeBillingText(tx, PIX_KEY));
    if (r.ok) channels.push("WhatsApp");
  }
  if (channels.length === 0) return { ok: false, error: "Paciente sem e-mail/WhatsApp ou canais desativados." };

  await logAudit("transaction.charge_now", "transactions", transactionId, { channels });
  return { ok: true, demo: isDemoMode(), channels };
}

/* ───────────── Parcelamento (renegociação de inadimplência) ───────────── */

const planSchema = z.object({
  transactionId: z.string().min(1),
  installments: z.number().int().min(2).max(12),
  firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notify: z.boolean(),
});

function composeInstallmentProposal(
  firstName: string,
  description: string,
  parcels: InstallmentPreview[]
): string {
  const lines = parcels
    .map((p) => `  ${p.number}ª — ${formatBRL(p.amountCents)} · vence ${new Date(`${p.dueDate}T12:00:00`).toLocaleDateString("pt-BR")}`)
    .join("\n");
  return (
    `Olá, ${firstName}! Tudo bem? 😊\n\n` +
    `Conforme conversamos, organizei o valor em aberto (${description.toLowerCase()}) ` +
    `em ${parcels.length} parcelas, para caber melhor no seu momento:\n\n${lines}\n\n` +
    `Você pode pagar cada parcela por PIX:\n🔑 ${PIX_KEY}\n\n` +
    `Combinado? Qualquer coisa, me chama — o mais importante é seguirmos com o seu cuidado em dia. ❤️\n\n` +
    `Um abraço,\nAnderson V. V. Silva · Psicólogo · CRP 06/166223`
  );
}

/**
 * Renegocia a cobrança atrasada: cancela a original e cria N parcelas
 * mensais (PENDENTE), opcionalmente enviando a proposta por e-mail/WhatsApp.
 */
export async function createInstallmentPlan(input: {
  transactionId: string;
  installments: number;
  firstDueDate: string;
  notify: boolean;
}): Promise<BillingActionState> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Verifique parcelas e data." };

  const tx = (await getTransactions()).find((t) => t.id === parsed.data.transactionId);
  if (!tx || !tx.patientId) return { ok: false, error: "Cobrança não encontrada." };
  const patient = await getPatient(tx.patientId);
  if (!patient) return { ok: false, error: "Paciente não encontrado." };

  const parcels = splitInstallments(tx.amountCents, parsed.data.installments, parsed.data.firstDueDate);

  if (!isDemoMode()) {
    const supabase = createServerSupabase(await cookies());
    const { error: insErr } = await supabase.from("transactions").insert(
      parcels.map((p) => ({
        patient_id: tx.patientId,
        kind: "RECEITA",
        status: "PENDENTE",
        description: `Parcela ${p.number}/${parcels.length} — ${tx.description}`,
        amount_cents: p.amountCents,
        due_date: p.dueDate,
        category: "renegociacao",
      }))
    );
    if (insErr) return { ok: false, error: "Não foi possível criar as parcelas." };
    await supabase.from("transactions").update({ status: "CANCELADO" }).eq("id", tx.id);
    await logAudit("transaction.installment_plan", "transactions", tx.id, {
      installments: parcels.length,
      firstDueDate: parsed.data.firstDueDate,
    });
  }

  const channels: string[] = [];
  if (parsed.data.notify) {
    const text = composeInstallmentProposal(patient.name.split(" ")[0], tx.description, parcels);
    if (patient.email) {
      const r = await sendEmail(
        patient.email,
        `Combinado de pagamento — ${parcels.length}x de ~${formatBRL(parcels[1]?.amountCents ?? parcels[0].amountCents)}`,
        `<p style="white-space:pre-line;line-height:1.7">${text}</p>`
      );
      if (r.ok) channels.push("e-mail");
    }
    if (patient.whatsapp || patient.phone) {
      const r = await sendWhatsAppText(patient.whatsapp ?? patient.phone!, text);
      if (r.ok) channels.push("WhatsApp");
    }
  }

  revalidatePath("/financeiro");
  revalidatePath("/");
  return { ok: true, demo: isDemoMode(), channels };
}
