# 07 · Design System "Acolher"

Implementado em [`packages/design-system/tokens.css`](../packages/design-system/tokens.css) (tokens) e [`packages/ui`](../packages/ui/src) (componentes). Referências: Notion (clareza), Linear (densidade calma), Stripe (precisão), Headspace/Calm (calor humano).

## 1. Cores

### Marca (imutáveis)
| Token | Valor | Uso |
|---|---|---|
| `--brand-coral` | `#FF5A5A` | Ações primárias, foco, identidade |
| `--brand-coral-600` | `#F0463F` | Hover |
| `--brand-ink` | `#202020` | Texto forte, footer |
| Neutras | `#FFFFFF` `#F8F9FA` `#EAEAEA` | Superfícies, fundos, bordas |

### Semânticas (mudam com o tema)
`--bg` `--bg-alt` `--surface` `--text` `--text-soft` `--border` `--accent` `--accent-soft` `--success` `--warning` `--danger` `--info` (+ variantes `-soft`)

**Light** = "clean clínico" (branco, cinzas frios suaves) · **Dark** = "moderno premium" (tons quentes de carvão `#161514`, herdados do site). Toggle persiste em `localStorage`, aplicado via `data-theme` no `<html>`.

## 2. Tipografia — Montserrat

| Estilo | Peso | Tamanho | Uso |
|---|---|---|---|
| Display | 800 | clamp 40–75px, tracking −0.02em | Hero do site |
| H1 | 800 | 24–30px | Título de página |
| H2/CardTitle | 700–800 | 15–20px | Seções e cards |
| Body | 400–500 | 14–17px, lh 1.6 | Texto corrido |
| Label/Eyebrow | 700 | 11–13px, caps, tracking +0.2em | Rótulos, KPIs |
| Script (acento) | Caveat 700 | 1.5em | Destaques humanizados ("ser quem você é") |

## 3. Grid e espaçamento

- Escala 4pt: `4 8 12 16 24 32 48 64`
- Container site: max 1200px · apps: max 1280px (7xl)
- Sidebar 256px fixa (desktop) → tab bar inferior (mobile)
- Raios: `--radius` 16px (cards) · `--radius-sm` 10px (inputs) · pill (botões/badges)
- Sombras suaves de baixa opacidade (`--shadow`, `--shadow-sm`) — nunca bordas duras de ERP

## 4. Componentes (packages/ui)

| Componente | Variações | Estados |
|---|---|---|
| `Button` / `ButtonLink` | primary, secondary, ghost, danger · sm/md/lg | hover (elevação −1px), focus-visible (anel coral), disabled 50% |
| `Card` (+Header/Title/Content) | — | hover opcional translate-y |
| `Badge` | 6 tons semânticos + mapas `statusTone`/`statusLabel` | — |
| `Input` `Textarea` `Select` `Label` `Field` | — | focus: borda coral + anel `accent-soft` |
| `StatCard` | tendência ▲▼ verde/vermelha + hint | — |
| `Avatar` | iniciais, paleta determinística por nome | — |
| `AppShell` | sidebar desktop / tab bar mobile, item ativo coral-soft | — |
| `PageHeader` | título + subtítulo + ações | — |
| `EmptyState` | ícone + título + descrição + ação | — |
| `ThemeToggle` | 🌙/☀️ persistente | — |

Iconografia: emojis na fase 1 (zero dependências); migração planejada para [Lucide](https://lucide.dev) na fase 2, com traço 1.5px.

## 5. Estados de interação

- **Foco**: sempre visível (`outline` coral 2px offset 2px) — acessibilidade não é opcional.
- **Hover**: transições 200ms `cubic-bezier(.4,0,.15,1)`.
- **Loading**: botões mostram texto de progresso ("Enviando…").
- **Vazio**: `EmptyState` com tom acolhedor, nunca tabela vazia crua.
- **Erro**: mensagem humana em pt-BR perto do campo, cor `--danger`.

## 6. Voz e tom (parte do design)

- Saudação por horário ("Bom dia, Mariana!"), nunca "Bem-vindo ao sistema".
- "Sessão", nunca "procedimento". "Você", nunca "o usuário".
- Avisos sensíveis sempre com caminho de ajuda (CVV 188).
- Microcopy de privacidade visível nos formulários (LGPD).
