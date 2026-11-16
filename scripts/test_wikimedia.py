import urllib.request
import json

queries = [
    'Volkswagen Gol Trend',
    'Chevrolet Onix',
    'Honda XR',
    'Yamaha FZ',
    'motorcycle helmet',
    'Michelin tire',
    'iPhone 14 Pro',
    'Samsung Galaxy S23',
    'MacBook Air',
    'Dell Inspiron',
    'iPad',
    'GeForce RTX',
    'Smart TV',
    'video projector',
    'mountain bike',
    'treadmill',
    'tennis racket Babolat',
    'surfboard',
    'Air Jordan 1',
    'Harry Potter books'
]

for q in queries:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|mime|extmetadata&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'SoltappBot/1.0 (test@soltapp.app)'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            print(f"=== {q} ===")
            for pid, p in pages.items():
                img = p.get('imageinfo', [{}])[0]
                mime = img.get('mime', '')
                if 'image' in mime and not 'svg' in mime:
                    print(f"  {p.get('title')}: {img.get('url')}")
    except Exception as e:
        print(f"Error {q}: {e}")
