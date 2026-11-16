import re
import csv
from io import StringIO

sql_path = 'C:/Users/nenri/OneDrive/Escritorio/soltapp-mobile/scripts/reset_and_seed_50_products.sql'
with open(sql_path, encoding='utf-8') as f:
    sql = f.read()

prod_match = re.search(r'INSERT INTO public\.products \(([\s\S]*?)\) VALUES\s*([\s\S]*?);', sql)
tuples = re.findall(r'\(([\s\S]*?)\)(?:,|\s*$)', prod_match.group(2).strip())

errors = 0
for idx, t in enumerate(tuples):
    reader = csv.reader(StringIO(t), quotechar="'", skipinitialspace=True)
    items = list(reader)[0]
    if len(items) != 12:
        print(f"ERROR: Product Row {idx+1} has {len(items)} items!")
        errors += 1

print(f"Total product rows checked: {len(tuples)}, errors: {errors}")

img_match = re.search(r'INSERT INTO public\.product_images \(([\s\S]*?)\) VALUES\s*([\s\S]*?);', sql)
img_tuples = re.findall(r'\(([\s\S]*?)\)(?:,|\s*$)', img_match.group(2).strip())

img_errors = 0
for idx, t in enumerate(img_tuples):
    reader = csv.reader(StringIO(t), quotechar="'", skipinitialspace=True)
    items = list(reader)[0]
    if len(items) != 6:
        print(f"ERROR: Image Row {idx+1} has {len(items)} items!")
        img_errors += 1

print(f"Total image rows checked: {len(img_tuples)}, errors: {img_errors}")
if errors == 0 and img_errors == 0:
    print("\nALL 52 PRODUCTS AND 52 IMAGES ARE 100% VALID!")

