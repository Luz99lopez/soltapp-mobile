import json

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/wikimedia_candidates.json', encoding='utf-8') as f:
    data = json.load(f)

for cat, items in data.items():
    print(f"\n=== {cat} ===")
    for it in items:
        title = it['title']
        url = it['url'].split('?')[0]
        desc = it.get('desc', '')
        print(f"* {title}")
        print(f"  {url}")
