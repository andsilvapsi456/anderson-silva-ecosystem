# 13 · Plano de Evolução — Aplicativo Mobile (Fase 4)

## Por que depois

O portal já é **mobile-first** (tab bar inferior, toques generosos, layouts fluidos) e cobre 100% dos casos de uso. O app nativo entra quando agregar o que a web não dá: **push notifications confiáveis** e **biometria**.

## Stack

| Camada | Escolha | Razão |
|---|---|---|
| Framework | **Expo SDK (React Native) + TypeScript** | Mesmo paradigma React; EAS Build free tier; OTA updates |
| Rotas | Expo Router | File-based como o Next — curva zero |
| Estilo | NativeWind | Tailwind + tokens do design system reaproveitados |
| Backend | Supabase JS (o mesmo) | **Zero novas APIs** — RLS já protege tudo |
| Push | Expo Notifications | Lembrete 24h/2h, aviso de cobrança |
| Segurança | expo-local-authentication + SecureStore | Biometria + tokens cifrados |

## Reuso do monorepo

```
apps/future-mobile/        ← expo init aqui (workspace já previsto)
  reusa @as/shared          100% (tipos, formatadores, marca)
  reusa @as/design-system   tokens via NativeWind preset
  reusa backend Supabase    100% (auth, RLS, storage, realtime)
  @as/ui                    não reusa (DOM) — recriar 8 componentes em RN
```

## Escopo do MVP (6–8 semanas)

1. **Login** — Supabase Auth + biometria no retorno
2. **Home** — próxima sessão + "Entrar na sessão" (deep link Meet/Zoom)
3. **Push** — lembretes de sessão e avisos da clínica
4. **Sessões** — histórico com status
5. **Pagamentos/recibos** — visualizar e baixar
6. **Mensagens** — canal seguro com realtime

Fora do MVP: prontuário (web só), financeiro completo, agenda da equipe.

## Distribuição

- **Fase 4.0**: distribuição interna via Expo (link direto, custo zero)
- **Fase 4.1**: lojas — Google Play (US$ 25 único) e App Store (US$ 99/ano) — únicos custos novos
- Alternativa intermediária: **PWA** do portal (manifest + service worker) dá ícone na home e push no Android sem lojas — implementável na Fase 2 em ~1 dia

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Revisão da Apple para apps de saúde | App é "companheiro do paciente" (agenda/pagamentos), sem conteúdo clínico |
| Push de conteúdo sensível | Notificações nunca citam terapia: "Você tem um compromisso amanhã às 14h" |
| Manutenção de 2 plataformas | Expo + monorepo: uma base, builds para iOS/Android |
