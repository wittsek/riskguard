'use client';

import type { ViolationType } from '@/types';
import { VIOLATION_LABELS } from '@/types';
import { Badge } from '@/components/ui/badge';

function variantFor(type: ViolationType) {
  if (type === 'REVENGE_TRADE') return 'revenge' as const;
  if (type === 'NO_OR_REMOVED_SL' || type === 'SL_REMOVED') return 'sl' as const;
  if (type === 'NEWS_TRADING') return 'news' as const;
  if (type === 'OVER_LEVERAGE') return 'leverage' as const;
  return 'default' as const;
}

export function ViolationBadge({ type }: { type: ViolationType }) {
  return <Badge variant={variantFor(type)}>{VIOLATION_LABELS[type]}</Badge>;
}
