"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@as/ui";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function ReportFilters({
  patients,
  years,
}: {
  patients: { id: string; name: string }[];
  years: number[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/relatorios?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Ano"
        className="!h-10 w-28"
        value={params.get("ano") ?? String(new Date().getFullYear())}
        onChange={(e) => setParam("ano", e.target.value)}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Mês"
        className="!h-10 w-40"
        value={params.get("mes") ?? ""}
        onChange={(e) => setParam("mes", e.target.value)}
      >
        <option value="">Ano inteiro</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Paciente"
        className="!h-10 w-52"
        value={params.get("paciente") ?? ""}
        onChange={(e) => setParam("paciente", e.target.value)}
      >
        <option value="">Todos os pacientes</option>
        {patients.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
