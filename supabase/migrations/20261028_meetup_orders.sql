-- Migration: 20261028_meetup_orders.sql
-- Description: Flujo Operativo de Compraventa Cara a Cara con QR dinámico

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'PENDING_MEETUP',
      'CANCELLED',
      'NO_SHOW',
      'DELIVERED',
      'COMPLETED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'PENDING_MEETUP',
  qr_token TEXT,
  qr_expires_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_qr_token ON public.orders(qr_token) WHERE qr_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_order_reviewer UNIQUE (order_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_order_reviews_reviewed ON public.order_reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_order ON public.order_reviews(order_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propias órdenes" ON public.orders;
CREATE POLICY "Usuarios pueden ver sus propias órdenes"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Comprador puede crear orden" ON public.orders;
CREATE POLICY "Comprador puede crear orden"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Partes pueden actualizar orden" ON public.orders;
CREATE POLICY "Partes pueden actualizar orden"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Lectura pública de reviews" ON public.order_reviews;
CREATE POLICY "Lectura pública de reviews"
  ON public.order_reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Usuario puede insertar su review" ON public.order_reviews;
CREATE POLICY "Usuario puede insertar su review"
  ON public.order_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE OR REPLACE FUNCTION public.create_meetup_order(
  p_product_id UUID,
  p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_buyer_id UUID;
  v_new_order_id UUID;
BEGIN
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para crear una orden de encuentro';
  END IF;

  IF v_buyer_id = p_seller_id THEN
    RAISE EXCEPTION 'No puedes iniciar una orden de tu propia publicación';
  END IF;

  INSERT INTO public.orders (
    buyer_id,
    seller_id,
    product_id,
    status
  ) VALUES (
    v_buyer_id,
    p_seller_id,
    p_product_id,
    'PENDING_MEETUP'
  )
  RETURNING id INTO v_new_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_new_order_id,
    'status', 'PENDING_MEETUP'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_meetup_qr(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.seller_id != auth.uid() THEN
    RAISE EXCEPTION 'Solo el vendedor puede generar el código QR de entrega';
  END IF;

  IF v_order.status != 'PENDING_MEETUP' THEN
    RAISE EXCEPTION 'Solo se puede generar QR si el encuentro está pendiente (PENDING_MEETUP). Estado actual: %', v_order.status;
  END IF;

  v_token := encode(gen_random_bytes(16), 'hex');
  v_expires_at := NOW() + INTERVAL '5 minutes';

  UPDATE public.orders
  SET 
    qr_token = v_token,
    qr_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'qr_token', v_token,
    'qr_expires_at', v_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_meetup_qr(
  p_order_id UUID,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.buyer_id != auth.uid() THEN
    RAISE EXCEPTION 'Solo el comprador puede escanear y validar el código QR de entrega';
  END IF;

  IF v_order.status != 'PENDING_MEETUP' THEN
    RAISE EXCEPTION 'La orden no está en estado PENDING_MEETUP. Estado actual: %', v_order.status;
  END IF;

  IF v_order.qr_expires_at IS NULL OR NOW() > v_order.qr_expires_at THEN
    RAISE EXCEPTION 'El código QR ha expirado. Pide al vendedor que presione Regenerar QR.';
  END IF;

  IF v_order.qr_token IS NULL OR trim(v_order.qr_token) != trim(p_token) THEN
    RAISE EXCEPTION 'El código QR no coincide o es inválido para esta orden.';
  END IF;

  UPDATE public.orders
  SET 
    status = 'DELIVERED',
    qr_token = NULL,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'DELIVERED',
    'message', 'Entrega validada exitosamente. Procede al pago directo al vendedor.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_payment_received(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.seller_id != auth.uid() THEN
    RAISE EXCEPTION 'Solo el vendedor puede confirmar la recepción del pago';
  END IF;

  IF v_order.status != 'DELIVERED' THEN
    RAISE EXCEPTION 'Solo se puede confirmar el pago una vez que el comprador validó la entrega (DELIVERED). Estado actual: %', v_order.status;
  END IF;

  UPDATE public.orders
  SET 
    status = 'COMPLETED',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id;

  IF v_order.product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'vendido', updated_at = NOW() 
    WHERE id = v_order.product_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'COMPLETED',
    'completed_at', NOW()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.report_order_issue(
  p_order_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();

  IF p_action NOT IN ('NO_SHOW', 'CANCELLED') THEN
    RAISE EXCEPTION 'Acción inválida. Debe ser NO_SHOW o CANCELLED';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_uid != v_order.buyer_id AND v_uid != v_order.seller_id THEN
    RAISE EXCEPTION 'No tienes permisos sobre esta orden';
  END IF;

  IF v_order.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'No se puede cancelar una orden ya completada';
  END IF;

  UPDATE public.orders
  SET 
    status = p_action::public.order_status,
    cancelled_by = v_uid,
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', p_action,
    'cancelled_by', v_uid,
    'cancellation_reason', p_reason
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_order_review(
  p_order_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_uid UUID;
  v_target_user_id UUID;
  v_new_review_id UUID;
BEGIN
  v_uid := auth.uid();

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La calificación debe ser entre 1 y 5 estrellas';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.status != 'COMPLETED' THEN
    RAISE EXCEPTION 'Solo se puede calificar una orden en estado COMPLETED';
  END IF;

  IF v_uid = v_order.buyer_id THEN
    v_target_user_id := v_order.seller_id;
  ELSIF v_uid = v_order.seller_id THEN
    v_target_user_id := v_order.buyer_id;
  ELSE
    RAISE EXCEPTION 'No participas en esta orden';
  END IF;

  INSERT INTO public.order_reviews (
    order_id,
    reviewer_id,
    reviewed_user_id,
    rating,
    comment
  ) VALUES (
    p_order_id,
    v_uid,
    v_target_user_id,
    p_rating,
    trim(p_comment)
  )
  ON CONFLICT (order_id, reviewer_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    created_at = NOW()
  RETURNING id INTO v_new_review_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_new_review_id,
    'rating', p_rating
  );
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
