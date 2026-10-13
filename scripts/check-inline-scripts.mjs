import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const root = process.cwd();
function filesIn(dir, extension) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(file => file.endsWith(extension))
    .sort()
    .map(file => `${dir}/${file}`);
}

const htmlFiles = [
  'index.html',
  'archive/legacy/index.legacy.html',
  'trip/index.html',
  'archive/legacy/trip-index.legacy.html',
  'admin/index.html',
  'character/index.html',
  'debt/index.html',
  'treasury/index.html',
];
const scriptFiles = [
  ...filesIn('shared', '.js'),
  'lang.js',
  'trip/trip-utils.js',
  'trip/entry.js',
  'trip/board.js',
  'trip/app.js',
  'admin/admin-utils.js',
  'admin/app.js',
  'character/app.js',
  'debt/app.js',
  'treasury/app.js',
];
const moduleFiles = [
  ...filesIn('api', '.js'),
  ...filesIn('scripts', '.mjs'),
  ...filesIn('tests/e2e', '.mjs'),
  ...filesIn('tests/e2e/helpers', '.mjs'),
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

let moduleChecked = 0;
for (const rel of moduleFiles) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `Syntax check failed for ${rel}\n`);
    process.exit(result.status || 1);
  }
  moduleChecked += 1;
}

console.log(`Checked ${checked} browser script(s) and ${moduleChecked} module file(s).`);
