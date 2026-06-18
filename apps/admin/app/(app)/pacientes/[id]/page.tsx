import { notFound } from "next/navigation";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, MoodChart, PageHeader, computeMoodStats, statusLabel, statusTone, trendView } from "@as/ui";
import { formatBRL, formatDate, formatDateTime } from "@as/shared";
import { getAppointments, getClinicalScales, getPatient, getPatientDiary, getPatientPanel, getRecordEntries, getTransactions } from "../../../../lib/data";
import { IntakeLinkButton } from "../../../../components/intake-link-button";
import { InformeIrButton } from "../../../../components/informe-ir-button";
import { EditPatientButton } from "../../../../components/edit-patient-button";
import { NewEvolutionButton } from "../../../../components/new-evolution-button";
import { ScalesCard } from "../../../../components/scales-card";
import { PatientPhoto } from "../../../../components/patient-photo";

const MOOD_EMOJI: Record<number, string> = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const kindLabel: Record<string, string> = {
  ANAMNESE: "Anamnese",
  EVOLUCAO: "Evolução",
  PLANO_TERAPEUTICO: "Plano terapêutico",
  HIPOTESE_DIAGNOSTICA: "Hipótese diagnóstica",
  ENCAMINHAMENTO: "Encaminhamento",
  OBSERVACAO: "Observação",
};

const TABS = [
  { href: "#principal", label: "Principal" },
  { href: "#cadastro", label: "Cadastro" },
  { href: "#anamnese", label: "Anamnese & Prontuário" },
  { href: "#sessoes", label: "Sessões" },
  { href: "#financeiro", label: "Financeiro" },
  { href: "#documentos", label: "Documentos" },
];

