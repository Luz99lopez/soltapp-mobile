import json
import os
import urllib.request
import urllib.parse
import time

candidates_file = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/all_marketplace_candidates.json'
with open(candidates_file, encoding='utf-8') as f:
    data = json.load(f)

preview_dir = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/preview_all_marketplace'
os.makedirs(preview_dir, exist_ok=True)

# Selection of the best real Marketplace photo for each product
# We choose photos that look like genuine items: on a table, floor, street, clean product shot
selected = {}

for pid_str, items in sorted(data.items(), key=lambda x: int(x[0])):
    pid = int(pid_str)
    # Filter candidates to find the best real product photo
    best = None
    for it in items:
        t = it['title'].lower()
        # Avoid diagrams, teardowns, boxes only if whole product exists, microscopic chips
        if any(bad in t for bad in ['motherboard', 'chip', 'teardown', 'interior', 'innenleben', 'patent', 'drawing', 'icon', 'logo', 'map']):
            continue
        best = it
        break
    if not best and len(items) > 0:
        best = items[0]
    
    if best:
        selected[pid] = best

# Let's write the chosen mapping
with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/chosen_marketplace_candidates.json', 'w', encoding='utf-8') as f:
    json.dump(selected, f, indent=2)

print(f"Selected candidates for {len(selected)} products:")
for pid, it in selected.items():
    title = it['title'].replace('File:', '')
    safe_title = title.encode('ascii', 'replace').decode('ascii')
    print(f"PID {pid:02d}: {safe_title[:50]} -> {it['thumburl']}")
