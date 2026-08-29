'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { EquityPoint } from '@/types';

interface DisciplineComparisonChartProps {
  points: EquityPoint[];
}

export function DisciplineComparisonChart({ points }: DisciplineComparisonChartProps) {
  if (points.length === 0) {
    return <p className="text-sm text-zinc-500">Load trades to plot the equity curves.</p>;
  }

  const data = points.map((point, i) => ({
    label: `#${i + 1}`,
    actual: Number(point.actual_equity.toFixed(2)),
    disciplined: Number(point.disciplined_equity.toFixed(2)),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#71717a"
            fontSize={11}
            tickLine={false}
            tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}`}
            width={72}
          />
          <Tooltip
            contentStyle={{
              background: '#18181b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: '#fafafa',
            }}
            formatter={(value) =>
              `$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#fb7185"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="disciplined"
            name="Disciplined"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
