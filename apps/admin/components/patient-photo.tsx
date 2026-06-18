"use client";

import * as React from "react";
import { Avatar } from "@as/ui";
import { updatePatientPhoto } from "../app/actions/patients";

async function fileToAvatarDataUrl(file: File): Promise<string> {
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  await new Promise((ok, err) => ((img.onload = ok), (img.onerror = err)));
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const side = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  URL.revokeObjectURL(img.src);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Avatar do prontuário com troca de foto (clique no ícone 📷). */
export function PatientPhoto({
  patientId,
  name,
  photoUrl,
  size = 56,
}: {
  patientId: string;
  name: string;
  photoUrl: string | null;
  size?: number;
}) {
  const [preview, setPreview] = React.useState<string | null>(photoUrl);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setBusy(true);
    const dataUrl = await fileToAvatarDataUrl(file);
    const res = await updatePatientPhoto(patientId, dataUrl);
    if (res.ok) setPreview(dataUrl);
    setBusy(false);
  }

  return (
    <span className="relative inline-block shrink-0">
      <Avatar name={name} size={size} src={preview} />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        aria-label="Trocar foto do prontuário"
        title="Trocar foto"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[11px] shadow-[var(--shadow-sm)] hover:border-[var(--accent)]"
      >
        {busy ? "…" : "📷"}
      </button>
    </span>
  );
}
