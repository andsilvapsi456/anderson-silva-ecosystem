"use client";

import { Button } from "@as/ui";

export function PrintButton() {
  return <Button size="sm" onClick={() => window.print()}>🖨️ Imprimir / salvar PDF</Button>;
}
