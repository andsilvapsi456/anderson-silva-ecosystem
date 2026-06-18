import Link from "next/link";
import { Avatar, Badge, Card, EmptyState, PageHeader } from "@as/ui";
import { formatDate } from "@as/shared";
import { getPatients } from "../../../lib/data";
import { NewPatientButton } from "../../../components/patient-form-modal";
import { PatientFilters } from "../../../components/patient-filters";

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; ano?: string; mes?: string }>;
}) {
  const [all, params] = await Promise.all([getPatients(), searchParams]);

  const q = (params.q ?? "").toLowerCase().trim();
  const patients = all.filter((p) => {
    if (params.status === "ativos" && !p.active) return false;
    if (params.status === "inativos" && p.active) return false;
    const start = new Date(p.createdAt);
    if (params.ano && start.getFullYear() !== Number(params.ano)) return false;
    if (params.mes && start.getMonth() + 1 !== Number(params.mes)) return false;
    if (q && ![p.name, p.cpf ?? "", p.email ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });

  const years = [...new Set(all.map((p) => new Date(p.createdAt).getFullYear()))].sort((a, b) => b - a);

  return (
    <>
      <PageHeader
        title="Pacientes"
        subtitle={`${patients.length} de ${all.length} cadastros · ${all.filter((p) => p.active).length} ativos`}
        actions={<NewPatientButton />}
      />
      <Card>
        <PatientFilters years={years} />
        {patients.length === 0 && (
          <EmptyState icon="🔍" title="Nenhum paciente com esses filtros" description="Ajuste o status ou o período de início." />
        )}
        <ul className="divide-y divide-[var(--border)]">
          {patients.map((p) => (
            <li key={p.id}>
              <Link
                href={`/pacientes/${p.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[var(--bg-alt)]"
              >
                <Avatar name={p.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{p.name}</p>
                  <p className="text-xs text-[var(--text-soft)] truncate">
                    {p.email ?? "sem e-mail"} · {p.whatsapp ?? p.phone ?? "sem telefone"}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-[var(--text-soft)]">desde {formatDate(p.createdAt)}</p>
                </div>
                <Badge tone={p.active ? "success" : "neutral"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                <span className="text-[var(--text-soft)]">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