export default async function PacientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const [entries, appointments, transactions, panel, diary, scales] = await Promise.all([
    getRecordEntries(id),
    getAppointments(),
    getTransactions(),
    getPatientPanel(id),
    getPatientDiary(id),
    getClinicalScales(id),
  ]);
  const patientAppointments = appointments.filter((a) => a.patientId === id);
  const patientTransactions = transactions.filter((t) => t.patientId === id);
  const next = patientAppointments.find((a) => new Date(a.startsAt) > new Date() && a.status !== "CANCELADA");

  const att = [
    { label: "Sessões presentes", value: panel.attendance.present, icon: "👍", color: "var(--success)" },
    { label: "Sessões ausentes", value: panel.attendance.absent, icon: "👎", color: "var(--warning)" },
    { label: "Sessões canceladas", value: panel.attendance.cancelled, icon: "🚫", color: "var(--danger)" },
    { label: "Frequência não pontuada", value: panel.attendance.unscored, icon: "❔", color: "var(--text-soft)" },
  ];

  return (
    <>
      <PageHeader
        title={patient.name}
        subtitle={`Paciente desde ${formatDate(panel.startDate)}`}
        actions={
          <>
            <IntakeLinkButton
              patientId={patient.id}
              patientFirstName={patient.name.split(" ")[0]}
              whatsapp={patient.whatsapp ?? patient.phone}
            />
            <a href={`/prontuario/${patient.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">⬇️ Prontuário (CFP)</Button>
            </a>
            <InformeIrButton patientId={patient.id} />
            <EditPatientButton patient={patient} />
            <NewEvolutionButton patientId={patient.id} />
          </>
        }
      />

      {/* sub-navegação do perfil */}
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px">
        {TABS.map((t, i) => (
          <a
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-t-[var(--radius-xs)] px-4 py-2.5 text-sm font-bold ${
              i === 0
                ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                : "text-[var(--text-soft)] hover:text-[var(--text)]"
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-5 lg:grid-cols-3" id="principal">
        {/* ───── Coluna esquerda: dados ───── */}
        <div className="space-y-5">
          <Card id="cadastro">
            <CardHeader>
              <CardTitle>👤 Dados principais</CardTitle>
              <Badge tone="success">{panel.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3 pb-2">
                <PatientPhoto patientId={patient.id} name={patient.name} photoUrl={patient.photoUrl} size={56} />
                <div>
                  <p className="font-extrabold">{patient.name}</p>
                  <p className="text-xs text-[var(--text-soft)]">
                    {patient.birthDate ? `Nascimento: ${formatDate(patient.birthDate)}` : "Nascimento: —"}
                  </p>
                </div>
              </div>
              <p>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">Telefone</span>
                {patient.whatsapp ?? patient.phone ?? "—"}{" "}
                {patient.whatsapp && (
                  <a
                    href={`https://wa.me/${patient.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[var(--success)]"
                    title="Abrir WhatsApp"
                  >
                    📱
                  </a>
                )}
              </p>
              {[
                ["E-mail", patient.email],
                ["CPF", patient.cpf],
                ["Endereço", patient.address],
                ["Resp. financeiro", patient.financialGuardian ?? "O próprio paciente"],
              ].map(([label, value]) => (
                <p key={label}>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">{label}</span>
                  {value ?? "—"}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ℹ️ Informações de atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">
                  Data de início das sessões
                </span>
                {formatDate(panel.startDate)}
              </p>
              <p>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">Status</span>
                {panel.status}
              </p>
              <p>
                <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">Lista de espera</span>
                {panel.waitlist}
              </p>
              {patient.notes && (
                <p className="rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-3 py-2 text-xs">{patient.notes}</p>
              )}
            </CardContent>
          </Card>

          {panel.meetLink && (
            <Card>
              <CardHeader>
                <CardTitle>📹 Teleconsulta — link fixo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="truncate rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-3 py-2 font-mono text-xs">
                  {panel.meetLink}
                </p>
                <p className="text-xs text-[var(--text-soft)]">
                  Evento recorrente no Google Agenda (seu calendário + o do paciente). O mesmo link do Meet vale para
                  todas as sessões da série.
                </p>
                <a href={panel.meetLink} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Button size="sm" variant="secondary">
                    Abrir Meet ↗
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ───── Coluna principal: painel ───── */}
        <div className="space-y-5 lg:col-span-2">
          {/* KPIs de presença */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-[var(--radius-sm)] bg-[var(--bg-alt)] px-4 py-3 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">Próxima sessão</p>
                <p className="mt-1 text-lg font-extrabold">{next ? formatDate(next.startsAt) : "—"}</p>
              </div>
              {att.map((k) => (
                <div key={k.label} className="px-2 py-3 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">{k.label}</p>
                  <p className="mt-1 text-lg font-extrabold" style={{ color: k.color }}>
                    {k.icon} {String(k.value).padStart(2, "0")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plano financeiro */}
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
              {[
                ["Plano financeiro", panel.plan.label],
                ["Modelo de cobrança", panel.plan.model],
                ["Valor (mensalidade)", formatBRL(panel.plan.amountCents)],
                ["Cobrança automática", panel.plan.autoCharge ? "Sim" : "Não"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">{label}</p>
                  <p className="mt-1 font-extrabold">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Atividades */}
          <Card>
            <CardHeader>
              <CardTitle>Atividades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-[var(--border)]">
                {panel.activities.map((a) => (
                  <li key={a.id} className="px-6 py-3">
                    <p className="text-sm">
                      <span aria-hidden>📋 </span>
                      <strong>{patient.name}</strong> {a.text}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-soft)]">{formatDateTime(a.at)}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Evolução do humor — o diário vira dado clínico */}
          {(() => {
            const moodPoints = diary.filter((d) => d.mood).map((d) => ({ createdAt: d.createdAt, mood: d.mood! }));
            const stats = computeMoodStats(moodPoints);
            if (!stats) return null;
            const trend = trendView[stats.trend];
            return (
              <Card>
                <CardHeader>
                  <CardTitle>📈 Evolução do humor</CardTitle>
                  <Badge tone={trend.tone}>{trend.label}</Badge>
                </CardHeader>
                <CardContent>
                  <MoodChart points={moodPoints} />
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span>
                      Média do período: <strong>{stats.average.toFixed(1).replace(".", ",")}</strong> / 5
                    </span>
                    <span>
                      Variação: <strong>{stats.delta > 0 ? "+" : ""}{stats.delta.toFixed(1).replace(".", ",")}</strong>{" "}
                      (metade recente vs. anterior)
                    </span>
                    <span className="text-[var(--text-soft)]">{stats.count} check-ins</span>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Diário do paciente — escrito por ele no portal; só clínicos veem */}
          <Card>
            <CardHeader>
              <CardTitle>📔 Diário do paciente</CardTitle>
              <Badge tone="accent">🔒 Visível só para você</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {diary.length === 0 ? (
                <p className="px-6 py-6 text-sm text-[var(--text-soft)]">
                  Nenhum registro ainda — o paciente pode usar o Diário no portal para contar como foi a semana e
                  anotar pontos para a sessão.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {diary.map((d) => (
                    <li key={d.id} className="flex gap-3 px-6 py-3.5">
                      <span className="text-2xl" aria-hidden>
                        {d.mood ? MOOD_EMOJI[d.mood] : "📝"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-soft)]">{formatDate(d.createdAt)}</p>
                        {d.note && <p className="mt-0.5 text-sm leading-relaxed">{d.note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Escalas clínicas — evolução dos instrumentos aplicados */}
          <ScalesCard scales={scales} />

          {/* Prontuário */}
          <Card id="anamnese">
            <CardHeader>
              <CardTitle>Prontuário eletrônico</CardTitle>
              <Badge tone="accent">🔒 Sigilo profissional</Badge>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l-2 border-[var(--border)] pl-5">
                {entries.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-[var(--accent)]" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{kindLabel[e.kind]}</Badge>
                      <span className="text-xs text-[var(--text-soft)]">
                        {formatDateTime(e.createdAt)} · {e.authorName}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold">{e.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-soft)]">{e.content}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-[var(--radius-sm)] bg-[var(--info-soft)] px-4 py-3 text-xs text-[var(--info)]">
                ✨ IA assistiva (opcional): resuma sessões e organize anotações. A IA nunca substitui o julgamento
                clínico — todo conteúdo gerado exige revisão e aprovação do profissional.
              </p>
            </CardContent>
          </Card>

          {/* Sessões + Financeiro lado a lado */}
          <div className="grid gap-5 xl:grid-cols-2">
            <Card id="sessoes">
              <CardHeader>
                <CardTitle>Sessões</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-[var(--border)]">
                  {patientAppointments.map((a) => (
                    <li key={a.id} className="flex items-center gap-4 px-6 py-3">
                      <p className="w-24 text-sm font-bold">{formatDate(a.startsAt)}</p>
                      <p className="flex-1 text-sm text-[var(--text-soft)]">
                        {a.mode === "ONLINE" ? "💻 Online" : `🏢 ${a.room ?? "Presencial"}`}
                      </p>
                      <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card id="financeiro">
              <CardHeader>
                <CardTitle>Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-[var(--border)]">
                  {patientTransactions.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-6 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{t.description}</p>
                        <p className="text-xs text-[var(--text-soft)]">{formatDate(t.dueDate)}</p>
                      </div>
                      <p className="text-sm font-extrabold">{formatBRL(t.amountCents)}</p>
                      <Badge tone={statusTone[t.status]}>{statusLabel[t.status]}</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Documentos / anexos */}
          <Card id="documentos">
            <CardHeader>
              <CardTitle>Documentos & anexos</CardTitle>
              <Button size="sm" variant="secondary">
                + Anexar
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-soft)]">
              📎 Contrato terapêutico.pdf · 📎 Termo LGPD v2.pdf — assinatura digital via{" "}
              <strong>Autentique</strong> quando conectado em Configurações.
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
