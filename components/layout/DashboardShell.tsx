'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthNav } from '@/components/layout/AuthNav';
import { PRICING_PATH } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/audit', label: 'Audit' },
  { href: '/review', label: 'Review' },
  { href: '/trades', label: 'Trades' },
  { href: '/import', label: 'Import' },
  { href: '/settings', label: 'Settings' },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-emerald-400">
            RiskGuard AI
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center gap-1">
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm',
                      active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href={PRICING_PATH}
              className="hidden text-xs text-zinc-500 hover:text-white sm:inline"
            >
              Pricing
            </Link>
            <AuthNav />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
