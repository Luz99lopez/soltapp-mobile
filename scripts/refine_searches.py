import urllib.request
import urllib.parse
import json
import os

def search_wikimedia(query, limit=5):
    params = {
        'action': 'query',
        'generator': 'search',
        'gsrsearch': query,
        'gsrnamespace': '6',
        'gsrlimit': str(limit),
        'prop': 'imageinfo',
        'iiprop': 'url|size|extmetadata',
        'iiurlwidth': '960',
        'format': 'json'
    }
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': 'SoltappBot/1.0 (contact@soltapp.com)'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        results = []
        for pid, p in pages.items():
            if 'imageinfo' in p and len(p['imageinfo']) > 0:
                info = p['imageinfo'][0]
                title = p.get('title', '')
                if any(ext in title.lower() for ext in ['.jpg', '.jpeg', '.png']):
                    results.append({
                        'title': title,
                        'url': info.get('url'),
                        'thumburl': info.get('thumburl'),
                        'width': info.get('width'),
                        'height': info.get('height')
                    })
        return results
    except Exception as e:
        print(f"Error {query}: {e}")
        return []

specific_searches = {
    9: ["Motorola Moto G8", "Motorola Moto G", "Motorola Edge 20", "Motorola smartphone"],
    12: ["Dell Latitude E6410 laptop", "Dell Inspiron laptop open", "Dell XPS laptop"],
    17: ["Flat screen television in living room", "Smart TV on wall living room", "LCD television living room"],
    18: ["Video projector on table", "Portable LED projector", "Epson video projector"],
    19: ["Sony WH-1000XM4 headphones", "Sony wireless headphones black", "Wireless over-ear headphones"],
    24: ["Wooden dining table and chairs in dining room", "Dining table with chairs modern wood", "Modern dining table six chairs"],
    25: ["Tripod floor lamp living room", "Floor lamp in living room", "Modern wooden floor lamp"],
    26: ["Barbecue grill patio", "Portable charcoal BBQ grill", "Weber kettle grill barbecue"],
    27: ["Cast aluminium patio garden furniture", "Cast iron garden bench and table", "White cast aluminium garden table and chairs"],
    28: ["Full length standing mirror bedroom", "Standing mirror wooden frame", "Cheval glass mirror"],
    29: ["DeWalt cordless drill with case", "DeWalt drill DCD", "Cordless drill in case battery"],
    30: ["Petrol lawn mower on lawn", "Rotary lawn mower garden grass", "Toro lawn mower"],
    31: ["DeLonghi espresso coffee maker", "DeLonghi espresso machine", "Manual espresso machine on kitchen counter"],
    32: ["Stainless steel double door refrigerator in kitchen", "Samsung refrigerator kitchen", "Modern refrigerator kitchen"],
    39: ["Road racing bicycle outdoors", "Carbon road bike Shimano", "Road bike against wall"],
    40: ["Set of dumbbells in gym", "Adjustable dumbbells bench", "Hex dumbbells on rack"],
    42: ["Babolat tennis racquet", "Tennis racquet and ball on court", "Wilson tennis racquet and balls"],
    47: ["Leather tote bag on table", "Women leather handbag brown", "Leather purse shoulder bag"],
    48: ["Black laptop backpack on desk", "Samsonite backpack laptop", "Business backpack black"],
    49: ["Fender Stratocaster Sunburst finish", "Fender Stratocaster guitar on stand", "Fender Stratocaster electric guitar"],
    50: ["Yamaha electronic keyboard on stand", "Yamaha PSR keyboard synthesizer", "Music keyboard synthesizer 61 keys"],
    51: ["Harry Potter complete book set", "Harry Potter books collection", "Harry Potter novels stack"],
    52: ["Audio-Technica turntable vinyl", "Turntable record player spinning vinyl", "Audio Technica AT-LP120"]
}

refined = {}
for pid, q_list in specific_searches.items():
    print(f"Refining PID {pid:02d}...")
    for q in q_list:
        res = search_wikimedia(q, limit=4)
        for r in res:
            t = r['title'].lower()
            if not any(bad in t for bad in ['motherboard', 'chip', 'teardown', 'patent', 'drawing', 'icon', 'logo', 'map', 'painting', 'nebula']):
                if pid not in refined:
                    refined[pid] = r
                break
        if pid in refined:
            break

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/refined_candidates.json', 'w', encoding='utf-8') as f:
    json.dump(refined, f, indent=2)

print(f"Refined {len(refined)} products!")
