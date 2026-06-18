import { StaticHtml, staticMetadata } from "../../components/static-html";

export const metadata = staticMetadata("faq.html");

export default function FaqPage() {
  return <StaticHtml file="faq.html" />;
}
