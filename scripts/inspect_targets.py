import json

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/search_results.json', encoding='utf-8') as f:
    data = json.load(f)

targets = [
    'Dell Inspiron', 'Dell Inspiron 2',
    'iPad', 'iPad 2',
    'Placa ASUS RTX', 'Placa ASUS RTX 2',
    'Smart TV Samsung', 'Smart TV Samsung 2',
    'Proyector', 'Proyector 2',
    'MTB Venzo', 'MTB Venzo 2',
    'Cinta Correr', 'Cinta Correr 2',
    'Raqueta Babolat',
    'Tabla Surf', 'Tabla Surf 2',
    'iPhone 14', 'iPhone 14 Pro',
    'Samsung S23', 'Samsung S23 2',
    'Motorola Edge'
]

for t in targets:
    if t in data:
        print(f"=== {t} ===")
        for it in data[t]:
            print(f"  {it['alt']} -> {it['url']}")
