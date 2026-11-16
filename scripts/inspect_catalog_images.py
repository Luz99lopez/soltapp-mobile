import json
import re

with open(r'C:\Users\nenri\OneDrive\Escritorio\soltapp-mobile\scripts\complete_52_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

with open(r'C:\Users\nenri\OneDrive\Escritorio\soltapp-mobile\scripts\reset_and_seed_50_products.sql', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Pattern for product rows
# ('id', 'seller_id', cat_id, 'title', 'description', price, 'currency', 'condition', 'status', 'location', created_at, updated_at)
pattern = re.compile(r"\('([0-9a-f\-]+)',\s*'([0-9a-f\-]+)',\s*(\d+),\s*'([^']+)',\s*'([^']+)'", re.DOTALL)
matches = pattern.findall(content)

print(f"Total parsed products: {len(matches)}")
for i, (pid, seller, cat, title, desc) in enumerate(matches, 1):
    m = mapping.get(str(i), {})
    img_t = m.get('title', 'N/A').encode('ascii', 'replace').decode('ascii')
    safe_title = title.encode('ascii', 'replace').decode('ascii')
    print(f"[{i:02d}] (Cat {cat:2}) {safe_title[:35]:35} | Img: {img_t[:40]}")

