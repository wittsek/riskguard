import Link from 'next/link';
import { Check, Clock } from 'lucide-react';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PRO_MONTHLY_USD,
  PRO_YEARLY_USD,
  REFUND_DAYS,
  REFUND_PROMISE,
  SAMPLE_AUDIT_PATH,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  yearlyEquivalentMonthly,
  yearlySavings,
} from '@/lib/pricing';

const FREE_FEATURES = [
  'Leak calculator forever',
  'One book in the browser',
  'Share / export card',
  'Rule-based coach',
];

const PRO_FEATURES = [
  'Saved audit history',
  'Multiple trading accounts',
  'GPT coach (LLM notes)',
  'Telegram alerts — coming soon',
  'Priority import help',
];

const ACADEMY_FEATURES = [
  'Coach and prop-firm desks',
  'Shared playbooks and reviews',
  'Team seats — details when we launch',
];

export function PricingPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Plans</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Free leak calculator. Pro when you want history.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Stay on <span className="text-zinc-200">free</span> as long as you like. Upgrade to{' '}
            <span className="text-zinc-200">pro</span> for saved audits, multi-account, and the GPT
            coach. <span className="text-zinc-200">academy</span> is coming later for coaches and
            prop firms.
          </p>
        </header>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="text-center sm:text-left">
            <CardDescription>{REFUND_DAYS}-day money-back on Pro</CardDescription>
            <CardTitle className="text-2xl">{REFUND_PROMISE}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400">
            Honest Edgewonk-style guarantee — not a checkout trick. Email{' '}
            <a className="text-emerald-400 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{' '}
            from the address you signed up with. No Stripe on this page yet; start free on{' '}
            {SITE_DOMAIN} and upgrade when payments ship.
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <PlanCard
            tier="free"
            name="Free"
            price="$0"
            cadence="forever"
            description="Run one book in the browser. No account required."
            features={FREE_FEATURES}
            cta={{ href: '/', label: 'Start free' }}
          />
          <PlanCard
            tier="pro"
            name="Pro"
            price={`$${PRO_MONTHLY_USD}`}
            cadence="/ month"
            badge="Most useful"
            description={`Or $${PRO_YEARLY_USD}/year (~$${yearlyEquivalentMonthly()}/mo, save $${yearlySavings()}).`}
            features={PRO_FEATURES}
            highlight
            cta={{ href: '/register', label: 'Sign up for Pro' }}
            footnote={`${REFUND_DAYS}-day money-back. ${REFUND_PROMISE}`}
          />
          <PlanCard
            tier="academy"
            name="Academy"
            price="Coming soon"
            cadence=""
            description="For coaches and prop firms — not for sale yet."
            features={ACADEMY_FEATURES}
          />
        </div>

        <p className="text-center text-sm text-zinc-500">
          See the product first.{' '}
          <Link href={SAMPLE_AUDIT_PATH} className="text-emerald-400 hover:underline">
            Open the public sample audit
          </Link>{' '}
          — no sign-up.
        </p>
      </div>
    </MarketingShell>
  );
}

function PlanCard({
  tier,
  name,
  price,
  cadence,
  description,
  features,
  badge,
  highlight,
  cta,
  footnote,
}: {
  tier: 'free' | 'pro' | 'academy';
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
  cta?: { href: string; label: string };
  footnote?: string;
}) {
  return (
    <Card className={highlight ? 'border-emerald-500/40 bg-emerald-500/5' : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="uppercase tracking-wide">{tier}</CardDescription>
          {badge ? <Badge variant="success">{badge}</Badge> : null}
        </div>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <p className="pt-2">
          <span className="text-3xl font-semibold tracking-tight">{price}</span>
          {cadence ? <span className="ml-1 text-sm text-zinc-500">{cadence}</span> : null}
        </p>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ul className="space-y-2 text-sm text-zinc-300">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {cta ? (
          <Button asChild className="w-full">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            <Clock className="h-4 w-4" />
            Coming soon
          </Button>
        )}
        {footnote ? <p className="text-xs leading-relaxed text-zinc-500">{footnote}</p> : null}
      </CardContent>
    </Card>
  );
}
