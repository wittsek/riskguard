import { ViralAuditCard } from '@/components/share/ViralAuditCard';
import { AUDIT_CARD_HEIGHT, AUDIT_CARD_WIDTH, type AuditCardModel } from '@/lib/share/auditCard';

interface AuditCardPreviewProps {
  model: AuditCardModel;
  width?: number;
}

export function AuditCardPreview({ model, width = 360 }: AuditCardPreviewProps) {
  const scale = width / AUDIT_CARD_WIDTH;

  return (
    <div
      className="mx-auto overflow-hidden rounded-xl border border-white/10"
      style={{ width, height: AUDIT_CARD_HEIGHT * scale }}
    >
      <div
        style={{
          width: AUDIT_CARD_WIDTH,
          height: AUDIT_CARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <ViralAuditCard model={model} />
      </div>
    </div>
  );
}
