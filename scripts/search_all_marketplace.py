import urllib.request
import urllib.parse
import json

def search_wikimedia(query, limit=8):
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

target_queries = {
    4: ["Yamaha FZ16", "Yamaha FZ", "Yamaha FZS", "Yamaha 150cc"],
    7: ["iPhone 14 Pro", "iPhone 13 Pro", "iPhone 14", "iPhone Space Black"],
    8: ["Samsung Galaxy S23", "Samsung Galaxy S22 Ultra", "Galaxy S23 Ultra", "Samsung Galaxy S21 Ultra"],
    9: ["Motorola smartphone", "Moto G", "Motorola Edge", "Motorola phone"],
    10: ["Apple Watch", "Apple Watch Series", "Apple Watch 45mm"],
    11: ["MacBook Air", "MacBook Air M1", "MacBook Air M2", "Apple MacBook Air"],
    12: ["Dell Inspiron", "Dell laptop", "Dell Inspiron 15"],
    13: ["iPad 10th generation", "Apple iPad", "iPad tablet"],
    14: ["PlayStation 5 console", "PlayStation 5 DualSense", "Sony PlayStation 5"],
    15: ["Nintendo Switch OLED", "Nintendo Switch console", "Nintendo Switch Neon"],
    16: ["GeForce RTX", "Nvidia GeForce RTX", "ASUS GeForce RTX", "Graphics card PCI"],
    17: ["Smart TV living room", "Flat screen television living room", "Samsung Smart TV", "Television set living room"],
    18: ["Video projector", "Mini projector", "Portable projector", "Digital projector"],
    19: ["Sony WH-1000XM4", "Sony WH-1000XM5", "Wireless headphones Sony", "Over-ear headphones"],
    20: ["JBL speaker", "JBL Charge", "Bluetooth speaker portable", "JBL Flip"],
    21: ["Canon EOS Rebel", "Canon EOS 2000D", "Canon EOS DSLR", "Canon camera 18-55mm"],
    22: ["DJI Mini 2", "DJI drone", "DJI Mavic Mini", "Quadcopter drone"],
    23: ["Chesterfield sofa", "Chesterfield armchair", "Leather sofa brown"],
    24: ["Dining table chairs", "Dining room table and chairs", "Eames chairs table"],
    25: ["Tripod floor lamp", "Floor lamp living room", "Wooden floor lamp"],
    26: ["Barbecue grill", "Charcoal barbecue grill", "Parrilla asado", "BBQ grill portable"],
    27: ["Cast aluminium garden furniture", "Garden furniture set", "Patio furniture table chairs"],
    28: ["Full length mirror", "Standing mirror", "Floor mirror bedroom"],
    29: ["DeWalt cordless drill", "Cordless drill", "DeWalt drill tool"],
    30: ["Lawn mower", "Rotary lawn mower", "Petrol lawn mower"],
    31: ["Espresso machine domestic", "DeLonghi espresso", "Coffee maker espresso machine"],
    32: ["Refrigerator kitchen", "Stainless steel refrigerator", "Fridge kitchen open"],
    33: ["Front loading washing machine", "Washing machine bathroom", "Lavarropas"],
    34: ["Air fryer", "Hot air fryer", "Airfryer kitchen"],
    35: ["Microwave oven", "Countertop microwave", "Kitchen microwave"],
    36: ["Robot vacuum cleaner", "Robotic vacuum", "Xiaomi vacuum"],
    37: ["Mountain bike", "Hardtail mountain bike", "Bicicleta mountain bike"],
    38: ["Folding bicycle", "Folding bike", "Bicicleta plegable"],
    39: ["Road bicycle", "Racing bicycle", "Bicicleta de ruta"],
    40: ["Adjustable dumbbells", "Dumbbells gym", "Hex dumbbells"],
    42: ["Babolat tennis racket", "Tennis racquet", "Raqueta de tenis"],
    44: ["Air Jordan 1", "Nike Air Jordan 1", "Air Jordan 1 High"],
    45: ["Leather jacket black", "Men leather jacket", "Black leather jacket"],
    46: ["Seiko 5", "Seiko 5 Sports", "Seiko automatic watch"],
    47: ["Leather handbag", "Women leather handbag", "Leather purse"],
    48: ["Backpack laptop", "Samsonite backpack", "Black backpack"],
    49: ["Fender Stratocaster", "Fender Stratocaster sunburst", "Stratocaster guitar"],
    50: ["Yamaha keyboard synthesizer", "Synthesizer keyboard", "Electronic keyboard Yamaha"],
    51: ["Harry Potter books", "Harry Potter book set", "Harry Potter novel"],
    52: ["Turntable record player", "Audio-Technica turntable", "Vinyl turntable"]
}

if __name__ == '__main__':
    all_results = {}
    for idx, q_list in target_queries.items():
        all_results[idx] = []
        for q in q_list:
            res = search_wikimedia(q, limit=5)
            for r in res:
                if not any(x['title'] == r['title'] for x in all_results[idx]):
                    all_results[idx].append(r)
        print(f"Product {idx:02d}: found {len(all_results[idx])} candidates")

    with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/all_marketplace_candidates.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2)
    print("Done searching all 45 products!")
