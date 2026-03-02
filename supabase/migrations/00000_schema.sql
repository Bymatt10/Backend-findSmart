-- users: managed by Supabase Auth (auth.users)

CREATE TABLE public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_system BOOLEAN DEFAULT false
);

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  merchant_name TEXT,
  merchant_hash TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'excel', 'pdf', 'photo')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.merchant_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_hash TEXT NOT NULL UNIQUE,
  merchant_name TEXT,
  category_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_text TEXT NOT NULL,
  insight_type TEXT CHECK (insight_type IN ('spending_alert', 'saving_tip', 'pattern', 'goal_progress')),
  relevance_score DECIMAL(3,2) DEFAULT 0.5,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('excel', 'pdf', 'photo')),
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transaction_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users manage own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own insights" ON public.ai_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own uploads" ON public.file_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_merchant_hash ON public.transactions(merchant_hash);
CREATE INDEX idx_merchant_cache_hash ON public.merchant_cache(merchant_hash);
CREATE INDEX idx_ai_insights_user ON public.ai_insights(user_id, created_at DESC);

-- Seed default categories
INSERT INTO public.categories (name, icon, is_system) VALUES
  ('Alimentación', '🍽️', true),
  ('Transporte', '🚗', true),
  ('Vivienda', '🏠', true),
  ('Entretenimiento', '🎬', true),
  ('Salud', '💊', true),
  ('Educación', '📚', true),
  ('Ropa', '👕', true),
  ('Servicios', '💡', true),
  ('Delivery', '📦', true),
  ('Café', '☕', true),
  ('Supermercado', '🛒', true),
  ('Transferencias', '💸', true),
  ('Otros', '📌', true);
