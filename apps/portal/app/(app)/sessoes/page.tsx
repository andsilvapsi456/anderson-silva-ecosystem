import { Badge, Card, PageHeader, statusLabel, statusTone, EmptyState } from "@as/ui";
import { formatDate, formatTime } from "@as/shared";
import { getMyAppointments } from "../../../lib/data";
import { SessionLinkButton } from "../../../components/session-link-button";

export default async function SessoesPage() {
  const appointments = await getMyAppointments();

  return (
    <>
      <PageHeader title="Minhas sessões" subtitle="Histórico completo e próximos encontros." />
      <Card>
        {appointments.length === 0 ? (
          <EmptyState title="Nenhuma sessão por aqui ainda" description="Quando houver agendamentos, eles aparecem nesta lista." />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {appointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <div className="w-24 shrink-0">
                  <p className="font-extrabold">{formatDate(a.startsAt)}</p>
                  <p className="text-sm text-[var(--text-soft)]">{formatTime(a.startsAt)}</p>
                </div>
                <div className="flex-1 min-w-40">
                  <p className="text-sm font-bold">
                    {a.mode === "ONLINE" ? "💻 Sessão online" : `🏢 Presencial${a.room ? ` · ${a.room}` : ""}`}
                    {a.recurring && (
                      <span className="ml-2 text-[11px] font-bold text-[var(--text-soft)]">↻ recorrente</span>
                    )}
                  </p>
                </div>
                <Badge tone={statusTone[a.status]}>{statusLabel[a.status]}</Badge>
                {a.mode === "ONLINE" && a.videoLink && (
                  <SessionLinkButton startsAt={a.startsAt} endsAt={a.endsAt} videoLink={a.videoLink} size="sm" />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="mt-4 text-xs text-[var(--text-soft)]">
        Precisa remarcar? Chame a clínica no <strong>WhatsApp</strong> — respondemos rapidinho.
      </p>
    </>
  );
}
