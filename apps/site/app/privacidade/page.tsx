import { StaticHtml, staticMetadata } from "../../components/static-html";

export const metadata = staticMetadata("privacidade.html");

export default function PrivacidadePage() {
  return <StaticHtml file="privacidade.html" />;
}
