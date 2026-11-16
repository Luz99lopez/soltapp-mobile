import subprocess
import re
import json

queries = {
    'Gol Trend': 'volkswagen-golf',
    'Gol Trend 2': 'volkswagen-polo',
    'Honda XR': 'dirt-bike',
    'Honda XR 2': 'motocross-bike',
    'Casco LS2': 'motorcycle-helmet',
    'Casco LS2 2': 'full-face-helmet',
    'Yamaha FZ': 'naked-motorcycle',
    'Yamaha FZ 2': 'yamaha-bike',
    'Cubiertas Michelin': 'car-tire',
    'Cubiertas Michelin 2': 'tires',
    'Chevrolet Onix': 'chevrolet',
    'Chevrolet Onix 2': 'compact-car',
    'iPhone 14': 'iphone-14',
    'iPhone 14 Pro': 'iphone-14-pro',
    'Samsung S23': 'samsung-galaxy',
    'Samsung S23 2': 'samsung-phone',
    'Motorola Edge': 'smartphone',
    'MacBook Air': 'macbook-air',
    'MacBook Air 2': 'silver-macbook',
    'Dell Inspiron': 'dell-laptop',
    'Dell Inspiron 2': 'laptop-computer',
    'iPad': 'apple-ipad',
    'iPad 2': 'ipad-tablet',
    'Placa ASUS RTX': 'graphics-card',
    'Placa ASUS RTX 2': 'computer-gpu',
    'Smart TV Samsung': 'smart-tv',
    'Smart TV Samsung 2': 'television-screen',
    'Proyector': 'mini-projector',
    'Proyector 2': 'video-projector',
    'MTB Venzo': 'mountain-bike',
    'MTB Venzo 2': 'bicycle-trail',
    'Cinta Correr': 'treadmill',
    'Cinta Correr 2': 'running-machine',
    'Raqueta Babolat': 'tennis-racket',
    'Tabla Surf': 'surfboard',
    'Tabla Surf 2': 'shortboard',
    'PS5': 'playstation-5',
    'Nintendo Switch': 'nintendo-switch',
    'Auriculares Sony': 'sony-headphones',
    'JBL Charge': 'jbl-speaker',
    'Canon T7': 'canon-camera',
    'DJI Drone': 'dji-drone',
    'Sillon Chesterfield': 'chesterfield-sofa',
    'Mesa Eames': 'dining-table-chairs',
    'Lampara Tripode': 'tripod-lamp',
    'Parrilla': 'bbq-grill',
    'Juego Jardin': 'patio-furniture',
    'Espejo Entero': 'full-length-mirror',
    'Taladro DeWalt': 'cordless-drill',
    'Cortadora Cesped': 'lawn-mower',
    'Cafetera Dedica': 'espresso-machine',
    'Heladera Samsung': 'refrigerator-kitchen',
    'Lavarropas LG': 'washing-machine',
    'Airfryer Philips': 'air-fryer',
    'Microondas': 'microwave-oven',
    'Robot Aspiradora': 'robot-vacuum',
    'Bici Plegable': 'folding-bike',
    'Bici Ruta': 'road-bike',
    'Mancuernas': 'dumbbells-gym',
    'Campera Cuero': 'leather-jacket-black',
    'Reloj Seiko': 'mens-wristwatch',
    'Cartera Prune': 'leather-handbag',
    'Mochila Samsonite': 'laptop-backpack',
    'Guitarra Fender': 'fender-stratocaster',
    'Teclado Yamaha': 'piano-keyboard-synthesizer',
    'Tocadiscos Audio Technica': 'vinyl-record-player'
}

results = {}

for label, slug in queries.items():
    cmd = ['curl.exe', '-s', f'https://unsplash.com/s/photos/{slug}']
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    pairs = re.findall(r'alt="([^"]+)"[^>]+src="(https://images\.unsplash\.com/photo-[^"?]+)', res.stdout)
    seen = set()
    items = []
    for alt, src in pairs:
        if src not in seen and len(alt) > 5 and 'avatar' not in alt.lower():
            seen.add(src)
            items.append({'alt': alt, 'url': src})
            if len(items) >= 4:
                break
    results[label] = items
    print(f"=== {label} ({slug}) ===")
    for it in items[:2]:
        print(f"  {it['alt'][:60]} -> {it['url']}")

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/search_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print("Done. Saved to search_results.json")
