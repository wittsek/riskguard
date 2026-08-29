'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SessionStats } from '@/types';
import { formatWinRate } from '@/lib/utils';

interface SessionWinRateChartProps {
  sessions: SessionStats[];
}

export function SessionWinRateChart({ sessions }: SessionWinRateChartProps) {
  const data = sessions.map((session) => ({
    name: session.label,
    winRate: Number((session.win_rate * 100).toFixed(1)),
    trades: session.trades,
    pnl: session.pnl,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: '#fafafa',
            }}
            formatter={(value, _name, item) => {
              const payload = item?.payload as { trades?: number } | undefined;
              return [`${value ?? 0}% wr · ${payload?.trades ?? 0} trades`, 'Session'];
            }}
          />
          <Bar dataKey="winRate" fill="#34d399" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SessionWinRateLegend({ sessions }: SessionWinRateChartProps) {
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
      {sessions.map((session) => (
        <li key={session.session}>
          {session.label}: {formatWinRate(session.win_rate)} · {session.pnl >= 0 ? '+' : ''}
          {session.pnl.toFixed(0)}
        </li>
      ))}
    </ul>
  );
}
