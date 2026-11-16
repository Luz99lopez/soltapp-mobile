import subprocess
import re
import json

def get_photos(slug):
    try:
        cmd = ['curl.exe', '-s', f'https://unsplash.com/s/photos/{slug}']
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        matches = re.findall(r'https://images\.unsplash\.com/photo-[a-zA-Z0-9-]+', res.stdout)
        # deduplicate preserving order
        seen = set()
        unique = []
        for m in matches:
            if m not in seen:
                seen.add(m)
                unique.append(m)
        return unique[:5]
    except Exception as e:
        return [str(e)]

queries = {
    'motorcycle-helmet': 'Casco moto',
    'car-tires': 'Cubiertas de auto',
    'espresso-machine': 'Cafetera espresso',
    'air-fryer': 'Freidora de aire',
    'microwave-oven': 'Horno microondas',
    'cordless-drill': 'Taladro percutor',
    'lawn-mower': 'Cortadora de césped',
    'washing-machine': 'Lavarropas automático',
    'refrigerator': 'Heladera No Frost',
    'robot-vacuum': 'Aspiradora robot',
    'treadmill': 'Cinta de correr',
    'dumbbells': 'Mancuernas',
    'tennis-racket': 'Raqueta de tenis',
    'surfboard': 'Tabla de surf',
    'leather-jacket': 'Campera de cuero',
    'womens-handbag': 'Cartera de cuero',
    'laptop-backpack': 'Mochila',
    'electric-guitar': 'Guitarra eléctrica',
    'musical-keyboard': 'Teclado sintetizador',
    'stack-of-books': 'Libros',
    'vinyl-record-player': 'Tocadiscos vinilo',
    'mens-wristwatch': 'Reloj Seiko',
    'nike-sneakers': 'Zapatillas Jordan',
    'smart-tv': 'Smart TV',
    'video-projector': 'Proyector Wanbo',
    'dining-table': 'Mesa comedor',
    'standing-lamp': 'Lámpara de pie',
    'bbq-grill': 'Parrilla',
    'patio-furniture': 'Juego de jardín',
    'full-length-mirror': 'Espejo cuerpo entero'
}

results = {}
for slug, label in queries.items():
    urls = get_photos(slug)
    results[label] = urls
    print(f"{label} ({slug}): {urls[:2]}")

with open('scraped_photos.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
