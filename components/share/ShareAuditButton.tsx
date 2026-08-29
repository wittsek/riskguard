'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareAuditModal } from '@/components/share/ShareAuditModal';

interface ShareAuditButtonProps {
  variant?: 'default' | 'compact';
}

export function ShareAuditButton({ variant = 'default' }: ShareAuditButtonProps) {
  const [open, setOpen] = useState(false);
  const compact = variant === 'compact';

  return (
    <>
      <Button
        variant={compact ? 'outline' : 'secondary'}
        size={compact ? 'sm' : 'default'}
        onClick={() => setOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        {compact ? 'Share card' : 'Share / Export card'}
      </Button>
      {open ? <ShareAuditModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
