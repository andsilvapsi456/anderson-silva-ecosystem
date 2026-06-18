import { Badge, Card, CardContent, CardHeader, CardTitle } from "@as/ui";
import { getIntegrationStatus } from "../lib/observability";

/** Painel de saúde — mostra quais integrações estão conectadas. */
export function SystemHealth() {
  const items = getIntegrationStatus();
  const connected = items.filter((i) => i.connected).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>🩺 Saúde do sistema</CardTitle>
        <Badge tone={connected === items.length ? "success" : "warning"}>
          {connected}/{items.length} conectadas
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-[var(--border)]">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3 px-6 py-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: i.connected ? "var(--success)" : "var(--border-strong)" }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{i.label}</p>
                <p className="text-xs text-[var(--text-soft)]">{i.hint}</p>
              </div>
              <Badge tone={i.connected ? "success" : "neutral"}>{i.connected ? "Conectada" : "Pendente"}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
