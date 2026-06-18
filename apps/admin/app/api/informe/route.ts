/**
 * INFORME ANUAL DE PAGAMENTOS (IR) — PDF gerado na hora.
 * O psicólogo baixa o informe de um paciente para um ano-calendário.
 * Soma as receitas PAGAS do paciente no ano e monta a declaração.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { composeAnnualStatement, mockPatients, mockTransactions, type AnnualStatementPayment } from "@as/shared";
import { textToPdf } from "@as/shared/pdf";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patient") ?? "";
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();

  let patientName = "";
  let patientCpf = "—";
  let payments: AnnualStatementPayment[] = [];

  if (isDemoMode()) {
    const p = mockPatients.find((x) => x.id === patientId) ?? mockPatients[0];
    patientName = p.name;
    patientCpf = p.cpf ?? "—";
    payments = mockTransactions
      .filter(
        (t) =>
          t.patientId === p.id &&
          t.kind === "RECEITA" &&
          t.status === "PAGO" &&
          new Date(t.paidAt ?? t.dueDate).getFullYear() === year
      )
      .map((t) => ({ date: t.paidAt ?? t.dueDate, amountCents: t.amountCents, description: t.description }));
  } else {
    const supabase = createServerSupabase(await cookies());
    const { data: patient } = await supabase
      .from("patients")
      .select("name, social_name, cpf")
      .eq("id", patientId)
      .maybeSingle();
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    patientName = (patient as any).social_name ?? patient.name;
    patientCpf = patient.cpf ?? "—";

    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const { data: txs } = await supabase
      .from("transactions")
      .select("amount_cents, description, paid_at, due_date")
      .eq("patient_id", patientId)
      .eq("kind", "RECEITA")
      .eq("status", "PAGO")
      .gte("paid_at", from)
      .lte("paid_at", to)
      .order("paid_at");
    payments = (txs ?? []).map((t: any) => ({
      date: t.paid_at ?? t.due_date,
      amountCents: t.amount_cents,
      description: t.description,
    }));
  }

  if (payments.length === 0) {
    return NextResponse.json({ error: `Sem pagamentos registrados em ${year} para este paciente.` }, { status: 404 });
  }

  const stmt = composeAnnualStatement({ year, patientName, patientCpf, payments });
  const pdf = textToPdf(stmt.title, stmt.body);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-ir-${year}-${patientName.split(" ")[0].toLowerCase()}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
