import Link from 'next/link';
import { PRICING_PATH, SAMPLE_AUDIT_PATH } from '@/lib/pricing';
import { AuthNav } from './AuthNav';

export function MarketingHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-emerald-400">
            RiskGuard AI
          </Link>
          <Link href={PRICING_PATH} className="text-xs text-zinc-400 hover:text-white">
            Pricing
          </Link>
          <Link
            href={SAMPLE_AUDIT_PATH}
            className="hidden text-xs text-zinc-400 hover:text-white sm:inline"
          >
            Sample audit
          </Link>
          <Link
            href="/import"
            className="hidden text-xs text-zinc-400 hover:text-white md:inline"
          >
            MT4/MT5 import
          </Link>
        </div>
        <AuthNav />
      </div>
    </header>
  );
}
