import urllib.request
import urllib.parse
import json

def search_wikimedia(query, limit=5):
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
                results.append({
                    'title': p.get('title'),
                    'url': info.get('url'),
                    'width': info.get('width'),
                    'height': info.get('height')
                })
        return results
    except Exception as e:
        print(f"Error searching {query}: {e}")
        return []

def search_unsplash_source(query):
    # Search unsplash via web search or public endpoint
    pass

if __name__ == '__main__':
    queries = [
        "Volkswagen Gol Trend",
        "Volkswagen Gol G5",
        "Volkswagen Gol",
        "Honda XR 150L",
        "Honda XR150",
        "Honda XR 250",
        "motorcycle helmet",
        "LS2 helmet",
        "Chevrolet Onix",
        "Chevrolet Onix hatchback",
        "treadmill machine",
        "surfboard beach single",
        "car tires stack"
    ]
    for q in queries:
        print(f"\n=== Query: {q} ===")
        res = search_wikimedia(q, limit=4)
        for r in res:
            print(f"- {r['title']} : {r['url']}")
