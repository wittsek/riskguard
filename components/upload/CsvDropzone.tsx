'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Upload } from 'lucide-react';
import { ExportGuideModal } from '@/components/import/ExportGuideModal';
import { cn } from '@/lib/utils';

interface CsvDropzoneProps {
  onText: (text: string, fileName: string) => void;
  className?: string;
  disabled?: boolean;
  showGuide?: boolean;
}

function isHtmlName(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

export function CsvDropzone({ onText, className, disabled, showGuide = true }: CsvDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const readFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const name = file.name.toLowerCase();
      const typedCsv = file.type.includes('csv') || file.type.includes('text');
      const looksCsv = name.endsWith('.csv') || typedCsv;
      const looksHtml = isHtmlName(file.name);
      if (!looksCsv && !looksHtml && file.type && !file.type.includes('text')) {
        setLocalError('Please drop a .csv trade history export (not Excel-only .xlsx).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        if (!text.trim()) {
          setLocalError('That file is empty.');
          return;
        }
        setLocalError(null);
        onText(text, file.name);
      };
      reader.onerror = () => setLocalError('Could not read that file.');
      reader.readAsText(file);
    },
    [onText],
  );

  return (
    <div className={cn('space-y-2', className)}>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors',
          dragOver
            ? 'border-emerald-400 bg-emerald-500/10'
            : 'border-white/15 bg-zinc-900/40 hover:border-emerald-400/50 hover:bg-zinc-900/70',
          disabled && 'pointer-events-none opacity-50',
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          readFile(event.dataTransfer.files[0]);
        }}
      >
        <Upload className="h-8 w-8 text-emerald-400" />
        <div>
          <p className="text-sm font-medium text-zinc-100">Drop your broker CSV here</p>
          <p className="mt-1 text-xs text-zinc-500">
            MT4, MT5, cTrader, or Myfxbook history. Parsed in the browser. Sign in to save a copy.
          </p>
        </div>
        <input
          type="file"
          accept=".csv,.html,.htm,text/csv,text/html"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            readFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </label>
      {showGuide ? (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-emerald-400 underline-offset-4 hover:underline"
            onClick={() => setGuideOpen(true)}
          >
            <BookOpen className="h-3.5 w-3.5" />
            How to export from MT4/MT5
          </button>
          <Link href="/import" className="text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">
            Full cookbook
          </Link>
        </div>
      ) : null}
      {localError ? <p className="text-sm text-rose-400">{localError}</p> : null}
      {guideOpen ? <ExportGuideModal onClose={() => setGuideOpen(false)} /> : null}
    </div>
  );
}
