"use client";

import * as React from "react";
import { Button, Field, Input, Select } from "@as/ui";

export function IntakeForm({ token }: { token: string }) {
  const [state, setState] = React.useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = React.useState<string>("");
  const [contractSent, setContractSent] = React.useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, token }),
    });
    const json = await res.json().catch(() => ({ ok: false }));
    if (json.ok) {
      setContractSent(Boolean(json.contractSent));
      setState("done");
    } else {
      setState("error");
      setError(json.error ?? "Não foi possível enviar. Tente novamente.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-[var(--radius)] bg-[var(--success-soft)] p-8 text-center">
        <p className="text-lg font-extrabold text-[var(--success)]">Cadastro enviado! ❤️</p>
        <p className="mt-2 text-sm text-[var(--text)]">
          Obrigado! Seus dados foram registrados com segurança e já estão no seu prontuário.
        </p>
        {contractSent && (
          <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--surface)] px-4 py-3 text-sm">
            ✍️ <strong>Próximo passo:</strong> você vai receber por e-mail o contrato terapêutico para{" "}
            <strong>assinatura digital</strong> (via Autentique). Leva 1 minutinho.
          </p>
        )}
        <p className="mt-3 text-sm text-[var(--text)]">Nos vemos na sessão. 😊</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data de nascimento *">
          <Input name="birthDate" type="date" required />
        </Field>
        <Field label="Naturalidade (cidade/UF) *">
          <Input name="naturalidade" placeholder="Ex.: São Paulo/SP" required />
        </Field>
        <Field label="CPF *">
          <Input name="cpf" placeholder="000.000.000-00" required />
        </Field>
        <Field label="RG *">
          <Input name="rg" required />
        </Field>
      </div>
      <Field label="E-mail *">
        <Input name="email" type="email" placeholder="voce@email.com" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="CEP *">
          <Input name="cep" placeholder="00000-000" required />
        </Field>
        <Field label="Endereço completo *">
          <Input name="address" placeholder="Rua, número, complemento — bairro, cidade/UF" required />
        </Field>
      </div>
      <Field label="Melhor dia para pagamento *">
        <Select name="billingDay" defaultValue="5" required>
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              dia {d}
            </option>
          ))}
        </Select>
      </Field>

      {/* Aceite obrigatório — o contrato (que inclui as cláusulas de LGPD e
          teleatendimento) é enviado para assinatura digital ao final */}
      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
        <span className="text-xs leading-relaxed text-[var(--text)]">
          Li e concordo com o <strong>contrato de prestação de serviços</strong> e com o{" "}
          <strong>tratamento dos meus dados conforme a LGPD</strong> (Lei nº 13.709/2018) e com o teleatendimento.
          Você receberá o contrato por e-mail para <strong>assinatura digital</strong>.
        </span>
      </label>

      {state === "error" && <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Aceitar e enviar meus dados"}
      </Button>
      <p className="text-xs text-[var(--text-soft)]">
        🔒 Seus dados são protegidos pelo sigilo profissional e pela LGPD — usados apenas para o seu prontuário e
        para a organização das sessões e pagamentos.
      </p>
    </form>
  );
}
