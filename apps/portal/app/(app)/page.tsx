import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, statusLabel, statusTone } from "@as/ui";
import { formatBRL, formatDateLong, formatTime, greeting } from "@as/shared";
import {
  getLastAppointment,
  getMe,
  getMyTransactions,
  getNextAppointment,
  getNotices,
} from "../../lib/data";
import { SessionLinkButton } from "../../components/session-link-button";

export default async function DashboardPage() {
  const [me, next, last, transactions, notices] = await Promise.all([
    getMe(),
    getNextAppointment(),
    getLastAppointment(),
    getMyTransactions(),
    getNotices(),
  ]);

  const pending = transactions.filter((t) => t.status === "PENDENTE" || t.status === "ATRASADO");
  const pendingTotal = pending.reduce((sum, t) => sum + t.amountCents, 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{greeting(me.name)}</h1>
        <p className="mt-1 text-[var(--text-soft)]">Que bom ter você por aqui. Este é o seu espaço. ❤️</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Próxima sessão */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Próxima sessão</CardTitle>
            {next && <Badge tone={statusTone[next.status]}>{statusLabel[next.status]}</Badge>}
          </CardHeader>
          <CardContent>
            {next ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xl font-extrabold capitalize">{formatDateLong(next.startsAt)}</p>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">
                    {formatTime(next.startsAt)} – {formatTime(next.endsAt)} ·{" "}
                    {next.mode === "ONLINE" ? "💻 Online" : `🏢 Presencial${next.room ? ` · ${next.room}` : ""}`}
                  </p>
                </div>
                {next.mode === "ONLINE" && next.videoLink && (
                  <SessionLinkButton
                    startsAt={next.startsAt}
                    endsAt={next.endsAt}
                    videoLink={next.videoLink}
                    size="lg"
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-soft)]">Nenhuma sessão agendada. Fale com a clínica 😊</p>
            )}
          </CardContent>
        </Card>

        {/* Situação financeira */}
        <Card>
          <CardHeader>
            <CardTitle>Situação financeira</CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-sm font-semibold text-[var(--success)]">Tudo em dia ✨</p>
            ) : (
              <>
                <p className="text-2xl font-extrabold">{formatBRL(pendingTotal)}</p>
                <p className="mt-1 text-sm text-[var(--text-soft)]">
                  {pending.length} cobrança{pending.length > 1 ? "s" : ""} em aberto
                </p>
                <Link href="/pagamentos" className="mt-3 inline-block text-sm font-bold text-[var(--accent)]">
                  Ver pagamentos →
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Última sessão */}
        <Card>
          <CardHeader>
            <CardTitle>Última sessão</CardTitle>
          </CardHeader>
          <CardContent>
            {last ? (
              <>
                <p className="font-bold capitalize">{formatDateLong(last.startsAt)}</p>
                <div className="mt-2">
                  <Badge tone={statusTone[last.status]}>{statusLabel[last.status]}</Badge>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--text-soft)]">Sua jornada começa em breve.</p>
            )}
          </CardContent>
        </Card>

        {/* Avisos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Avisos da clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {notices.length === 0 && <p className="text-sm text-[var(--text-soft)]">Sem avisos no momento.</p>}
            {notices.map((n) => (
              <div key={n.id} className="rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-4 py-3">
                <p className="text-sm font-bold text-[var(--accent)]">{n.title}</p>
                <p className="mt-0.5 text-sm text-[var(--text)]">{n.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
