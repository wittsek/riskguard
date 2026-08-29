import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <MarketingHeader />
      <main className="mx-auto flex max-w-5xl justify-center px-6 py-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
