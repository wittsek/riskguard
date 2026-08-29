import type { Metadata } from 'next';
import { ImportPage } from '@/components/import/ImportPage';

export const metadata: Metadata = {
  title: 'MT4 / MT5 import guide · RiskGuard AI',
  description: 'Export closed-position CSV from MetaTrader 4 and 5 for the RiskGuard leak calculator.',
};

export default function Page() {
  return <ImportPage />;
}
