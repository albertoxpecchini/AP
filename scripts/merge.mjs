import fs from 'fs';
import path from 'path';

const BATCH_DIR = 'C:\\Users\\Administrator\\AppData\\Local\\Temp\\claude\\c--Users-Administrator-Documents-AP\\28376372-6b77-4e66-b6b0-e8a485c01793\\scratchpad\\tx';
const OUT_FILE = 'src\\app\\i18n\\translations.json';

async function mergeBatches() {
  const merged = {};

  const files = fs.readdirSync(BATCH_DIR).filter(f => f.match(/^b\d+\.json$/)).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });

  let totalBefore = 0;
  if (fs.existsSync(OUT_FILE)) {
    const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf-8'));
    Object.assign(merged, existing);
    totalBefore = Object.keys(existing).length;
  }

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, file), 'utf-8'));
    Object.assign(merged, content);
    console.log(`✓ Merged ${file}`);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
  const totalAfter = Object.keys(merged).length;
  console.log(`\n✓ Merged to ${OUT_FILE}`);
  console.log(`  Before: ${totalBefore} entries`);
  console.log(`  After: ${totalAfter} entries`);
  console.log(`  New: +${totalAfter - totalBefore}`);
}

mergeBatches().catch(console.error);
