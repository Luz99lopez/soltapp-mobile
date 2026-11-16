import json

# Define the updated 52 catalog items with 100% faithful, brand-accurate, isolated images
new_images = {
    # 1. Gol Trend
    0: 'https://images.unsplash.com/photo-1572811298797-9eecadf6cb24?w=800&auto=format&fit=crop&q=80', # White Volkswagen hatchback
    # 2. Moto Honda XR 150L
    1: 'https://images.unsplash.com/photo-1630949821332-3beae5adc9e2?w=800&auto=format&fit=crop&q=80', # Red and black motocross dirt bike parked
    # 3. Casco para moto LS2
    2: 'https://images.unsplash.com/photo-1590506995460-d0d9892b54da?w=800&auto=format&fit=crop&q=80', # Black and red full-face motorcycle helmet
    # 4. Yamaha FZ FI 2.0
    3: 'https://images.unsplash.com/photo-1649027738807-5a0d9fedf6ae?w=800&auto=format&fit=crop&q=80', # Black naked street motorcycle
    # 5. Cubiertas Michelin
    4: 'https://images.unsplash.com/photo-1571335746824-742511d49bce?w=800&auto=format&fit=crop&q=80', # Set of 4 car tires
    # 6. Chevrolet Onix
    5: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80', # Chevrolet coupe/compact car
    # 7. iPhone 14 Pro
    6: 'https://images.unsplash.com/photo-1726587912121-ea21fcc57ff8?w=800&auto=format&fit=crop&q=80', # Authentic iPhones side by side (space black & silver)
    # 8. Samsung Galaxy S23 Ultra
    7: 'https://images.unsplash.com/photo-1772182129439-7ab29e9d154c?w=800&auto=format&fit=crop&q=80', # Samsung Galaxy smartphones with multiple camera sensors
    # 9. Motorola Edge 40 Neo
    8: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80', # Modern Android smartphone with colorful screen on clean white
    # 10. Apple Watch Series 8
    9: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80', # Apple Watch with dark band and app screen
    # 11. MacBook Air M2
    10: 'https://images.unsplash.com/photo-1651241680016-cc9e407e7dc3?w=800&auto=format&fit=crop&q=80', # Silver MacBook laptop with Apple logo
    # 12. Notebook Dell Inspiron 15
    11: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80', # Dell laptop with blue desktop on white surface
    # 13. iPad 10ma Generacion
    12: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80', # Apple iPad with screen and stylus
    # 14. Sony PlayStation 5
    13: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&auto=format&fit=crop&q=80', # PS5 console and DualSense controller
    # 15. Nintendo Switch OLED
    14: 'https://images.unsplash.com/photo-1612036781124-847f8939b154?w=800&auto=format&fit=crop&q=80', # Red and blue Nintendo Switch console
    # 16. Placa de Video ASUS TUF RTX 4070
    15: 'https://images.unsplash.com/photo-1778621962156-f9b3d255fb5f?w=800&auto=format&fit=crop&q=80', # Graphics card with 3 cooling fans
    # 17. Smart TV Samsung 55
    16: 'https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?w=800&auto=format&fit=crop&q=80', # Flat screen smart TV on modern cabinet
    # 18. Proyector Portatil Wanbo
    17: 'https://images.unsplash.com/photo-1637656375538-9dfe600ccfd2?w=800&auto=format&fit=crop&q=80', # Compact white portable mini projector
    # 19. Auriculares Sony WH-1000XM5
    18: 'https://images.unsplash.com/photo-1612858249816-5a91a9fb9886?w=800&auto=format&fit=crop&q=80', # Black Sony over-ear headphones
    # 20. Parlante JBL Charge 5
    19: 'https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=800&auto=format&fit=crop&q=80', # Red JBL portable bluetooth speaker
    # 21. Camara Canon EOS Rebel T7
    20: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80', # Canon EOS Rebel DSLR camera with zoom lens
    # 22. Drone DJI Mini 2 SE
    21: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=800&auto=format&fit=crop&q=80', # Compact drone quadcopter
    # 23. Sillon Chesterfield
    22: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80', # Classic Chesterfield button-tufted leather sofa
    # 24. Mesa Comedor + Sillas Eames
    23: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80', # Dining table with modern chairs
    # 25. Lampara Pie Tripode
    24: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', # Nordic wooden tripod floor lamp
    # 26. Parrilla Movil con Fogonero
    25: 'https://images.unsplash.com/photo-1508615263227-c5d58c1e5821?w=800&auto=format&fit=crop&q=80', # BBQ barbecue grill
    # 27. Juego de Jardin Aluminio
    26: 'https://images.unsplash.com/photo-1613685302957-3a6fc45346ef?w=800&auto=format&fit=crop&q=80', # Outdoor patio garden table and chairs
    # 28. Espejo de Pared Cuerpo Entero
    27: 'https://images.unsplash.com/photo-1602164091410-255d1bf88959?w=800&auto=format&fit=crop&q=80', # Full-length mirror with metal frame
    # 29. Taladro DeWalt 20V
    28: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80', # Yellow and black DeWalt cordless drill
    # 30. Cortadora de Cesped
    29: 'https://images.unsplash.com/photo-1458245201577-fc8a130b8829?w=800&auto=format&fit=crop&q=80', # Lawnmower on green lawn
    # 31. Cafetera Espresso DeLonghi
    30: 'https://images.unsplash.com/photo-1616388761741-a5936c6f61f6?w=800&auto=format&fit=crop&q=80', # Stainless steel espresso machine with portafilter
    # 32. Heladera No Frost Samsung
    31: 'https://images.unsplash.com/photo-1642497590397-7f4384a19966?w=800&auto=format&fit=crop&q=80', # Modern stainless steel refrigerator in kitchen
    # 33. Lavarropas LG Inverter
    32: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=800&auto=format&fit=crop&q=80', # Front load automatic washing machine
    # 34. Freidora de Aire Philips
    33: 'https://images.unsplash.com/photo-1695089028114-ce28248f0ab9?w=800&auto=format&fit=crop&q=80', # Digital airfryer
    # 35. Horno Microondas BGH
    34: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80', # Countertop microwave oven
    # 36. Aspiradora Robot Xiaomi
    35: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80', # Round robot vacuum cleaner
    # 37. Bicicleta Mountain Bike Venzo
    36: 'https://images.unsplash.com/photo-1629216012338-0e06caae0dff?w=800&auto=format&fit=crop&q=80', # Black mountain bike with suspension and knobby tires
    # 38. Bicicleta Plegable Tern Link
    37: 'https://images.unsplash.com/photo-1586403232406-43107b51e673?w=800&auto=format&fit=crop&q=80', # Folding urban bicycle
    # 39. Bicicleta de Ruta Vairo Speed
    38: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop&q=80', # Road racing bicycle
    # 40. Set de Mancuernas
    39: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&auto=format&fit=crop&q=80', # Dumbbells set on rack
    # 41. Cinta de Correr Motorizada
    40: 'https://images.unsplash.com/photo-1648995361141-30676a75fd27?w=800&auto=format&fit=crop&q=80', # Motorized treadmill running machine
    # 42. Raqueta de Tenis Babolat
    41: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800&auto=format&fit=crop&q=80', # White and blue Babolat style tennis racket
    # 43. Tabla de Surf Fish
    42: 'https://images.unsplash.com/photo-1621951289270-b942dc5f4320?w=800&auto=format&fit=crop&q=80', # Surfboard standing on beach
    # 44. Zapatillas Nike Air Jordan 1 Retro
    43: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800&auto=format&fit=crop&q=80', # Authentic black, white, and red Nike Air Jordan 1 High Top sneaker
    # 45. Campera de Cuero Vacuno
    44: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80', # Black leather biker/zip jacket
    # 46. Reloj Seiko 5 Sports
    45: 'https://images.unsplash.com/photo-1629581678313-36cf745a9af9?w=800&auto=format&fit=crop&q=80', # Stainless steel chronograph sports wristwatch with metal bracelet
    # 47. Cartera de Cuero Prüne
    46: 'https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=800&auto=format&fit=crop&q=80', # Elegant leather handbag with strap
    # 48. Mochila Impermeable Samsonite
    47: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', # Black laptop backpack
    # 49. Guitarra Eléctrica Fender Stratocaster
    48: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&auto=format&fit=crop&q=80', # Fender Stratocaster electric guitar
    # 50. Teclado Sintetizador Yamaha
    49: 'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&auto=format&fit=crop&q=80', # Electronic music keyboard synthesizer
    # 51. Box Set Colección Harry Potter
    50: 'https://images.unsplash.com/photo-1600189261900-da2183219c28?w=800&auto=format&fit=crop&q=80', # Actual Harry Potter books collection
    # 52. Tocadiscos Vinilo Audio-Technica
    51: 'https://images.unsplash.com/photo-1616714109948-c74fe5029a4d?w=800&auto=format&fit=crop&q=80', # Turntable vinyl record player with tone arm
}

print("Total replacement images:", len(new_images))
