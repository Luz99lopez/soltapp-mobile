import urllib.request

from update_catalog import new_images

success = 0
failed = 0

for idx, url in new_images.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get('Content-Type')
            length = len(resp.read())
            print(f"[{idx+1}/52] OK {resp.status} - {content_type} ({length} bytes)")
            success += 1
    except Exception as e:
        print(f"[{idx+1}/52] FAIL {url} -> {e}")
        failed += 1

print(f"\nResult: {success} succeeded, {failed} failed.")
