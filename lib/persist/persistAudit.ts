import type { SupabaseClient, User } from '@supabase/supabase-js';
import { buildRuleBasedCoaching, generateCoaching } from '@/lib/ai';
import { defaultLintContext, lintTrades } from '@/lib/analytics';
import { annotationsFromDbRows, type AnnotationMap } from '@/lib/trades/annotations';
import type {
  CoachingNotes,
  Database,
  LatestAuditResponseBody,
  LintResult,
  NormalizedTradeInput,
  TablesInsert,
} from '@/types';
import {
  IMPORTED_ACCOUNT_NAME,
  importedAccountInsert,
  isMissingAnnotationColumnError,
  mapAnnotatedTradesToInserts,
  mapDbTradesToNormalized,
  mapLintResultToAuditInsert,
  stripAnnotationColumns,
} from './mapAuditToDb';

const TRADE_CHUNK = 200;

type Client = SupabaseClient<Database>;

function profileName(user: User): string | null {
  const meta = user.user_metadata ?? {};
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) return meta.full_name.trim();
  if (typeof meta.name === 'string' && meta.name.trim()) return meta.name.trim();
  return null;
}

async function coachingForResult(result: LintResult): Promise<CoachingNotes> {
  try {
    return await generateCoaching(result);
  } catch {
    return buildRuleBasedCoaching(result);
  }
}

async function insertTradeChunk(supabase: Client, chunk: TablesInsert<'trades'>[]) {
  const first = await supabase.from('trades').insert(chunk);
  if (!first.error) return;
  if (!isMissingAnnotationColumnError(first.error.message)) {
    throw new Error(first.error.message);
  }
  const retry = await supabase.from('trades').insert(chunk.map(stripAnnotationColumns));
  if (retry.error) throw new Error(retry.error.message);
}

export async function persistLintedAudit(
  supabase: Client,
  user: User,
  trades: NormalizedTradeInput[],
  annotations: AnnotationMap = {},
): Promise<{ accountId: string; reportId: string; result: LintResult; coaching: CoachingNotes }> {
  const result = lintTrades(trades, defaultLintContext());
  const coaching = await coachingForResult(result);

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: profileName(user) }, { onConflict: 'id' });
  if (profileError) throw new Error(profileError.message);

  const { data: existing, error: findError } = await supabase
    .from('trading_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('account_name', IMPORTED_ACCOUNT_NAME)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  let accountId = existing?.id;
  if (!accountId) {
    const { data: created, error: createError } = await supabase
      .from('trading_accounts')
      .insert(importedAccountInsert(user.id))
      .select('id')
      .single();
    if (createError || !created) {
      throw new Error(createError?.message ?? 'Could not create trading account.');
    }
    accountId = created.id;
  }

  const { error: deleteError } = await supabase.from('trades').delete().eq('account_id', accountId);
  if (deleteError) throw new Error(deleteError.message);

  const inserts = mapAnnotatedTradesToInserts(result.annotated_trades, accountId, annotations);
  for (let i = 0; i < inserts.length; i += TRADE_CHUNK) {
    await insertTradeChunk(supabase, inserts.slice(i, i + TRADE_CHUNK));
  }

  const { data: report, error: reportError } = await supabase
    .from('audit_reports')
    .insert(mapLintResultToAuditInsert(result, accountId, coaching.summary))
    .select('id')
    .single();
  if (reportError || !report) {
    throw new Error(reportError?.message ?? 'Could not save audit report.');
  }

  return { accountId, reportId: report.id, result, coaching };
}

export async function loadLatestSavedAudit(
  supabase: Client,
  user: User,
): Promise<LatestAuditResponseBody | null> {
  const { data: accounts, error: accountsError } = await supabase
    .from('trading_accounts')
    .select('id')
    .eq('user_id', user.id);
  if (accountsError) throw new Error(accountsError.message);
  if (!accounts?.length) return null;

  const { data: report, error: reportError } = await supabase
    .from('audit_reports')
    .select('id, account_id, created_at, ai_coaching_summary')
    .in(
      'account_id',
      accounts.map((row) => row.id),
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reportError) throw new Error(reportError.message);
  if (!report?.account_id) return null;

  const { data: rows, error: tradesError } = await supabase
    .from('trades')
    .select('*')
    .eq('account_id', report.account_id)
    .order('open_time', { ascending: true });
  if (tradesError) throw new Error(tradesError.message);

  const normalized = mapDbTradesToNormalized(rows ?? []);
  if (normalized.length === 0) return null;

  const result = lintTrades(normalized, defaultLintContext());
  let coaching: CoachingNotes;
  let storedSummary = report.ai_coaching_summary;

  if (storedSummary?.trim()) {
    coaching = { summary: storedSummary, source: 'saved' };
  } else {
    coaching = await coachingForResult(result);
    storedSummary = coaching.summary;
    await supabase
      .from('audit_reports')
      .update({ ai_coaching_summary: coaching.summary })
      .eq('id', report.id);
  }

  return {
    accountId: report.account_id,
    reportId: report.id,
    fileName: 'Saved audit',
    format: 'Unknown',
    parsedAt: report.created_at,
    trades: normalized,
    result,
    coaching,
    ai_coaching_summary: storedSummary,
    annotations: annotationsFromDbRows(rows ?? []),
  };
}
