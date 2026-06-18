import { StaticHtml, staticMetadata } from "../components/static-html";

export const metadata = staticMetadata("index.html");

export default function HomePage() {
  return <StaticHtml file="index.html" />;
}
