# 📱 future-mobile — Aplicativo Mobile (Fase 4)

Reservado para o app mobile do paciente. **Não desenvolver antes da Fase 4 do roadmap** — o portal web já é mobile-first e cobre 100% dos casos de uso iniciais.

## Stack planejada

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | **Expo (React Native) + TypeScript** | Reaproveita conhecimento React do monorepo; build na nuvem gratuita (EAS free tier) |
| Navegação | Expo Router | Mesmo modelo de rotas por arquivo do Next.js |
| Estilo | NativeWind | Tailwind no React Native → tokens do design system reutilizados |
| Dados/Auth | `@supabase/supabase-js` | Mesmo backend, mesmas RLS — zero retrabalho de API |
| Push | Expo Notifications | Lembretes de sessão 24h/2h |

## O que será reaproveitado deste monorepo

- `packages/shared` — tipos, formatadores e constantes da marca (100%)
- `packages/design-system` — tokens de cor/tipografia (adaptados a StyleSheet via NativeWind)
- Backend inteiro: Supabase Auth + RLS + tabelas (100%)

## Escopo do MVP mobile

1. Login (Supabase Auth + biometria local)
2. Próxima sessão + botão "Entrar na sessão" (deep link Meet/Zoom)
3. Notificações push de lembrete
4. Pagamentos e recibos (visualização)
5. Mensagens com a clínica

Ver plano completo em [`docs/13-mobile.md`](../../docs/13-mobile.md).
