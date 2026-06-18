/**
 * Recebe o formulário de cadastro do paciente (link tokenizado, sem login).
 * O token HMAC identifica o paciente; a gravação usa a SERVICE_ROLE_KEY no
 * servidor (a tabela patients não tem policy de update anônimo de propósito).
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyIntakeToken } from "@as/auth/intake";
import { isDemoMode } from "@as/auth";
import { DOC_TEMPLATES, clientIp, mockPatients, rateLimit } from "@as/shared";
import { textToPdf } from "@as/shared/pdf";
import { sendForSignature } from "../../../lib/autentique";

/** Preenche o contrato oficial com os dados do cadastro e envia ao Autentique. */
async function sendContract(patientName: string, cpf: string, email: string): Promise<boolean> {
  const template = DOC_TEMPLATES.find((t) => t.id === "contrato");
  if (!template) return false;

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const body = template.body
    .replace(/\{\{paciente\.nome\}\}/g, patientName)
    .replace(/\{\{paciente\.cpf\}\}/g, cpf)
    .replace(/\{\{valor_sessao\}\}/g, "R$ ____ (conforme combinado na primeira entrevista)")
    .replace(/\{\{data\.extenso\}\}/g, hoje);

  const pdf = textToPdf("Contrato de Prestação de Serviços – Psicologia", body);
  const result = await sendForSignature({
    fileName: `Contrato - ${patientName}.pdf`,
    pdf,
    signerName: patientName,
    signerEmail: email,
  });
  return result.ok;
}

const intakeSchema = z.object({
  token: z.string().min(10),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida"),
  cpf: z.string().min(11, "CPF inválido").max(20),
  rg: z.string().min(3, "RG inválido").max(20),
  email: z.string().email("E-mail inválido"),
  cep: z.string().min(8, "CEP inválido").max(10),
  address: z.string().min(5, "Informe o endereço completo").max(220),
  naturalidade: z.string().min(2, "Informe a naturalidade").max(80),
  billingDay: z.coerce.number().int().min(1).max(28),
  consent: z.literal(true, { errorMap: () => ({ message: "É necessário aceitar o contrato e a LGPD para continuar." }) }),
});

/** Registra o consentimento LGPD/teleatendimento (versão do contrato). */
async function recordConsent(patientId: string, ip: string | null) {
  for (const kind of ["tratamento_dados", "teleatendimento"]) {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/consents`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify({ patient_id: patientId, kind, version: "contrato-v1", ip_address: ip }),
    }).catch(() => {});
  }
}

export async function POST(request: Request) {
  if (!rateLimit(`intake:${clientIp(request)}`, 6, 60_000)) {
    return NextResponse.json({ ok: false, error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }
  const parsed = intakeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Verifique os campos." }, { status: 400 });
  }

  const verified = verifyIntakeToken(parsed.data.token);
  if (!verified) {
    return NextResponse.json({ ok: false, error: "Link inválido ou expirado. Peça um novo à clínica." }, { status: 401 });
  }

  const d = parsed.data;
  if (isDemoMode()) {
    console.info(`[DEMO] Cadastro recebido do paciente ${verified.patientId}:`, { ...d, token: "***" });
    const demoName = mockPatients.find((p) => p.id === verified.patientId)?.name ?? "Paciente";
    const contractSent = await sendContract(demoName, d.cpf, d.email);
    return NextResponse.json({ ok: true, demo: true, contractSent });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients?id=eq.${verified.patientId}`,
    {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        birth_date: d.birthDate,
        cpf: d.cpf,
        rg: d.rg,
        email: d.email,
        address_zip: d.cep,
        address_street: d.address,
        naturalidade: d.naturalidade,
        billing_day: d.billingDay,
      }),
    }
  );
  if (!res.ok) {
    console.error("Intake falhou:", await res.text());
    return NextResponse.json({ ok: false, error: "Não foi possível salvar. Tente novamente." }, { status: 502 });
  }

  // auditoria do preenchimento (ator = próprio paciente, via link)
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/audit_logs`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ action: "patient.intake_form", entity: "patients", entity_id: verified.patientId }),
  });

  // contrato oficial preenchido + assinatura digital (Autentique)
  const { data: rows } = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/patients?id=eq.${verified.patientId}&select=name,social_name`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  )
    .then(async (r) => ({ data: await r.json() }))
    .catch(() => ({ data: [] as any[] }));
  // registra o consentimento LGPD/teleatendimento (aceite do checkbox)
  await recordConsent(verified.patientId, clientIp(request));

  const patientName: string = rows?.[0]?.social_name ?? rows?.[0]?.name ?? "Paciente";
  const contractSent = await sendContract(patientName, d.cpf, d.email).catch((err) => {
    console.error("Contrato/Autentique falhou (cadastro salvo normalmente):", err);
    return false;
  });

  return NextResponse.json({ ok: true, contractSent });
}
