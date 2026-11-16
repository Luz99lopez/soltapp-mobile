import json
import os
import urllib.request

candidates_file = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/all_marketplace_candidates.json'
with open(candidates_file, encoding='utf-8') as f:
    data = json.load(f)

for pid_str, items in sorted(data.items(), key=lambda x: int(x[0])):
    pid = int(pid_str)
    print(f"\n=== Product {pid:02d} ({len(items)} candidates) ===")
    for idx, it in enumerate(items[:4]):
        title = it['title'].replace('File:', '')
        thumb = it.get('thumburl', '')
        print(f"  [{idx+1}] {title}")
