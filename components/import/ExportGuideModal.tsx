'use client';

import { useEffect, useId } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ExportCookbook } from '@/components/import/ExportCookbook';
import { Button } from '@/components/ui/button';

interface ExportGuideModalProps {
  onClose: () => void;
}

export function ExportGuideModal({ onClose }: ExportGuideModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              How to export from MT4 / MT5
            </h2>
            <p className="text-sm text-zinc-500">
              Closed-position CSV only. No broker auto-sync yet.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-5">
          <ExportCookbook compact />
        </div>
        <div className="mt-6 border-t border-white/10 pt-4">
          <Button asChild variant="outline">
            <Link href="/import" onClick={onClose}>
              Open full cookbook
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
