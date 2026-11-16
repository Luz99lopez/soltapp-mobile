import sys
import subprocess
import re

query = sys.argv[1] if len(sys.argv) > 1 else 'air-jordan-1'
cmd = ['curl.exe', '-s', f'https://unsplash.com/s/photos/{query}']
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')

pairs = re.findall(r'alt="([^"]+)"[^>]+src="(https://images\.unsplash\.com/photo-[^"?]+)', res.stdout)
seen = set()
count = 0
for alt, src in pairs:
    if src not in seen and len(alt) > 5 and 'avatar' not in alt.lower():
        seen.add(src)
        print(f"Alt: {alt} -> {src}")
        count += 1
        if count >= 10:
            break
if count == 0:
    print("No images found with alt text")
