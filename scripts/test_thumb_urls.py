import urllib.request
import time

urls = [
    ("Gol Trend", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg/960px-Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg"),
    ("Honda XR", "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honda_Tornado.jpg/960px-Honda_Tornado.jpg"),
    ("Casco Airoh", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Full-Face_Helmet_9274.jpg/960px-Full-Face_Helmet_9274.jpg"),
    ("Chevrolet Onix", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2019_Chevrolet_Onix_Activ_1.4.jpg/960px-2019_Chevrolet_Onix_Activ_1.4.jpg"),
    ("Tabla Surf", "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tabla_de_surf_epoxi_Surfboard_epoxy.jpg/960px-Tabla_de_surf_epoxi_Surfboard_epoxy.jpg"),
    ("Cinta Correr", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Treadmill_by_window.jpg/960px-Treadmill_by_window.jpg"),
    ("Cubiertas", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Car_tire_stack_20170516.jpg/960px-Car_tire_stack_20170516.jpg")
]

for name, u in urls:
    req = urllib.request.Request(u, headers={'User-Agent': 'SoltappMobileApp/1.0 (Mobile Client; info@soltapp.com)'})
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        print(f"SUCCESS: {name:<15} | status: {resp.status} | len: {len(resp.read())}")
    except Exception as e:
        print(f"FAILED:  {name:<15} | error: {e}")
    time.sleep(1)
