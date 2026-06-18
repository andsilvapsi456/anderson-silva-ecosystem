/**
 * RECIBO OFICIAL EM PDF — gerado na hora a partir do template da marca.
 * O paciente só baixa os próprios recibos (RLS em modo real; demo usa mocks).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";
import { DOC_TEMPLATES, formatBRL, mockPatients, mockTransactions, valorPorExtenso } from "@as/shared";
import { textToPdf } from "@as/shared/pdf";

function composeReceipt(args: {
  numero: string;
  nome: string;
  cpf: string;
  amountCents: number;
  descricao: string;
  paidAt: string;
}): Buffer {
  const template = DOC_TEMPLATES.find((t) => t.id === "recibo")!;
  const dataExtenso = new Date(args.paidAt).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const body = template.body
    .replace(/\{\{recibo\.numero\}\}/g, args.numero)
    .replace(/\{\{paciente\.nome\}\}/g, args.nome)
    .replace(/\{\{paciente\.cpf\}\}/g, args.cpf)
    .replace(/\{\{valor\.extenso\}\}/g, valorPorExtenso(args.amountCents))
    .replace(/\{\{valor\}\}/g, formatBRL(args.amountCents))
    .replace(/\{\{cobranca\.descricao\}\}/g, args.descricao)
    .replace(/\{\{data\.extenso\}\}/g, dataExtenso);
  return textToPdf(`RECIBO ${args.numero}`, body);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let receipt: Parameters<typeof composeReceipt>[0] | null = null;

  if (isDemoMode()) {
    const tx = mockTransactions.find((t) => t.id === id && t.receiptNumber);
    const patient = tx ? mockPatients.find((p) => p.id === tx.patientId) : null;
    if (tx && patient) {
      receipt = {
        numero: tx.receiptNumber!,
        nome: patient.name,
        cpf: patient.cpf ?? "—",
        amountCents: tx.amountCents,
        descricao: tx.description,
        paidAt: tx.paidAt ?? tx.dueDate,
      };
    }
  } else {
    // RLS: a query só retorna se a transação for do paciente logado
    const supabase = createServerSupabase(await cookies());
    const { data } = await supabase
      .from("transactions")
      .select("amount_cents, description, paid_at, due_date, receipts(number), patients(name, social_name, cpf)")
      .eq("id", id)
      .maybeSingle();
    const r: any = data;
    if (r?.receipts?.number) {
      receipt = {
        numero: r.receipts.number,
        nome: r.patients?.social_name ?? r.patients?.name ?? "—",
        cpf: r.patients?.cpf ?? "—",
        amountCents: r.amount_cents,
        descricao: r.description,
        paidAt: r.paid_at ?? r.due_date,
      };
    }
  }

  if (!receipt) return NextResponse.json({ error: "Recibo não encontrado." }, { status: 404 });

  const pdf = composeReceipt(receipt);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${receipt.numero}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
