import json

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/chosen_marketplace_candidates.json', encoding='utf-8') as f:
    chosen = json.load(f)

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/refined_candidates.json', encoding='utf-8') as f:
    refined = json.load(f)

for pid_str, it in refined.items():
    chosen[pid_str] = it

# Also we have our 7 already verified products:
already_verified = {
    1: {
        "title": "Volkswagen Gol Trend 1.6 Pack I 2011.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg/960px-Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg"
    },
    2: {
        "title": "Honda Tornado.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honda_Tornado.jpg/960px-Honda_Tornado.jpg"
    },
    3: {
        "title": "Full-Face Helmet 9274.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Full-Face_Helmet_9274.jpg/960px-Full-Face_Helmet_9274.jpg"
    },
    5: {
        "title": "Car tire stack 20170516.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Car_tire_stack_20170516.jpg/960px-Car_tire_stack_20170516.jpg"
    },
    6: {
        "title": "2019 Chevrolet Onix Activ 1.4.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2019_Chevrolet_Onix_Activ_1.4.jpg/960px-2019_Chevrolet_Onix_Activ_1.4.jpg"
    },
    41: {
        "title": "Treadmill by window.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Treadmill_by_window.jpg/960px-Treadmill_by_window.jpg"
    },
    43: {
        "title": "Tabla de surf epoxi Surfboard epoxy.jpg",
        "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tabla_de_surf_epoxi_Surfboard_epoxy.jpg/960px-Tabla_de_surf_epoxi_Surfboard_epoxy.jpg"
    }
}

for pid, it in already_verified.items():
    chosen[str(pid)] = it

with open('C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/complete_52_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(chosen, f, indent=2)

print(f"Total mapped products: {len(chosen)}/52")
for pid in range(1, 53):
    it = chosen.get(str(pid))
    if it:
        t = it['title'].replace('File:', '')
        safe_t = t.encode('ascii', 'replace').decode('ascii')
        print(f"[{pid:02d}] {safe_t[:45]:<45} -> {it['thumburl']}")
    else:
        print(f"[{pid:02d}] MISSING!")
