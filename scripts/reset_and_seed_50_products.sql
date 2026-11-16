-- ==============================================================================
-- SOLTAPP: Reseteo y Carga Masiva de 52 Publicaciones Multi-Categoría y Multi-Usuario
-- Con fotos 100% reales de Marketplace / MercadoLibre (Verificadas HTTP 200)
-- Ejecutar en: Supabase Dashboard -> SQL Editor (Rol Postgres / Superusuario)
-- ==============================================================================

BEGIN;

-- 1. Limpieza segura y en cascada de productos y tablas vinculadas
DO $$ 
BEGIN
  -- Desactivar triggers o borrar tablas dependientes en orden
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE 'DELETE FROM public.chat_messages';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_conversations') THEN
    EXECUTE 'DELETE FROM public.chat_conversations';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_reviews') THEN
    EXECUTE 'DELETE FROM public.order_reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    EXECUTE 'DELETE FROM public.reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    EXECUTE 'DELETE FROM public.order_items';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    EXECUTE 'DELETE FROM public.orders';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    EXECUTE 'DELETE FROM public.favorites';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') THEN
    EXECUTE 'DELETE FROM public.product_images';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    EXECUTE 'TRUNCATE TABLE public.products CASCADE';
  END IF;
END $$;

-- 2. Inserción de 52 Publicaciones distribuidas entre usuarios y categorías
INSERT INTO public.products (
  id,
  seller_id,
  category_id,
  title,
  description,
  price,
  currency,
  condition,
  status,
  location,
  created_at,
  updated_at
) VALUES
  ('0fcec416-8ee7-4d64-8106-b5e4634ca2a4', 'c2026302-b7da-4dee-8c96-6623a5a5f4d0', 1, 'Volkswagen Gol Trend 1.6 MSI 2018', 'Impecable estado general, 68.000 km reales, services oficiales al día. Aire acondicionado, dirección hidráulica, levanta vidrios y cierre centralizado. VTV vigente hasta fin de año.', 10500000, 'ARS', 'como_nuevo', 'activo', 'Palermo, CABA', '2026-11-16T13:57:17.404Z', '2026-11-16T13:57:17.404Z'),
  ('92859177-98fc-4ebf-84af-7d9b00f5419f', 'ea31e357-1e9a-4bd1-88e3-bf630bfe9c47', 1, 'Moto Honda XR 150L 2022', 'Excelente moto enduro urbana con 12.000 km. Titular al día, cubiertas originales con 80% de vida útil, service recién hecho con cambio de aceite y filtro.', 3800000, 'ARS', 'como_nuevo', 'activo', 'Pilar, Buenos Aires', '2026-11-16T12:57:17.406Z', '2026-11-16T12:57:17.406Z'),
  ('17cdd193-0fb7-4ccf-b1b4-1bc217474ade', 'd15131cc-e679-4ce6-ac73-397b57b789cc', 1, 'Casco para moto LS2 Rookie Integral Talle L', 'Casco integral homologado ECE 22.05, visor antirrayas transparente, interior desmontable y lavable. Muy poco uso, sin caídas ni golpes.', 95000, 'ARS', 'bueno', 'activo', 'Belgrano, CABA', '2026-11-16T11:57:17.406Z', '2026-11-16T11:57:17.406Z'),
  ('3dcf4189-71de-49db-9011-a0f5e65ca456', 'd3605f8d-3c95-41b0-a724-687110125044', 1, 'Yamaha FZ FI 2.0 Edición Especial', 'Color negra mate con detalles dorados. 18.500 km, inyección electrónica Blue Core, frenos impecables. Manuales y duplicado de llave.', 4200000, 'ARS', 'como_nuevo', 'activo', 'Rosario, Santa Fe', '2026-11-16T10:57:17.406Z', '2026-11-16T10:57:17.406Z'),
  ('e1b5c47b-11b3-481b-b9ec-88722c4153c0', '122230dc-4ee3-407a-a32d-07a538b32212', 1, 'Juego de 4 Cubiertas Michelin Primacy 205/55 R16', 'Set completo de 4 neumáticos nuevos sin rodar. Fabricación reciente (DOT 2024). Ideales para Golf, Focus, Cruze, Corolla o similar.', 480000, 'ARS', 'nuevo', 'activo', 'Morón, Buenos Aires', '2026-11-16T09:57:17.406Z', '2026-11-16T09:57:17.406Z'),
  ('810bb300-b94c-43ce-b688-c38909c738db', '4641c167-0fb0-4982-b880-39eb93a9b003', 1, 'Chevrolet Onix 1.4 LTZ 2019', 'Versión full equipada con pantalla táctil MyLink, cámara de retroceso, tapizados combinados en cuero y tela. 54.000 km, cubiertas semi-nuevas.', 12800000, 'ARS', 'como_nuevo', 'activo', 'Vicente López, Buenos Aires', '2026-11-16T08:57:17.406Z', '2026-11-16T08:57:17.406Z'),
  ('1e8d73b1-5afe-44df-b0a5-83e3a025c3e0', 'a753450d-1a9a-406a-99f7-70460e7bdba3', 21, 'iPhone 14 Pro 128GB Space Black', 'Batería con 92% de condición original. Pantalla Super Retina XDR con Dynamic Island y 120Hz ProMotion. Incluye cable Lightning original y funda de silicona negra.', 980000, 'ARS', 'como_nuevo', 'activo', 'Recoleta, CABA', '2026-11-16T07:57:17.406Z', '2026-11-16T07:57:17.406Z'),
  ('c00b5fba-b0ab-49db-843e-61df82a5d5f6', '3212332c-c77f-4c45-82c6-317f4b7d0ded', 21, 'Samsung Galaxy S23 Ultra 256GB Phantom Black', 'Cámara de 200MP con zoom óptico 100x y lápiz S-Pen integrado. Pantalla Dynamic AMOLED 2X. Caja original, cable USB-C y vidrio templado colocado.', 1150000, 'ARS', 'como_nuevo', 'activo', 'Caballito, CABA', '2026-11-16T06:57:17.406Z', '2026-11-16T06:57:17.406Z'),
  ('df568034-75f4-4907-aa36-e4a6172e126d', '1dca4e05-2499-481b-a2e1-fe568f564e4a', 21, 'Motorola Edge 40 Neo 256GB Caneel Bay', 'Nuevo en caja sellada con garantía oficial. Pantalla curva pOLED 144Hz, certificación IP68 contra agua y polvo, cámara 50MP con OIS.', 450000, 'ARS', 'nuevo', 'activo', 'Almagro, CABA', '2026-11-16T05:57:17.406Z', '2026-11-16T05:57:17.406Z'),
  ('b14d7923-1109-4822-800b-92ed5125af7a', '92e85b68-2904-4f0b-88ca-e8235e6b8579', 21, 'Apple Watch Series 8 45mm GPS Medianoche', 'Carcasa de aluminio color medianoche. Sensor de temperatura, detección de choques y monitoreo de oxígeno en sangre. Correa deportiva original y cargador magnético rápido.', 410000, 'ARS', 'como_nuevo', 'activo', 'Salta Capital, Salta', '2026-11-16T04:57:17.406Z', '2026-11-16T04:57:17.406Z'),
  ('ac92fb15-4402-413d-a96d-fad6310f81bb', 'f79a1a4f-ac7b-48dc-b4e5-27a601ed54df', 22, 'MacBook Air M2 13.6 pulgadas 8GB RAM 256GB SSD', 'Color Silver, estado idéntico a nuevo con 32 ciclos de batería (100% de capacidad). Teclado en español, cargador MagSafe 3 original y caja con folletería.', 1350000, 'ARS', 'como_nuevo', 'activo', 'San Isidro, Buenos Aires', '2026-11-16T03:57:17.406Z', '2026-11-16T03:57:17.406Z'),
  ('f7387d5c-8b22-4736-ad6d-4fa272708669', '09af6e65-afae-4cad-a5bf-cb8adc2be80c', 22, 'Notebook Dell Inspiron 15 AMD Ryzen 7 16GB RAM 512GB SSD', 'Notebook de alto rendimiento para programación o diseño. Pantalla FHD 120Hz 15.6 pulgadas, teclado numérico retroiluminado, Windows 11 Home original.', 820000, 'ARS', 'nuevo', 'activo', 'Olivos, Buenos Aires', '2026-11-16T02:57:17.406Z', '2026-11-16T02:57:17.406Z'),
  ('55291489-b745-44b2-9dac-49a16ed454f5', '9f017b8b-6bfa-48e4-8da3-d6c77b888fc8', 22, 'iPad 10ma Generación 64GB Wi-Fi Blue', 'Nuevo en empaque cerrado de fábrica. Chip A14 Bionic, pantalla Liquid Retina de 10.9 pulgadas, compatibilidad con Apple Pencil y Magic Keyboard Folio.', 520000, 'ARS', 'nuevo', 'activo', 'Villa Urquiza, CABA', '2026-11-16T01:57:17.406Z', '2026-11-16T01:57:17.406Z'),
  ('a637d5f9-65de-4fdc-8783-bd4e317fb833', 'bbb8c996-9540-4bd3-b0c1-231789f7de51', 23, 'Sony PlayStation 5 con 2 Controles DualSense', 'Consola PS5 con lectora de discos Ultra HD Blu-ray. Incluye 2 joysticks inalámbricos DualSense, cable HDMI 2.1, cable de corriente y juego Spider-Man 2 en formato físico.', 1050000, 'ARS', 'como_nuevo', 'activo', 'Córdoba Capital, Córdoba', '2026-11-16T00:57:17.406Z', '2026-11-16T00:57:17.406Z'),
  ('b83851a3-0e87-4ef6-b719-34b246379246', 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb', 23, 'Nintendo Switch OLED 64GB Neon + Estuche Viajero', 'Pantalla OLED de 7 pulgadas con soporte ajustable ancho. Muy cuidada, sin drift en los Joy-Con, incluye dock, correas, cargador original y funda protectora rígida.', 580000, 'ARS', 'como_nuevo', 'activo', 'Mar del Plata, Buenos Aires', '2026-11-15T23:57:17.406Z', '2026-11-15T23:57:17.406Z'),
  ('da1299f3-8879-4b0f-95c7-eb373e71291c', '75bd20e2-1358-4505-b95a-d212136eb7cb', 23, 'Placa de Video ASUS TUF Gaming GeForce RTX 4070 12GB', 'Tarjeta gráfica con arquitectura Ada Lovelace y DLSS 3. Tres ventiladores axiales con rodamiento doble, backplate de aluminio. Se entrega en caja con precintos.', 920000, 'ARS', 'nuevo', 'activo', 'La Plata, Buenos Aires', '2026-11-15T22:57:17.406Z', '2026-11-15T22:57:17.406Z'),
  ('e22b5d7f-9ba7-4f91-ac95-c8e5137c77ca', 'ae23de33-f64e-4304-9fbe-eb536dc3cf3e', 18, 'Smart TV Samsung 55 pulgadas 4K QLED UHD', 'Televisor inteligente con tecnología Quantum Dot, procesador Quantum Lite 4K, diseño AirSlim ultradelgado y control remoto SolarCell ecológico. Soporte de pie incluido.', 680000, 'ARS', 'como_nuevo', 'activo', 'Mendoza Capital, Mendoza', '2026-11-15T21:57:17.406Z', '2026-11-15T21:57:17.406Z'),
  ('acb0cb17-ac41-4eb1-899c-1d7c96810103', 'c8aa4409-b4a4-48d6-be0c-55581d11c34c', 18, 'Proyector Portátil Wanbo T2 Max Full HD 1080p Nativo', 'Proyector compacto con Android integrado, conectividad Wi-Fi dual band y Bluetooth. Enfoque automático y corrección trapezoidal inteligente de 4 puntos.', 220000, 'ARS', 'nuevo', 'activo', 'Tigre, Buenos Aires', '2026-11-15T20:57:17.406Z', '2026-11-15T20:57:17.406Z'),
  ('9ccfb242-adfd-4c4f-b9a6-a92fbe31c3bd', 'c2026302-b7da-4dee-8c96-6623a5a5f4d0', 19, 'Auriculares Inalámbricos Sony WH-1000XM5 Noise Cancelling', 'Líderes en cancelación de ruido activa con procesador V1 y HD QN1. Hasta 30 horas de batería, almohadillas de cuero suave ergonómicas y estuche de transporte plegable.', 420000, 'ARS', 'como_nuevo', 'activo', 'Colegiales, CABA', '2026-11-15T19:57:17.406Z', '2026-11-15T19:57:17.406Z'),
  ('57f20efb-f18e-4b8d-968c-757715cb522a', 'ea31e357-1e9a-4bd1-88e3-bf630bfe9c47', 19, 'Parlante Bluetooth Portátil JBL Charge 5 Resistente al Agua', 'Sonido potente JBL Original Pro con driver de gran excursión y tweeters independientes. Certificación IP67 resistente al agua y polvo. Batería externa incorporada.', 210000, 'ARS', 'nuevo', 'activo', 'Quilmes, Buenos Aires', '2026-11-15T18:57:17.406Z', '2026-11-15T18:57:17.406Z'),
  ('43e1d122-b828-4b24-b1ba-525f8d6fab6e', 'd15131cc-e679-4ce6-ac73-397b57b789cc', 20, 'Cámara Réflex Canon EOS Rebel T7 + Lente 18-55mm IS II', 'Sensor CMOS APS-C de 24.1 megapíxeles y procesador DIGIC 4+. Conexión Wi-Fi y NFC para transferir fotos al celular. Incluye batería, cargador y correa Canon.', 590000, 'ARS', 'como_nuevo', 'activo', 'Neuquén Capital, Neuquén', '2026-11-15T17:57:17.406Z', '2026-11-15T17:57:17.406Z'),
  ('6b3d1648-f4e5-4f27-845b-5bff274d1870', 'd3605f8d-3c95-41b0-a724-687110125044', 20, 'Drone DJI Mini 2 SE Fly More Combo con 3 Baterías', 'Peso ultraligero menor a 249g. Transmisión de video HD hasta 10 km, video 2.7K con gimbal de 3 ejes, resistencia a vientos nivel 5. Incluye bolso DJI y hélices de repuesto.', 620000, 'ARS', 'como_nuevo', 'activo', 'San Carlos de Bariloche, Río Negro', '2026-11-15T16:57:17.406Z', '2026-11-15T16:57:17.406Z'),
  ('4e6a1f5c-e33d-4e5c-8b98-720bd8a358a4', '122230dc-4ee3-407a-a32d-07a538b32212', 7, 'Sillón Chesterfield 3 Cuerpos en Cuero Ecológico Chocolate', 'Estructura maciza de madera estacionada con capitoné artesanal y tachas bronceadas. Almohadones de placa soft de alta densidad 28kg. 2.10m de largo.', 450000, 'ARS', 'como_nuevo', 'activo', 'Palermo, CABA', '2026-11-15T15:57:17.406Z', '2026-11-15T15:57:17.406Z'),
  ('ecf54141-f853-49fd-914d-396a1e5c2b9c', '4641c167-0fb0-4982-b880-39eb93a9b003', 7, 'Mesa de Comedor Paraíso 160x80 + 6 Sillas Eames Negras', 'Tapa de madera enchapada en Paraíso lustrado poliuretánico impermeable con patas macizas. Sillas modelo DSW con patas de madera y estructura de acero.', 340000, 'ARS', 'nuevo', 'activo', 'Belgrano, CABA', '2026-11-15T14:57:17.406Z', '2026-11-15T14:57:17.406Z'),
  ('e06c7e0c-e83d-4f96-bc18-f996b8ff2120', 'a753450d-1a9a-406a-99f7-70460e7bdba3', 7, 'Lámpara de Pie Nórdica Trípode en Madera y Pantalla Lino', 'Diseño escandinavo moderno de 1.55m de alto. Base de tres patas en madera de pino clear tratada, pantalla cilíndrica de lino natural beige e interruptor de pie.', 65000, 'ARS', 'nuevo', 'activo', 'Recoleta, CABA', '2026-11-15T13:57:17.406Z', '2026-11-15T13:57:17.406Z'),
  ('c7b125d4-2593-4cd1-999a-1b174f210ced', '3212332c-c77f-4c45-82c6-317f4b7d0ded', 7, 'Parrilla Móvil con Fogonero y Ruedas Reforzada', 'Parrilla rodante con emparrillado en V desmontable y grasera en chapa enlozada. Fogonero lateral con ladrillos refractarios y mesada de apoyo en madera.', 185000, 'ARS', 'nuevo', 'activo', 'Pilar, Buenos Aires', '2026-11-15T12:57:17.406Z', '2026-11-15T12:57:17.406Z'),
  ('2776cd58-7785-459e-a45a-88edc731d5bb', '1dca4e05-2499-481b-a2e1-fe568f564e4a', 7, 'Juego de Jardín en Fundición de Aluminio Mesa + 4 Sillones', 'Juego para exterior e intemperie eterno, no se oxida. Acabado epoxi negro microtexturado con detalles florales clásicos. Muy liviano y resistente.', 390000, 'ARS', 'como_nuevo', 'activo', 'San Isidro, Buenos Aires', '2026-11-15T11:57:17.406Z', '2026-11-15T11:57:17.406Z'),
  ('f85f3446-f40c-4ed5-aabf-b4bda962d481', '92e85b68-2904-4f0b-88ca-e8235e6b8579', 7, 'Espejo de Pared Cuerpo Entero Marco Metálico 170x60', 'Espejo biselado de cristal premium sin deformación con marco de hierro negro mate. Apto para colgar o apoyar con pie trasero desplegable.', 78000, 'ARS', 'nuevo', 'activo', 'Caballito, CABA', '2026-11-15T10:57:17.406Z', '2026-11-15T10:57:17.406Z'),
  ('5c89e420-66b3-4b65-8e24-9317d8171efb', 'f79a1a4f-ac7b-48dc-b4e5-27a601ed54df', 7, 'Taladro Percutor Inalámbrico DeWalt 20V MAX + 2 Baterías', 'Motor Brushless sin carbones, mandril metálico autoajustable de 13mm y 15 posiciones de torque. Incluye maletín de transporte TSTAK y cargador rápido multivoltaje.', 240000, 'ARS', 'nuevo', 'activo', 'Lomas de Zamora, Buenos Aires', '2026-11-15T09:57:17.406Z', '2026-11-15T09:57:17.406Z'),
  ('3c7f1d51-9379-4363-8160-bbfefcdc9e3a', '09af6e65-afae-4cad-a5bf-cb8adc2be80c', 7, 'Cortadora de Césped a Nafta Petri 5.5HP con Bolsa', 'Motor naftero de 4 tiempos 139cc, chasis de acero estampado con descarga trasera y bolsa recolectora de 50 litros. Ruedas con rodamientos reforzadas.', 310000, 'ARS', 'bueno', 'activo', 'Vicente López, Buenos Aires', '2026-11-15T08:57:17.406Z', '2026-11-15T08:57:17.406Z'),
  ('44edd614-c00f-4735-8abc-4c9f87022eae', '9f017b8b-6bfa-48e4-8da3-d6c77b888fc8', 8, 'Cafetera Espresso DeLonghi Dedica Deluxe Bomba 15 Bar', 'Elegante cuerpo de acero inoxidable de solo 15 cm de ancho. Termobloque rápido en 40 segundos, boquilla para espumar leche y calentar tazas superior.', 320000, 'ARS', 'como_nuevo', 'activo', 'Colegiales, CABA', '2026-11-15T07:57:17.406Z', '2026-11-15T07:57:17.406Z'),
  ('fbfaf7db-3974-4ec9-b377-76dc9c8db314', 'bbb8c996-9540-4bd3-b0c1-231789f7de51', 8, 'Heladera No Frost Samsung 390L con Motor Digital Inverter', 'Tecnología All Around Cooling que distribuye el frío homogéneamente. Estantes de vidrio templado antiderrame, cajón Fresh Zone para vegetales y bajo consumo clase A+.', 1150000, 'ARS', 'como_nuevo', 'activo', 'Olivos, Buenos Aires', '2026-11-15T06:57:17.406Z', '2026-11-15T06:57:17.406Z'),
  ('b2bd7f8b-fc46-4d67-a32a-e47324a08fe7', 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb', 8, 'Lavarropas Automático LG Inverter 8.5kg Carga Frontal', 'Motor 6 Motion DD silencioso con garantía de 10 años. Sistema Smart Diagnosis con conectividad Wi-Fi ThinQ para controlar ciclos desde el celular.', 790000, 'ARS', 'como_nuevo', 'activo', 'Villa Urquiza, CABA', '2026-11-15T05:57:17.406Z', '2026-11-15T05:57:17.406Z'),
  ('335e39ea-674b-4c24-b02f-6b8b73e6c22a', '75bd20e2-1358-4505-b95a-d212136eb7cb', 8, 'Freidora de Aire Philips Airfryer XL Digital 4.1L', 'Cocina con hasta un 90% menos de grasa mediante flujo de aire caliente Rapid Air. Pantalla táctil con 7 programas preestablecidos de cocción.', 165000, 'ARS', 'nuevo', 'activo', 'Tigre, Buenos Aires', '2026-11-15T04:57:17.406Z', '2026-11-15T04:57:17.406Z'),
  ('d98a63a4-693a-4661-878b-191350169dba', 'ae23de33-f64e-4304-9fbe-eb536dc3cf3e', 8, 'Horno Microondas BGH Quick Chef 28L Grill Digital', 'Capacidad de 28 litros con función de grill dorador y descongelamiento automático por peso. Panel digital con reloj y traba de seguridad para niños.', 145000, 'ARS', 'como_nuevo', 'activo', 'Rosario, Santa Fe', '2026-11-15T03:57:17.406Z', '2026-11-15T03:57:17.406Z'),
  ('771c95ff-ec4e-4b4f-92cd-a82c803e7746', 'c8aa4409-b4a4-48d6-be0c-55581d11c34c', 8, 'Aspiradora Robot Xiaomi Robot Vacuum Mop 2 Pro con Láser LDS', 'Navegación láser precisa, potencia de succión de 3000Pa y trapeado con vibración sónica. Mapeo multinivel y programación inteligente de zonas.', 460000, 'ARS', 'como_nuevo', 'activo', 'Córdoba Capital, Córdoba', '2026-11-15T02:57:17.406Z', '2026-11-15T02:57:17.406Z'),
  ('6b19c368-d2fe-446e-95ab-defe3d69e63b', 'c2026302-b7da-4dee-8c96-6623a5a5f4d0', 6, 'Bicicleta Mountain Bike Venzo Rodado 29 Frenos a Disco', 'Cuadro de aluminio 6061 talle M/L, suspensión delantera con bloqueo, transmisión Shimano de 24 velocidades y cubiertas todo terreno Chaoyang.', 380000, 'ARS', 'como_nuevo', 'activo', 'Mendoza Capital, Mendoza', '2026-11-15T01:57:17.406Z', '2026-11-15T01:57:17.406Z'),
  ('cca6cd31-7f27-4482-89aa-cd2e48f09852', 'ea31e357-1e9a-4bd1-88e3-bf630bfe9c47', 6, 'Bicicleta Plegable Tern Link B7 Rodado 20 Aluminio', 'Bicicleta urbana de pliegue ultra rápido en 10 segundos. Cambio Shimano Tourney de 7 velocidades, guardabarros completos y portaequipajes trasero.', 490000, 'ARS', 'como_nuevo', 'activo', 'Palermo, CABA', '2026-11-15T00:57:17.406Z', '2026-11-15T00:57:17.406Z'),
  ('adbefb57-ef5d-4275-ab1e-f68c6c8e2638', 'd15131cc-e679-4ce6-ac73-397b57b789cc', 6, 'Bicicleta de Ruta Vairo Speed 24V Shimano Claris', 'Cuadro aerodinámico de aluminio con horquilla cónica de carbono. Ruedas doble pared rodado 700x25c y mandos integrados Shimano Claris STI.', 680000, 'ARS', 'como_nuevo', 'activo', 'San Isidro, Buenos Aires', '2026-11-14T23:57:17.406Z', '2026-11-14T23:57:17.406Z'),
  ('f3fed2bf-476c-4e25-a86d-b2a6029d102e', 'd3605f8d-3c95-41b0-a724-687110125044', 5, 'Set de Mancuernas Ajustables de 2.5kg a 24kg con Soporte', 'Mancuernas automáticas con selector giratorio de carga rápida en 15 niveles de peso. Base organizadora y empuñaduras ergonómicas antideslizantes.', 290000, 'ARS', 'nuevo', 'activo', 'Belgrano, CABA', '2026-11-14T22:57:17.406Z', '2026-11-14T22:57:17.406Z'),
  ('2fbbd418-8e1b-422d-a910-d654f316baf2', '122230dc-4ee3-407a-a32d-07a538b32212', 5, 'Cinta de Correr Motorizada Randers Plegable 12km/h', 'Motor de 2.0HP continuo con display digital LCD que mide calorías, tiempo, distancia y pulso cardíaco. Amortiguación elástica de impacto.', 520000, 'ARS', 'como_nuevo', 'activo', 'Mar del Plata, Buenos Aires', '2026-11-14T21:57:17.406Z', '2026-11-14T21:57:17.406Z'),
  ('5dc2eb01-c32f-4c15-830a-78cfa25aff26', '4641c167-0fb0-4982-b880-39eb93a9b003', 5, 'Raqueta de Tenis Babolat Pure Drive 300g Grip 3', 'La raqueta más vendida del mundo para balance entre potencia y efectos. Encordada con Babolat RPM Blast a 52 libras con antivibrador incluido.', 210000, 'ARS', 'bueno', 'activo', 'Pilar, Buenos Aires', '2026-11-14T20:57:17.406Z', '2026-11-14T20:57:17.406Z'),
  ('4a9001ac-cece-4cc9-8cb3-a75ebff82471', 'a753450d-1a9a-406a-99f7-70460e7bdba3', 5, 'Tabla de Surf Fish 6 pies Epoxi con Quillas y Leash', 'Ideal para olas de verano en la costa argentina. Excelente flotación y remada, fondo cóncavo simple a doble y configuración tri-fin incluida.', 310000, 'ARS', 'bueno', 'activo', 'Mar del Plata, Buenos Aires', '2026-11-14T19:57:17.406Z', '2026-11-14T19:57:17.406Z'),
  ('cada82af-00af-4664-8dee-e6e54a2c207e', '3212332c-c77f-4c45-82c6-317f4b7d0ded', 14, 'Zapatillas Nike Air Jordan 1 Retro High Talle 42', 'Edición original 100% auténtica en caja con cordones de repuesto. Capellada de cuero genuino premium con suela de goma cosida duradera.', 180000, 'ARS', 'como_nuevo', 'activo', 'Recoleta, CABA', '2026-11-14T18:57:17.406Z', '2026-11-14T18:57:17.406Z'),
  ('ed02aea9-6c9b-4946-b101-4cb4eab2d549', '1dca4e05-2499-481b-a2e1-fe568f564e4a', 14, 'Campera de Cuero Vacuno Hombre Talle L Negra', 'Cuero argentino 100% legítimo de primera calidad. Corte slim fit con cierres YKK metálicos reforzados y forro interior rasado térmico.', 210000, 'ARS', 'como_nuevo', 'activo', 'Caballito, CABA', '2026-11-14T17:57:17.406Z', '2026-11-14T17:57:17.406Z'),
  ('ce851525-e28a-4e64-bf9b-cff2f26931f7', '92e85b68-2904-4f0b-88ca-e8235e6b8579', 15, 'Reloj Seiko 5 Sports Automático Acero Inox Fondo Azul', 'Calibre 4R36 automático con 41 horas de reserva de marcha y cuerda manual. Cristal Hardlex resistente a rayones y sumergible a 100 metros.', 390000, 'ARS', 'nuevo', 'activo', 'Palermo, CABA', '2026-11-14T16:57:17.406Z', '2026-11-14T16:57:17.406Z'),
  ('d05a7e6e-4248-4858-8b35-cec7038e17a8', 'f79a1a4f-ac7b-48dc-b4e5-27a601ed54df', 13, 'Cartera de Cuero Genuino Prüne Suela con Correa', 'Cartera tote bag con manijas fijas y correa larga desmontable. Interior forrado con bolsillo organizador con cierre. Bolsa de tela guardapolvo.', 135000, 'ARS', 'como_nuevo', 'activo', 'Belgrano, CABA', '2026-11-14T15:57:17.406Z', '2026-11-14T15:57:17.406Z'),
  ('2bdc89e7-28a3-4684-a34f-1586970a65ce', '09af6e65-afae-4cad-a5bf-cb8adc2be80c', 15, 'Mochila Impermeable Samsonite Xenon para Notebook 15.6', 'Compartimento acolchado para laptop y tablet con tecnología de absorción de caídas. Bolsillo frontal organizador de cables y pasador para valija.', 95000, 'ARS', 'nuevo', 'activo', 'Almagro, CABA', '2026-11-14T14:57:17.406Z', '2026-11-14T14:57:17.406Z'),
  ('88a7130f-b2d2-4046-94de-5578198b90c1', '9f017b8b-6bfa-48e4-8da3-d6c77b888fc8', 26, 'Guitarra Eléctrica Fender Stratocaster Player Series México', 'Cuerpo de aliso en color Sunburst brillante, mástil de arce con perfil Modern C y 3 micrófonos simples Player Series Alnico 5. Funda Fender acolchada.', 1100000, 'ARS', 'como_nuevo', 'activo', 'San Miguel de Tucumán, Tucumán', '2026-11-14T13:57:17.406Z', '2026-11-14T13:57:17.406Z'),
  ('fd079ddf-2cd3-45e0-9fd8-00d4f8f35e83', 'bbb8c996-9540-4bd3-b0c1-231789f7de51', 26, 'Teclado Sintetizador Yamaha PSR-E373 Sensitivo 61 Teclas', 'Teclas sensibles al tacto con generador de tonos LSI de alta fidelidad, 622 voces de instrumentos y lecciones incorporadas. Incluye fuente y atril.', 350000, 'ARS', 'como_nuevo', 'activo', 'La Plata, Buenos Aires', '2026-11-14T12:57:17.406Z', '2026-11-14T12:57:17.406Z'),
  ('14548ece-afb6-472d-a93b-7738cef1c332', 'f12e3fba-56fd-421b-8f0f-63061d4e5bdb', 24, 'Box Set Colección Harry Potter Edición Especial Tapa Dura', 'Los 7 libros completos en español con estuche rígido ilustrado con detalles dorados y mapas desplegables. Nuevos en celofán.', 110000, 'ARS', 'nuevo', 'activo', 'Villa Carlos Paz, Córdoba', '2026-11-14T11:57:17.406Z', '2026-11-14T11:57:17.406Z'),
  ('ec2b11f0-d80d-441b-8f82-eca43d37fc10', '75bd20e2-1358-4505-b95a-d212136eb7cb', 26, 'Tocadiscos Vinilo Audio-Technica AT-LP60X Automático', 'Bandeja giradiscos de transmisión por correa con preamplificador phono conmutable incorporado. Cápsula Dual Magnet con púa de diamante reemplazable.', 270000, 'ARS', 'como_nuevo', 'activo', 'Godoy Cruz, Mendoza', '2026-11-14T10:57:17.406Z', '2026-11-14T10:57:17.406Z');

-- 3. Inserción de Imágenes Reales Estilo Marketplace (1 imagen principal por producto)
INSERT INTO public.product_images (
  id,
  product_id,
  image_url,
  position,
  is_cover,
  created_at
) VALUES
  ('2c4eb79e-ee1a-47d8-9da3-89226ffd09c7', '0fcec416-8ee7-4d64-8106-b5e4634ca2a4', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg/960px-Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg', 0, true, '2026-11-16T13:57:17.404Z'),
  ('ed88b13c-0581-466c-9c11-44df291e7ab8', '92859177-98fc-4ebf-84af-7d9b00f5419f', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honda_Tornado.jpg/960px-Honda_Tornado.jpg', 0, true, '2026-11-16T12:57:17.406Z'),
  ('366a2225-f557-4424-8639-fde921940d41', '17cdd193-0fb7-4ccf-b1b4-1bc217474ade', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Full-Face_Helmet_9274.jpg/960px-Full-Face_Helmet_9274.jpg', 0, true, '2026-11-16T11:57:17.406Z'),
  ('df8ea09c-33b8-448b-88ba-87680ed636d2', '3dcf4189-71de-49db-9011-a0f5e65ca456', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/2011_Yamaha_Byson_150_%2820201105%29.jpg/960px-2011_Yamaha_Byson_150_%2820201105%29.jpg', 0, true, '2026-11-16T10:57:17.406Z'),
  ('918d1c86-d0e0-42e9-aff2-e55f3eff34f8', 'e1b5c47b-11b3-481b-b9ec-88722c4153c0', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Car_tire_stack_20170516.jpg/960px-Car_tire_stack_20170516.jpg', 0, true, '2026-11-16T09:57:17.406Z'),
  ('966484b7-fd4a-4ff7-bbdc-93d21503d0cd', '810bb300-b94c-43ce-b688-c38909c738db', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2019_Chevrolet_Onix_Activ_1.4.jpg/960px-2019_Chevrolet_Onix_Activ_1.4.jpg', 0, true, '2026-11-16T08:57:17.406Z'),
  ('344d00d7-45db-420d-899e-c750a2889fb0', '1e8d73b1-5afe-44df-b0a5-83e3a025c3e0', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Back_of_the_iPhone_14_Pro.jpg/960px-Back_of_the_iPhone_14_Pro.jpg', 0, true, '2026-11-16T07:57:17.406Z'),
  ('10607b5f-53f5-46e0-b595-8acd2f6ff00e', 'c00b5fba-b0ab-49db-843e-61df82a5d5f6', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Back_of_the_Samsung_Galaxy_S23.jpg/960px-Back_of_the_Samsung_Galaxy_S23.jpg', 0, true, '2026-11-16T06:57:17.406Z'),
  ('ee4e1308-c21b-488b-ba5d-4d0da41df170', 'df568034-75f4-4907-aa36-e4a6172e126d', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/%282022%29_-_Motorola_Moto_G31_2021_model.jpg/960px-%282022%29_-_Motorola_Moto_G31_2021_model.jpg', 0, true, '2026-11-16T05:57:17.406Z'),
  ('5757d4b2-a0bf-4f51-a77d-b901458938b3', 'b14d7923-1109-4822-800b-92ed5125af7a', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Apple_Watch_Series_7%3B_January_2022_%2801%29.jpg/960px-Apple_Watch_Series_7%3B_January_2022_%2801%29.jpg', 0, true, '2026-11-16T04:57:17.406Z'),
  ('8d3552c8-a4b4-4067-86d5-3417222487dd', 'ac92fb15-4402-413d-a96d-fad6310f81bb', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/MacBook_Air_black.jpg/960px-MacBook_Air_black.jpg', 0, true, '2026-11-16T03:57:17.406Z'),
  ('2ca8f183-a21e-44df-9ead-c36096af92b1', 'f7387d5c-8b22-4736-ad6d-4fa272708669', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Dell_Latitude_E6410_laptop_with_Kiwix.jpg/960px-Dell_Latitude_E6410_laptop_with_Kiwix.jpg', 0, true, '2026-11-16T02:57:17.406Z'),
  ('8537b22a-d148-4fe7-9b16-e9295f324674', '55291489-b745-44b2-9dac-49a16ed454f5', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/About_iPad_%2810th_generation%29.jpg/960px-About_iPad_%2810th_generation%29.jpg', 0, true, '2026-11-16T01:57:17.406Z'),
  ('32e9528f-ab32-475e-8d97-abb6dd888496', 'a637d5f9-65de-4fdc-8783-bd4e317fb833', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_5_and_DualSense.jpg/960px-PlayStation_5_and_DualSense.jpg', 0, true, '2026-11-16T00:57:17.406Z'),
  ('3166fc04-1e4b-4772-a07f-01dd8503d661', 'b83851a3-0e87-4ef6-b719-34b246379246', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Nintendo-Switch-Console-Docked-wJoyConRB.jpg/960px-Nintendo-Switch-Console-Docked-wJoyConRB.jpg', 0, true, '2026-11-15T23:57:17.406Z'),
  ('52d4dd8d-a0ec-478e-ba73-99005038f86b', 'da1299f3-8879-4b0f-95c7-eb373e71291c', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg/960px-2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg', 0, true, '2026-11-15T22:57:17.406Z'),
  ('4fab938b-db92-4c4d-9c2a-5923a7c2fe8a', 'e22b5d7f-9ba7-4f91-ac95-c8e5137c77ca', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/A_flat-screen_television.jpg/960px-A_flat-screen_television.jpg', 0, true, '2026-11-15T21:57:17.406Z'),
  ('f7000411-f116-4c72-9b49-a7327c78d976', 'acb0cb17-ac41-4eb1-899c-1d7c96810103', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Sony_Portable_Ultra_Short_Throw_Projector_%2826089152123%29.jpg/960px-Sony_Portable_Ultra_Short_Throw_Projector_%2826089152123%29.jpg', 0, true, '2026-11-15T20:57:17.406Z'),
  ('03e77e37-ca78-47e8-9428-6c603361b4ac', '9ccfb242-adfd-4c4f-b9a6-a92fbe31c3bd', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Sony_WH-CH510_Bluetooth_Over-Ear_Headphone.jpg/960px-Sony_WH-CH510_Bluetooth_Over-Ear_Headphone.jpg', 0, true, '2026-11-15T19:57:17.406Z'),
  ('89136f96-f914-47e0-972c-6ebfcf16f005', '57f20efb-f18e-4b8d-968c-757715cb522a', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/JBL_Charge_4_1v2.jpg/960px-JBL_Charge_4_1v2.jpg', 0, true, '2026-11-15T18:57:17.406Z'),
  ('43cff5ef-d965-46d0-a831-d3a437a5647f', '43e1d122-b828-4b24-b1ba-525f8d6fab6e', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Canon_1300D.jpg/960px-Canon_1300D.jpg', 0, true, '2026-11-15T17:57:17.406Z'),
  ('c0eb304f-69a3-4694-affc-2da17dbb2970', '6b3d1648-f4e5-4f27-845b-5bff274d1870', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/2024_Dron_DJI_Mini_4_Pro_%2801%29.jpg/960px-2024_Dron_DJI_Mini_4_Pro_%2801%29.jpg', 0, true, '2026-11-15T16:57:17.406Z'),
  ('0fcc99cd-2c53-4f52-b617-0ebfa006df68', '4e6a1f5c-e33d-4e5c-8b98-720bd8a358a4', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Chesterfield_Buckingham_sofa.jpg/960px-Chesterfield_Buckingham_sofa.jpg', 0, true, '2026-11-15T15:57:17.406Z'),
  ('8adc6ada-5a22-4827-bf58-a8f476ef4df0', 'ecf54141-f853-49fd-914d-396a1e5c2b9c', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Dining_table_brown.jpg/960px-Dining_table_brown.jpg', 0, true, '2026-11-15T14:57:17.406Z'),
  ('778a5881-c4b7-461e-932a-bc96d6815ae2', 'e06c7e0c-e83d-4f96-bc18-f996b8ff2120', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Mid-Century_Modern_Tripod_Lamp_at_Intterno_Showroom_in_Warsaw.jpg/960px-Mid-Century_Modern_Tripod_Lamp_at_Intterno_Showroom_in_Warsaw.jpg', 0, true, '2026-11-15T13:57:17.406Z'),
  ('343461e1-e1f1-49c7-8301-3b5d02ae8b6f', 'c7b125d4-2593-4cd1-999a-1b174f210ced', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Argentine_wood-fired_asado_on_a_homemade_chulengo_grill_with_anchico_firewood.jpg/960px-Argentine_wood-fired_asado_on_a_homemade_chulengo_grill_with_anchico_firewood.jpg', 0, true, '2026-11-15T12:57:17.406Z'),
  ('7b9fcc1f-d985-4fe2-ba18-c6a2f49cbfdd', '2776cd58-7785-459e-a45a-88edc731d5bb', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Cast_iron_outdoor_table_and_chairs_at_Boreham%2C_Essex%2C_England.jpg/960px-Cast_iron_outdoor_table_and_chairs_at_Boreham%2C_Essex%2C_England.jpg', 0, true, '2026-11-15T11:57:17.406Z'),
  ('ad4c8753-132c-4d69-b34a-f39c1b7cb71b', 'f85f3446-f40c-4ed5-aabf-b4bda962d481', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/A_vintage%2C_hand-carved_wooden_wall_mirror_frame.jpg/960px-A_vintage%2C_hand-carved_wooden_wall_mirror_frame.jpg', 0, true, '2026-11-15T10:57:17.406Z'),
  ('d9aac198-ca9a-4661-b656-3d6d075a5455', '5c89e420-66b3-4b65-8e24-9317d8171efb', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/DeWalt_20_Volt_Max_Cordless_Drill.jpg/960px-DeWalt_20_Volt_Max_Cordless_Drill.jpg', 0, true, '2026-11-15T09:57:17.406Z'),
  ('a2114740-d0b0-44a5-a9e3-6d267b722850', '3c7f1d51-9379-4363-8160-bbfefcdc9e3a', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/2006_Lawn_Master_Mower_%2830953866266%29.jpg/960px-2006_Lawn_Master_Mower_%2830953866266%29.jpg', 0, true, '2026-11-15T08:57:17.406Z'),
  ('e41f3578-20ed-404e-acc4-48552b637fd9', '44edd614-c00f-4735-8abc-4c9f87022eae', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Automatic_espresso_machine_02.JPG/960px-Automatic_espresso_machine_02.JPG', 0, true, '2026-11-15T07:57:17.406Z'),
  ('0459dcdd-0d9a-48a4-bbd0-79dcba7de522', 'fbfaf7db-3974-4ec9-b377-76dc9c8db314', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/SAMSUNG_REFRIGERATOR_RF60J9030WZ.jpg/960px-SAMSUNG_REFRIGERATOR_RF60J9030WZ.jpg', 0, true, '2026-11-15T06:57:17.406Z'),
  ('85f5a68d-57ec-4cf1-a123-dbf79ef2ea64', 'b2bd7f8b-fc46-4d67-a32a-e47324a08fe7', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Fagor_washing_machine_front_FF6314.jpg/960px-Fagor_washing_machine_front_FF6314.jpg', 0, true, '2026-11-15T05:57:17.406Z'),
  ('161f8cc1-495b-466f-a99e-b5bad1032ed7', '335e39ea-674b-4c24-b02f-6b8b73e6c22a', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Air_Fryer_2020.jpg/960px-Air_Fryer_2020.jpg', 0, true, '2026-11-15T04:57:17.406Z'),
  ('7ffb36eb-a824-48a8-96b5-6c5575462419', 'd98a63a4-693a-4661-878b-191350169dba', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/AKIRA_Microwave_Oven_in_Singapore_HDB.jpg/960px-AKIRA_Microwave_Oven_in_Singapore_HDB.jpg', 0, true, '2026-11-15T03:57:17.406Z'),
  ('5f1f59ba-ce47-4001-a531-cd376ada1461', '771c95ff-ec4e-4b4f-92cd-a82c803e7746', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Mopping_vacuum_cleaner_robotic.jpg/960px-Mopping_vacuum_cleaner_robotic.jpg', 0, true, '2026-11-15T02:57:17.406Z'),
  ('6e1d87f1-1d1f-4f94-91f0-12c0155a293d', '6b19c368-d2fe-446e-95ab-defe3d69e63b', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Bulls_Wild_Cup_1_%28Modell_2010%29_20100814.jpg/960px-Bulls_Wild_Cup_1_%28Modell_2010%29_20100814.jpg', 0, true, '2026-11-15T01:57:17.406Z'),
  ('bd1e86a2-4988-4c92-abb6-f6cca7b0f1db', 'cca6cd31-7f27-4482-89aa-cd2e48f09852', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Brompton1.jpeg/960px-Brompton1.jpeg', 0, true, '2026-11-15T00:57:17.406Z'),
  ('4eb8d53e-e85b-459f-9c5f-408784821e2b', 'adbefb57-ef5d-4275-ab1e-f68c6c8e2638', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/RaleighScorpio.JPG/960px-RaleighScorpio.JPG', 0, true, '2026-11-14T23:57:17.406Z'),
  ('57dba470-42dd-4bef-9c43-3d0f05ed919c', 'f3fed2bf-476c-4e25-a86d-b2a6029d102e', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Colorful_pile_of_dumbbells_at_the_gym.jpg/960px-Colorful_pile_of_dumbbells_at_the_gym.jpg', 0, true, '2026-11-14T22:57:17.406Z'),
  ('44353fe0-5167-401e-8888-d49512012c9c', '2fbbd418-8e1b-422d-a910-d654f316baf2', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Treadmill_by_window.jpg/960px-Treadmill_by_window.jpg', 0, true, '2026-11-14T21:57:17.406Z'),
  ('0799a408-11d4-4367-b7ee-f4cb7bdc9087', '5dc2eb01-c32f-4c15-830a-78cfa25aff26', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Babolat_Contest_Pro_tennis_racquet.JPG/960px-Babolat_Contest_Pro_tennis_racquet.JPG', 0, true, '2026-11-14T20:57:17.406Z'),
  ('1b707f04-4b7a-4df8-aaa1-39ed9ca35707', '4a9001ac-cece-4cc9-8cb3-a75ebff82471', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tabla_de_surf_epoxi_Surfboard_epoxy.jpg/960px-Tabla_de_surf_epoxi_Surfboard_epoxy.jpg', 0, true, '2026-11-14T19:57:17.406Z'),
  ('436a9d9f-6980-490d-8424-d1bc08c7fac1', 'cada82af-00af-4664-8dee-e6e54a2c207e', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/2023_Buty_Nike_Air_Jordan.jpg/960px-2023_Buty_Nike_Air_Jordan.jpg', 0, true, '2026-11-14T18:57:17.406Z'),
  ('d96a805c-a320-45c0-a312-4cdc77fb8818', 'ed02aea9-6c9b-4946-b101-4cb4eab2d549', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Black_worn_leather_jacket.jpg/960px-Black_worn_leather_jacket.jpg', 0, true, '2026-11-14T17:57:17.406Z'),
  ('8d8a0453-bc39-44ea-9811-22ac09b2c204', 'ce851525-e28a-4e64-bf9b-cff2f26931f7', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Seiko_5.jpg/960px-Seiko_5.jpg', 0, true, '2026-11-14T16:57:17.406Z'),
  ('09c885cd-2ac7-4927-9a9e-a68088ed358c', 'd05a7e6e-4248-4858-8b35-cec7038e17a8', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/%D0%A1%D1%83%D0%BC%D0%BA%D0%B0_%D0%9E%D0%BB%D0%B8%D0%B2%D0%B8%2C_%D0%BC%D0%BE%D0%B4%D0%B5%D0%BB%D1%8C_561.jpg/960px-%D0%A1%D1%83%D0%BC%D0%BA%D0%B0_%D0%9E%D0%BB%D0%B8%D0%B2%D0%B8%2C_%D0%BC%D0%BE%D0%B4%D0%B5%D0%BB%D1%8C_561.jpg', 0, true, '2026-11-14T15:57:17.406Z'),
  ('cd5141c6-e996-4fbc-a741-14f05e5a23f4', '2bdc89e7-28a3-4684-a34f-1586970a65ce', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Eastpak_Sugarbush_backpack_black.jpg/960px-Eastpak_Sugarbush_backpack_black.jpg', 0, true, '2026-11-14T14:57:17.406Z'),
  ('867ae6d2-d2b4-4fe4-9d8a-7f7d9cebd059', '88a7130f-b2d2-4046-94de-5578198b90c1', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Bob_Dylan%27s_Fender_Stratocaster_%281964%29_in_3_tone_sunburst%2C_played_when_Dylan_Goes_Electric_at_Newport_Folk_Festival_on_July_25%2C_1965._Lost_ca.1965%2C_rediscovered_in_2012_-_Play_It_Loud._MET_%282019-05-13_19.46.56_by_Eden%2C_Janine_and_Jim%29.jpg/960px-thumbnail.jpg', 0, true, '2026-11-14T13:57:17.406Z'),
  ('79eb3665-cb33-4255-910a-da81cf5b3e52', 'fd079ddf-2cd3-45e0-9fd8-00d4f8f35e83', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Yamaha_PSR-270_-_angled.jpg/960px-Yamaha_PSR-270_-_angled.jpg', 0, true, '2026-11-14T12:57:17.406Z'),
  ('06eb7bcf-4cb6-4810-8ee9-24251d29435b', '14548ece-afb6-472d-a93b-7738cef1c332', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Harry_Potter_1st_USA_ed._complete_hardback_set_lined_up_L-R.JPG/960px-Harry_Potter_1st_USA_ed._complete_hardback_set_lined_up_L-R.JPG', 0, true, '2026-11-14T11:57:17.406Z'),
  ('8676e405-c5a7-4477-bb73-2da1fef5fbf6', 'ec2b11f0-d80d-441b-8f82-eca43d37fc10', 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Audio-Technica_turntable_playing_coloured_vinyl.jpg/960px-Audio-Technica_turntable_playing_coloured_vinyl.jpg', 0, true, '2026-11-14T10:57:17.406Z');

COMMIT;

-- 4. Verificación de Carga
SELECT 
  COUNT(*) AS total_productos_cargados,
  COUNT(DISTINCT seller_id) AS vendedores_distintos,
  COUNT(DISTINCT category_id) AS categorias_distintas,
  COUNT(DISTINCT location) AS ubicaciones_distintas
FROM public.products
WHERE status = 'activo';

SELECT 
  COUNT(*) AS total_imagenes_cargadas,
  COUNT(DISTINCT product_id) AS productos_con_imagen
FROM public.product_images;
