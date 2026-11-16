const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'generate_seed_sql.js');
let code = fs.readFileSync(filePath, 'utf8');

// Map of replacement images by index
const images = [
  // 1. Gol Trend
  'https://images.unsplash.com/photo-1572811298797-9eecadf6cb24?w=800&auto=format&fit=crop&q=80',
  // 2. Moto Honda XR 150L
  'https://images.unsplash.com/photo-1630949821332-3beae5adc9e2?w=800&auto=format&fit=crop&q=80',
  // 3. Casco para moto LS2
  'https://images.unsplash.com/photo-1590506995460-d0d9892b54da?w=800&auto=format&fit=crop&q=80',
  // 4. Yamaha FZ FI 2.0
  'https://images.unsplash.com/photo-1649027738807-5a0d9fedf6ae?w=800&auto=format&fit=crop&q=80',
  // 5. Cubiertas Michelin
  'https://images.unsplash.com/photo-1571335746824-742511d49bce?w=800&auto=format&fit=crop&q=80',
  // 6. Chevrolet Onix
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
  // 7. iPhone 14 Pro
  'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?w=800&auto=format&fit=crop&q=80',
  // 8. Samsung Galaxy S23 Ultra
  'https://images.unsplash.com/photo-1772182129439-7ab29e9d154c?w=800&auto=format&fit=crop&q=80',
  // 9. Motorola Edge 40 Neo
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  // 10. Apple Watch Series 8
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80',
  // 11. MacBook Air M2
  'https://images.unsplash.com/photo-1651241680016-cc9e407e7dc3?w=800&auto=format&fit=crop&q=80',
  // 12. Notebook Dell Inspiron 15
  'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80',
  // 13. iPad 10ma Generación
  'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
  // 14. Sony PlayStation 5
  'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop&q=80',
  // 15. Nintendo Switch OLED
  'https://images.unsplash.com/photo-1612036781124-847f8939b154?w=800&auto=format&fit=crop&q=80',
  // 16. Placa de Video ASUS TUF Gaming GeForce RTX 4070
  'https://images.unsplash.com/photo-1778621962156-f9b3d255fb5f?w=800&auto=format&fit=crop&q=80',
  // 17. Smart TV Samsung 55
  'https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?w=800&auto=format&fit=crop&q=80',
  // 18. Proyector Portátil Wanbo
  'https://images.unsplash.com/photo-1637656375538-9dfe600ccfd2?w=800&auto=format&fit=crop&q=80',
  // 19. Auriculares Sony WH-1000XM5
  'https://images.unsplash.com/photo-1612858249816-5a91a9fb9886?w=800&auto=format&fit=crop&q=80',
  // 20. Parlante JBL Charge 5
  'https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=800&auto=format&fit=crop&q=80',
  // 21. Cámara Canon EOS Rebel T7
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80',
  // 22. Drone DJI Mini 2 SE
  'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&auto=format&fit=crop&q=80',
  // 23. Sillón Chesterfield
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
  // 24. Mesa de Comedor Paraíso + 6 Sillas Eames
  'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80',
  // 25. Lámpara de Pie Nórdica Trípode
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
  // 26. Parrilla Móvil con Fogonero
  'https://images.unsplash.com/photo-1508615263227-c5d58c1e5821?w=800&auto=format&fit=crop&q=80',
  // 27. Juego de Jardín en Fundición de Aluminio
  'https://images.unsplash.com/photo-1613685302957-3a6fc45346ef?w=800&auto=format&fit=crop&q=80',
  // 28. Espejo de Pared Cuerpo Entero
  'https://images.unsplash.com/photo-1602164091410-255d1bf88959?w=800&auto=format&fit=crop&q=80',
  // 29. Taladro Percutor DeWalt 20V
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80',
  // 30. Cortadora de Césped a Nafta Petri
  'https://images.unsplash.com/photo-1458245201577-fc8a130b8829?w=800&auto=format&fit=crop&q=80',
  // 31. Cafetera Espresso DeLonghi Dedica
  'https://images.unsplash.com/photo-1616388761741-a5936c6f61f6?w=800&auto=format&fit=crop&q=80',
  // 32. Heladera No Frost Samsung 390L
  'https://images.unsplash.com/photo-1642497590397-7f4384a19966?w=800&auto=format&fit=crop&q=80',
  // 33. Lavarropas Automático LG Inverter
  'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop&q=80',
  // 34. Freidora de Aire Philips Airfryer XL
  'https://images.unsplash.com/photo-1695089028114-ce28248f0ab9?w=800&auto=format&fit=crop&q=80',
  // 35. Horno Microondas BGH Quick Chef
  'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80',
  // 36. Aspiradora Robot Xiaomi Robot Vacuum Mop
  'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
  // 37. Bicicleta Mountain Bike Venzo Rodado 29
  'https://images.unsplash.com/photo-1629216012338-0e06caae0dff?w=800&auto=format&fit=crop&q=80',
  // 38. Bicicleta Plegable Tern Link B7
  'https://images.unsplash.com/photo-1586403232406-43107b51e673?w=800&auto=format&fit=crop&q=80',
  // 39. Bicicleta de Ruta Vairo Speed 24V
  'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop&q=80',
  // 40. Set de Mancuernas Ajustables
  'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&auto=format&fit=crop&q=80',
  // 41. Cinta de Correr Motorizada Randers
  'https://images.unsplash.com/photo-1648995361141-30676a75fd27?w=800&auto=format&fit=crop&q=80',
  // 42. Raqueta de Tenis Babolat Pure Drive
  'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&auto=format&fit=crop&q=80',
  // 43. Tabla de Surf Fish 6 pies
  'https://images.unsplash.com/photo-1621951289270-b942dc5f4320?w=800&auto=format&fit=crop&q=80',
  // 44. Zapatillas Nike Air Jordan 1 Retro High
  'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&auto=format&fit=crop&q=80',
  // 45. Campera de Cuero Vacuno Hombre
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
  // 46. Reloj Seiko 5 Sports Automático
  'https://images.unsplash.com/photo-1629581678313-36cf745a9af9?w=800&auto=format&fit=crop&q=80',
  // 47. Cartera de Cuero Genuino Prüne
  'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800&auto=format&fit=crop&q=80',
  // 48. Mochila Impermeable Samsonite Xenon
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  // 49. Guitarra Eléctrica Fender Stratocaster
  'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&auto=format&fit=crop&q=80',
  // 50. Teclado Sintetizador Yamaha PSR-E373
  'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&auto=format&fit=crop&q=80',
  // 51. Box Set Colección Harry Potter
  'https://images.unsplash.com/photo-1600189261900-da2183219c28?w=800&auto=format&fit=crop&q=80',
  // 52. Tocadiscos Vinilo Audio-Technica AT-LP60X
  'https://images.unsplash.com/photo-1616714109948-c74fe5029a4d?w=800&auto=format&fit=crop&q=80'
];

let itemIdx = 0;
code = code.replace(/images:\s*\[\s*'[^']+'\s*\]/g, () => {
  const url = images[itemIdx++];
  return `images: [\n      '${url}'\n    ]`;
});

fs.writeFileSync(filePath, code, 'utf8');
console.log(`Updated generate_seed_sql.js with ${itemIdx} brand-faithful images!`);
