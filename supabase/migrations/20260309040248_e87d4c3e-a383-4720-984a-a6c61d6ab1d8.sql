-- Create user_subscriptions table to track PRO status
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow DEV users to manage all subscriptions
CREATE POLICY "DEV users can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'dev'))
WITH CHECK (public.has_role(auth.uid(), 'dev'));

-- Allow users to read their own subscription
CREATE POLICY "Users can read own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();