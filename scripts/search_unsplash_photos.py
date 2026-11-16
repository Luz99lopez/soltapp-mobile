import urllib.request
import urllib.parse
import json
import re

def search_unsplash(term):
    url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(term + ' site:unsplash.com/photos')
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            links = re.findall(r'unsplash\.com/photos/([a-zA-Z0-9_\-]+)', html)
            seen = set()
            out = []
            for l in links:
                if l not in seen and not l.startswith('download') and not l.startswith('license'):
                    seen.add(l)
                    out.append(l)
            return out[:5]
    except Exception as e:
        return [str(e)]

if __name__ == '__main__':
    queries = [
        ('Casco moto LS2', 'black motorcycle helmet product'),
        ('Cubiertas Michelin', 'car tires stack product'),
        ('Airfryer Philips', 'air fryer kitchen appliance'),
        ('Cafetera DeLonghi', 'espresso coffee machine product'),
        ('Smart TV', 'smart tv television isolated screen'),
        ('Proyector', 'video projector home cinema'),
        ('Taladro DeWalt', 'cordless power drill tool'),
        ('Cortadora de cesped', 'lawn mower garden tool'),
        ('Microondas', 'microwave oven kitchen'),
        ('Lavarropas', 'washing machine laundry'),
        ('Heladera', 'refrigerator fridge modern'),
        ('Aspiradora robot', 'robot vacuum cleaner floor'),
        ('Cinta de correr', 'fitness treadmill equipment'),
        ('Mancuernas', 'hex dumbbell weights gym'),
        ('Raqueta tenis', 'tennis racket tennis ball'),
        ('Tabla de surf', 'surfboard beach sand'),
        ('Zapatillas Jordan', 'sneakers shoes nike jordan'),
        ('Campera de cuero', 'leather jacket hanger'),
        ('Reloj Seiko', 'wrist watch luxury steel'),
        ('Cartera de cuero', 'leather handbag women purse'),
        ('Mochila laptop', 'backpack bag isolated laptop'),
        ('Guitarra electrica', 'electric guitar sunburst fender'),
        ('Teclado musical', 'electric piano keyboard music synthesizer'),
        ('Libros Harry Potter', 'stack of hardcover fantasy books'),
        ('Tocadiscos vinilo', 'vintage vinyl record player turntable')
    ]
    for name, q in queries:
        print(f"=== {name} ===")
        print(search_unsplash(q))
