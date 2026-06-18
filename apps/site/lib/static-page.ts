/**
 * Carrega as páginas do site original (content/*.html) e aplica apenas as
 * integrações do ecossistema, preservando 100% do design e dos textos:
 *  1. links internos .html → rotas Next
 *  2. botão "Área do Paciente" no header, menu mobile e rodapé
 *  3. nota LGPD do formulário atualizada (agora o lead é registrado no CRM)
 */
import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

function portalUrl(): string {
  return process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
}

export interface StaticPage {
  bodyHtml: string;
  title: string;
  description: string;
}

export function loadPage(file: string): StaticPage {
  const html = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");

  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "Anderson V. V. Silva · Psicólogo";
  const description =
    html.match(/<meta name="description" content="([\s\S]*?)"\s*\/?>/)?.[1]?.trim() ?? "";

  let body = html.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? "";

  // remove os <script> do HTML original (site.js entra via <Script> no layout)
  body = body.replace(/<script[\s\S]*?<\/script>/g, "");

  // links internos → rotas do app
  body = body
    .replace(/href="index\.html(#[^"]*)?"/g, 'href="/$1"')
    .replace(/href="(sobre|servicos|faq|contato|privacidade)\.html(#[^"]*)?"/g, 'href="/$1$2"');

  const portal = portalUrl();

  // header desktop: "Área do Paciente" antes do botão Agendar
  body = body.replace(
    '<div class="header__cta">',
    `<div class="header__cta"><a class="btn btn-ghost portal-desktop" href="${portal}">Área do Paciente</a>`
  );

  // menu mobile: marca no topo + bloco de CTAs com hierarquia no rodapé
  body = body.replace(
    '<div class="mobile-menu" aria-hidden="true"><button class="mobile-menu__close" aria-label="Fechar menu">×</button>',
    '<div class="mobile-menu" aria-hidden="true"><button class="mobile-menu__close" aria-label="Fechar menu">×</button>' +
      '<div class="mm-brand"><img class="logo-color" src="brand/logo-color.png" alt="Anderson V. V. Silva — Psicólogo, CRP 06/166223"/><img class="logo-white" src="brand/logo-white.png" alt=""/></div>'
  );
  body = body.replace(
    '<a class="btn btn-primary btn-lg"',
    `<p class="mm-cta-label">Vamos conversar?<span>1ª conversa, sem compromisso</span></p>` +
      `<a class="btn btn-lg mm-portal" href="${portal}">Área do Paciente</a><a class="btn btn-primary btn-lg"`
  );
  body = body.replace(
    "Agendar pelo WhatsApp</a>",
    'Agendar pelo WhatsApp</a><p class="mm-foot">CRP 06/166223 · On-line, Brasil e exterior</p>'
  );

  // rodapé: link na coluna Navegação
  body = body.replace(
    '<a href="/contato">Contato</a></div>',
    `<a href="/contato">Contato</a><a href="${portal}">Área do Paciente</a></div>`
  );

  // nota LGPD: o formulário agora registra o lead no CRM da clínica
  body = body.replace(
    /não são armazenados neste site<\/strong>\s*\(o envio apenas abre o WhatsApp com a mensagem pronta\)\s*e/g,
    "são usados apenas para retornar seu contato</strong> e"
  );

  return { bodyHtml: body, title, description };
}
