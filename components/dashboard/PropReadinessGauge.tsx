'use client';

import { cn } from '@/lib/utils';

interface PropReadinessGaugeProps {
  score: number;
  className?: string;
}

function tone(score: number) {
  if (score >= 80) return { stroke: '#34d399', label: 'Prop-ready' };
  if (score >= 50) return { stroke: '#fbbf24', label: 'Needs work' };
  return { stroke: '#fb7185', label: 'Not ready' };
}

export function PropReadinessGauge({ score, className }: PropReadinessGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 68;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - clamped / 100);
  const { stroke, label } = tone(clamped);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg viewBox="0 0 180 180" className="h-44 w-44">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
        />
        <text
          x="90"
          y="86"
          textAnchor="middle"
          className="fill-zinc-50"
          style={{ fontSize: 36, fontWeight: 600 }}
        >
          {clamped}
        </text>
        <text x="90" y="110" textAnchor="middle" className="fill-zinc-500" style={{ fontSize: 12 }}>
          / 100
        </text>
      </svg>
      <p className="text-sm font-medium" style={{ color: stroke }}>
        {label}
      </p>
      <p className="text-xs text-zinc-500">Prop Readiness Score</p>
    </div>
  );
}
