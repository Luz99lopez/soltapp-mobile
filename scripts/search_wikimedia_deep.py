import urllib.request
import urllib.parse
import json

def search_wikimedia(query, limit=10):
    params = {
        'action': 'query',
        'generator': 'search',
        'gsrsearch': query,
        'gsrnamespace': '6',
        'gsrlimit': str(limit),
        'prop': 'imageinfo',
        'iiprop': 'url|size|extmetadata',
        'format': 'json'
    }
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': 'SoltappBot/1.0 (contact@soltapp.com)'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        results = []
        for pid, p in pages.items():
            if 'imageinfo' in p and len(p['imageinfo']) > 0:
                info = p['imageinfo'][0]
                meta = info.get('extmetadata', {})
                desc = meta.get('ObjectName', {}).get('value', '') or meta.get('ImageDescription', {}).get('value', '')
                title = p.get('title', '')
                if any(ext in title.lower() for ext in ['.jpg', '.jpeg', '.png']):
                    results.append({
                        'title': title,
                        'url': info.get('url'),
                        'desc': desc[:100],
                        'width': info.get('width'),
                        'height': info.get('height')
                    })
        return results
    except Exception as e:
        print(f"Error searching {query}: {e}")
        return []

if __name__ == '__main__':
    targets = {
        'Gol Trend': [
            'Volkswagen Gol Trend',
            'VW Gol Trend',
            'Volkswagen Gol 1.6'
        ],
        'Chevrolet Onix': [
            'Chevrolet Onix 1.4',
            'Chevrolet Onix Activ',
            '2019 Chevrolet Onix'
        ],
        'Honda XR': [
            'Honda XR 150',
            'Honda XR150L',
            'Honda XR 250',
            'Honda XR250 Tornado',
            'Honda NXR 160 Bros'
        ],
        'Casco Moto': [
            'Full-face helmet',
            'Motorcycle helmet isolated',
            'Motorradhelm',
            'Casque moto'
        ],
        'Cinta Correr': [
            'Treadmill exercise equipment',
            'Treadmill gym machine',
            'Treadmill indoor'
        ],
        'Tabla Surf': [
            'Surfboard sand beach',
            'Surfboard vertical',
            'Surfboard upright'
        ],
        'Cubiertas': [
            'Car tires stack',
            'Michelin tires',
            'Automobile tires stack'
        ]
    }

    output = {}
    for cat, q_list in targets.items():
        output[cat] = []
        for q in q_list:
            res = search_wikimedia(q, limit=6)
            for r in res:
                if not any(x['title'] == r['title'] for x in output[cat]):
                    output[cat].append(r)

    with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/wikimedia_candidates.json', 'w', encoding='utf-8') as out:
        json.dump(output, out, indent=2, ensure_ascii=False)

    for cat, items in output.items():
        print(f"\n==================== {cat} ({len(items)} items) ====================")
        for it in items[:5]:
            print(f"* {it['title']}\n  URL: {it['url']}")
