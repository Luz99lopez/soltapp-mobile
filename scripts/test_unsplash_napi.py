import urllib.request
import json

def search_unsplash_napi(query, per_page=5):
    url = f"https://unsplash.com/napi/search/photos?query={urllib.parse.quote(query)}&per_page={per_page}"
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        results = []
        for item in data.get('results', []):
            results.append({
                'id': item.get('id'),
                'desc': item.get('description') or item.get('alt_description'),
                'url': item.get('urls', {}).get('regular')
            })
        return results
    except Exception as e:
        print(f"Error {query}: {e}")
        return []

if __name__ == '__main__':
    import urllib.parse
    for q in ["motorcycle helmet", "full face helmet", "casco moto", "treadmill gym equipment", "car tires stack side", "single surfboard beach"]:
        print(f"\n=== Query: {q} ===")
        res = search_unsplash_napi(q, 4)
        for r in res:
            print(f"- ID: {r['id']} | Desc: {r['desc']} | URL: {r['url']}")
