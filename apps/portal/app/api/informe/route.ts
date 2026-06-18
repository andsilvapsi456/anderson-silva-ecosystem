/**
 * INFORME ANUAL DE PAGAMENTOS (IR) — o paciente baixa o próprio informe.
 * Reaproveita getMe()/getMyTransactions() (que já respeitam RLS e modo demo).
 */
import { NextResponse } from "next/server";
import { composeAnnualStatement, type AnnualStatementPayment } from "@as/shared";
import { textToPdf } from "@as/shared/pdf";
import { getMe, getMyTransactions } from "../../../lib/data";

export async function GET(request: Request) {
  const year = Number(new URL(request.url).searchParams.get("year")) || new Date().getFullYear();
  const me = await getMe();
  const payments: AnnualStatementPayment[] = (await getMyTransactions())
    .filter(
      (t) =>
        t.kind === "RECEITA" &&
        t.status === "PAGO" &&
        new Date(t.paidAt ?? t.dueDate).getFullYear() === year
    )
    .map((t) => ({ date: t.paidAt ?? t.dueDate, amountCents: t.amountCents, description: t.description }));

  if (payments.length === 0) {
    return NextResponse.json({ error: `Sem pagamentos registrados em ${year}.` }, { status: 404 });
  }

  const stmt = composeAnnualStatement({ year, patientName: me.name, patientCpf: me.cpf ?? "—", payments });
  const pdf = textToPdf(stmt.title, stmt.body);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-ir-${year}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
