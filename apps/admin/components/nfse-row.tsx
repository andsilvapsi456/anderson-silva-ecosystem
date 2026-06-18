"use client";

import * as React from "react";
import { Badge, Button } from "@as/ui";
import { formatBRL, formatDate, type Transaction } from "@as/shared";
import { emitNfseForTransaction } from "../app/actions/nfse";

export function NfseRow({ tx }: { tx: Transaction }) {
  const [state, setState] = React.useState<"idle" | "emitting" | "done" | "error">("idle");
  const [info, setInfo] = React.useState<string>("");

  async function emit() {
    setState("emitting");
    const res = await emitNfseForTransaction(tx.id);
    if (res.ok) {
      setState("done");
      setInfo(res.demo ? `Nota ${res.numero} (demo)` : `Nota ${res.numero ?? ""} · ${res.status}`);
    } else {
      setState("error");
      setInfo(res.error ?? "Falha na emissão.");
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-6 py-3.5">
      <div className="min-w-44 flex-1">
        <p className="text-sm font-bold">{tx.patientName}</p>
        <p className="text-xs text-[var(--text-soft)]">
          {tx.description} · pago em {tx.paidAt ? formatDate(tx.paidAt) : "—"}
        </p>
      </div>
      <p className="font-extrabold text-sm">{formatBRL(tx.amountCents)}</p>
      {state === "done" ? (
        <Badge tone="success">✓ {info}</Badge>
      ) : state === "error" ? (
        <Badge tone="danger">{info}</Badge>
      ) : (
        <Button size="sm" variant="secondary" onClick={emit} disabled={state === "emitting"}>
          {state === "emitting" ? "Emitindo…" : "Emitir NFS-e"}
        </Button>
      )}
    </li>
  );
}
