BEGIN;

CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX favorites_user_created_idx ON public.favorites (user_id, created_at DESC, product_id);
CREATE INDEX favorites_product_idx ON public.favorites (product_id);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.favorites FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;

CREATE POLICY favorites_select_own ON public.favorites
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY favorites_insert_own ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'activo')
  );
CREATE POLICY favorites_delete_own ON public.favorites
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

COMMIT;
