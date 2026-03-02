-- Migration: Add custom categories and currency fields

-- 1. Update Categories table to support user-specific categories
ALTER TABLE public.categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
-- Also remove the UNIQUE constraint on name so different users can have the same category name (or we make it unique per user)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_user_id_key UNIQUE NULLS NOT DISTINCT (name, user_id);

-- Update RLS for Categories so users can see system categories + their own categories
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Users can read system and own categories" ON public.categories 
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories 
  FOR INSERT WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update own categories" ON public.categories 
  FOR UPDATE USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own categories" ON public.categories 
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- 2. Update Transactions table to support currencies
ALTER TABLE public.transactions ADD COLUMN original_currency TEXT DEFAULT 'NIO' CHECK (original_currency IN ('NIO', 'USD'));
ALTER TABLE public.transactions ADD COLUMN exchange_rate DECIMAL(10,4);
