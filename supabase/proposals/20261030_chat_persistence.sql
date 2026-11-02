-- SQL ÚNICO FINAL PARA REVISIÓN DEL ADMINISTRADOR (contrato v1, 2026-10-31). NO EJECUTADO.
-- Se reutiliza este archivo; no hay otra migración de chat que deba aplicarse.
-- Instrucciones exactas: COORDINACION_INTEGRANTE_2_CHAT.md, sección Administrador.
-- Fuera de migrations para impedir aplicación automática.
-- Coordinar con el integrante de chat y el responsable de Supabase antes de mover/aplicar.
-- Si ya existe un chat con otros nombres/esquema, adaptar el cliente a ese contrato.
-- Requiere products(id uuid, seller_id uuid, status) y Auth existentes.
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.products') IS NULL OR to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'Faltan products o Auth; revisar el contrato antes de habilitar chat';
  END IF;
  IF to_regclass('public.chat_conversations') IS NOT NULL OR to_regclass('public.chat_messages') IS NOT NULL THEN
    RAISE EXCEPTION 'Ya existe una tabla del contrato: no sobrescribir ni crear otra estructura. Revisar si la migración ya se aplicó';
  END IF;
  IF to_regclass('public.conversations') IS NOT NULL AND to_regclass('public.messages') IS NOT NULL THEN
    RAISE EXCEPTION 'Existe el par conversations/messages. Confirmar el contrato del Integrante 2 antes de crear tablas paralelas';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE EXCEPTION 'Falta la publicación supabase_realtime. El administrador debe revisar Realtime antes de aplicar este SQL';
  END IF;
END;
$$;

CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT chat_distinct_participants CHECK (buyer_id <> seller_id),
  CONSTRAINT chat_conversation_identity UNIQUE (product_id, buyer_id, seller_id)
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL CHECK (char_length(client_id) BETWEEN 8 AND 100),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000 AND body ~ '[^[:space:]]'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT chat_message_retry_identity UNIQUE (conversation_id, sender_id, client_id)
);

CREATE INDEX chat_buyer_inbox ON public.chat_conversations(buyer_id, updated_at DESC);
CREATE INDEX chat_seller_inbox ON public.chat_conversations(seller_id, updated_at DESC);
CREATE INDEX chat_message_history ON public.chat_messages(conversation_id, created_at DESC, id DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.chat_conversations, public.chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.chat_conversations, public.chat_messages TO authenticated;
-- No se permite falsificar id/fecha, editar mensajes, borrar historia ni cambiar participantes.
GRANT INSERT (conversation_id, sender_id, client_id, body) ON public.chat_messages TO authenticated;

CREATE POLICY chat_participants_read ON public.chat_conversations FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = buyer_id OR (SELECT auth.uid()) = seller_id);

CREATE POLICY chat_participants_read_messages ON public.chat_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id
  AND ((SELECT auth.uid()) = c.buyer_id OR (SELECT auth.uid()) = c.seller_id)
));

CREATE POLICY chat_participant_sends_as_self ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()) AND EXISTS (
  SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id
  AND ((SELECT auth.uid()) = c.buyer_id OR (SELECT auth.uid()) = c.seller_id)
));

-- Serializar INSERT por conversación mantiene el orden del cursor incluso con transacciones
-- concurrentes. El cliente no puede elegir created_at; el reloj queda monotónico por chat.
CREATE FUNCTION public.chat_prepare_message() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_previous timestamptz;
BEGIN
  SELECT updated_at INTO v_previous FROM public.chat_conversations
  WHERE id = NEW.conversation_id AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversación no disponible' USING ERRCODE = '42501'; END IF;
  NEW.created_at := greatest(clock_timestamp(), v_previous + interval '1 microsecond');
  RETURN NEW;
END;
$$;
CREATE TRIGGER chat_prepare_new_message BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_prepare_message();

