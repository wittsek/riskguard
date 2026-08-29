'use client';

import { useEffect, useState } from 'react';
import { MAX_NOTE_LENGTH } from '@/lib/trades/annotations';
import { cn } from '@/lib/utils';

export function TradeNoteField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (note: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(Boolean(value));

  useEffect(() => {
    setDraft(value);
    if (value) setOpen(true);
  }, [value]);

  function commit() {
    const next = draft.replace(/\s+/g, ' ').trim();
    if (next !== value) onCommit(next);
    else setDraft(value);
    if (!next) setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-w-[10rem] rounded-md border border-dashed border-white/10 px-2 py-1 text-left text-xs text-zinc-600 hover:border-white/20 hover:text-zinc-400"
      >
        Why I took this / what I missed
      </button>
    );
  }

  return (
    <textarea
      value={draft}
      maxLength={MAX_NOTE_LENGTH}
      rows={2}
      autoFocus={!value}
      placeholder="Why I took this / what I missed"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          setDraft(value);
          if (!value) setOpen(false);
          event.currentTarget.blur();
        }
      }}
      className={cn(
        'w-full min-w-[10rem] resize-y rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-xs leading-snug text-zinc-100 placeholder:text-zinc-600',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60 md:resize-none',
      )}
    />
  );
}
