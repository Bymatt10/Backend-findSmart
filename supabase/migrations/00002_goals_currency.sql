-- Añade el campo target_currency a la tabla goals
ALTER TABLE public.goals ADD COLUMN target_currency TEXT DEFAULT 'NIO' CHECK (target_currency IN ('NIO', 'USD'));
