-- Lightweight journal fields on the existing trade log (not a separate journal product).
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS setup_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_trades_setup_tags ON public.trades USING GIN (setup_tags);
