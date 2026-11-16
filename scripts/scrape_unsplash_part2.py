import subprocess
import re
import json

def get_photos(slug):
    try:
        cmd = ['curl.exe', '-s', f'https://unsplash.com/s/photos/{slug}']
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        matches = re.findall(r'https://images\.unsplash\.com/photo-[a-zA-Z0-9-]+', res.stdout)
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
    'volkswagen-golf': 'Gol Trend',
    'enduro-motorcycle': 'Moto Honda XR',
    'sport-motorcycle': 'Yamaha FZ',
    'compact-car': 'Chevrolet Onix',
    'iphone': 'iPhone 14 Pro',
    'samsung-galaxy': 'Samsung Galaxy S23',
    'smartphone': 'Motorola Edge 40',
    'apple-watch': 'Apple Watch',
    'macbook': 'MacBook Air M2',
    'laptop-computer': 'Notebook Dell Inspiron',
    'ipad': 'iPad 10ma Gen',
    'playstation-5': 'PlayStation 5',
    'nintendo-switch': 'Nintendo Switch OLED',
    'graphics-card': 'Placa RTX 4070',
    'headphones': 'Auriculares Sony',
    'bluetooth-speaker': 'Parlante JBL',
    'canon-camera': 'Cámara Canon',
    'dji-drone': 'Drone DJI Mini 2',
    'chesterfield-sofa': 'Sillón Chesterfield',
    'mountain-bike': 'Bicicleta Mountain Bike',
    'folding-bike': 'Bicicleta Plegable',
    'road-bike': 'Bicicleta de Ruta'
}

results = {}
for slug, label in queries.items():
    urls = get_photos(slug)
    results[label] = urls
    print(f"{label} ({slug}): {urls[:2]}")

with open('scraped_photos_part2.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
