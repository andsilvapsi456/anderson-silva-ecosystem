"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Field, Input, Modal, Segmented, Select } from "@as/ui";
import { DEFAULT_LUNCH, type Holiday, type LunchConfig, type TimeBlock } from "@as/shared";
import { createAppointment, type AppointmentActionState } from "../app/actions/appointments";
import { AgendaBlocksManager } from "./agenda-blocks-manager";

export interface PatientOption {
  id: string;
  name: string;
}

const initialState: AppointmentActionState = { ok: false };

/**
 * Toolbar da agenda: "+ Agendar sessão" (modal completo) e menu ⚙ com
 * bloqueio de horários, integração Google, impressão e configurações.
 */
export function AgendaToolbar({
  patients,
  blocks = [],
  lunch = DEFAULT_LUNCH,
  blockHolidays = true,
  holidays = [],
}: {
  patients: PatientOption[];
  blocks?: TimeBlock[];
  lunch?: LunchConfig;
  blockHolidays?: boolean;
  holidays?: Holiday[];
}) {
  const [open, setOpen] = React.useState(false);
  const [blocksOpen, setBlocksOpen] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);
  const [googleConnected, setGoogleConnected] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const [kind, setKind] = React.useState("Individual");
  const [recurrence, setRecurrence] = React.useState("semanal");
  const [mode, setMode] = React.useState("online");

  const [state, formAction, pending] = useActionState(createAppointment, initialState);
  const router = useRouter();

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  React.useEffect(() => {
    if (state.ok) {
      const t = setTimeout(() => {
        setOpen(false);
        notify(
          state.demo
            ? "Sessão cadastrada (demo) — em produção ela entra na agenda e dispara os lembretes."
            : state.meetLink
              ? `Sessão criada com evento no Google Agenda — link fixo: ${state.meetLink}`
              : "Sessão criada na agenda."
        );
        router.refresh();
      }, 1100);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <>
      {toast && (
        <span className="fixed bottom-6 right-6 z-50 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)] shadow-[var(--shadow)]">
          {toast}
        </span>
      )}

      <Button onClick={() => setOpen(true)}>+ Agendar sessão</Button>

      <Dropdown
        trigger={
          <Button variant="secondary" aria-label="Configurações da agenda">
            ⚙
          </Button>
        }
        items={[
          { icon: "🕐", label: "Bloquear horários", onSelect: () => setBlocksOpen(true) },
          {
            icon: "🇬",
            label: googleConnected ? "Google Agenda conectado ✓" : "Integrar com a agenda do Google",
            onSelect: () => {
              setGoogleConnected(true);
              notify("Google Agenda conectado (demo) — em produção: OAuth + sincronização bidirecional.");
            },
          },
          { icon: "🖨️", label: "Imprimir agenda", onSelect: () => window.print() },
          { icon: "🎨", label: "Personalizar agenda", onSelect: () => notify("Personalização (demo): horários exibidos, duração padrão, cores por status.") },
          { icon: "⚙️", label: "Configurações da agenda", onSelect: () => notify("Configurações (demo): lembretes padrão, antecedência do link, salas.") },
        ]}
      />

      {/* Botão flutuante (só no celular): acesso rápido a agendar e bloquear */}
      <div className="md:hidden">
        {fabOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setFabOpen(false)} aria-hidden />
            <div className="fixed bottom-[8.5rem] right-4 z-40 flex flex-col items-end gap-2">
              <button
                onClick={() => {
                  setBlocksOpen(true);
                  setFabOpen(false);
                }}
                className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2.5 text-sm font-bold shadow-[var(--shadow)] border border-[var(--border)]"
              >
                🚫 Bloquear horários
              </button>
              <button
                onClick={() => {
                  setOpen(true);
                  setFabOpen(false);
                }}
                className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2.5 text-sm font-bold shadow-[var(--shadow)] border border-[var(--border)]"
              >
                📅 Agendar sessão
              </button>
            </div>
          </>
        )}
        <button
          aria-label={fabOpen ? "Fechar ações" : "Ações da agenda"}
          onClick={() => setFabOpen((v) => !v)}
          className="fixed bottom-[5.5rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-3xl leading-none text-white shadow-[var(--shadow)] transition-transform active:scale-95"
        >
          {fabOpen ? "×" : "+"}
        </button>
      </div>

      <AgendaBlocksManager
        open={blocksOpen}
        onClose={() => setBlocksOpen(false)}
        blocks={blocks}
        lunch={lunch}
        blockHolidays={blockHolidays}
        holidays={holidays}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar evento">
        {state.ok ? (
          <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-6 text-center font-bold text-[var(--success)]">
            Sessão salva! {state.meetLink ? "📹 Link do Meet gerado." : "✨"}
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Que tipo de evento é esse?
              </p>
              <Segmented options={["Individual", "Grupo", "Evento geral"]} value={kind} onChange={setKind} />
            </div>

            {kind !== "Evento geral" && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label={kind === "Grupo" ? "Clientes *" : "Cliente *"}>
                    <Select name="patientId" required defaultValue="">
                      <option value="" disabled>
                        — Selecione —
                      </option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button type="button" variant="secondary" aria-label="Novo cliente" title="Cadastrar novo cliente">
                  +
                </Button>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Quando acontece o evento? *
              </p>
              <div className="flex items-center gap-2">
                <Input name="date" type="text" defaultValue={today} className="flex-1" required />
                <Input name="start" type="time" defaultValue="14:00" className="w-28" required />
                <span className="text-[var(--text-soft)] font-bold">–</span>
                <Input name="end" type="time" defaultValue="14:50" className="w-28" required />
              </div>
            </div>

            <Field label="Esse evento é recorrente?">
              <Select name="recurrence" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <option value="nao">Não, quero cadastrar somente esse horário</option>
                <option value="semanal">Sim, toda semana neste horário</option>
                <option value="quinzenal">Sim, a cada 15 dias</option>
                <option value="mensal">Sim, todo mês</option>
              </Select>
            </Field>

            <Field label="Como os eventos acontecerão?">
              <Select name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="online">Online (sala fixa no Google Meet)</option>
                <option value="presencial">Presencial</option>
              </Select>
            </Field>

            {mode === "online" && recurrence !== "nao" && (
              <p className="rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-4 py-3 text-xs leading-relaxed text-[var(--info)]">
                📅 <strong>Google Agenda + Meet:</strong> será criado um evento recorrente no seu calendário e no do
                paciente (convite automático), com <strong>link do Meet fixo para todas as sessões</strong> — o mesmo
                link, toda semana. Reagendamentos movem a série sem trocar o link.
              </p>
            )}

            <Field label="Qual o serviço oferecido?">
              <Select name="service" defaultValue="psicanalise">
                <option value="psicanalise">Psicanálise</option>
                <option value="mentoria">Mentoria de carreira</option>
                <option value="entrevista">Preparação para processos seletivos</option>
                <option value="triagem">Conversa inicial (triagem)</option>
              </Select>
            </Field>

            {state.error && <p className="text-sm font-semibold text-[var(--danger)]">{state.error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
