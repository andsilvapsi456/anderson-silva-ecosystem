import { StaticHtml, staticMetadata } from "../../components/static-html";

export const metadata = staticMetadata("sobre.html");

export default function SobrePage() {
  return <StaticHtml file="sobre.html" />;
}
