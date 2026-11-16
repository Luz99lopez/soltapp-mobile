import os
import urllib.request

preview_dir = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/preview_candidates'
os.makedirs(preview_dir, exist_ok=True)

test_images = {
    # Gol Trend
    "gol_1": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg/800px-Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg",
    "gol_2": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/2015_Volkswagen_Gol_Trend_1.6_Pack_III%2C_I-Motion_%28front%29.jpg/800px-2015_Volkswagen_Gol_Trend_1.6_Pack_III%2C_I-Motion_%28front%29.jpg",
    "gol_3": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/VW_Gol_Trend_Sportline_1.6_%282016%29.jpg/800px-VW_Gol_Trend_Sportline_1.6_%282016%29.jpg",
    "gol_4": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/2014_Volkswagen_Gol_Trend_1.6_Cup.jpg/800px-2014_Volkswagen_Gol_Trend_1.6_Cup.jpg",
    
    # Chevrolet Onix
    "onix_1": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2019_Chevrolet_Onix_Activ_1.4.jpg/800px-2019_Chevrolet_Onix_Activ_1.4.jpg",
    "onix_2": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Chevrolet_Onix_20150814-DSC05650.JPG/800px-Chevrolet_Onix_20150814-DSC05650.JPG",
    "onix_3": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Chevrolet_Onix_1.4_Activ_2019.jpg/800px-Chevrolet_Onix_1.4_Activ_2019.jpg",
    "onix_4": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Chevrolet_Onix_002.jpg/800px-Chevrolet_Onix_002.jpg",

    # Honda XR
    "honda_tornado": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honda_Tornado.jpg/800px-Honda_Tornado.jpg",
    "honda_xr250": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/1994_Honda_XR250R.jpg/800px-1994_Honda_XR250R.jpg",

    # Casco
    "casco_fullface": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Full-Face_Helmet_9274.jpg/800px-Full-Face_Helmet_9274.jpg",
    "casco_leap": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/AC_Bike_Helmet_LEAP_GCE_Tirunelveli_Sep22_R16_06263.jpg/800px-AC_Bike_Helmet_LEAP_GCE_Tirunelveli_Sep22_R16_06263.jpg",

    # Cinta correr
    "cinta_gym": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Treadmill-gym.jpg/800px-Treadmill-gym.jpg",
    "cinta_bedrest": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/HRP_HHC_Bedrest_Exercise_Treadmill.jpg/800px-HRP_HHC_Bedrest_Exercise_Treadmill.jpg",

    # Tabla surf
    "surf_abandoned": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Abandoned_surfboard_%28Unsplash%29.jpg/800px-Abandoned_surfboard_%28Unsplash%29.jpg",

    # Cubiertas
    "tires_stack": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/2008-05-01_Stack_of_car_wheels.jpg/800px-2008-05-01_Stack_of_car_wheels.jpg",
    "tires_stack2": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Car_tire_stack_20170516.jpg/800px-Car_tire_stack_20170516.jpg",
    "tires_michelin": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Michelin_tires_%287612855412%29.jpg/800px-Michelin_tires_%287612855412%29.jpg"
}

headers = {'User-Agent': 'SoltappBot/1.0 (contact@soltapp.com)'}
for name, url in test_images.items():
    dest = os.path.join(preview_dir, f"{name}.jpg")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            with open(dest, 'wb') as f:
                f.write(data)
            print(f"Downloaded {name}: {len(data)} bytes")
    except Exception as e:
        print(f"Failed {name}: {e}")
