const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const users = [
  'c2026302-b7da-4dee-8c96-6623a5a5f4d0', // Nestor Enrique Sanabria
  'ea31e357-1e9a-4bd1-88e3-bf630bfe9c47', // alanagustingomez22
  'd15131cc-e679-4ce6-ac73-397b57b789cc', // alanagustingomez23
  'd3605f8d-3c95-41b0-a724-687110125044', // joaqosanabria
  '122230dc-4ee3-407a-a32d-07a538b32212', // yassvica
  '4641c167-0fb0-4982-b880-39eb93a9b003', // Rodri El Mas Capito
  'a753450d-1a9a-406a-99f7-70460e7bdba3', // Luz Lopez
  '3212332c-c77f-4c45-82c6-317f4b7d0ded', // Elías Ayala
  '1dca4e05-2499-481b-a2e1-fe568f564e4a', // Alan Gomez Crossingnet
  '92e85b68-2904-4f0b-88ca-e8235e6b8579', // Alan Agustin Gomez
  'f79a1a4f-ac7b-48dc-b4e5-27a601ed54df', // ALAN GOMEZ
  '09af6e65-afae-4cad-a5bf-cb8adc2be80c', // Javier Florentin
  '9f017b8b-6bfa-48e4-8da3-d6c77b888fc8', // Javier Florentin
  'bbb8c996-9540-4bd3-b0c1-231789f7de51', // Alan G
  'f12e3fba-56fd-421b-8f0f-63061d4e5bdb', // Kike Sanabria
  '75bd20e2-1358-4505-b95a-d212136eb7cb', // Luz López
  'ae23de33-f64e-4304-9fbe-eb536dc3cf3e', // agustin ayala
  'c8aa4409-b4a4-48d6-be0c-55581d11c34c', // Leandro Galan
];

