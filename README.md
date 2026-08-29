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

[Login and go](https://getriskguard.com/register) on getriskguard.com. You do not run Docker.

- Cloud save and audit history
- **AI coaching quota in the plan** — you are not wiring your own LLM key
- Hosted Telegram alerts — no 24/7 server of your own
- **$19/month or $149/year**, 14-day refund

**Pro roadmap (not in the code yet — do not treat as shipping):** live prop-firm buffer, live broker sync, Discord alerts.

Copy lives on [`/pricing`](./app/pricing/page.tsx). Constants: [`lib/pricing.ts`](./lib/pricing.ts).

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

**Not here yet:** live broker API, live prop linter, Discord sender, Academy seats/grading, Stripe checkout.

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
| `LLM_API_KEY` (or `OPENAI_API_KEY`) | Optional | LLM notes on `/api/coach` (else rule-based) |
| `LLM_BASE_URL` + `LLM_MODEL` | Optional | Any OpenAI-compatible host (OpenRouter, Ollama, Groq, …). Required model if base URL is set. |
| `TELEGRAM_BOT_TOKEN` | Optional | Alert after a saved audit + `/api/webhook/telegram` |

Never commit `.env.local`. Restart the single `next dev` after changing env.

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
