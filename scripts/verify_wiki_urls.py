import urllib.request

urls = {
    "Gol Trend": "https://upload.wikimedia.org/wikipedia/commons/a/a8/Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg",
    "Honda XR": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Honda_Tornado.jpg",
    "Casco Moto": "https://upload.wikimedia.org/wikipedia/commons/9/90/Full-Face_Helmet_9274.jpg",
    "Chevrolet Onix": "https://upload.wikimedia.org/wikipedia/commons/c/c9/2019_Chevrolet_Onix_Activ_1.4.jpg",
    "Tabla Surf": "https://upload.wikimedia.org/wikipedia/commons/2/23/Tabla_de_surf_epoxi_Surfboard_epoxy.jpg",
    "Cinta Correr": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Treadmill_by_window.jpg",
    "Cubiertas": "https://upload.wikimedia.org/wikipedia/commons/b/b4/Car_tire_stack_20170516.jpg"
}

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for k, u in urls.items():
    try:
        req = urllib.request.Request(u, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            ct = resp.headers.get('Content-Type')
            cl = resp.headers.get('Content-Length')
            print(f"OK: {k:<15} | status: {resp.status} | type: {ct} | size: {cl} bytes")
    except Exception as e:
        print(f"FAILED: {k:<15} | error: {e}")
