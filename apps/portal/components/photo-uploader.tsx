"use client";

import * as React from "react";
import { Avatar, Button } from "@as/ui";

/** Lê o arquivo, redimensiona para 256px (canvas) e devolve um data URL leve. */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
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

export function PhotoUploader({
  name,
  photoUrl,
  onSave,
  hint,
}: {
  name: string;
  photoUrl: string | null;
  onSave: (dataUrl: string) => Promise<{ ok: boolean; demo?: boolean; error?: string }>;
  hint?: string;
}) {
  const [preview, setPreview] = React.useState<string | null>(photoUrl);
  const [toast, setToast] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    const dataUrl = await fileToAvatarDataUrl(file);
    const res = await onSave(dataUrl);
    setBusy(false);
    if (res.ok) {
      setPreview(dataUrl);
      setToast(`Foto atualizada${res.demo ? " (demo)" : ""} ✓`);
    } else {
      setToast(res.error ?? "Não foi possível salvar a foto.");
    }
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} size={64} src={preview} />
      <div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? "Enviando…" : "📷 Trocar foto"}
        </Button>
        <p className="mt-1.5 text-xs text-[var(--text-soft)]">{hint ?? "JPG ou PNG · enquadrada automaticamente"}</p>
        {toast && <p className="mt-1 text-xs font-bold text-[var(--success)]">{toast}</p>}
      </div>
    </div>
  );
}
