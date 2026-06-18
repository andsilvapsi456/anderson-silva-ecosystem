"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input, Select } from "@as/ui";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function PatientFilters({ years }: { years: number[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/pacientes?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-4">
      <Input
        placeholder="Buscar por nome, CPF ou e-mail…"
        className="max-w-xs"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => setParam("q", e.target.value)}
      />
      <Select
        aria-label="Status"
        className="!h-11 w-36"
        value={params.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">Todos</option>
        <option value="ativos">Ativos</option>
        <option value="inativos">Inativos</option>
      </Select>
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Início:</span>
      <Select
        aria-label="Ano de início"
        className="!h-11 w-32"
        value={params.get("ano") ?? ""}
        onChange={(e) => setParam("ano", e.target.value)}
      >
        <option value="">Qualquer ano</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Mês de início"
        className="!h-11 w-32"
        value={params.get("mes") ?? ""}
        onChange={(e) => setParam("mes", e.target.value)}
      >
        <option value="">Qualquer mês</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
