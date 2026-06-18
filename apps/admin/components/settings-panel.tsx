"use client";

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Select, Switch, Textarea } from "@as/ui";
import { saveNotificationSettings } from "../app/actions/settings";
import type { NotificationSettings } from "../lib/notifications/settings";

const TEMPLATES = [
  { id: "cobranca", label: "Cobrança (e-mail + WhatsApp)" },
  { id: "lembrete24", label: "Lembrete 24h — confirmação com botões" },
  { id: "lembrete2", label: "Lembrete de sessão — 2h antes" },
  { id: "agenda", label: "Agenda do dia (e-mail para você)" },
  { id: "boasvindas", label: "Boas-vindas ao portal" },
  { id: "nps", label: "Pesquisa de satisfação (NPS)" },
];

function toastStyle(): string {
  return "fixed bottom-6 right-6 z-50 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-3 text-sm font-semibold text-[var(--success)] shadow-[var(--shadow)]";
}

function ChannelRow({
  label,
  desc,
  email,
  whatsapp,
  onEmail,
  onWhatsapp,
}: {
  label: string;
  desc: string;
  email: boolean;
  whatsapp: boolean;
  onEmail: (v: boolean) => void;
  onWhatsapp: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <div className="min-w-44">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-[var(--text-soft)]">{desc}</p>
      </div>
      <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-soft)]">
        <span className="flex items-center gap-1.5">
          📧 <Switch checked={email} onChange={onEmail} label={`${label} por e-mail`} />
        </span>
        <span className="flex items-center gap-1.5">
          📱 <Switch checked={whatsapp} onChange={onWhatsapp} label={`${label} por WhatsApp`} />
        </span>
      </div>
    </div>
  );
}

