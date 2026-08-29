export function SupabaseSetupMessage() {
  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-zinc-300">
      <p className="font-medium text-amber-200">Supabase is not configured yet.</p>
      <ol className="list-decimal space-y-2 pl-5 text-zinc-400">
        <li>
          Create a project at{' '}
          <a
            className="text-emerald-400 underline-offset-4 hover:underline"
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>
          .
        </li>
        <li>
          In SQL Editor, run{' '}
          <code className="text-zinc-200">supabase/migrations/20260829152200_init_riskguard.sql</code>{' '}
          then{' '}
          <code className="text-zinc-200">
            supabase/migrations/20260829154900_profiles_insert_policy.sql
          </code>
          .
        </li>
        <li>Copy Project URL and anon public key from Project Settings → API.</li>
        <li>
          Create <code className="text-zinc-200">.env.local</code> from{' '}
          <code className="text-zinc-200">.env.local.example</code> and paste the values.
        </li>
        <li>
          Restart the single <code className="text-zinc-200">next dev</code> process on port 3000.
        </li>
      </ol>
      <p className="text-zinc-500">
        The leak calculator still works without keys — saving history requires a project.
      </p>
    </div>
  );
}
