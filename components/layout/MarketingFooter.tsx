import Link from 'next/link';
import {
  GITHUB_REPO_URL,
  OPEN_CORE_LABEL,
  PRICING_PATH,
  REFUND_DAYS,
  SAMPLE_AUDIT_PATH,
  SITE_DOMAIN,
} from '@/lib/pricing';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">
            RiskGuard AI · {SITE_DOMAIN}
          </p>
          <p className="text-xs text-zinc-600">
            {REFUND_DAYS}-day money-back on Pro. Community linter stays free.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
          <a href={GITHUB_REPO_URL} className="hover:text-white">
            {OPEN_CORE_LABEL}
          </a>
          <Link href={PRICING_PATH} className="hover:text-white">
            Pricing
          </Link>
          <Link href={SAMPLE_AUDIT_PATH} className="hover:text-white">
            Sample audit
          </Link>
          <Link href="/import" className="hover:text-white">
            Import
          </Link>
          <Link href="/" className="hover:text-white">
            Leak calculator
          </Link>
        </nav>
      </div>
    </footer>
  );
}
