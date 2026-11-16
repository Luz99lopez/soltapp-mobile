import urllib.request

urls = [
    ('Casco', 'https://images.unsplash.com/photo-1590506995460-d0d9892b54da?w=800&auto=format&fit=crop&q=80'),
    ('Cubiertas', 'https://images.unsplash.com/photo-1645445522156-9ac06bc7a767?w=800&auto=format&fit=crop&q=80'),
    ('Cafetera', 'https://images.unsplash.com/photo-1616388761741-a5936c6f61f6?w=800&auto=format&fit=crop&q=80'),
    ('Airfryer', 'https://images.unsplash.com/photo-1695089028114-ce28248f0ab9?w=800&auto=format&fit=crop&q=80'),
    ('Microondas', 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80'),
    ('Taladro', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80'),
    ('Cortadora', 'https://images.unsplash.com/photo-1458245201577-fc8a130b8829?w=800&auto=format&fit=crop&q=80'),
    ('Lavarropas', 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop&q=80'),
    ('Heladera', 'https://images.unsplash.com/photo-1721613877687-c9099b698faa?w=800&auto=format&fit=crop&q=80'),
    ('Robot vacuum', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80'),
    ('Cinta correr', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80'),
    ('Mancuernas', 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&auto=format&fit=crop&q=80'),
    ('Raqueta', 'https://images.unsplash.com/photo-1545151414-8a948e1ea54f?w=800&auto=format&fit=crop&q=80'),
    ('Surf', 'https://images.unsplash.com/photo-1586996292898-71f4036c4e07?w=800&auto=format&fit=crop&q=80'),
    ('Campera', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'),
    ('Cartera', 'https://images.unsplash.com/photo-1691480150204-66dd1eb77391?w=800&auto=format&fit=crop&q=80'),
    ('Mochila', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'),
    ('Guitarra', 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&auto=format&fit=crop&q=80'),
    ('Teclado', 'https://images.unsplash.com/photo-1538402074774-8e624f3f7e5d?w=800&auto=format&fit=crop&q=80'),
    ('Libros', 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=800&auto=format&fit=crop&q=80'),
    ('Tocadiscos', 'https://images.unsplash.com/photo-1616714109948-c74fe5029a4d?w=800&auto=format&fit=crop&q=80'),
    ('Reloj', 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800&auto=format&fit=crop&q=80'),
    ('Zapatillas', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'),
    ('TV', 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&auto=format&fit=crop&q=80'),
    ('Proyector', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop&q=80'),
    ('Mesa', 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800&auto=format&fit=crop&q=80'),
    ('Lampara', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80'),
    ('Parrilla', 'https://images.unsplash.com/photo-1508615263227-c5d58c1e5821?w=800&auto=format&fit=crop&q=80'),
    ('Jardin', 'https://images.unsplash.com/photo-1613685302957-3a6fc45346ef?w=800&auto=format&fit=crop&q=80'),
    ('Espejo', 'https://images.unsplash.com/photo-1602164091410-255d1bf88959?w=800&auto=format&fit=crop&q=80')
]

for label, u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as r:
        print(f"{label}: HTTP {r.status}, {r.headers.get('Content-Type')}, {len(r.read())} bytes")
