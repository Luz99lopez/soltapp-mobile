import urllib.request
import re
import json

photo_ids = [
    ("01 Gol Trend", "photo-1572811298797-9eecadf6cb24"),
    ("02 Honda XR", "photo-1630949821332-3beae5adc9e2"),
    ("03 Casco LS2", "photo-1590506995460-d0d9892b54da"),
    ("04 Yamaha FZ", "photo-1649027738807-5a0d9fedf6ae"),
    ("05 Cubiertas", "photo-1571335746824-742511d49bce"),
    ("06 Onix", "photo-1552519507-da3b142c6e3d"),
    ("07 iPhone 14", "photo-1726587912121-ea21fcc57ff8"),
    ("08 S23 Ultra", "photo-1772182129439-7ab29e9d154c"),
    ("09 Moto Edge", "photo-1511707171634-5f897ff02aa9"),
    ("10 Apple Watch", "photo-1579586337278-3befd40fd17a"),
    ("11 MacBook Air", "photo-1651241680016-cc9e407e7dc3"),
    ("12 Dell Inspiron", "photo-1588872657578-7efd1f1555ed"),
    ("13 iPad", "photo-1544244015-0df4b3ffc6b0"),
    ("14 PS5", "photo-1606144042614-b2417e99c4e3"),
    ("15 Switch OLED", "photo-1612036781124-847f8939b154"),
    ("16 RTX 4070", "photo-1778621962156-f9b3d255fb5f"),
    ("17 TV Samsung", "photo-1646861039459-fd9e3aabf3fb"),
    ("18 Proyector", "photo-1637656375538-9dfe600ccfd2"),
    ("19 Sony WH1000", "photo-1612858249816-5a91a9fb9886"),
    ("20 JBL Charge", "photo-1558537348-c0f8e733989d"),
    ("21 Canon Rebel", "photo-1502920917128-1aa500764cbd"),
    ("22 DJI Drone", "photo-1507582020474-9a35b7d455d9"),
    ("23 Sillón Chesterfield", "photo-1555041469-a586c61ea9bc"),
    ("24 Mesa Comedor", "photo-1615066390971-03e4e1c36ddf"),
    ("25 Lámpara", "photo-1507473885765-e6ed057f782c"),
    ("26 Parrilla", "photo-1508615263227-c5d58c1e5821"),
    ("27 Juego Jardín", "photo-1613685302957-3a6fc45346ef"),
    ("28 Espejo", "photo-1602164091410-255d1bf88959"),
    ("29 DeWalt", "photo-1572981779307-38b8cabb2407"),
    ("30 Cortadora", "photo-1458245201577-fc8a130b8829"),
    ("31 DeLonghi", "photo-1616388761741-a5936c6f61f6"),
    ("32 Heladera", "photo-1642497590397-7f4384a19966"),
    ("33 Lavarropas", "photo-1626806819282-2c1dc01a5e0c"),
    ("34 Freidora", "photo-1695089028114-ce28248f0ab9"),
    ("35 Microondas", "photo-1585659722983-3a675dabf23d"),
    ("36 Xiaomi Robot", "photo-1558317374-067fb5f30001"),
    ("37 Bici Venzo", "photo-1629216012338-0e06caae0dff"),
    ("38 Bici Tern", "photo-1586403232406-43107b51e673"),
    ("39 Bici Vairo", "photo-1532298229144-0ec0c57515c7"),
    ("40 Mancuernas", "photo-1576678927484-cc907957088c"),
    ("41 Cinta correr", "photo-1648995361141-30676a75fd27"),
    ("42 Raqueta", "photo-1622163642998-1ea32b0bbc67"),
    ("43 Tabla surf", "photo-1621951289270-b942dc5f4320"),
    ("44 Jordan 1", "photo-1597045566677-8cf032ed6634"),
    ("45 Campera cuero", "photo-1551028719-00167b16eac5"),
    ("46 Seiko 5", "photo-1629581678313-36cf745a9af9"),
    ("47 Cartera Prüne", "photo-1605733513597-a8f8341084e6"),
    ("48 Mochila Samsonite", "photo-1553062407-98eeb64c6a62"),
    ("49 Fender guitar", "photo-1564186763535-ebb21ef5277f"),
    ("50 Yamaha synth", "photo-1598653222000-6b7b7a552625"),
    ("51 Harry Potter", "photo-1600189261900-da2183219c28"),
    ("52 Vinilo AudioTechnica", "photo-1616714109948-c74fe5029a4d"),
]

for label, pid in photo_ids:
    url = f"https://unsplash.com/photos/{pid.replace('photo-', '')}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8', errors='ignore')
        title_tag = re.search(r'<title>(.*?)</title>', html)
        title = title_tag.group(1) if title_tag else "No title"
        # meta description
        meta_desc = re.search(r'<meta name="description" content="(.*?)"', html)
        desc = meta_desc.group(1) if meta_desc else ""
        print(f"{label:<25} | {title[:60]} | {desc[:80]}")
    except Exception as e:
        print(f"{label:<25} | Error: {e}")
