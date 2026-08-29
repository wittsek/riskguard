'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { toBlob, toPng } from 'html-to-image';
import { Copy, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViralAuditCard } from '@/components/share/ViralAuditCard';
import {
  AUDIT_CARD_FILENAME,
  AUDIT_CARD_HEIGHT,
  AUDIT_CARD_WIDTH,
  buildAuditCardModel,
} from '@/lib/share/auditCard';
import { useAuditSession } from '@/lib/store/audit-session';

const PREVIEW_WIDTH = 360;

interface ShareAuditModalProps {
  onClose: () => void;
}

function canCopyImage() {
  return typeof window !== 'undefined' && Boolean(navigator.clipboard?.write) && typeof ClipboardItem !== 'undefined';
}

const EXPORT_OPTIONS = {
  width: AUDIT_CARD_WIDTH,
  height: AUDIT_CARD_HEIGHT,
  pixelRatio: 1,
  cacheBust: true,
  backgroundColor: '#09090b',
  style: {
    transform: 'none',
    left: '0',
    top: '0',
  },
} as const;

async function capturePng(node: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready;
  return toPng(node, EXPORT_OPTIONS);
}

async function captureBlob(node: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready;
  return toBlob(node, EXPORT_OPTIONS);
}

export function ShareAuditModal({ onClose }: ShareAuditModalProps) {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const { session, loadSample } = useAuditSession();
  const [busy, setBusy] = useState<'idle' | 'download' | 'copy'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const model = session ? buildAuditCardModel(session.result) : null;
  const scale = PREVIEW_WIDTH / AUDIT_CARD_WIDTH;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = useCallback(async () => {
    if (!cardRef.current) return;
    setBusy('download');
    setMessage(null);
    try {
      const dataUrl = await capturePng(cardRef.current);
      const link = document.createElement('a');
      link.download = AUDIT_CARD_FILENAME;
      link.href = dataUrl;
      link.click();
      setMessage('Saved riskguard-audit.png');
    } catch {
      setMessage('Could not export the card. Try again.');
    } finally {
      setBusy('idle');
    }
  }, []);

  const copy = useCallback(async () => {
    if (!cardRef.current) return;
    if (!canCopyImage()) {
      setMessage('Copy image is not supported here — download the PNG instead.');
      return;
    }
    setBusy('copy');
    setMessage(null);
    try {
      const blobPromise = captureBlob(cardRef.current).then((blob) => {
        if (!blob) throw new Error('empty export');
        return blob;
      });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
      setMessage('Image copied');
    } catch {
      setMessage('Could not copy the image. Download the PNG instead.');
    } finally {
      setBusy('idle');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              Share / Export card
            </h2>
            <p className="text-sm text-zinc-500">Portrait PNG for X, Instagram, or Discord.</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {model ? (
          <div className="mt-5 space-y-5">
            <div
              className="mx-auto overflow-hidden rounded-xl border border-white/10"
              style={{ width: PREVIEW_WIDTH, height: AUDIT_CARD_HEIGHT * scale }}
            >
              <div
                style={{
                  width: AUDIT_CARD_WIDTH,
                  height: AUDIT_CARD_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <ViralAuditCard ref={cardRef} model={model} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void download()} disabled={busy !== 'idle'}>
                <Download className="h-4 w-4" />
                {busy === 'download' ? 'Exporting…' : 'Download PNG'}
              </Button>
              <Button variant="outline" onClick={() => void copy()} disabled={busy !== 'idle'}>
                <Copy className="h-4 w-4" />
                {busy === 'copy' ? 'Copying…' : 'Copy image'}
              </Button>
            </div>
            {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-400">
              Load sample trades or upload a CSV first. The card uses the current session lint — no
              account required.
            </p>
            <Button onClick={() => loadSample()}>Load sample trades</Button>
          </div>
        )}
      </div>
    </div>
  );
}
