import { StaticHtml, staticMetadata } from "../../components/static-html";

export const metadata = staticMetadata("contato.html");

export default function ContatoPage() {
  return <StaticHtml file="contato.html" />;
}
