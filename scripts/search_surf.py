from search_wikimedia_deep import search_wikimedia
import json

queries = [
    "Surfboard single",
    "Surfboard standing",
    "Surfboard beach",
    "Surfboard upright",
    "Fish surfboard",
    "Shortboard surfboard"
]

results = []
for q in queries:
    res = search_wikimedia(q, limit=8)
    for r in res:
        if not any(x['title'] == r['title'] for x in results):
            results.append(r)

print(f"Found {len(results)} surfboard candidates:")
for r in results:
    print(f"- {r['title']} : {r['url']}")

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/surf_candidates.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
