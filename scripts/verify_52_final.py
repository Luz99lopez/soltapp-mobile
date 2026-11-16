import urllib.request
import time

urls = {
    1: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg/960px-Volkswagen_Gol_Trend_1.6_Pack_I_2011.jpg",
    2: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honda_Tornado.jpg/960px-Honda_Tornado.jpg",
    3: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Full-Face_Helmet_9274.jpg/960px-Full-Face_Helmet_9274.jpg",
    4: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/2011_Yamaha_Byson_150_%2820201105%29.jpg/960px-2011_Yamaha_Byson_150_%2820201105%29.jpg",
    5: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Car_tire_stack_20170516.jpg/960px-Car_tire_stack_20170516.jpg",
    6: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2019_Chevrolet_Onix_Activ_1.4.jpg/960px-2019_Chevrolet_Onix_Activ_1.4.jpg",
    7: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Back_of_the_iPhone_14_Pro.jpg/960px-Back_of_the_iPhone_14_Pro.jpg",
    8: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Back_of_the_Samsung_Galaxy_S23.jpg/960px-Back_of_the_Samsung_Galaxy_S23.jpg",
    9: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/%282022%29_-_Motorola_Moto_G31_2021_model.jpg/960px-%282022%29_-_Motorola_Moto_G31_2021_model.jpg",
    10: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Apple_Watch_Series_7%3B_January_2022_%2801%29.jpg/960px-Apple_Watch_Series_7%3B_January_2022_%2801%29.jpg",
    11: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0f/MacBook_Air_black.jpg/960px-MacBook_Air_black.jpg",
    12: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Dell_Latitude_E6410_laptop_with_Kiwix.jpg/960px-Dell_Latitude_E6410_laptop_with_Kiwix.jpg",
    13: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/About_iPad_%2810th_generation%29.jpg/960px-About_iPad_%2810th_generation%29.jpg",
    14: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_5_and_DualSense.jpg/960px-PlayStation_5_and_DualSense.jpg",
    15: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Nintendo-Switch-Console-Docked-wJoyConRB.jpg/960px-Nintendo-Switch-Console-Docked-wJoyConRB.jpg",
    16: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg/960px-2023_Gigabyte_GeForce_RTX_4070_Aero_OC_12GB_%283%29.jpg",
    17: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/A_flat-screen_television.jpg/960px-A_flat-screen_television.jpg",
    18: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Sony_Portable_Ultra_Short_Throw_Projector_%2826089152123%29.jpg/960px-Sony_Portable_Ultra_Short_Throw_Projector_%2826089152123%29.jpg",
    19: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Sony_WH-CH510_Bluetooth_Over-Ear_Headphone.jpg/960px-Sony_WH-CH510_Bluetooth_Over-Ear_Headphone.jpg",
    20: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/JBL_Charge_4_1v2.jpg/960px-JBL_Charge_4_1v2.jpg",
    21: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Canon_1300D.jpg/960px-Canon_1300D.jpg",
    22: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/2024_Dron_DJI_Mini_4_Pro_%2801%29.jpg/960px-2024_Dron_DJI_Mini_4_Pro_%2801%29.jpg",
    23: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a5/Chesterfield_Buckingham_sofa.jpg/960px-Chesterfield_Buckingham_sofa.jpg",
    24: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Dining_table_brown.jpg/960px-Dining_table_brown.jpg",
    25: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Mid-Century_Modern_Tripod_Lamp_at_Intterno_Showroom_in_Warsaw.jpg/960px-Mid-Century_Modern_Tripod_Lamp_at_Intterno_Showroom_in_Warsaw.jpg",
    26: "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Argentine_wood-fired_asado_on_a_homemade_chulengo_grill_with_anchico_firewood.jpg/960px-Argentine_wood-fired_asado_on_a_homemade_chulengo_grill_with_anchico_firewood.jpg",
    27: "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Cast_iron_outdoor_table_and_chairs_at_Boreham%2C_Essex%2C_England.jpg/960px-Cast_iron_outdoor_table_and_chairs_at_Boreham%2C_Essex%2C_England.jpg",
    28: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/A_vintage%2C_hand-carved_wooden_wall_mirror_frame.jpg/960px-A_vintage%2C_hand-carved_wooden_wall_mirror_frame.jpg",
    29: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/DeWalt_20_Volt_Max_Cordless_Drill.jpg/960px-DeWalt_20_Volt_Max_Cordless_Drill.jpg",
    30: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/2006_Lawn_Master_Mower_%2830953866266%29.jpg/960px-2006_Lawn_Master_Mower_%2830953866266%29.jpg",
    31: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Automatic_espresso_machine_02.JPG/960px-Automatic_espresso_machine_02.JPG",
    32: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/SAMSUNG_REFRIGERATOR_RF60J9030WZ.jpg/960px-SAMSUNG_REFRIGERATOR_RF60J9030WZ.jpg",
    33: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Fagor_washing_machine_front_FF6314.jpg/960px-Fagor_washing_machine_front_FF6314.jpg",
    34: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Air_Fryer_2020.jpg/960px-Air_Fryer_2020.jpg",
    35: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/AKIRA_Microwave_Oven_in_Singapore_HDB.jpg/960px-AKIRA_Microwave_Oven_in_Singapore_HDB.jpg",
    36: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Mopping_vacuum_cleaner_robotic.jpg/960px-Mopping_vacuum_cleaner_robotic.jpg",
    37: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Bulls_Wild_Cup_1_%28Modell_2010%29_20100814.jpg/960px-Bulls_Wild_Cup_1_%28Modell_2010%29_20100814.jpg",
    38: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Brompton1.jpeg/960px-Brompton1.jpeg",
    39: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/RaleighScorpio.JPG/960px-RaleighScorpio.JPG",
    40: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Colorful_pile_of_dumbbells_at_the_gym.jpg/960px-Colorful_pile_of_dumbbells_at_the_gym.jpg",
    41: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Treadmill_by_window.jpg/960px-Treadmill_by_window.jpg",
    42: "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f7/Babolat_Contest_Pro_tennis_racquet.JPG/960px-Babolat_Contest_Pro_tennis_racquet.JPG",
    43: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Tabla_de_surf_epoxi_Surfboard_epoxy.jpg/960px-Tabla_de_surf_epoxi_Surfboard_epoxy.jpg",
    44: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/62/2023_Buty_Nike_Air_Jordan.jpg/960px-2023_Buty_Nike_Air_Jordan.jpg",
    45: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/be/Black_worn_leather_jacket.jpg/960px-Black_worn_leather_jacket.jpg",
    46: "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Seiko_5.jpg/960px-Seiko_5.jpg",
    47: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a0/%D0%A1%D1%83%D0%BC%D0%BA%D0%B0_%D0%9E%D0%BB%D0%B8%D0%B2%D0%B8%2C_%D0%BC%D0%BE%D0%B4%D0%B5%D0%BB%D1%8C_561.jpg/960px-%D0%A1%D1%83%D0%BC%D0%BA%D0%B0_%D0%9E%D0%BB%D0%B8%D0%B2%D0%B8%2C_%D0%BC%D0%BE%D0%B4%D0%B5%D0%BB%D1%8C_561.jpg",
    48: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Eastpak_Sugarbush_backpack_black.jpg/960px-Eastpak_Sugarbush_backpack_black.jpg",
    49: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Bob_Dylan%27s_Fender_Stratocaster_%281964%29_in_3_tone_sunburst%2C_played_when_Dylan_Goes_Electric_at_Newport_Folk_Festival_on_July_25%2C_1965._Lost_ca.1965%2C_rediscovered_in_2012_-_Play_It_Loud._MET_%282019-05-13_19.46.56_by_Eden%2C_Janine_and_Jim%29.jpg/960px-thumbnail.jpg",
    50: "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Yamaha_PSR-270_-_angled.jpg/960px-Yamaha_PSR-270_-_angled.jpg",
    51: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Harry_Potter_1st_USA_ed._complete_hardback_set_lined_up_L-R.JPG/960px-Harry_Potter_1st_USA_ed._complete_hardback_set_lined_up_L-R.JPG",
    52: "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Audio-Technica_turntable_playing_coloured_vinyl.jpg/960px-Audio-Technica_turntable_playing_coloured_vinyl.jpg"
}

headers = {'User-Agent': 'SoltappBot/1.0 (tester@soltapp.com)'}

if __name__ == '__main__':
    failed = []
    print(f"Testing all {len(urls)} URLs...")
    for idx, u in sorted(urls.items()):
        req = urllib.request.Request(u, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
                if resp.status == 200 and len(data) > 1000:
                    print(f"[{idx:02d}] OK ({len(data)} bytes)")
                else:
                    print(f"[{idx:02d}] BAD: status {resp.status}, size {len(data)}")
                    failed.append((idx, u, resp.status))
        except Exception as e:
            print(f"[{idx:02d}] ERROR: {e}")
            failed.append((idx, u, str(e)))
        time.sleep(0.1)

    print(f"\nSummary: {len(urls) - len(failed)}/{len(urls)} succeeded!")
    if failed:
        print("FAILED ITEMS:")
        for f in failed:
            print(f)
