"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Field, Input, Modal, Textarea } from "@as/ui";
import { createPatient, deletePatient, type PatientActionState } from "../app/actions/patients";
import { generateIntakeLink } from "../app/actions/intake";

const initial: PatientActionState = { ok: false };

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  await new Promise((ok, err) => ((img.onload = ok), (img.onerror = err)));
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const side = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  URL.revokeObjectURL(img.src);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * "+ Novo paciente": faz o PRÉ-CADASTRO (Salvar). Depois, em um passo
 * separado, você decide GERAR O LINK (se a pessoa quer seguir) ou
 * EXCLUIR o pré-cadastro (se ela desistir) — minimizando dados (LGPD).
 */
export function NewPatientButton() {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(createPatient, initial);
  const [photo, setPhoto] = React.useState<string>("");
  const [name, setName] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [intakeUrl, setIntakeUrl] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);
  const photoInput = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) setPhoto(await fileToAvatarDataUrl(file));
  }

  function reset() {
    setIntakeUrl(null);
    setPhoto("");
    setName("");
    setWhatsapp("");
    setDeleted(false);
  }
  function close() {
    setOpen(false);
    reset();
    router.refresh();
  }

  async function genLink() {
    if (!state.patientId) return;
    setGenerating(true);
    const r = await generateIntakeLink(state.patientId);
    setIntakeUrl(r.url);
    setGenerating(false);
  }

  async function removePre() {
    if (!state.patientId) return;
    if (!confirm("Excluir este pré-cadastro? Os dados serão apagados.")) return;
    await deletePatient(state.patientId);
    setDeleted(true);
    setTimeout(close, 1200);
  }

  const firstName = name.trim().split(" ")[0] || "paciente";
  const waMessage =
    `Olá, ${firstName}! Que bom que vamos seguir juntos. ❤️\n\n` +
    `Para eu montar seu cadastro e prontuário, preencha seus dados neste link seguro (leva 2 minutinhos):\n${intakeUrl}\n\n` +
    `Ao final, você recebe o contrato por e-mail para assinatura digital. Qualquer dúvida, me chama!`;

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Novo paciente</Button>
      <Modal open={open} onClose={close} title="Novo paciente" maxWidth={640}>
        {deleted ? (
          <p className="rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-6 text-center font-bold">
            Pré-cadastro excluído. 🗑️
          </p>
        ) : state.ok ? (
          <div className="space-y-4">
            <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-4 text-center font-bold text-[var(--success)]">
              Pré-cadastro de {firstName} salvo! {state.demo ? "(demo)" : "✨"}
            </p>

            {!intakeUrl ? (
              <>
                <p className="text-sm text-[var(--text-soft)]">
                  E agora? Se {firstName} decidiu seguir, <strong>gere o link de cadastro</strong> para ele completar
                  os dados. Se desistiu, você pode <strong>excluir o pré-cadastro</strong> — nada fica guardado.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={genLink} disabled={generating}>
                    {generating ? "Gerando…" : "🔗 Gerar link de cadastro"}
                  </Button>
                  <Button variant="danger" onClick={removePre}>
                    🗑️ Excluir pré-cadastro
                  </Button>
                  <Button variant="ghost" onClick={close}>
                    Deixar pendente
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-soft)]">
                  Envie o link para {firstName} preencher <strong>nascimento, CPF, RG, e-mail, CEP, endereço,
                  naturalidade e o melhor dia de pagamento</strong>. Ao final, o <strong>contrato vai para assinatura
                  (Autentique)</strong>. Validade: 7 dias.
                </p>
                <p className="break-all rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3 font-mono text-xs">
                  {intakeUrl}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(intakeUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? "Copiado ✓" : "📋 Copiar link"}
                  </Button>
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(waMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary">📱 Enviar pelo WhatsApp</Button>
                    </a>
                  )}
                  <Button variant="ghost" onClick={close}>
                    Concluir
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => photoInput.current?.click()}
                className="relative shrink-0 cursor-pointer rounded-full"
                aria-label="Adicionar foto"
                title="Adicionar foto"
              >
                <Avatar name={name || "?"} size={64} src={photo || null} />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[11px] shadow-[var(--shadow-sm)]">
                  📷
                </span>
              </button>
              <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              <input type="hidden" name="photoDataUrl" value={photo} />
              <div className="flex-1">
                <Field label="Nome completo *">
                  <Input name="name" required placeholder="Nome civil" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome social">
                <Input name="socialName" placeholder="Como prefere ser chamado(a/e)" />
              </Field>
              <Field label="WhatsApp *">
                <Input
                  name="whatsapp"
                  placeholder="(11) 9XXXX-XXXX"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </Field>
              <Field label="Telefone">
                <Input name="phone" placeholder="(11) 9XXXX-XXXX" />
              </Field>
              <Field label="E-mail">
                <Input name="email" type="email" placeholder="Será o login da Área do Paciente" />
              </Field>
            </div>
            <p className="rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-3 py-2 text-xs text-[var(--info)]">
              ✉️ O e-mail informado será o <strong>login do paciente</strong> na Área do Paciente.
            </p>
            <Field label="Responsável financeiro">
              <Input name="financialGuardian" placeholder="Deixe vazio se for o próprio paciente" />
            </Field>
            <Field label="Observações">
              <Textarea name="notes" className="min-h-20" placeholder="Preferências de horário, contexto inicial…" />
            </Field>
            <p className="text-xs text-[var(--text-soft)]">
              💡 Os demais dados (nascimento, CPF, RG, endereço, dia de pagamento) o próprio paciente preenche pelo
              <strong> link de cadastro</strong> — que você gera depois de salvar, só se ele decidir seguir.
            </p>
            {state.error && <p className="text-sm font-semibold text-[var(--danger)]">{state.error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar pré-cadastro"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