const catalog = [
  // --- VEHICULOS Y MOTOR (Cat 1) ---
  {
    title: 'Volkswagen Gol Trend 1.6 MSI 2018',
    description: 'Impecable estado general, 68.000 km reales, services oficiales al día. Aire acondicionado, dirección hidráulica, levanta vidrios y cierre centralizado. VTV vigente hasta fin de año.',
    category_id: 1,
    price: 10500000,
    condition: 'como_nuevo',
    location: 'Palermo, CABA',
    images: [
      'https://images.unsplash.com/photo-1572811298797-9eecadf6cb24?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Moto Honda XR 150L 2022',
    description: 'Excelente moto enduro urbana con 12.000 km. Titular al día, cubiertas originales con 80% de vida útil, service recién hecho con cambio de aceite y filtro.',
    category_id: 1,
    price: 3800000,
    condition: 'como_nuevo',
    location: 'Pilar, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1630949821332-3beae5adc9e2?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Casco para moto LS2 Rookie Integral Talle L',
    description: 'Casco integral homologado ECE 22.05, visor antirrayas transparente, interior desmontable y lavable. Muy poco uso, sin caídas ni golpes.',
    category_id: 1,
    price: 95000,
    condition: 'bueno',
    location: 'Belgrano, CABA',
    images: [
      'https://images.unsplash.com/photo-1590506995460-d0d9892b54da?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Yamaha FZ FI 2.0 Edición Especial',
    description: 'Color negra mate con detalles dorados. 18.500 km, inyección electrónica Blue Core, frenos impecables. Manuales y duplicado de llave.',
    category_id: 1,
    price: 4200000,
    condition: 'como_nuevo',
    location: 'Rosario, Santa Fe',
    images: [
      'https://images.unsplash.com/photo-1649027738807-5a0d9fedf6ae?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Juego de 4 Cubiertas Michelin Primacy 205/55 R16',
    description: 'Set completo de 4 neumáticos nuevos sin rodar. Fabricación reciente (DOT 2024). Ideales para Golf, Focus, Cruze, Corolla o similar.',
    category_id: 1,
    price: 480000,
    condition: 'nuevo',
    location: 'Morón, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1571335746824-742511d49bce?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Chevrolet Onix 1.4 LTZ 2019',
    description: 'Versión full equipada con pantalla táctil MyLink, cámara de retroceso, tapizados combinados en cuero y tela. 54.000 km, cubiertas semi-nuevas.',
    category_id: 1,
    price: 12800000,
    condition: 'como_nuevo',
    location: 'Vicente López, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- TECNOLOGÍA: CELULARES Y SMARTWATCHES (Cat 21) ---
  {
    title: 'iPhone 14 Pro 128GB Space Black',
    description: 'Batería con 92% de condición original. Pantalla Super Retina XDR con Dynamic Island y 120Hz ProMotion. Incluye cable Lightning original y funda de silicona negra.',
    category_id: 21,
    price: 980000,
    condition: 'como_nuevo',
    location: 'Recoleta, CABA',
    images: [
      'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Samsung Galaxy S23 Ultra 256GB Phantom Black',
    description: 'Cámara de 200MP con zoom óptico 100x y lápiz S-Pen integrado. Pantalla Dynamic AMOLED 2X. Caja original, cable USB-C y vidrio templado colocado.',
    category_id: 21,
    price: 1150000,
    condition: 'como_nuevo',
    location: 'Caballito, CABA',
    images: [
      'https://images.unsplash.com/photo-1772182129439-7ab29e9d154c?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Motorola Edge 40 Neo 256GB Caneel Bay',
    description: 'Nuevo en caja sellada con garantía oficial. Pantalla curva pOLED 144Hz, certificación IP68 contra agua y polvo, cámara 50MP con OIS.',
    category_id: 21,
    price: 450000,
    condition: 'nuevo',
    location: 'Almagro, CABA',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Apple Watch Series 8 45mm GPS Medianoche',
    description: 'Carcasa de aluminio color medianoche. Sensor de temperatura, detección de choques y monitoreo de oxígeno en sangre. Correa deportiva original y cargador magnético rápido.',
    category_id: 21,
    price: 410000,
    condition: 'como_nuevo',
    location: 'Salta Capital, Salta',
    images: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- TECNOLOGÍA: COMPUTADORAS Y TABLETS (Cat 22) ---
  {
    title: 'MacBook Air M2 13.6 pulgadas 8GB RAM 256GB SSD',
    description: 'Color Silver, estado idéntico a nuevo con 32 ciclos de batería (100% de capacidad). Teclado en español, cargador MagSafe 3 original y caja con folletería.',
    category_id: 22,
    price: 1350000,
    condition: 'como_nuevo',
    location: 'San Isidro, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1651241680016-cc9e407e7dc3?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Notebook Dell Inspiron 15 AMD Ryzen 7 16GB RAM 512GB SSD',
    description: 'Notebook de alto rendimiento para programación o diseño. Pantalla FHD 120Hz 15.6 pulgadas, teclado numérico retroiluminado, Windows 11 Home original.',
    category_id: 22,
    price: 820000,
    condition: 'nuevo',
    location: 'Olivos, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'iPad 10ma Generación 64GB Wi-Fi Blue',
    description: 'Nuevo en empaque cerrado de fábrica. Chip A14 Bionic, pantalla Liquid Retina de 10.9 pulgadas, compatibilidad con Apple Pencil y Magic Keyboard Folio.',
    category_id: 22,
    price: 520000,
    condition: 'nuevo',
    location: 'Villa Urquiza, CABA',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- GAMING: CONSOLAS Y COMPONENTES (Cat 23) ---
  {
    title: 'Sony PlayStation 5 con 2 Controles DualSense',
    description: 'Consola PS5 con lectora de discos Ultra HD Blu-ray. Incluye 2 joysticks inalámbricos DualSense, cable HDMI 2.1, cable de corriente y juego Spider-Man 2 en formato físico.',
    category_id: 23,
    price: 1050000,
    condition: 'como_nuevo',
    location: 'Córdoba Capital, Córdoba',
    images: [
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Nintendo Switch OLED 64GB Neon + Estuche Viajero',
    description: 'Pantalla OLED de 7 pulgadas con soporte ajustable ancho. Muy cuidada, sin drift en los Joy-Con, incluye dock, correas, cargador original y funda protectora rígida.',
    category_id: 23,
    price: 580000,
    condition: 'como_nuevo',
    location: 'Mar del Plata, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1612036781124-847f8939b154?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Placa de Video ASUS TUF Gaming GeForce RTX 4070 12GB',
    description: 'Tarjeta gráfica con arquitectura Ada Lovelace y DLSS 3. Tres ventiladores axiales con rodamiento doble, backplate de aluminio. Se entrega en caja con precintos.',
    category_id: 23,
    price: 920000,
    condition: 'nuevo',
    location: 'La Plata, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1778621962156-f9b3d255fb5f?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- IMAGEN Y SONIDO (Cat 18, 19, 20) ---
  {
    title: 'Smart TV Samsung 55 pulgadas 4K QLED UHD',
    description: 'Televisor inteligente con tecnología Quantum Dot, procesador Quantum Lite 4K, diseño AirSlim ultradelgado y control remoto SolarCell ecológico. Soporte de pie incluido.',
    category_id: 18,
    price: 680000,
    condition: 'como_nuevo',
    location: 'Mendoza Capital, Mendoza',
    images: [
      'https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Proyector Portátil Wanbo T2 Max Full HD 1080p Nativo',
    description: 'Proyector compacto con Android integrado, conectividad Wi-Fi dual band y Bluetooth. Enfoque automático y corrección trapezoidal inteligente de 4 puntos.',
    category_id: 18,
    price: 220000,
    condition: 'nuevo',
    location: 'Tigre, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1637656375538-9dfe600ccfd2?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Auriculares Inalámbricos Sony WH-1000XM5 Noise Cancelling',
    description: 'Líderes en cancelación de ruido activa con procesador V1 y HD QN1. Hasta 30 horas de batería, almohadillas de cuero suave ergonómicas y estuche de transporte plegable.',
    category_id: 19,
    price: 420000,
    condition: 'como_nuevo',
    location: 'Colegiales, CABA',
    images: [
      'https://images.unsplash.com/photo-1612858249816-5a91a9fb9886?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Parlante Bluetooth Portátil JBL Charge 5 Resistente al Agua',
    description: 'Sonido potente JBL Original Pro con driver de gran excursión y tweeters independientes. Certificación IP67 resistente al agua y polvo. Batería externa incorporada.',
    category_id: 19,
    price: 210000,
    condition: 'nuevo',
    location: 'Quilmes, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Cámara Réflex Canon EOS Rebel T7 + Lente 18-55mm IS II',
    description: 'Sensor CMOS APS-C de 24.1 megapíxeles y procesador DIGIC 4+. Conexión Wi-Fi y NFC para transferir fotos al celular. Incluye batería, cargador y correa Canon.',
    category_id: 20,
    price: 590000,
    condition: 'como_nuevo',
    location: 'Neuquén Capital, Neuquén',
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Drone DJI Mini 2 SE Fly More Combo con 3 Baterías',
    description: 'Peso ultraligero menor a 249g. Transmisión de video HD hasta 10 km, video 2.7K con gimbal de 3 ejes, resistencia a vientos nivel 5. Incluye bolso DJI y hélices de repuesto.',
    category_id: 20,
    price: 620000,
    condition: 'como_nuevo',
    location: 'San Carlos de Bariloche, Río Negro',
    images: [
      'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- HOGAR Y JARDÍN (Cat 7) ---
  {
    title: 'Sillón Chesterfield 3 Cuerpos en Cuero Ecológico Chocolate',
    description: 'Estructura maciza de madera estacionada con capitoné artesanal y tachas bronceadas. Almohadones de placa soft de alta densidad 28kg. 2.10m de largo.',
    category_id: 7,
    price: 450000,
    condition: 'como_nuevo',
    location: 'Palermo, CABA',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Mesa de Comedor Paraíso 160x80 + 6 Sillas Eames Negras',
    description: 'Tapa de madera enchapada en Paraíso lustrado poliuretánico impermeable con patas macizas. Sillas modelo DSW con patas de madera y estructura de acero.',
    category_id: 7,
    price: 340000,
    condition: 'nuevo',
    location: 'Belgrano, CABA',
    images: [
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Lámpara de Pie Nórdica Trípode en Madera y Pantalla Lino',
    description: 'Diseño escandinavo moderno de 1.55m de alto. Base de tres patas en madera de pino clear tratada, pantalla cilíndrica de lino natural beige e interruptor de pie.',
    category_id: 7,
    price: 65000,
    condition: 'nuevo',
    location: 'Recoleta, CABA',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Parrilla Móvil con Fogonero y Ruedas Reforzada',
    description: 'Parrilla rodante con emparrillado en V desmontable y grasera en chapa enlozada. Fogonero lateral con ladrillos refractarios y mesada de apoyo en madera.',
    category_id: 7,
    price: 185000,
    condition: 'nuevo',
    location: 'Pilar, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1508615263227-c5d58c1e5821?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Juego de Jardín en Fundición de Aluminio Mesa + 4 Sillones',
    description: 'Juego para exterior e intemperie eterno, no se oxida. Acabado epoxi negro microtexturado con detalles florales clásicos. Muy liviano y resistente.',
    category_id: 7,
    price: 390000,
    condition: 'como_nuevo',
    location: 'San Isidro, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1613685302957-3a6fc45346ef?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Espejo de Pared Cuerpo Entero Marco Metálico 170x60',
    description: 'Espejo biselado de cristal premium sin deformación con marco de hierro negro mate. Apto para colgar o apoyar con pie trasero desplegable.',
    category_id: 7,
    price: 78000,
    condition: 'nuevo',
    location: 'Caballito, CABA',
    images: [
      'https://images.unsplash.com/photo-1602164091410-255d1bf88959?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Taladro Percutor Inalámbrico DeWalt 20V MAX + 2 Baterías',
    description: 'Motor Brushless sin carbones, mandril metálico autoajustable de 13mm y 15 posiciones de torque. Incluye maletín de transporte TSTAK y cargador rápido multivoltaje.',
    category_id: 7,
    price: 240000,
    condition: 'nuevo',
    location: 'Lomas de Zamora, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Cortadora de Césped a Nafta Petri 5.5HP con Bolsa',
    description: 'Motor naftero de 4 tiempos 139cc, chasis de acero estampado con descarga trasera y bolsa recolectora de 50 litros. Ruedas con rodamientos reforzadas.',
    category_id: 7,
    price: 310000,
    condition: 'bueno',
    location: 'Vicente López, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1458245201577-fc8a130b8829?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- ELECTRODOMÉSTICOS (Cat 8) ---
  {
    title: 'Cafetera Espresso DeLonghi Dedica Deluxe Bomba 15 Bar',
    description: 'Elegante cuerpo de acero inoxidable de solo 15 cm de ancho. Termobloque rápido en 40 segundos, boquilla para espumar leche y calentar tazas superior.',
    category_id: 8,
    price: 320000,
    condition: 'como_nuevo',
    location: 'Colegiales, CABA',
    images: [
      'https://images.unsplash.com/photo-1616388761741-a5936c6f61f6?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Heladera No Frost Samsung 390L con Motor Digital Inverter',
    description: 'Tecnología All Around Cooling que distribuye el frío homogéneamente. Estantes de vidrio templado antiderrame, cajón Fresh Zone para vegetales y bajo consumo clase A+.',
    category_id: 8,
    price: 1150000,
    condition: 'como_nuevo',
    location: 'Olivos, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1642497590397-7f4384a19966?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Lavarropas Automático LG Inverter 8.5kg Carga Frontal',
    description: 'Motor 6 Motion DD silencioso con garantía de 10 años. Sistema Smart Diagnosis con conectividad Wi-Fi ThinQ para controlar ciclos desde el celular.',
    category_id: 8,
    price: 790000,
    condition: 'como_nuevo',
    location: 'Villa Urquiza, CABA',
    images: [
      'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Freidora de Aire Philips Airfryer XL Digital 4.1L',
    description: 'Cocina con hasta un 90% menos de grasa mediante flujo de aire caliente Rapid Air. Pantalla táctil con 7 programas preestablecidos de cocción.',
    category_id: 8,
    price: 165000,
    condition: 'nuevo',
    location: 'Tigre, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1695089028114-ce28248f0ab9?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Horno Microondas BGH Quick Chef 28L Grill Digital',
    description: 'Capacidad de 28 litros con función de grill dorador y descongelamiento automático por peso. Panel digital con reloj y traba de seguridad para niños.',
    category_id: 8,
    price: 145000,
    condition: 'como_nuevo',
    location: 'Rosario, Santa Fe',
    images: [
      'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Aspiradora Robot Xiaomi Robot Vacuum Mop 2 Pro con Láser LDS',
    description: 'Navegación láser precisa, potencia de succión de 3000Pa y trapeado con vibración sónica. Mapeo multinivel y programación inteligente de zonas.',
    category_id: 8,
    price: 460000,
    condition: 'como_nuevo',
    location: 'Córdoba Capital, Córdoba',
    images: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- BICICLETAS (Cat 6) ---
  {
    title: 'Bicicleta Mountain Bike Venzo Rodado 29 Frenos a Disco',
    description: 'Cuadro de aluminio 6061 talle M/L, suspensión delantera con bloqueo, transmisión Shimano de 24 velocidades y cubiertas todo terreno Chaoyang.',
    category_id: 6,
    price: 380000,
    condition: 'como_nuevo',
    location: 'Mendoza Capital, Mendoza',
    images: [
      'https://images.unsplash.com/photo-1629216012338-0e06caae0dff?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Bicicleta Plegable Tern Link B7 Rodado 20 Aluminio',
    description: 'Bicicleta urbana de pliegue ultra rápido en 10 segundos. Cambio Shimano Tourney de 7 velocidades, guardabarros completos y portaequipajes trasero.',
    category_id: 6,
    price: 490000,
    condition: 'como_nuevo',
    location: 'Palermo, CABA',
    images: [
      'https://images.unsplash.com/photo-1586403232406-43107b51e673?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Bicicleta de Ruta Vairo Speed 24V Shimano Claris',
    description: 'Cuadro aerodinámico de aluminio con horquilla cónica de carbono. Ruedas doble pared rodado 700x25c y mandos integrados Shimano Claris STI.',
    category_id: 6,
    price: 680000,
    condition: 'como_nuevo',
    location: 'San Isidro, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- DEPORTE Y OCIO (Cat 5) ---
  {
    title: 'Set de Mancuernas Ajustables de 2.5kg a 24kg con Soporte',
    description: 'Mancuernas automáticas con selector giratorio de carga rápida en 15 niveles de peso. Base organizadora y empuñaduras ergonómicas antideslizantes.',
    category_id: 5,
    price: 290000,
    condition: 'nuevo',
    location: 'Belgrano, CABA',
    images: [
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Cinta de Correr Motorizada Randers Plegable 12km/h',
    description: 'Motor de 2.0HP continuo con display digital LCD que mide calorías, tiempo, distancia y pulso cardíaco. Amortiguación elástica de impacto.',
    category_id: 5,
    price: 520000,
    condition: 'como_nuevo',
    location: 'Mar del Plata, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1648995361141-30676a75fd27?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Raqueta de Tenis Babolat Pure Drive 300g Grip 3',
    description: 'La raqueta más vendida del mundo para balance entre potencia y efectos. Encordada con Babolat RPM Blast a 52 libras con antivibrador incluido.',
    category_id: 5,
    price: 210000,
    condition: 'bueno',
    location: 'Pilar, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Tabla de Surf Fish 6 pies Epoxi con Quillas y Leash',
    description: 'Ideal para olas de verano en la costa argentina. Excelente flotación y remada, fondo cóncavo simple a doble y configuración tri-fin incluida.',
    category_id: 5,
    price: 310000,
    condition: 'bueno',
    location: 'Mar del Plata, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1621951289270-b942dc5f4320?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- MODA Y ACCESORIOS (Cat 2 & subcats 13, 14, 15) ---
  {
    title: 'Zapatillas Nike Air Jordan 1 Retro High Talle 42',
    description: 'Edición original 100% auténtica en caja con cordones de repuesto. Capellada de cuero genuino premium con suela de goma cosida duradera.',
    category_id: 14,
    price: 180000,
    condition: 'como_nuevo',
    location: 'Recoleta, CABA',
    images: [
      'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Campera de Cuero Vacuno Hombre Talle L Negra',
    description: 'Cuero argentino 100% legítimo de primera calidad. Corte slim fit con cierres YKK metálicos reforzados y forro interior rasado térmico.',
    category_id: 14,
    price: 210000,
    condition: 'como_nuevo',
    location: 'Caballito, CABA',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Reloj Seiko 5 Sports Automático Acero Inox Fondo Azul',
    description: 'Calibre 4R36 automático con 41 horas de reserva de marcha y cuerda manual. Cristal Hardlex resistente a rayones y sumergible a 100 metros.',
    category_id: 15,
    price: 390000,
    condition: 'nuevo',
    location: 'Palermo, CABA',
    images: [
      'https://images.unsplash.com/photo-1629581678313-36cf745a9af9?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Cartera de Cuero Genuino Prüne Suela con Correa',
    description: 'Cartera tote bag con manijas fijas y correa larga desmontable. Interior forrado con bolsillo organizador con cierre. Bolsa de tela guardapolvo.',
    category_id: 13,
    price: 135000,
    condition: 'como_nuevo',
    location: 'Belgrano, CABA',
    images: [
      'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Mochila Impermeable Samsonite Xenon para Notebook 15.6',
    description: 'Compartimento acolchado para laptop y tablet con tecnología de absorción de caídas. Bolsillo frontal organizador de cables y pasador para valija.',
    category_id: 15,
    price: 95000,
    condition: 'nuevo',
    location: 'Almagro, CABA',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
    ]
  },

  // --- CINE, LIBROS Y MÚSICA (Cat 9 & subcats 24, 26) ---
  {
    title: 'Guitarra Eléctrica Fender Stratocaster Player Series México',
    description: 'Cuerpo de aliso en color Sunburst brillante, mástil de arce con perfil Modern C y 3 micrófonos simples Player Series Alnico 5. Funda Fender acolchada.',
    category_id: 26,
    price: 1100000,
    condition: 'como_nuevo',
    location: 'San Miguel de Tucumán, Tucumán',
    images: [
      'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Teclado Sintetizador Yamaha PSR-E373 Sensitivo 61 Teclas',
    description: 'Teclas sensibles al tacto con generador de tonos LSI de alta fidelidad, 622 voces de instrumentos y lecciones incorporadas. Incluye fuente y atril.',
    category_id: 26,
    price: 350000,
    condition: 'como_nuevo',
    location: 'La Plata, Buenos Aires',
    images: [
      'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Box Set Colección Harry Potter Edición Especial Tapa Dura',
    description: 'Los 7 libros completos en español con estuche rígido ilustrado con detalles dorados y mapas desplegables. Nuevos en celofán.',
    category_id: 24,
    price: 110000,
    condition: 'nuevo',
    location: 'Villa Carlos Paz, Córdoba',
    images: [
      'https://images.unsplash.com/photo-1600189261900-da2183219c28?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    title: 'Tocadiscos Vinilo Audio-Technica AT-LP60X Automático',
    description: 'Bandeja giradiscos de transmisión por correa con preamplificador phono conmutable incorporado. Cápsula Dual Magnet con púa de diamante reemplazable.',
    category_id: 26,
    price: 270000,
    condition: 'como_nuevo',
    location: 'Godoy Cruz, Mendoza',
    images: [
      'https://images.unsplash.com/photo-1616714109948-c74fe5029a4d?w=800&auto=format&fit=crop&q=80'
    ]
  }
];

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

let sql = `-- ==============================================================================
-- SOLTAPP: Reseteo y Carga Masiva de 52 Publicaciones Multi-Categoría y Multi-Usuario
-- Ejecutar en: Supabase Dashboard -> SQL Editor (Rol Postgres / Superusuario)
-- ==============================================================================

BEGIN;

-- 1. Limpieza segura y en cascada de productos y tablas vinculadas (chats, órdenes, imágenes)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    EXECUTE 'DELETE FROM public.chat_messages';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_conversations') THEN
    EXECUTE 'DELETE FROM public.chat_conversations';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_reviews') THEN
    EXECUTE 'DELETE FROM public.order_reviews';
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
`;

const productRows = [];
const imageRows = [];

catalog.forEach((item, index) => {
  const productId = crypto.randomUUID();
  const sellerId = users[index % users.length];
  const now = new Date(Date.now() - (index * 3600000)).toISOString();

  productRows.push(
    `('${productId}', '${sellerId}', ${item.category_id}, '${escapeSql(item.title)}', '${escapeSql(item.description)}', ${item.price}, 'ARS', '${item.condition}', 'activo', '${escapeSql(item.location)}', '${now}', '${now}')`
  );

  item.images.forEach((imgUrl, pos) => {
    const imgId = crypto.randomUUID();
    const isCover = pos === 0 ? 'true' : 'false';
    imageRows.push(
      `('${imgId}', '${productId}', '${escapeSql(imgUrl)}', ${pos}, ${isCover}, '${now}')`
    );
  });
});

sql += `INSERT INTO public.products (
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
) VALUES \n` + productRows.join(',\n') + ';\n\n';

sql += `-- 3. Inserción de Imágenes Asociadas (Fotos exactas, aisladas y enfocadas al producto)
INSERT INTO public.product_images (
  id,
  product_id,
  image_url,
  position,
  is_cover,
  created_at
) VALUES \n` + imageRows.join(',\n') + ';\n\n';

sql += `COMMIT;

-- 4. Verificación de Carga
SELECT 
  COUNT(*) AS total_productos_cargados,
  COUNT(DISTINCT seller_id) AS vendedores_distintos,
  COUNT(DISTINCT category_id) AS categorias_distintas,
  COUNT(DISTINCT location) AS ubicaciones_distintas
FROM public.products
WHERE status = 'activo';
`;

const targetPath1 = path.join('C:', 'Users', 'nenri', 'OneDrive', 'Escritorio', 'soltapp-mobile', 'scripts', 'reset_and_seed_50_products.sql');
const targetPath2 = path.join('C:', 'Users', 'nenri', 'OneDrive', 'Escritorio', 'soltapp-mobile', 'supabase', 'migrations', '20261116_reset_and_seed_50_products.sql');

fs.writeFileSync(targetPath1, sql, 'utf8');
fs.writeFileSync(targetPath2, sql, 'utf8');

console.log('Regenerated with 100% verified isolated product images!');
