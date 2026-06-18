"use client";

import * as React from "react";
import { Button, Modal } from "@as/ui";
import { generateIntakeLink } from "../app/actions/intake";

/** Gera o link de cadastro e oferece copiar ou enviar pelo WhatsApp. */
export function IntakeLinkButton({
  patientId,
  patientFirstName,
  whatsapp,
}: {
  patientId: string;
  patientFirstName: string;
  whatsapp: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function generate() {
    const res = await generateIntakeLink(patientId);
    setUrl(res.url);
    setOpen(true);
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waMessage =
    `Olá, ${patientFirstName}! Que bom que vamos seguir juntos. ❤️\n\n` +
    `Para eu montar seu cadastro e prontuário, preencha seus dados neste link seguro (leva 2 minutinhos):\n${url}\n\n` +
    `Qualquer dúvida, me chama por aqui!`;

  return (
    <>
      <Button variant="secondary" onClick={generate}>
        🔗 Link de cadastro
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Link de cadastro do paciente">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-soft)]">
            Envie este link para {patientFirstName} preencher <strong>nascimento, CPF, RG, e-mail, CEP, endereço,
            naturalidade e o melhor dia para pagamento</strong>. Os dados entram direto no cadastro e no prontuário.
            Validade: <strong>7 dias</strong>.
          </p>
          <p className="break-all rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3 font-mono text-xs">{url}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy}>{copied ? "Copiado ✓" : "📋 Copiar link"}</Button>
            {whatsapp && url && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(waMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary">📱 Enviar pelo WhatsApp</Button>
              </a>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
