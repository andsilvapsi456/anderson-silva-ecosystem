import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@as/auth";
import { clientIp, rateLimit } from "@as/shared";

const leadSchema = z.object({
  name: z.string().min(2).max(60),
  contact: z.string().min(5).max(80),
  message: z.string().max(600).optional().default(""),
  source: z.enum(["SITE", "WHATSAPP", "INSTAGRAM", "FACEBOOK"]).default("SITE"),
  page: z.string().max(120).optional(),
});

/**
 * CAPTURA AUTOMÁTICA DE LEADS — formulário do site → CRM.
 * O campo "contato" do site aceita WhatsApp OU e-mail; separamos aqui.
 * Usa a SERVICE_ROLE_KEY apenas no servidor; a tabela leads não tem
 * policy de insert anônimo de propósito.
 */
export async function POST(request: Request) {
  if (!rateLimit(`leads:${clientIp(request)}`, 6, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  let parsed;
  try {
    parsed = leadSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const { name, contact, message, source, page } = parsed.data;
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);

  const lead = {
    name,
    email: isEmail ? contact : null,
    phone: isEmail ? null : contact,
    message: message || null,
    source,
    stage: "NOVO",
    utm_campaign: page ?? null,
  };

  if (isDemoMode()) {
    console.info("[DEMO] Lead capturado:", lead);
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(lead),
  });

  if (!res.ok) {
    console.error("Falha ao criar lead:", await res.text());
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
