const fs = require('fs');
const https = require('https');
const path = require('path');

// We will inspect the 52 images
const catalogPath = path.join(__dirname, 'generate_seed_sql.js');
const content = fs.readFileSync(catalogPath, 'utf8');

// Extract the catalog array
const match = content.match(/const catalog = (\[[\s\S]*?\]);/);
if (match) {
  const catalog = eval(match[1]);
  console.log('Total items in catalog:', catalog.length);
  catalog.forEach((item, i) => {
    console.log(`${i + 1}. [${item.title}] -> ${item.images[0]}`);
  });
}
