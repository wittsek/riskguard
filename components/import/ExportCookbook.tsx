import { COOKBOOK_SECTIONS, GOOD_FILE_CHECKS, SAMPLE_TRADES_HREF } from '@/lib/import/exportCookbook';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ExportCookbook({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-6' : 'space-y-8'}>
      <section id="good-file" className="scroll-mt-24 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
          What a good file looks like
        </h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
          {GOOD_FILE_CHECKS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a
          href={SAMPLE_TRADES_HREF}
          download
          className="inline-flex text-sm text-emerald-400 underline-offset-4 hover:underline"
        >
          Download sample-trades.csv
        </a>
      </section>

      {COOKBOOK_SECTIONS.map((section) => (
        <Card key={section.id} id={section.id} className="scroll-mt-24">
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-emerald-400">{section.platform}</p>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.honestNote ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {section.honestNote}
              </p>
            ) : null}
            {section.warn ? (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {section.warn}
              </p>
            ) : null}
            <ol className="space-y-2">
              {section.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-zinc-300">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Expected columns</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {section.columns.map((column, index) => (
                  <span
                    key={`${section.id}-${column}-${index}`}
                    className="rounded-md border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[11px] text-zinc-300"
                  >
                    {column}
                  </span>
                ))}
              </div>
              {compact ? null : (
                <p className="mt-2 overflow-x-auto font-mono text-[11px] text-zinc-500">
                  {section.exampleHeader}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