CREATE FUNCTION public.chat_get_or_create_conversation(p_product_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_product public.products%ROWTYPE;
  v_conversation public.chat_conversations%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticación requerida' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_product FROM public.products WHERE id = p_product_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Publicación no disponible'; END IF;
  IF v_product.seller_id = v_user THEN RAISE EXCEPTION 'No podés iniciar un chat con vos mismo'; END IF;

  SELECT * INTO v_conversation FROM public.chat_conversations
  WHERE product_id = p_product_id AND buyer_id = v_user AND seller_id = v_product.seller_id;
  IF FOUND THEN RETURN to_jsonb(v_conversation); END IF;
  IF v_product.status IS DISTINCT FROM 'activo' THEN RAISE EXCEPTION 'Publicación no disponible'; END IF;

  INSERT INTO public.chat_conversations(product_id, buyer_id, seller_id)
  VALUES (p_product_id, v_user, v_product.seller_id)
  ON CONFLICT (product_id, buyer_id, seller_id) DO NOTHING;
  -- Otro dispositivo puede haber creado la conversación en paralelo.
  SELECT * INTO STRICT v_conversation FROM public.chat_conversations
  WHERE product_id = p_product_id AND buyer_id = v_user AND seller_id = v_product.seller_id;
  RETURN to_jsonb(v_conversation);
END;
$$;

CREATE FUNCTION public.chat_send_message(p_conversation_id uuid, p_client_id text, p_body text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_user uuid := auth.uid();
  v_message public.chat_messages%ROWTYPE;
  v_body text := btrim(p_body);
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Autenticación requerida' USING ERRCODE = '42501'; END IF;
  IF p_client_id IS NULL OR char_length(p_client_id) NOT BETWEEN 8 AND 100 THEN RAISE EXCEPTION 'Identificador de envío inválido'; END IF;
  IF v_body IS NULL OR char_length(v_body) NOT BETWEEN 1 AND 4000 OR v_body !~ '[^[:space:]]' THEN RAISE EXCEPTION 'Mensaje inválido'; END IF;
  -- La política INSERT exige pertenencia y sender_id = auth.uid().
  INSERT INTO public.chat_messages(conversation_id, sender_id, client_id, body)
  VALUES (p_conversation_id, v_user, p_client_id, v_body)
  ON CONFLICT (conversation_id, sender_id, client_id) DO NOTHING;
  SELECT * INTO STRICT v_message FROM public.chat_messages
  WHERE conversation_id = p_conversation_id AND sender_id = v_user AND client_id = p_client_id;
  IF v_message.body <> v_body THEN RAISE EXCEPTION 'No se puede reutilizar un envío con otro contenido'; END IF;
  RETURN to_jsonb(v_message);
END;
$$;

CREATE FUNCTION public.chat_touch_conversation() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.chat_conversations SET updated_at = greatest(updated_at, NEW.created_at) WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER chat_new_message AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_touch_conversation();

REVOKE ALL ON FUNCTION public.chat_get_or_create_conversation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_send_message(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_touch_conversation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_prepare_message() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_get_or_create_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_send_message(uuid, text, text) TO authenticated;

-- Solo estas dos tablas; conservar las tablas y opciones existentes de la publicación.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- Comprobaciones posteriores de SOLO LECTURA (esperado: RLS true, 3 políticas, 2 tablas publicadas).
SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('chat_conversations', 'chat_messages');
SELECT tablename, policyname, roles, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('chat_conversations', 'chat_messages');
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename IN ('chat_conversations', 'chat_messages');
SELECT has_table_privilege('anon', 'public.chat_messages', 'SELECT') AS anon_read_should_be_false,
       has_table_privilege('authenticated', 'public.chat_messages', 'SELECT') AS participant_select_grant_should_be_true,
       has_column_privilege('authenticated', 'public.chat_messages', 'created_at', 'INSERT') AS choose_date_should_be_false,
       has_function_privilege('anon', 'public.chat_send_message(uuid,text,text)', 'EXECUTE') AS anon_send_should_be_false;
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname IN ('anon', 'authenticated');

-- Decisiones de retención a revisar: borrar una cuenta borra sus conversaciones;
-- borrar físicamente un producto con chat queda restringido. La baja lógica sigue siendo compatible.

/*
PRUEBA DE SEGURIDAD PREPARADA, NO EJECUTADA. NO FORMA PARTE DE LA APLICACIÓN AUTOMÁTICA.
Ejecutar SOLAMENTE esta sección, sin los delimitadores de comentario, en un entorno
de prueba autorizado después de aplicar el SQL. Reemplazar los cuatro UUID por cuentas
y producto DE PRUEBA existentes: A comprador, B vendedor, C tercero; producto activo de B.
No se crean usuarios/productos. Las filas de chat se revierten con ROLLBACK.
No prueba Realtime (los eventos requieren COMMIT) ni sesiones reales: ver prueba manual.
Si falla una aserción, ejecutar ROLLBACK y corregir el problema; no desactivar RLS.

BEGIN;
SELECT set_config('soltapp_test.seller', 'REEMPLAZAR_UUID_B', true),
       set_config('soltapp_test.buyer', 'REEMPLAZAR_UUID_A', true),
       set_config('soltapp_test.outsider', 'REEMPLAZAR_UUID_C', true),
       set_config('soltapp_test.product', 'REEMPLAZAR_UUID_PRODUCTO', true);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('soltapp_test.buyer'), true),
       set_config('request.jwt.claims', json_build_object('sub', current_setting('soltapp_test.buyer'), 'role', 'authenticated')::text, true);
DO $$
DECLARE c jsonb; c2 jsonb; m jsonb; m2 jsonb;
BEGIN
  c := public.chat_get_or_create_conversation(current_setting('soltapp_test.product')::uuid);
  c2 := public.chat_get_or_create_conversation(current_setting('soltapp_test.product')::uuid);
  IF c->>'id' <> c2->>'id' OR c->>'seller_id' <> current_setting('soltapp_test.seller') OR c->>'buyer_id' <> current_setting('soltapp_test.buyer') THEN
    RAISE EXCEPTION 'FAIL: identidad o conversación duplicada' USING ERRCODE = 'XX000';
  END IF;
  PERFORM set_config('soltapp_test.conversation', c->>'id', true);
  m := public.chat_send_message((c->>'id')::uuid, 'security-buyer-001', 'Prueba autorizada A');
  m2 := public.chat_send_message((c->>'id')::uuid, 'security-buyer-001', 'Prueba autorizada A');
  IF m->>'id' <> m2->>'id' OR (SELECT count(*) FROM public.chat_messages WHERE conversation_id = (c->>'id')::uuid AND sender_id = auth.uid() AND client_id = 'security-buyer-001') <> 1 THEN
    RAISE EXCEPTION 'FAIL: mensaje duplicado' USING ERRCODE = 'XX000';
  END IF;
  BEGIN
    PERFORM public.chat_send_message((c->>'id')::uuid, 'security-buyer-001', 'Texto diferente');
    RAISE EXCEPTION 'FAIL: nonce reutilizado con otro texto' USING ERRCODE = 'XX000';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
  BEGIN
    INSERT INTO public.chat_messages(conversation_id,sender_id,client_id,body)
    VALUES ((c->>'id')::uuid,current_setting('soltapp_test.seller')::uuid,'security-spoof-001','Suplantación');
    RAISE EXCEPTION 'FAIL: remitente suplantado' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.chat_messages(conversation_id,sender_id,client_id,body,created_at)
    VALUES ((c->>'id')::uuid,auth.uid(),'security-date-001','Fecha falsificada',now());
    RAISE EXCEPTION 'FAIL: fecha elegida por cliente' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.chat_conversations SET seller_id = auth.uid() WHERE id = (c->>'id')::uuid;
    RAISE EXCEPTION 'FAIL: participantes modificados' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;

-- B puede recuperar el mensaje y responder en la misma conversación.
SELECT set_config('request.jwt.claim.sub', current_setting('soltapp_test.seller'), true),
       set_config('request.jwt.claims', json_build_object('sub', current_setting('soltapp_test.seller'), 'role', 'authenticated')::text, true);
DO $$
DECLARE m jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.chat_messages WHERE conversation_id = current_setting('soltapp_test.conversation')::uuid AND client_id = 'security-buyer-001') THEN
    RAISE EXCEPTION 'FAIL: B no puede leer a A' USING ERRCODE = 'XX000';
  END IF;
  m := public.chat_send_message(current_setting('soltapp_test.conversation')::uuid,'security-seller-001','Respuesta autorizada B');
  IF m->>'sender_id' <> current_setting('soltapp_test.seller') THEN
    RAISE EXCEPTION 'FAIL: remitente de B incorrecto' USING ERRCODE = 'XX000';
  END IF;
END;
$$;

-- C no puede leer las filas de A/B ni insertar, incluso con IDs conocidos.
SELECT set_config('request.jwt.claim.sub', current_setting('soltapp_test.outsider'), true),
       set_config('request.jwt.claims', json_build_object('sub', current_setting('soltapp_test.outsider'), 'role', 'authenticated')::text, true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = current_setting('soltapp_test.conversation')::uuid)
     OR EXISTS (SELECT 1 FROM public.chat_messages WHERE conversation_id = current_setting('soltapp_test.conversation')::uuid) THEN
    RAISE EXCEPTION 'FAIL: C lee mensajes/conversación ajena' USING ERRCODE = 'XX000';
  END IF;
  BEGIN
    PERFORM public.chat_send_message(current_setting('soltapp_test.conversation')::uuid,'security-third-001','No autorizado');
    RAISE EXCEPTION 'FAIL: C envía por RPC' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.chat_messages(conversation_id,sender_id,client_id,body)
    VALUES (current_setting('soltapp_test.conversation')::uuid,auth.uid(),'security-third-002','No autorizado');
    RAISE EXCEPTION 'FAIL: C inserta directamente' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true), set_config('request.jwt.claims', '{}', true);
DO $$
BEGIN
  BEGIN
    PERFORM 1 FROM public.chat_messages LIMIT 1;
    RAISE EXCEPTION 'FAIL: anon lee' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.chat_send_message(current_setting('soltapp_test.conversation')::uuid,'security-anon-001','No autorizado');
    RAISE EXCEPTION 'FAIL: anon ejecuta RPC' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;
RESET ROLE;
ROLLBACK;
-- Si todo terminó sin excepciones: contrato de seguridad probado en ESA base de prueba.
-- Aún falta la prueba real entre dispositivos y la recepción Realtime con autorización.
*/
