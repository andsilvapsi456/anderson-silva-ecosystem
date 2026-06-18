"use client";

import * as React from "react";
import { Button, Dropdown } from "@as/ui";

/** Baixa o Informe de pagamentos para o IR de um paciente, por ano. */
export function InformeIrButton({ patientId }: { patientId: string }) {
  const [busy, setBusy] = React.useState(false);
  const now = new Date().getFullYear();
  const years = [now, now - 1, now - 2];

  async function download(year: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/informe?patient=${patientId}&year=${year}`);
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `informe-ir-${year}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Não foi possível gerar o informe.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dropdown
      align="right"
      trigger={
        <Button variant="secondary" disabled={busy}>
          {busy ? "Gerando…" : "🧾 Informe IR"}
        </Button>
      }
      items={years.map((y) => ({ label: `Ano ${y}`, onSelect: () => download(y) }))}
    />
  );
}
