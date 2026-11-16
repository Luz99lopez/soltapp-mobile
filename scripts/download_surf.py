import urllib.request
import os

preview_dir = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/preview_candidates'

surf_titles = [
    "File:Tabla de surf epoxi Surfboard epoxy.jpg",
    "File:Riley-fish-Marlin2.jpg",
    "File:12 A Surfboard On A Stand.jpg",
    "File:Yellow surfboard in Golden Beach.jpg",
    "File:Dukes Day 2015 surfboard.JPG"
]

from download_via_api import get_image_info

for t in surf_titles:
    img_url = get_image_info(t)
    if img_url:
        safe_name = t.replace('File:', '').replace(' ', '_').replace('/', '_')[:35] + '.jpg'
        dest = os.path.join(preview_dir, safe_name)
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'SoltappBot/1.0'})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = r.read()
                with open(dest, 'wb') as f:
                    f.write(data)
                print(f"OK: {safe_name} ({len(data)} bytes)")
        except Exception as e:
            print(f"Failed {safe_name}: {e}")
