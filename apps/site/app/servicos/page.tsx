import { StaticHtml, staticMetadata } from "../../components/static-html";

export const metadata = staticMetadata("servicos.html");

export default function ServicosPage() {
  return <StaticHtml file="servicos.html" />;
}
