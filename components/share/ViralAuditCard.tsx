'use client';

import { forwardRef } from 'react';
import type { AuditCardChip, AuditCardModel } from '@/lib/share/auditCard';
import {
  AUDIT_CARD_BRAND,
  AUDIT_CARD_HEIGHT,
  AUDIT_CARD_SITE_URL,
  AUDIT_CARD_WIDTH,
} from '@/lib/share/auditCard';

const TONE = {
  ready: { stroke: '#34d399', text: '#6ee7b7' },
  work: { stroke: '#fbbf24', text: '#fcd34d' },
  risk: { stroke: '#fb7185', text: '#fda4af' },
} as const;

const CHIP_TONE: Record<AuditCardChip['kind'], { border: string; bg: string; text: string }> = {
  revenge: { border: 'rgba(251,113,133,0.35)', bg: 'rgba(251,113,133,0.12)', text: '#fda4af' },
  missing_sl: { border: 'rgba(251,191,36,0.35)', bg: 'rgba(251,191,36,0.12)', text: '#fcd34d' },
  worst_session: { border: 'rgba(56,189,248,0.35)', bg: 'rgba(56,189,248,0.12)', text: '#7dd3fc' },
  habit: { border: 'rgba(192,132,252,0.35)', bg: 'rgba(192,132,252,0.12)', text: '#d8b4fe' },
};

interface ViralAuditCardProps {
  model: AuditCardModel;
}

export const ViralAuditCard = forwardRef<HTMLDivElement, ViralAuditCardProps>(function ViralAuditCard(
  { model },
  ref,
) {
  const tone = TONE[model.readinessTone];
  const radius = 78;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - model.readinessScore / 100);

  return (
    <div
      ref={ref}
      data-audit-card
      style={{
        width: AUDIT_CARD_WIDTH,
        height: AUDIT_CARD_HEIGHT,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        padding: '72px 80px 64px',
        display: 'flex',
        flexDirection: 'column',
        color: '#f4f4f5',
        background:
          'radial-gradient(1200px 700px at 12% -10%, rgba(251,113,133,0.18), transparent 55%), radial-gradient(900px 640px at 110% 20%, rgba(16,185,129,0.14), transparent 50%), linear-gradient(180deg, #0c0c0e 0%, #09090b 48%, #07110d 100%)',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 20%, transparent 78%)',
        }}
      />

      <header style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#34d399',
              fontWeight: 600,
            }}
          >
            {AUDIT_CARD_BRAND}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 18, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#71717a' }}>
            Trade leak card
          </p>
        </div>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: '#34d399',
            boxShadow: '0 0 24px rgba(52,211,153,0.7)',
          }}
        />
      </header>

      <section style={{ position: 'relative', marginTop: 72 }}>
        <p
          data-audit-leak
          style={{
            margin: 0,
            fontSize: 148,
            lineHeight: 0.9,
            fontWeight: 700,
            letterSpacing: '-0.05em',
            color: '#fda4af',
          }}
        >
          {model.leakHeadline}
        </p>
        <p
          style={{
            margin: '28px 0 0',
            maxWidth: 820,
            fontSize: 36,
            lineHeight: 1.25,
            color: '#a1a1aa',
            fontWeight: 500,
          }}
        >
          {model.leakCaption}
        </p>
      </section>

      <section
        style={{
          position: 'relative',
          marginTop: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          padding: '28px 32px',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.28)',
        }}
      >
        <svg viewBox="0 0 200 200" width={168} height={168}>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
          />
          <text
            x="100"
            y="98"
            textAnchor="middle"
            fill="#fafafa"
            style={{ fontSize: 44, fontWeight: 700 }}
          >
            {model.readinessScore}
          </text>
          <text x="100" y="126" textAnchor="middle" fill="#71717a" style={{ fontSize: 16 }}>
            / 100
          </text>
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 16, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a' }}>
            Prop readiness
          </p>
          <p data-audit-readiness style={{ margin: '8px 0 0', fontSize: 40, fontWeight: 600, color: tone.text }}>
            {model.readinessLabel}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: 20, color: '#a1a1aa' }}>
            {model.tradeCount} trade{model.tradeCount === 1 ? '' : 's'} audited
          </p>
        </div>
      </section>

      <section style={{ position: 'relative', marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {model.chips.length === 0 ? (
          <span
            style={{
              padding: '14px 22px',
              borderRadius: 999,
              border: '1px solid rgba(52,211,153,0.28)',
              background: 'rgba(52,211,153,0.1)',
              color: '#6ee7b7',
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            Clean book
          </span>
        ) : (
          model.chips.map((chip) => {
            const colors = CHIP_TONE[chip.kind];
            return (
              <span
                key={`${chip.kind}-${chip.label}`}
                data-audit-chip
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 22px',
                  borderRadius: 999,
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {chip.label}
                <span style={{ color: '#d4d4d8', fontWeight: 500 }}>{chip.detail}</span>
              </span>
            );
          })
        )}
      </section>

      <section
        style={{
          position: 'relative',
          marginTop: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        <PnlBox label="Actual PnL" value={model.actualPnl} />
        <PnlBox label="Disciplined PnL" value={model.disciplinedPnl} accent />
      </section>
      <p style={{ position: 'relative', margin: '18px 0 0', fontSize: 20, color: '#71717a' }}>{model.pnlDelta}</p>

      <footer
        style={{
          position: 'relative',
          marginTop: 36,
          paddingTop: 28,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em' }}>{AUDIT_CARD_BRAND}</p>
        <p style={{ margin: 0, fontSize: 20, color: '#71717a' }}>{AUDIT_CARD_SITE_URL}</p>
      </footer>
    </div>
  );
});

function PnlBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      style={{
        padding: '22px 26px',
        borderRadius: 22,
        border: '1px solid rgba(255,255,255,0.08)',
        background: accent ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
      }}
    >
      <p style={{ margin: 0, fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#71717a' }}>
        {label}
      </p>
      <p style={{ margin: '8px 0 0', fontSize: 32, fontWeight: 600, color: accent ? '#6ee7b7' : '#e4e4e7' }}>{value}</p>
    </div>
  );
}
