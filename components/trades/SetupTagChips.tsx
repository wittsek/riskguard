'use client';

import { useState } from 'react';
import { SETUP_TAG_PRESETS } from '@/lib/trades/annotations';
import { cn } from '@/lib/utils';

export function SetupTagChips({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const selected = new Set(tags.map((tag) => tag.toLowerCase()));
  const custom = tags.filter(
    (tag) => !SETUP_TAG_PRESETS.some((preset) => preset.toLowerCase() === tag.toLowerCase()),
  );

  function toggle(tag: string) {
    const key = tag.toLowerCase();
    if (selected.has(key)) {
      onChange(tags.filter((item) => item.toLowerCase() !== key));
      return;
    }
    onChange([...tags, tag]);
  }

  function addCustom() {
    const next = draft.replace(/\s+/g, ' ').trim();
    setDraft('');
    setAdding(false);
    if (!next) return;
    toggle(next);
  }

  return (
    <div className="flex min-w-[11rem] flex-wrap items-center gap-1">
      {SETUP_TAG_PRESETS.map((preset) => {
        const on = selected.has(preset.toLowerCase());
        return (
          <button
            key={preset}
            type="button"
            onClick={() => toggle(preset)}
            className={cn(
              'rounded-md border px-1.5 py-0.5 text-[10px] leading-4',
              on
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                : 'border-white/10 bg-transparent text-zinc-600 hover:border-white/20 hover:text-zinc-300',
            )}
          >
            {preset}
          </button>
        );
      })}
      {custom.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className="rounded-md border border-sky-500/30 bg-sky-500/15 px-1.5 py-0.5 text-[10px] leading-4 text-sky-200"
          title="Remove custom tag"
        >
          {tag} ×
        </button>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          maxLength={32}
          placeholder="Custom"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={addCustom}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
            if (event.key === 'Escape') {
              setDraft('');
              setAdding(false);
            }
          }}
          className="h-5 w-20 rounded border border-white/15 bg-black/50 px-1 text-[10px] text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-md border border-dashed border-white/15 px-1.5 py-0.5 text-[10px] leading-4 text-zinc-500 hover:text-zinc-300"
        >
          +
        </button>
      )}
    </div>
  );
}
