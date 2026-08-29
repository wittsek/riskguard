import { MarketingFooter } from './MarketingFooter';
import { MarketingHeader } from './MarketingHeader';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
