-- Migration: 20261101_user_ratings.sql
-- Description: Sistema de valoración de usuarios (1 a 5 estrellas) con restricción única, 
--              validaciones de integridad, verificación de transacción previa y rate limiting.

-- 1. Tabla de valoraciones de usuario a usuario
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment VARCHAR(500) CHECK (comment IS NULL OR char_length(comment) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un usuario solo puede tener una valoración por entidad/usuario (si vuelve a valorar, se actualiza)
  CONSTRAINT uq_user_ratings_reviewer_target UNIQUE (reviewer_id, target_user_id),
  -- No se puede valorar a uno mismo
  CONSTRAINT check_no_self_rating CHECK (reviewer_id <> target_user_id)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_user_ratings_target ON public.user_ratings(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_reviewer ON public.user_ratings(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_created_at ON public.user_ratings(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Lectura pública de valoraciones" ON public.user_ratings;
CREATE POLICY "Lectura pública de valoraciones"
  ON public.user_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuarios autenticados pueden crear sus valoraciones" ON public.user_ratings;
CREATE POLICY "Usuarios autenticados pueden crear sus valoraciones"
  ON public.user_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id 
    AND auth.uid() <> target_user_id
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia valoración" ON public.user_ratings;
CREATE POLICY "Usuarios pueden actualizar su propia valoración"
  ON public.user_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar su propia valoración" ON public.user_ratings;
CREATE POLICY "Usuarios pueden eliminar su propia valoración"
  ON public.user_ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = reviewer_id);

-- 2. Función para verificar si un usuario es elegible para valorar a otro
-- Requisitos: usuario autenticado, no auto-valoración, y existencia de transacción previa completada
CREATE OR REPLACE FUNCTION public.can_rate_user(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reviewer_id UUID;
  v_has_transaction BOOLEAN := false;
  v_existing_rating public.user_ratings%ROWTYPE;
  v_can_rate BOOLEAN := false;
  v_reason TEXT := NULL;
  v_seconds_since_update INT := NULL;
BEGIN
  v_reviewer_id := auth.uid();

  IF v_reviewer_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_rate', false,
      'reason', 'Debes iniciar sesión para valorar a un usuario.'
    );
  END IF;

  IF v_reviewer_id = p_target_user_id THEN
    RETURN jsonb_build_object(
      'can_rate', false,
      'reason', 'No puedes valorarte a ti mismo.'
    );
  END IF;

  -- Comprobar si existe al menos una transacción completada entre ambos usuarios
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.orders
      WHERE (
        (buyer_id = v_reviewer_id AND seller_id = p_target_user_id)
        OR (buyer_id = p_target_user_id AND seller_id = v_reviewer_id)
      )
      AND status IN ('COMPLETED', 'DELIVERED')
    ) INTO v_has_transaction;
  ELSE
    -- Si la tabla orders no está instalada aún, permitir para compatibilidad
    v_has_transaction := true;
  END IF;

  IF NOT v_has_transaction THEN
    RETURN jsonb_build_object(
      'can_rate', false,
      'reason', 'Solo puedes valorar a este usuario si han completado una compra o venta juntos.'
    );
  END IF;

  -- Obtener valoración previa si existe
  SELECT * INTO v_existing_rating
  FROM public.user_ratings
  WHERE reviewer_id = v_reviewer_id AND target_user_id = p_target_user_id;

  IF FOUND THEN
    v_seconds_since_update := EXTRACT(EPOCH FROM (NOW() - v_existing_rating.updated_at))::INT;
  END IF;

  RETURN jsonb_build_object(
    'can_rate', true,
    'has_rated_before', FOUND,
    'existing_rating', CASE 
      WHEN FOUND THEN jsonb_build_object(
        'rating', v_existing_rating.rating,
        'comment', v_existing_rating.comment,
        'updated_at', v_existing_rating.updated_at
      )
      ELSE NULL
    END,
    'seconds_since_update', v_seconds_since_update
  );
END;
$$;

-- 3. Endpoint RPC: Crear o actualizar valoración con rate limiting y validación de transacción
CREATE OR REPLACE FUNCTION public.upsert_user_rating(
  p_target_user_id UUID,
  p_rating INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reviewer_id UUID;
  v_existing public.user_ratings%ROWTYPE;
  v_trimmed_comment TEXT;
  v_new_id UUID;
  v_has_transaction BOOLEAN := false;
BEGIN
  v_reviewer_id := auth.uid();

  -- 1. Validación de autenticación
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para valorar a un usuario.';
  END IF;

  -- 2. Validación de auto-valoración
  IF v_reviewer_id = p_target_user_id THEN
    RAISE EXCEPTION 'No puedes valorarte a ti mismo.';
  END IF;

  -- 3. Validación de rango 1 a 5
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'La calificación debe estar entre 1 y 5 estrellas.';
  END IF;

  -- 4. Validación de longitud de comentario (máx 500 caracteres)
  v_trimmed_comment := NULLIF(trim(p_comment), '');
  IF v_trimmed_comment IS NOT NULL AND char_length(v_trimmed_comment) > 500 THEN
    RAISE EXCEPTION 'El comentario no puede exceder los 500 caracteres.';
  END IF;

  -- 5. Validación de transacción previa completada
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    SELECT EXISTS (
      SELECT 1 FROM public.orders
      WHERE (
        (buyer_id = v_reviewer_id AND seller_id = p_target_user_id)
        OR (buyer_id = p_target_user_id AND seller_id = v_reviewer_id)
      )
      AND status IN ('COMPLETED', 'DELIVERED')
    ) INTO v_has_transaction;

    IF NOT v_has_transaction THEN
      RAISE EXCEPTION 'Debes haber completado al menos una compra o venta con este usuario para calificarlo.';
    END IF;
  END IF;

  -- 6. Rate Limiting en servidor: Mínimo 30 segundos entre modificaciones del mismo usuario
  SELECT * INTO v_existing
  FROM public.user_ratings
  WHERE reviewer_id = v_reviewer_id AND target_user_id = p_target_user_id;

  IF FOUND THEN
    IF (NOW() - v_existing.updated_at) < INTERVAL '30 seconds' THEN
      RAISE EXCEPTION 'Has calificado recientemente a este usuario. Por favor, espera unos segundos antes de volver a modificar tu voto.';
    END IF;
  END IF;

  -- 7. Inserción o actualización segura (UPSERT)
  INSERT INTO public.user_ratings (
    reviewer_id,
    target_user_id,
    rating,
    comment,
    created_at,
    updated_at
  ) VALUES (
    v_reviewer_id,
    p_target_user_id,
    p_rating,
    v_trimmed_comment,
    NOW(),
    NOW()
  )
  ON CONFLICT (reviewer_id, target_user_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    updated_at = NOW()
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_new_id,
    'rating', p_rating,
    'comment', v_trimmed_comment,
    'updated_at', NOW(),
    'is_update', FOUND
  );
END;
$$;

-- 4. Endpoint RPC: Obtener resumen estadístico de valoraciones
CREATE OR REPLACE FUNCTION public.get_user_rating_summary(p_target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_total INT := 0;
  v_avg NUMERIC(3, 1) := 0.0;
  v_c1 INT := 0;
  v_c2 INT := 0;
  v_c3 INT := 0;
  v_c4 INT := 0;
  v_c5 INT := 0;
BEGIN
  SELECT 
    COUNT(*),
    ROUND(COALESCE(AVG(rating), 0)::numeric, 1),
    COUNT(*) FILTER (WHERE rating = 1),
    COUNT(*) FILTER (WHERE rating = 2),
    COUNT(*) FILTER (WHERE rating = 3),
    COUNT(*) FILTER (WHERE rating = 4),
    COUNT(*) FILTER (WHERE rating = 5)
  INTO 
    v_total, v_avg, v_c1, v_c2, v_c3, v_c4, v_c5
  FROM public.user_ratings
  WHERE target_user_id = p_target_user_id;

  RETURN jsonb_build_object(
    'target_user_id', p_target_user_id,
    'total_ratings', v_total,
    'average_rating', v_avg,
    'distribution', jsonb_build_object(
      '5', jsonb_build_object('count', v_c5, 'percent', CASE WHEN v_total > 0 THEN ROUND((v_c5::numeric / v_total::numeric) * 100) ELSE 0 END),
      '4', jsonb_build_object('count', v_c4, 'percent', CASE WHEN v_total > 0 THEN ROUND((v_c4::numeric / v_total::numeric) * 100) ELSE 0 END),
      '3', jsonb_build_object('count', v_c3, 'percent', CASE WHEN v_total > 0 THEN ROUND((v_c3::numeric / v_total::numeric) * 100) ELSE 0 END),
      '2', jsonb_build_object('count', v_c2, 'percent', CASE WHEN v_total > 0 THEN ROUND((v_c2::numeric / v_total::numeric) * 100) ELSE 0 END),
      '1', jsonb_build_object('count', v_c1, 'percent', CASE WHEN v_total > 0 THEN ROUND((v_c1::numeric / v_total::numeric) * 100) ELSE 0 END)
    )
  );
END;
$$;

-- 5. Endpoint RPC: Listar valoraciones paginadas de un usuario con datos del autor
CREATE OR REPLACE FUNCTION public.get_user_ratings_paginated(
  p_target_user_id UUID,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reviews JSONB;
  v_total INT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.user_ratings
  WHERE target_user_id = p_target_user_id;

  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) INTO v_reviews
  FROM (
    SELECT 
      ur.id,
      ur.reviewer_id,
      ur.target_user_id,
      ur.rating,
      ur.comment,
      ur.created_at,
      ur.updated_at,
      jsonb_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'username', u.username,
        'avatar_url', u.avatar_url,
        'created_at', u.created_at
      ) AS reviewer
    FROM public.user_ratings ur
    LEFT JOIN public.users u ON u.id = ur.reviewer_id
    WHERE ur.target_user_id = p_target_user_id
    ORDER BY ur.created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 50))
    OFFSET GREATEST(0, p_offset)
  ) r;

  RETURN jsonb_build_object(
    'target_user_id', p_target_user_id,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset,
    'items', v_reviews
  );
END;
$$;
