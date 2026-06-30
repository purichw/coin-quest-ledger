import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const htmlFiles = [
  'index.html',
  'index.legacy.html',
  'trip/index.html',
  'trip/index.legacy.html',
  'admin/index.html',
  'character/index.html',
  'debt/index.html',
];
const scriptFiles = [
  'shared/board-invites.js',
  'trip/app.js',
  'admin/app.js',
  'character/app.js',
  'debt/app.js',
];

let checked = 0;
for (const rel of htmlFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1].trim())
    .filter(Boolean);
  scripts.forEach((code, index) => {
    new vm.Script(code, { filename: `${rel}#inline-script-${index + 1}` });
    checked += 1;
  });
}

for (const rel of scriptFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  new vm.Script(fs.readFileSync(file, 'utf8'), { filename: rel });
  checked += 1;
}

console.log(`Checked ${checked} browser script(s).`);
