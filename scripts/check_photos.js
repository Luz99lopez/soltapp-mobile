const https = require('https');
const fs = require('fs');

const photoIds = [
  { i: 1, title: 'Gol Trend', id: '1541899481282-d53bffe3c35d' },
  { i: 2, title: 'Moto Honda', id: '1558981403-c5f9899a28bc' },
  { i: 3, title: 'Casco moto', id: '1558980664-3a031cf67ea8' },
  { i: 4, title: 'Yamaha FZ', id: '1568772585407-9361f9bf3a87' },
  { i: 5, title: 'Cubiertas', id: '1578844251758-2f71da64c96f' },
  { i: 6, title: 'Chevrolet Onix', id: '1552519507-da3b142c6e3d' },
  { i: 7, title: 'iPhone 14', id: '1592750475338-74b7b21085ab' },
  { i: 8, title: 'Samsung S23', id: '1610945265064-0e34e5519bbf' },
  { i: 9, title: 'Motorola', id: '1598327105666-5b89351aff97' },
  { i: 10, title: 'Apple Watch', id: '1523275335684-37898b6baf30' },
  { i: 11, title: 'MacBook', id: '1517336714731-489689fd1ca8' },
  { i: 12, title: 'Dell Inspiron', id: '1588872657578-7efd1f1555ed' },
  { i: 13, title: 'iPad', id: '1544244015-0df4b3ffc6b0' },
  { i: 14, title: 'PS5', id: '1606813907291-d86efa9b94db' },
  { i: 15, title: 'Nintendo Switch', id: '1578301978693-85fa9c0320b9' },
  { i: 16, title: 'RTX 4070', id: '1591799264318-7e6ef8ddb7ea' },
  { i: 17, title: 'Smart TV', id: '1593359677879-a4bb92f829d1' },
  { i: 18, title: 'Proyector', id: '1517604931442-7e0c8ed2963c' },
  { i: 19, title: 'Auriculares Sony', id: '1505740420928-5e560c06d30e' },
  { i: 20, title: 'JBL Charge', id: '1545454675-3531b543be5d' },
  { i: 21, title: 'Canon T7', id: '1516035069371-29a1b244cc32' },
  { i: 22, title: 'DJI Mini 2', id: '1527977966376-1c8408f9f108' },
  { i: 23, title: 'Chesterfield', id: '1555041469-a586c61ea9bc' },
  { i: 24, title: 'Mesa Eames', id: '1615066390971-03e4e1c36ddf' },
  { i: 25, title: 'Lampara', id: '1507473885765-e6ed057f782c' },
  { i: 26, title: 'Parrilla', id: '1555396273-367ea4eb4db5' },
  { i: 27, title: 'Jardin', id: '1586023492125-27b2c045efd7' },
  { i: 28, title: 'Espejo', id: '1618220179428-22790b461013' },
  { i: 29, title: 'Taladro', id: '1504148455328-c376907d081c' },
  { i: 30, title: 'Cortadora', id: '1589923188900-85dae523342b' },
  { i: 31, title: 'Cafetera', id: '1517668808822-9ebb02f2a0e6' },
  { i: 32, title: 'Heladera', id: '1584992236310-6edddc08acff' },
  { i: 33, title: 'Lavarropas', id: '1626806787461-102c1bfaaea1' },
  { i: 34, title: 'Airfryer', id: '1556911220-e15b29be8c8f' },
  { i: 35, title: 'Microondas', id: '1574269909862-7e1d70bb8078' },
  { i: 36, title: 'Robot Vacuum', id: '1518770660439-4636190af475' },
  { i: 37, title: 'MTB Venzo', id: '1485965120184-e220f721d03e' },
  { i: 38, title: 'Plegable Tern', id: '1532298229144-0ec0c57515c7' },
  { i: 39, title: 'Ruta Vairo', id: '1507035895480-2b3156c31fc8' },
  { i: 40, title: 'Mancuernas', id: '1584735935682-2f2b69dff9d2' },
  { i: 41, title: 'Cinta Correr', id: '1576678927484-cc907957088c' },
  { i: 42, title: 'Raqueta', id: '1617083934555-ac7d4efe0f74' },
  { i: 43, title: 'Surf', id: '1502680390469-be75c86b636f' },
  { i: 44, title: 'Air Jordan', id: '1552346154-21d32810aba3' },
  { i: 45, title: 'Campera Cuero', id: '1551028719-00167b16eac5' },
  { i: 46, title: 'Reloj Seiko', id: '1524805444758-089113d48a6d' },
  { i: 47, title: 'Cartera Prune', id: '1584917865442-de89df76afd3' },
  { i: 48, title: 'Mochila', id: '1553062407-98eeb64c6a62' },
  { i: 49, title: 'Guitarra', id: '1511671782779-c97d3d27a1d4' },
  { i: 50, title: 'Teclado Yamaha', id: '1520523839898-50712825e617' },
  { i: 51, title: 'Harry Potter', id: '1512820790803-83ca734da794' },
  { i: 52, title: 'Tocadiscos', id: '1539185441755-769473a23570' }
];

async function checkOne(p) {
  return new Promise((resolve) => {
    https.get('https://unsplash.com/photos/photo-' + p.id, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const titleMatch = data.match(/<title>([^<]+)<\/title>/);
        const metaDesc = data.match(/name=\"description\" content=\"([^\"]+)\"/);
        resolve({
          title: p.title,
          pageTitle: titleMatch ? titleMatch[1] : 'N/A',
          desc: metaDesc ? metaDesc[1] : 'N/A'
        });
      });
    }).on('error', () => resolve({ title: p.title, error: true }));
  });
}

async function run() {
  for (let i = 0; i < photoIds.length; i += 5) {
    const chunk = photoIds.slice(i, i + 5);
    const results = await Promise.all(chunk.map(checkOne));
    results.forEach(r => console.log(`${r.title}: ${r.pageTitle}`));
  }
}
run();
