import subprocess
import re

queries = [
    'white-volkswagen',
    'volkswagen-hatchback',
    'dirt-bike-parked',
    'red-dirt-bike',
    'chevrolet-car',
    'red-chevrolet',
    'treadmill-gym',
    'exercise-treadmill',
    'mountain-bike-side',
    'black-mountain-bike',
    'apple-watch',
    'playstation-5-console',
    'nintendo-switch-console',
    'sony-wh-1000xm5',
    'jbl-charge',
    'canon-camera-dslr',
    'dji-mini-drone'
]

for q in queries:
    cmd = ['curl.exe', '-s', f'https://unsplash.com/s/photos/{q}']
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    pairs = re.findall(r'alt="([^"]+)"[^>]+src="(https://images\.unsplash\.com/photo-[^"?]+)', res.stdout)
    seen = set()
    print(f"=== {q} ===")
    for alt, src in pairs:
        if src not in seen and len(alt) > 5 and 'avatar' not in alt.lower():
            seen.add(src)
            print(f"  {alt[:70]} -> {src}")
            if len(seen) >= 3:
                break
