/**
 * Recuperação de senha por WhatsApp / SMS — etapa 2: VERIFICAR + trocar senha.
 * Confere o hash do código (não expirado, < 5 tentativas), consome-o e
 * redefine a senha do usuário (GoTrue admin, por telefone). Demo: aceita
 * qualquer código de 6 dígitos e responde ok (sem persistência).
 */
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { clientIp, rateLimit } from "@as/shared";
import { isDemoMode } from "@as/auth";

const schema = z.object({
  channel: z.enum(["whatsapp", "sms"]),
  contact: z.string().min(8).max(30),
  code: z.string().regex(/^\d{6}$/, "Código inválido"),
  newPassword: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const normalizePhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length <= 11 ? `55${d}` : d;
};
const svc = () => ({
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  "Content-Type": "application/json",
});

export async function POST(request: Request) {
  if (!rateLimit(`recovery-verify:${clientIp(request)}`, 6, 60_000)) {
    return NextResponse.json({ ok: false, error: "Muitas tentativas. Aguarde." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { contact, code, newPassword } = parsed.data;
  const phone = normalizePhone(contact);

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // busca o código válido mais recente
  const rows = await fetch(
    `${base}/rest/v1/recovery_codes?contact=eq.${phone}&consumed_at=is.null&expires_at=gt.${new Date().toISOString()}&order=created_at.desc&limit=1`,
    { headers: svc() }
  ).then((r) => r.json());
  const rec = Array.isArray(rows) ? rows[0] : null;
  if (!rec) return NextResponse.json({ ok: false, error: "Código expirado. Solicite um novo." }, { status: 400 });
  if (rec.attempts >= 5) return NextResponse.json({ ok: false, error: "Muitas tentativas. Solicite um novo código." }, { status: 429 });

  if (rec.code_hash !== sha256(code)) {
    await fetch(`${base}/rest/v1/recovery_codes?id=eq.${rec.id}`, {
      method: "PATCH",
      headers: { ...svc(), Prefer: "return=minimal" },
      body: JSON.stringify({ attempts: rec.attempts + 1 }),
    });
    return NextResponse.json({ ok: false, error: "Código incorreto." }, { status: 400 });
  }

  // acha o usuário pelo telefone e redefine a senha (GoTrue admin)
  const users = await fetch(`${base}/auth/v1/admin/users?per_page=1&phone=${phone}`, { headers: svc() })
    .then((r) => r.json())
    .catch(() => null);
  const userId = users?.users?.[0]?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Contato não encontrado." }, { status: 404 });

  const upd = await fetch(`${base}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: svc(),
    body: JSON.stringify({ password: newPassword }),
  });
  if (!upd.ok) return NextResponse.json({ ok: false, error: "Não foi possível redefinir a senha." }, { status: 502 });

  // consome o código
  await fetch(`${base}/rest/v1/recovery_codes?id=eq.${rec.id}`, {
    method: "PATCH",
    headers: { ...svc(), Prefer: "return=minimal" },
    body: JSON.stringify({ consumed_at: new Date().toISOString() }),
  });

  return NextResponse.json({ ok: true });
}
