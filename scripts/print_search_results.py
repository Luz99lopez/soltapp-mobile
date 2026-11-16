import json

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/search_results.json', encoding='utf-8') as f:
    data = json.load(f)

for k, v in data.items():
    print(f"=== {k} ===")
    for it in v:
        print(f"  {it['alt']} -> {it['url']}")
