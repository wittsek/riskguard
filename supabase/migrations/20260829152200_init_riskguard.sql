-- RiskGuard AI initial schema: profiles, accounts, trades, audit reports.
-- Includes RLS, indexes, check constraints, and auth.users → profiles trigger.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  telegram_chat_id TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'pro', 'academy'))
);

CREATE TABLE public.trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  initial_balance NUMERIC NOT NULL,
  target_firm TEXT,
  max_daily_drawdown_pct NUMERIC NOT NULL DEFAULT 5.0,
  max_total_drawdown_pct NUMERIC NOT NULL DEFAULT 10.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trading_accounts_initial_balance_check
    CHECK (initial_balance > 0),
  CONSTRAINT trading_accounts_target_firm_check
    CHECK (target_firm IS NULL OR target_firm IN ('FTMO', 'FundedNext', 'Custom')),
  CONSTRAINT trading_accounts_daily_dd_check
    CHECK (max_daily_drawdown_pct > 0 AND max_daily_drawdown_pct <= 100),
  CONSTRAINT trading_accounts_total_dd_check
    CHECK (max_total_drawdown_pct > 0 AND max_total_drawdown_pct <= 100)
);

CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  ticket_id TEXT,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  lot_size NUMERIC NOT NULL,
  open_price NUMERIC NOT NULL,
  close_price NUMERIC,
  sl_price NUMERIC,
  tp_price NUMERIC,
  pnl NUMERIC NOT NULL,
  open_time TIMESTAMPTZ NOT NULL,
  close_time TIMESTAMPTZ NOT NULL,
  duration_seconds INT,
  is_rule_violated BOOLEAN NOT NULL DEFAULT FALSE,
  violation_type TEXT,
  CONSTRAINT trades_trade_type_check
    CHECK (trade_type IN ('BUY', 'SELL')),
  CONSTRAINT trades_lot_size_check
    CHECK (lot_size > 0),
  CONSTRAINT trades_open_price_check
    CHECK (open_price > 0),
  CONSTRAINT trades_close_price_check
    CHECK (close_price IS NULL OR close_price > 0),
  CONSTRAINT trades_violation_type_check
    CHECK (
      violation_type IS NULL OR violation_type IN (
        'REVENGE_TRADE',
        'SL_REMOVED',
        'NO_OR_REMOVED_SL',
        'OVER_LEVERAGE',
        'NEWS_TRADING'
      )
    )
);

CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.trading_accounts(id) ON DELETE CASCADE,
  readiness_score INT,
  actual_pnl NUMERIC,
  disciplined_pnl NUMERIC,
  money_lost_to_mistakes NUMERIC,
  top_destructive_habits JSONB,
  ai_coaching_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_reports_readiness_score_check
    CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100))
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_trading_accounts_user_id ON public.trading_accounts (user_id);
CREATE INDEX idx_trades_account_id ON public.trades (account_id);
CREATE INDEX idx_trades_open_time ON public.trades (open_time);
CREATE INDEX idx_trades_account_id_open_time ON public.trades (account_id, open_time);
CREATE INDEX idx_trades_account_id_ticket_id ON public.trades (account_id, ticket_id);
CREATE INDEX idx_trades_symbol ON public.trades (symbol);
CREATE INDEX idx_audit_reports_account_id ON public.audit_reports (account_id);
CREATE INDEX idx_audit_reports_created_at ON public.audit_reports (created_at DESC);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "trading_accounts_select_own"
  ON public.trading_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "trading_accounts_insert_own"
  ON public.trading_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trading_accounts_update_own"
  ON public.trading_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trading_accounts_delete_own"
  ON public.trading_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "trades_select_own"
  ON public.trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = trades.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "trades_insert_own"
  ON public.trades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = trades.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "trades_update_own"
  ON public.trades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = trades.account_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = trades.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "trades_delete_own"
  ON public.trades FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = trades.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "audit_reports_select_own"
  ON public.audit_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = audit_reports.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "audit_reports_insert_own"
  ON public.audit_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = audit_reports.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "audit_reports_update_own"
  ON public.audit_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = audit_reports.account_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = audit_reports.account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "audit_reports_delete_own"
  ON public.audit_reports FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_accounts a
      WHERE a.id = audit_reports.account_id AND a.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
