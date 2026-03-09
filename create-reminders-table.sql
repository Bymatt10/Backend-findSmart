-- Ejecuta esto en el SQL Editor de Supabase para crear la tabla de recordatorios (push notifications)

CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    amount_nio NUMERIC(10, 2) DEFAULT 0,
    amount_usd NUMERIC(10, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) para que cada usuario solo vea sus recordatorios
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can create their own reminders."
    ON public.reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reminders."
    ON public.reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders."
    ON public.reminders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders."
    ON public.reminders FOR DELETE
    USING (auth.uid() = user_id);
