-- Migration: Expand insight types and add metadata
ALTER TABLE public.ai_insights DROP CONSTRAINT IF EXISTS ai_insights_insight_type_check;
ALTER TABLE public.ai_insights ADD CONSTRAINT ai_insights_insight_type_check
  CHECK (insight_type IN ('spending_alert', 'saving_tip', 'pattern', 'trend', 'goal_progress', 'action'));

ALTER TABLE public.ai_insights ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
