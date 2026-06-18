import type { Metadata } from "next";
import { loadPage } from "../lib/static-page";

/** Renderiza uma página do site original sem alterar markup nem estilos. */
export function StaticHtml({ file }: { file: string }) {
  const { bodyHtml } = loadPage(file);
  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} suppressHydrationWarning />;
}

export function staticMetadata(file: string): Metadata {
  const { title, description } = loadPage(file);
  return { title, description };
}
