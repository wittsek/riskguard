'use client';

import type { DestructiveHabit } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';

const HINTS: Record<string, string> = {
  REVENGE_TRADE: 'Wait 15 minutes after a loss and keep the next size at or below the prior lot.',
  NO_OR_REMOVED_SL: 'Hard-code a 1% stop before entry. No ticket without a stop.',
  SL_REMOVED: 'Do not move or cancel the stop once the trade is live.',
  OVER_LEVERAGE: 'Cut size so notional stays inside your leverage cap.',
  NEWS_TRADING: 'Stay flat through high-impact windows unless the plan allows it.',
};

interface HabitLeakCardsProps {
  habits: DestructiveHabit[];
}

export function HabitLeakCards({ habits }: HabitLeakCardsProps) {
  if (habits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Habit leaks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">No destructive habits flagged on this book.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {habits.map((habit) => (
        <Card key={habit.type}>
          <CardHeader>
            <CardTitle className="text-base">{habit.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-semibold text-rose-300">{formatMoney(habit.money_lost)}</p>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {habit.count} trade{habit.count === 1 ? '' : 's'}
            </p>
            <p className="text-sm text-zinc-400">{HINTS[habit.type]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
