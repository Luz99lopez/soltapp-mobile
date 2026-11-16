import subprocess
import re

test_ids = [
    ('1590506995460-d0d9892b54da', 'Casco'),
    ('1645445522156-9ac06bc7a767', 'Cubiertas'),
    ('1616388761741-a5936c6f61f6', 'Cafetera'),
    ('1695089028114-ce28248f0ab9', 'Airfryer'),
    ('1585659722983-3a675dabf23d', 'Microondas'),
    ('1572981779307-38b8cabb2407', 'Taladro'),
    ('1458245201577-fc8a130b8829', 'Cortadora'),
    ('1626806819282-2c1dc01a5e0c', 'Lavarropas'),
    ('1721613877687-c9099b698faa', 'Heladera'),
    ('1558317374-067fb5f30001', 'Robot vacuum'),
    ('1599058917212-d750089bc07e', 'Cinta correr'),
    ('1638536532686-d610adfc8e5c', 'Mancuernas'),
    ('1545151414-8a948e1ea54f', 'Raqueta'),
    ('1586996292898-71f4036c4e07', 'Surf'),
    ('1551028719-00167b16eac5', 'Campera'),
    ('1691480150204-66dd1eb77391', 'Cartera'),
    ('1553062407-98eeb64c6a62', 'Mochila'),
    ('1564186763535-ebb21ef5277f', 'Guitarra'),
    ('1538402074774-8e624f3f7e5d', 'Teclado'),
    ('1610116306796-6fea9f4fae38', 'Libros'),
    ('1616714109948-c74fe5029a4d', 'Tocadiscos'),
    ('1542496658-e33a6d0d50f6', 'Reloj'),
    ('1542291026-7eec264c27ff', 'Zapatillas')
]

for pid, name in test_ids:
    url = f"https://unsplash.com/photos/{pid}"
    res = subprocess.run(['curl.exe', '-s', '-L', url, '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)'], capture_output=True, text=True, encoding='utf-8', errors='ignore')
    m = re.search(r'<title>(.*?)</title>', res.stdout)
    title = m.group(1) if m else 'No title'
    # strip trailing " | Download Free Images on Unsplash" or similar
    title = title.split(' | ')[0]
    print(f"{name} ({pid}): {title}")