export function SettingsPanel({
  chargeTemplate,
  notificationSettings,
}: {
  chargeTemplate: string;
  notificationSettings: NotificationSettings;
}) {
  const [template, setTemplate] = React.useState("cobranca");
  const [body, setBody] = React.useState(chargeTemplate);
  const [s, setS] = React.useState<NotificationSettings>(notificationSettings);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function set<K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const res = await saveNotificationSettings(s);
    setSaving(false);
    notify(res.ok ? `Configurações salvas${res.demo ? " (demo)" : ""} ✓` : res.error!);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {toast && <span className={toastStyle()}>{toast}</span>}

      {/* ───── Templates de mensagens ───── */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>📝 Templates de mensagens e e-mails</CardTitle>
          <Badge tone="accent">{"{{campos}}"} preenchidos automaticamente</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold cursor-pointer ${
                  template === t.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-soft)] hover:bg-[var(--bg-alt)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-3">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-56 font-sans" />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => notify("Template salvo (demo).")}>
                Salvar template
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBody(chargeTemplate)}>
                Restaurar padrão
              </Button>
              <span className="text-xs text-[var(--text-soft)]">
                Campos: {"{{paciente.primeiro_nome}} {{cobranca.valor}} {{cobranca.dia_acordado}} {{pagamento.chave_pix}} {{sessao.data}} {{sessao.link}}"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ───── Lembretes & notificações ───── */}
      <Card>
        <CardHeader>
          <CardTitle>🔔 Lembretes & notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Agenda diária para o psicólogo */}
          <div className="rounded-[var(--radius-sm)] bg-[var(--accent-soft)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[var(--accent)]">📬 Sua agenda do dia, por e-mail</p>
                <p className="text-xs text-[var(--text)]">
                  Todos os dias, com horário, nome completo e link da sala de cada paciente.
                </p>
              </div>
              <Switch
                checked={s.dailyAgendaEnabled}
                onChange={(v) => set("dailyAgendaEnabled", v)}
                label="Agenda diária"
              />
            </div>
            {s.dailyAgendaEnabled && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="w-24">
                  <Field label="Horário">
                    <Select
                      value={String(s.dailyAgendaHour)}
                      onChange={(e) => set("dailyAgendaHour", Number(e.target.value))}
                    >
                      {[6, 7, 8, 9, 10].map((h) => (
                        <option key={h} value={h}>
                          {h}h00
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="flex-1 min-w-52">
                  <Field label="Enviar para">
                    <Input
                      type="email"
                      value={s.dailyAgendaEmail}
                      onChange={(e) => set("dailyAgendaEmail", e.target.value)}
                    />
                  </Field>
                </div>
                <a href="/api/cron/daily-agenda?preview=1" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="secondary" type="button">
                    Testar agora ↗
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Lembretes ao paciente */}
          <div className="space-y-3">
            <ChannelRow
              label="Lembrete 24h antes"
              desc="No WhatsApp vai com botões — o paciente CONFIRMA com 1 toque"
              email={s.remind24hEmail}
              whatsapp={s.remind24hWhatsapp}
              onEmail={(v) => set("remind24hEmail", v)}
              onWhatsapp={(v) => set("remind24hWhatsapp", v)}
            />
            <ChannelRow
              label="Lembrete 2h antes"
              desc="Aviso final; sessões online lembram do link no portal"
              email={s.remind2hEmail}
              whatsapp={s.remind2hWhatsapp}
              onEmail={(v) => set("remind2hEmail", v)}
              onWhatsapp={(v) => set("remind2hWhatsapp", v)}
            />
            <ChannelRow
              label="Cobrança na data acordada"
              desc="Mensagem acolhedora com valor, vencimento e chave PIX"
              email={s.billingEmail}
              whatsapp={s.billingWhatsapp}
              onEmail={(v) => set("billingEmail", v)}
              onWhatsapp={(v) => set("billingWhatsapp", v)}
            />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="w-44">
              <Field label="Reenviar cobrança a cada">
                <Select
                  value={String(s.billingRetryDays)}
                  onChange={(e) => set("billingRetryDays", Number(e.target.value))}
                >
                  {[3, 5, 7, 10, 15].map((d) => (
                    <option key={d} value={d}>
                      {d} dias de atraso
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex gap-2">
              <a href="/api/cron/reminders" target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" type="button">
                  Rodar lembretes agora
                </Button>
              </a>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? "Salvando…" : "Salvar configurações"}
              </Button>
            </div>
          </div>
          <p className="text-xs text-[var(--text-soft)]">
            Confirmações respondidas no WhatsApp marcam a sessão como <strong>Confirmada</strong> automaticamente
            (webhook). Agendamento: agenda diária via Vercel Cron · lembretes a cada 15 min via GitHub Actions.
          </p>
        </CardContent>
      </Card>

      {/* ───── Importar / Exportar ───── */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Importar & exportar dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-bold mb-2">Exportar</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => notify("Exportação Excel (demo) — pacientes, agenda e financeiro em .xlsx.")}>
                📊 Excel (.xlsx)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => notify("Exportação Word (demo) — documentos e relatórios em .docx.")}>
                📄 Word (.docx)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => notify("Exportação PDF (demo) — relatórios prontos para impressão.")}>
                🧾 PDF
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold mb-2">Importar</p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-sm text-[var(--text-soft)] hover:border-[var(--accent)]">
              <span className="text-xl" aria-hidden>⬆️</span>
              Arraste uma planilha (.xlsx/.csv) de pacientes ou clique para enviar
              <input type="file" accept=".xlsx,.csv" className="hidden" onChange={() => notify("Arquivo recebido (demo) — em produção: validação + prévia antes de importar.")} />
            </label>
          </div>
          <p className="text-xs text-[var(--text-soft)]">
            LGPD: exportações contêm dados pessoais — são registradas na auditoria e protegidas por download autenticado.
          </p>
        </CardContent>
      </Card>

      {/* ───── Integrações ───── */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>🔌 Integrações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-4 py-3 text-xs text-[var(--info)]">
            🔒 Por segurança, as integrações são configuradas no servidor por <strong>variáveis de ambiente</strong> (tokens
            nunca passam pelo navegador). O status real de cada conexão aparece no painel <strong>“Saúde do sistema”</strong>,
            no topo desta página.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <p className="font-bold text-sm">🇬 Google Agenda</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                Sessões com link fixo do Meet no seu calendário. Configurar: <code>GOOGLE_CALENDAR_*</code>.
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <p className="font-bold text-sm">📱 WhatsApp Business</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                Confirmações, lembretes e cobranças pela Cloud API oficial. Configurar: <code>WHATSAPP_*</code>.
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] p-4">
              <p className="font-bold text-sm">✍️ Autentique</p>
              <p className="mt-1 text-xs text-[var(--text-soft)]">
                Contratos para assinatura digital, com status por webhook. Configurar: <code>AUTENTIQUE_TOKEN</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
