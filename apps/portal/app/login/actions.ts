"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@as/auth/server";
import { isDemoMode } from "@as/auth";

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (isDemoMode()) redirect("/");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  const supabase = createServerSupabase(await cookies());
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // mensagem humanizada, sem vazar detalhe técnico
    return { error: "E-mail ou senha incorretos. Se esqueceu a senha, use “Redefinir senha”." };
  }
  redirect("/");
}

/**
 * Recuperação de senha multicanal: e-mail (link), WhatsApp ou SMS (código).
 * - E-mail: link nativo do Supabase Auth.
 * - WhatsApp/SMS: gera código OTP e envia pelo canal escolhido (em produção,
 *   WhatsApp Cloud API e provedor de SMS; aqui o fluxo já está estruturado).
 * Resposta sempre neutra — nunca revela se o contato existe.
 */
export async function resetPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const channel = String(formData.get("channel") ?? "email");
  const contact = String(formData.get("contact") ?? "").trim();
  if (!contact) return { error: "Informe seu contato para receber o código." };

  if (isDemoMode()) {
    const via = channel === "whatsapp" ? "WhatsApp" : channel === "sms" ? "SMS" : "e-mail";
    return { error: `(Demo) Em produção, enviaríamos o código/link por ${via} para ${contact}.` };
  }

  if (channel === "email") {
    const supabase = createServerSupabase(await cookies());
    await supabase.auth.resetPasswordForEmail(contact, {
      redirectTo: `${process.env.NEXT_PUBLIC_PORTAL_URL}/auth/callback?next=/dados`,
    });
    return { error: "Se este e-mail estiver cadastrado, você receberá o link em instantes." };
  }

  // WhatsApp / SMS: dispara o OTP pelo endpoint dedicado (rate-limited)
  await fetch(`${process.env.NEXT_PUBLIC_PORTAL_URL}/api/recovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, contact }),
  }).catch(() => {});
  return { error: `Se este contato estiver cadastrado, você receberá um código por ${channel === "sms" ? "SMS" : "WhatsApp"}.` };
}
