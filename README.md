# Ozelo

App de acompanhamento para usuários de medicamentos GLP-1 (Ozempic, Mounjaro, Wegovy): medicação, alimentação, sintomas, controle intestinal, progresso e fotos.

React Native + Expo (Expo Router), Supabase (auth, Postgres, storage) e Stripe (assinatura mensal/anual).

## Setup

```bash
npm install
cp .env.example .env
# preencha EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY e EXPO_PUBLIC_APP_URL em .env

npx expo start
```

Abra no simulador iOS/Android, no Expo Go, ou pressione `w` pra abrir a versão web.

## Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Aplique o schema (tabelas + RLS + bucket de storage privado):

   ```bash
   npx supabase link --project-ref <seu-project-ref>
   npx supabase db push
   ```

   Ou cole o conteúdo de `supabase/migrations/0001_init.sql` no SQL Editor do painel.

3. Configure os segredos das Edge Functions (**nunca** o `.env` do app — essas variáveis são só do servidor):

   ```bash
   npx supabase secrets set --env-file .env
   ```

   (o `.env` deve conter `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — veja `.env.example`)

4. Deploy das Edge Functions:

   ```bash
   npx supabase functions deploy create-checkout-session
   npx supabase functions deploy create-portal-session
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```

5. No painel do Stripe, crie um webhook apontando pra URL da função `stripe-webhook` (eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`) e copie o signing secret pra `STRIPE_WEBHOOK_SECRET`.

## Stripe

Crie dois preços recorrentes no Stripe:

- Mensal: R$ 11,29/mês
- Anual: R$ 7,90/mês, cobrado uma vez por ano (ou seja, R$ 94,80/ano)

Copie os IDs de preço (`price_...`) pra `STRIPE_PRICE_MONTHLY` e `STRIPE_PRICE_ANNUAL`.

## Deploy web (Vercel)

O app exporta uma versão web estática via Expo Router (`app.json` → `web.output: "static"`).

1. Importe o repositório no Vercel (o `vercel.json` já define `buildCommand`/`outputDirectory`).
2. Nas Environment Variables do projeto Vercel, adicione **apenas as variáveis públicas**:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_APP_URL` (a URL do próprio deploy, ex: `https://ozelo.vercel.app`)
3. Cada push na branch principal gera um deploy de produção; pushes em outras branches/PRs geram preview deploys automaticamente (comportamento padrão do Vercel).

As chaves secretas do Stripe e do Supabase (service role) **nunca** vão para o Vercel — elas vivem só nos secrets das Edge Functions do Supabase.

## Estrutura

```
src/
  app/                    rotas (Expo Router)
    (onboarding)/         funil de cadastro
    (auth)/                login
    (tabs)/                dashboard, diário, intestino, sintomas, progresso
    profile.tsx, photos.tsx
  components/
    ui/                    Card, Button, Input, ProgressBar, SegmentedControl...
    charts/                LineChart, BarChart (react-native-svg)
    onboarding/            wrapper de tela do funil
  context/                 AuthProvider, OnboardingContext
  lib/                     supabase.ts, stripe.ts, queries.ts
  constants/theme.ts       design tokens (cores, tipografia, espaçamento)
  types/database.ts        tipos das tabelas do Supabase
supabase/
  migrations/0001_init.sql schema + RLS + bucket de storage
  functions/                Edge Functions (checkout, portal, webhook)
```
