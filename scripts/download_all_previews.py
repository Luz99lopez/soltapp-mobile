import urllib.request
import os

check_dir = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/check_all_photos'
os.makedirs(check_dir, exist_ok=True)

from inspect_all_items import prods, imgs

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for idx, (p, img) in enumerate(zip(prods, imgs)):
    title = p[3]
    url = img[2]
    # Small preview
    if 'unsplash.com' in url:
        preview_url = url.split('?')[0] + '?w=300&q=70'
    else:
        preview_url = url
    filename = f"{idx+1:02d}_{title[:20].replace(' ', '_').replace('/', '_')}.jpg"
    dest = os.path.join(check_dir, filename)
    if not os.path.exists(dest):
        try:
            req = urllib.request.Request(preview_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                with open(dest, 'wb') as f:
                    f.write(resp.read())
            print(f"OK {idx+1:02d}: {title[:30]}")
        except Exception as e:
            print(f"FAIL {idx+1:02d}: {e}")
