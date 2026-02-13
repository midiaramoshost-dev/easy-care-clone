
-- Enum for invoice status
CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');

-- Enum for payment method
CREATE TYPE public.payment_method AS ENUM ('stripe', 'mercado_pago', 'pagseguro', 'pix_manual', 'boleto_manual', 'transferencia', 'dinheiro', 'outro');

-- Invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  description TEXT,
  reference_month TEXT, -- e.g. '2026-02'
  external_id TEXT, -- Stripe invoice ID, MP preference ID, etc.
  gateway TEXT, -- which gateway processed it
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payments table (individual payment records)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'outro',
  status TEXT NOT NULL DEFAULT 'completed', -- completed, refunded, failed
  external_transaction_id TEXT, -- transaction ID from gateway
  notes TEXT,
  received_by UUID, -- admin who registered manual payment
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS for invoices
CREATE POLICY "Admins full access invoices" ON public.invoices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);

-- RLS for payments
CREATE POLICY "Admins full access payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);

-- Trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
