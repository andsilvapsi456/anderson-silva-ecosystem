"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal, Textarea } from "@as/ui";
import type { Patient } from "@as/shared";
import { updatePatient, type PatientActionState } from "../app/actions/patients";

const initial: PatientActionState = { ok: false };

/** Editar o cadastro de um paciente existente (nome, contato, CPF, endereço…). */
export function EditPatientButton({ patient }: { patient: Patient }) {
  const [open, setOpen] = React.useState(false);
  const action = updatePatient.bind(null, patient.id);
  const [state, formAction, pending] = useActionState(action, initial);
  const router = useRouter();

  React.useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Editar cadastro
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar cadastro" maxWidth={640}>
        {state.ok ? (
          <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-6 text-center font-bold text-[var(--success)]">
            Cadastro atualizado{state.demo ? " (demo)" : ""} ✓
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <Field label="Nome completo *">
              <Input name="name" required defaultValue={patient.name} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp">
                <Input name="whatsapp" defaultValue={patient.whatsapp ?? ""} placeholder="(11) 9XXXX-XXXX" />
              </Field>
              <Field label="Telefone">
                <Input name="phone" defaultValue={patient.phone ?? ""} placeholder="(11) 9XXXX-XXXX" />
              </Field>
              <Field label="E-mail (login da Área do Paciente)">
                <Input name="email" type="email" defaultValue={patient.email ?? ""} />
              </Field>
              <Field label="CPF">
                <Input name="cpf" defaultValue={patient.cpf ?? ""} placeholder="000.000.000-00" />
              </Field>
              <Field label="Data de nascimento">
                <Input name="birthDate" type="date" defaultValue={patient.birthDate ?? ""} />
              </Field>
              <Field label="Responsável financeiro">
                <Input name="financialGuardian" defaultValue={patient.financialGuardian ?? ""} />
              </Field>
            </div>
            <Field label="Endereço">
              <Input name="address" defaultValue={patient.address ?? ""} placeholder="Rua, número — cidade/UF" />
            </Field>
            <Field label="Observações">
              <Textarea name="notes" className="min-h-20" defaultValue={patient.notes ?? ""} />
            </Field>
            {state.error && <p className="text-sm font-semibold text-[var(--danger)]">{state.error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
