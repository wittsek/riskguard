# RiskGuard

**A trading-behavior auditor — not a fat journal.**

Upload an MT4/MT5 CSV, see what revenge trades and missing stops actually cost you, and score a static prop-firm check. The leak calculator and the full linter run in the browser. No account required.

Hosted product: [getriskguard.com](https://getriskguard.com) · [Pricing](https://getriskguard.com/pricing) · Source: [github.com/wittsek/riskguard](https://github.com/wittsek/riskguard)

**Open-core · [AGPLv3](./LICENSE).** Community is the full auditor. Pro is hosted convenience plus included AI. See [NOTICE](./NOTICE) for what is already open in this tree versus future hosted modules.

## Who it is for

Traders who want a **behavior linter** on a closed book — not another diary with 40 fields. Drop a CSV, get leak dollars, discipline PnL vs actual PnL, and a static FTMO-style readiness score.

## Community (free / OSS)

Clone it, Docker it, bring your own keys. Forever.

- **Full behavior linter** — revenge trading, missing / removed SL, over-leverage, news window (when provided), discipline PnL, static prop-firm check
- **CSV import** — MT4 and MT5 (also cTrader / Myfxbook when the headers match)
- **Leak calculator** — guest, in the browser, no Supabase / LLM / Telegram
- **Docker / self-host** — see below
- Optional: your own Supabase (login + save), any OpenAI-compatible LLM, Telegram bot token

The rule-based coach always works without an API key. An LLM is optional and not tied to OpenAI.

## Cloud Pro (hosted)

[Login and go](https://getriskguard.com/register) on getriskguard.com. You do not run Docker. Stripe Checkout is live.

- Cloud save and audit history
- **AI coaching quota in the plan** — you are not wiring your own LLM key
- Hosted Telegram alerts — no 24/7 server of your own
- **$19/month or $149/year**, 14-day refund (email [hello@getriskguard.com](mailto:hello@getriskguard.com) — not an automatic Stripe refund)

Signed-in **free** still gets the browser calculator (sessionStorage). Persist, load-latest, hosted LLM, and hosted Telegram need Pro. Guests need no login and no Stripe. Community self-host without Stripe env vars is not paywalled.

**Pro roadmap (not in the code yet — do not treat as shipping):** live prop-firm buffer, live broker sync, Discord alerts.

Copy lives on [`/pricing`](./app/pricing/page.tsx). Constants: [`lib/pricing.ts`](./lib/pricing.ts). Checkout: [`app/api/checkout`](./app/api/checkout/route.ts). Webhook: [`app/api/webhook/stripe`](./app/api/webhook/stripe/route.ts).

## Academy

Multi-seat desks and student grading against the linter. **Coming soon — waitlist only, no checkout.** Email [hello@getriskguard.com](mailto:hello@getriskguard.com?subject=Academy%20waitlist).

## Honest inventory of this repo

Already here (AGPLv3, not pretend-closed):

| Area | Where |
| --- | --- |
| Linter + leak + static prop score | `lib/analytics` |
| CSV parsers | `lib/parsers` |
| Rule-based + optional LLM coach | `lib/ai`, `app/api/coach` |
| Session review | `lib/review` |
| Persist / saved audits | `lib/persist`, `app/api/run-audit` |
| Telegram helper | `lib/telegram`, `app/api/webhook/telegram` |

**Not here yet:** live broker API, live prop linter, Discord sender, Academy seats/grading.

The commercial bill is still for hosted convenience, managed LLM quota, and upcoming live infra — not for locking the linter.

## Run locally

Need Node 20+. **One** `next dev` on port 3000.

```bash
cp .env.local.example .env.local   # optional — leave empty for guest mode
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drop a CSV or load the sample book. Guest leak calculator + linter work with no keys.

| Env | Required? | What it unlocks |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Login, cloud save |
| `NEXT_PUBLIC_SITE_URL` | Optional on Vercel | Canonical origin for auth emails (`https://getriskguard.com`). Prevents confirmation links from pointing at localhost. |
| `LLM_API_KEY` (or `OPENAI_API_KEY`) | Optional | LLM notes on `/api/coach` (else rule-based) |
| `LLM_BASE_URL` + `LLM_MODEL` | Optional | Any OpenAI-compatible host (OpenRouter, Ollama, Groq, …). Required model if base URL is set. |
| `TELEGRAM_BOT_TOKEN` | Optional | Alert after a saved audit + `/api/webhook/telegram` |
| `STRIPE_SECRET_KEY` + `STRIPE_PRICE_MONTHLY` + `STRIPE_PRICE_YEARLY` | Optional | Hosted Cloud Pro Checkout. Empty = no paywall (self-host). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional | Shows Checkout / Manage billing in the UI |
| `STRIPE_WEBHOOK_SECRET` | Optional | Verifies `POST /api/webhook/stripe` (never expose to the client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Required with Stripe | Webhook writes `subscription_tier` / `stripe_customer_id`. Server only. |

Never commit `.env.local`. Restart the single `next dev` after changing env.

On hosted login, set **Supabase → Authentication → URL configuration**:

- Site URL: `https://getriskguard.com`
- Redirect URLs: `https://getriskguard.com/auth/callback`, `https://www.getriskguard.com/auth/callback` (if you use www), and optionally `http://localhost:3000/auth/callback` for local work

Then add `NEXT_PUBLIC_SITE_URL=https://getriskguard.com` on Vercel and redeploy. Old emails that already contain `localhost:3000` will not change — request a new confirmation from https://getriskguard.com/register.

## Stripe (Cloud Pro on getriskguard.com)

Apply `supabase/migrations/20260829204500_profiles_stripe_billing.sql` on the hosted Supabase project.

### Stripe Dashboard

1. **Product** → add **Cloud Pro**.
2. **Prices** (same product):
   - Recurring **$19 / month** → copy the Price ID into `STRIPE_PRICE_MONTHLY` (`price_…`)
   - Recurring **$149 / year** → copy the Price ID into `STRIPE_PRICE_YEARLY`
3. **Developers → Webhooks → Add endpoint**
   - URL: `https://getriskguard.com/api/webhook/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the endpoint signing secret into `STRIPE_WEBHOOK_SECRET` (`whsec_…`)
4. **Settings → Billing → Customer portal** — enable it so “Manage billing” works (cancel / update card).
5. Use **live** keys (`sk_live_…` / `pk_live_…`) on Vercel production. Test mode is only for local.

### Vercel env vars

| Name | Notes |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public, baked at build |
| `STRIPE_WEBHOOK_SECRET` | Server only |
| `STRIPE_PRICE_MONTHLY` | Live monthly price ID |
| `STRIPE_PRICE_YEARLY` | Live yearly price ID |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | `https://getriskguard.com` (Checkout success/cancel — never localhost in production) |

Redeploy after adding `NEXT_PUBLIC_*`. Success URL is `/dashboard?upgraded=1`. Cancel URL is `/pricing`. Refunds stay email-only (`hello@getriskguard.com`).

### Local test with Stripe CLI

Keep **one** `next dev` on port 3000. In `.env.local` use **test** keys, test price IDs, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`, and:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Paste the CLI `whsec_…` into `STRIPE_WEBHOOK_SECRET` and restart that single Next process. Do not start a second `next dev`.

```bash
npm test
npx tsc --noEmit
npm run lint
```

## Docker (Community self-host)

Guest calculator and linter need **no** env vars.

```bash
docker compose up --build
```

Then [http://localhost:3000](http://localhost:3000).

To add login / an LLM / Telegram later, put keys in `.env.local` (or export them) and rebuild. `NEXT_PUBLIC_*` is baked at **build** time. Server-only keys (`LLM_API_KEY`, `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`) are read at runtime.

Examples (never commit real keys):

```bash
# OpenAI
LLM_API_KEY=sk-...

# OpenRouter + Ox Alpha
LLM_API_KEY=sk-or-...
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=stealth/ox-alpha

# Ollama
LLM_API_KEY=ollama
LLM_BASE_URL=http://127.0.0.1:11434/v1
LLM_MODEL=llama3.1
```

```bash
docker compose up --build
# optional keys via the environment or a local .env file — see docker-compose.yml
```

Stop with Ctrl+C or `docker compose down`.

## License

[GNU Affero General Public License v3.0](./LICENSE). Community core is AGPLv3. Future proprietary hosted modules (live broker sync, multi-tenant Academy, managed notification fleet) live outside this license **when they exist**. Today, Telegram / coach / persist in this tree are open — see [NOTICE](./NOTICE).
