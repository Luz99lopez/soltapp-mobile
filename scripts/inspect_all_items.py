import re
import csv
from io import StringIO
import urllib.request
import json

sql_path = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/reset_and_seed_50_products.sql'
with open(sql_path, encoding='utf-8') as f:
    sql = f.read()

prod_match = re.search(r'INSERT INTO public\.products \(([\s\S]*?)\) VALUES\s*([\s\S]*?);', sql)
img_match = re.search(r'INSERT INTO public\.product_images \(([\s\S]*?)\) VALUES\s*([\s\S]*?);', sql)

prods = [list(csv.reader(StringIO(t), quotechar="'", skipinitialspace=True))[0] for t in re.findall(r'\(([\s\S]*?)\)(?:,|\s*$)', prod_match.group(2).strip())]
imgs = [list(csv.reader(StringIO(t), quotechar="'", skipinitialspace=True))[0] for t in re.findall(r'\(([\s\S]*?)\)(?:,|\s*$)', img_match.group(2).strip())]

for idx, (p, img) in enumerate(zip(prods, imgs)):
    title = p[3]
    url = img[2]
    photo_id = url.split('/')[-1].split('?')[0]
    print(f"{idx+1:02d} | {title[:40]:<40} | {photo_id} | {url}")
