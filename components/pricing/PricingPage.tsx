import type { ReactNode } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { Check, Mail } from 'lucide-react';
import { ProPlanCtas } from '@/components/pricing/ProPlanCtas';
import { MarketingShell } from '@/components/layout/MarketingShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ACADEMY_FEATURES,
  COMMUNITY_FEATURES,
  GITHUB_REPO_URL,
  OPEN_CORE_LABEL,
  PRO_FEATURES,
  PRO_MONTHLY_USD,
  PRO_YEARLY_USD,
  REFUND_DAYS,
  REFUND_PROMISE,
  SAMPLE_AUDIT_PATH,
  SUPPORT_EMAIL,
  academyWaitlistMailto,
  yearlyEquivalentMonthly,
  yearlySavings,
} from '@/lib/pricing';

export function PricingPage() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Plans</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Community is the full linter. Pro is login and go.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Self-host the auditor forever — CSV, Docker, your keys.{' '}
            <span className="text-zinc-200">Cloud Pro</span> is hosted convenience and AI in the
            bill, not a crippled Community. <span className="text-zinc-200">Academy</span> is seats
            and student grading when it ships — waitlist only.
          </p>
        </header>

        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="text-center sm:text-left">
            <CardDescription>{REFUND_DAYS}-day money-back on Pro</CardDescription>
            <CardTitle className="text-2xl">{REFUND_PROMISE}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400">
            Honest guarantee — not a checkout trick. Email{' '}
            <a className="text-emerald-400 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{' '}
            from the address you signed up with. Stripe Checkout is live for Cloud Pro. Community
            stays free — clone the{' '}
            <a className="text-emerald-400 hover:underline" href={GITHUB_REPO_URL}>
              AGPLv3 repo
            </a>
            .
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <PlanCard
            tier="community"
            name="Community"
            price="$0"
            cadence="forever"
            description="Full linter, CSV, Docker / self-host. Your own API keys."
            features={COMMUNITY_FEATURES}
            cta={{ href: '/', label: 'Start free' }}
            extra={
              <Button asChild variant="outline" className="w-full">
                <a href={GITHUB_REPO_URL}>Clone on GitHub</a>
              </Button>
            }
          />
          <PlanCard
            tier="pro"
            name="Cloud Pro"
            price={`$${PRO_MONTHLY_USD}`}
            cadence="/ month"
            badge="Hosted + AI"
            description={`Or $${PRO_YEARLY_USD}/year (~$${yearlyEquivalentMonthly()}/mo, save $${yearlySavings()}). Login and go.`}
            features={PRO_FEATURES}
            highlight
            extra={
              <Suspense fallback={<p className="text-sm text-zinc-500">Loading checkout…</p>}>
                <ProPlanCtas />
              </Suspense>
            }
            footnote={`${REFUND_DAYS}-day money-back. ${REFUND_PROMISE} Stripe handles the card — refunds are by email, not automatic.`}
          />
          <PlanCard
            tier="academy"
            name="Academy"
            price="Coming soon"
            cadence=""
            description="Seats and student grading — not for sale yet."
            features={ACADEMY_FEATURES}
            cta={{ href: academyWaitlistMailto(), label: 'Join the waitlist' }}
            ctaExternal
            footnote="Email only. No checkout, no fake buy button."
          />
        </div>

        <p className="text-center text-sm text-zinc-500">
          See the product first.{' '}
          <Link href={SAMPLE_AUDIT_PATH} className="text-emerald-400 hover:underline">
            Open the public sample audit
          </Link>{' '}
          — no sign-up. {OPEN_CORE_LABEL} on{' '}
          <a href={GITHUB_REPO_URL} className="text-emerald-400 hover:underline">
            GitHub
          </a>
          .
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
  ctaExternal,
  extra,
  footnote,
}: {
  tier: 'community' | 'pro' | 'academy';
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: readonly string[];
  badge?: string;
  highlight?: boolean;
  cta?: { href: string; label: string };
  ctaExternal?: boolean;
  extra?: ReactNode;
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
          <Button asChild className="w-full" variant={tier === 'academy' ? 'outline' : 'default'}>
            {ctaExternal ? (
              <a href={cta.href}>
                {tier === 'academy' ? <Mail className="h-4 w-4" /> : null}
                {cta.label}
              </a>
            ) : (
              <Link href={cta.href}>{cta.label}</Link>
            )}
          </Button>
        ) : null}
        {extra}
        {footnote ? <p className="text-xs leading-relaxed text-zinc-500">{footnote}</p> : null}
      </CardContent>
    </Card>
  );
}
