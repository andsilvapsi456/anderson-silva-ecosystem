"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@as/ui";
import { importPatients, previewImport, type ImportPreview } from "../app/actions/import";

const TEMPLATE = `Nome,CPF,E-mail,Telefone,Celular,Data de Nascimento,Observações
Maria Exemplo,000.000.000-00,maria@email.com,(11) 3333-0000,(11) 99999-0000,12/03/1990,Veio por indicação`;

/** Importa pacientes do PsicoManager a partir de um CSV (preview → confirmar). */
export function ImportPatients() {
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [csv, setCsv] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setBusy(true);
    setDone(null);
    setPreview(await previewImport(text));
    setBusy(false);
  }

  async function confirm() {
    setBusy(true);
    const res = await importPatients(csv);
    setBusy(false);
    if (res.ok) {
      setDone(`${res.imported} paciente(s) importado(s)${res.demo ? " (demo)" : ""} ✓`);
      setPreview(null);
      setCsv("");
      if (!res.demo) router.refresh();
    } else {
      setDone(res.error ?? "Falha na importação.");
    }
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + TEMPLATE], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modelo-importacao-pacientes.csv";
    a.click();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📥 Importar pacientes do PsicoManager</CardTitle>
        <Badge tone="accent">Migração</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--text-soft)]">
          <li>No PsicoManager, exporte seus pacientes em <strong>Excel/CSV</strong> (ou salve a planilha como CSV).</li>
          <li>Confira que existe uma coluna <strong>Nome</strong> (CPF, e-mail, telefone, nascimento são opcionais).</li>
          <li>Envie o arquivo aqui — você vê uma prévia antes de confirmar.</li>
        </ol>

        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          <Button onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? "Lendo…" : "Escolher arquivo CSV"}
          </Button>
          <Button variant="ghost" onClick={downloadTemplate}>
            Baixar modelo
          </Button>
        </div>

        {done && (
          <p className="rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--success)]">
            {done}
          </p>
        )}

        {preview?.error && <p className="text-sm font-semibold text-[var(--danger)]">{preview.error}</p>}

        {preview && preview.patients.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm">
              <strong>{preview.patients.length}</strong> paciente(s) reconhecido(s)
              {preview.skipped > 0 && ` · ${preview.skipped} linha(s) ignorada(s) (sem nome)`}. Confira a prévia:
            </p>
            <div className="max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--bg-alt)]">
                  <tr className="text-left text-[11px] font-extrabold uppercase tracking-wide text-[var(--text-soft)]">
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">CPF</th>
                    <th className="px-3 py-2">E-mail</th>
                    <th className="px-3 py-2">Telefone</th>
                    <th className="px-3 py-2">Nasc.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {preview.patients.slice(0, 50).map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 font-semibold">{p.name}</td>
                      <td className="px-3 py-1.5 text-[var(--text-soft)]">{p.cpf ?? "—"}</td>
                      <td className="px-3 py-1.5 text-[var(--text-soft)]">{p.email ?? "—"}</td>
                      <td className="px-3 py-1.5 text-[var(--text-soft)]">{p.whatsapp ?? p.phone ?? "—"}</td>
                      <td className="px-3 py-1.5 text-[var(--text-soft)]">{p.birthDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={confirm} disabled={busy}>
                {busy ? "Importando…" : `Importar ${preview.patients.length} paciente(s)`}
              </Button>
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Cancelar
              </Button>
            </div>
            <p className="text-xs text-[var(--text-soft)]">
              Pacientes com o mesmo CPF não são duplicados. Depois, envie o <strong>link de cadastro</strong> para cada
              um completar os dados que faltarem.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
