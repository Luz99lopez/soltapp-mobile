import subprocess
import json
import re

def search_unsplash(query):
    url = f"https://unsplash.com/napi/search/photos?query={subprocess.list2cmdline([query]).strip('\"')}&per_page=10"
    cmd = ['curl.exe', '-s', url, '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)']
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    try:
        data = json.loads(res.stdout)
        results = []
        for item in data.get('results', []):
            results.append({
                'id': item.get('id'),
                'alt': item.get('alt_description') or item.get('description') or '',
                'url': item.get('urls', {}).get('raw') + '&w=800&auto=format&fit=crop&q=80'
            })
        return results
    except Exception as e:
        return []

# Test with a few of the user's specific products
queries = [
    'air jordan 1',
    'harry potter books',
    'volkswagen gol',
    'volkswagen hatchback',
    'honda xr motorcycle',
    'enduro motorcycle red',
    'ls2 helmet',
    'motorcycle helmet full face',
    'yamaha motorcycle naked',
    'michelin tire car',
    'chevrolet onix',
    'chevrolet hatchback',
    'iphone 14 pro',
    'samsung galaxy s23',
    'motorola smartphone',
    'macbook air',
    'dell laptop',
    'apple ipad',
    'asus rog graphics card',
    'rtx graphics card',
    'samsung smart tv',
    'portable projector',
    'venzo mountain bike',
    'mountain bike',
    'motorized treadmill',
    'babolat tennis racket',
    'tennis racket ball',
    'surfboard on sand'
]

for q in queries:
    res = search_unsplash(q)
    print(f"=== Query: {q} (found {len(res)}) ===")
    for r in res[:3]:
        print(f"  [{r['id']}] {r['alt'][:70]}... -> {r['url']}")
