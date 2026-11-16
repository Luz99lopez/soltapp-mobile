import os
import urllib.request
import urllib.parse
import json

preview_dir = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/preview_candidates'
os.makedirs(preview_dir, exist_ok=True)

titles = [
    # Gol Trend
    "File:2015 Volkswagen Gol Trend 1.6 Pack III, I-Motion (front).jpg",
    "File:Volkswagen Gol Trend 1.6 Pack I 2011.jpg",
    "File:VW Gol Trend Sportline 1.6 (2016).jpg",
    "File:2014 Volkswagen Gol Trend 1.6 Cup.jpg",
    # Onix
    "File:2019 Chevrolet Onix Activ 1.4.jpg",
    "File:Chevrolet Onix 20150814-DSC05650.JPG",
    "File:Chevrolet Onix 002.jpg",
    # Honda
    "File:Honda Tornado.jpg",
    "File:1994 Honda XR250R.jpg",
    "File:Honda XR 150L Police Motorcycle PNP.jpg",
    # Casco
    "File:Full-Face Helmet 9274.jpg",
    "File:BlackFullCoverageMotorcycleHelmet.jpg",
    "File:Casque moto vu de profil.jpg",
    # Cinta
    "File:Treadmill-gym.jpg",
    "File:Treadmill.JPG",
    "File:Treadmill by window.jpg",
    # Surf
    "File:Abandoned surfboard (Unsplash).jpg",
    "File:Surfboard on sand (Unsplash).jpg",
    # Cubiertas
    "File:2008-05-01 Stack of car wheels.jpg",
    "File:Car tire stack 20170516.jpg",
    "File:Michelin tires (7612855412).jpg"
]

def get_image_info(title):
    params = {
        'action': 'query',
        'titles': title,
        'prop': 'imageinfo',
        'iiprop': 'url|size',
        'iiurlwidth': '800',
        'format': 'json'
    }
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': 'SoltappBot/1.0 (contact@soltapp.com)'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        for pid, p in pages.items():
            if 'imageinfo' in p and len(p['imageinfo']) > 0:
                info = p['imageinfo'][0]
                return info.get('thumburl') or info.get('url')
    except Exception as e:
        print(f"Error for {title}: {e}")
    return None

for t in titles:
    img_url = get_image_info(t)
    if img_url:
        safe_name = t.replace('File:', '').replace(' ', '_').replace('/', '_').replace(',', '')[:40] + '.jpg'
        dest = os.path.join(preview_dir, safe_name)
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'SoltappBot/1.0 (contact@soltapp.com)'})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = r.read()
                with open(dest, 'wb') as f:
                    f.write(data)
                print(f"OK: {safe_name} ({len(data)} bytes) <- {img_url}")
        except Exception as e:
            print(f"Failed download {safe_name}: {e}")
    else:
        print(f"No URL for {t}")
