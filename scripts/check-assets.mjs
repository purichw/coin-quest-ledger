import fs from 'node:fs';
import path from 'node:path';

const classes = [
  'warrior',
  'wizard',
  'cleric',
  'monk',
  'bard',
  'dragoon',
  'summoner',
  'thief',
  'ranger',
  'alchemist',
  'necromancer',
  'engineer',
  'berserker',
  'archfiend',
  'corsair',
  'reveler',
  'seraph',
  'tiderunner',
];
const genders = ['female', 'male'];
const expected = [
  ...classes.flatMap(cls => genders.map(gender => `assets/rpg-portraits/${cls}-${gender}.png`)),
  'assets/rpg-portraits/crimson-regent-male.png',
  'assets/rpg-portraits/archfiend-swimmer-male.png',
  'assets/rpg-portraits/archfiend-swimmer-blackred-male.png',
  ...[
    'card',
    'autoloan',
    'student',
    'mortgage',
    'medical',
    'tax',
    'other',
  ].map(file => `assets/debt-dragons/${file}.png`),
  'assets/icons/loot-chest.svg',
];
const dragons = ['card', 'autoloan', 'student', 'mortgage', 'medical', 'tax', 'other'];
const manifestPath = path.join(process.cwd(), 'shared', 'cloudinary-assets.js');
const manifestText = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';
const manifestMatch = manifestText.match(/window\.POINTY_CLOUDINARY_ASSETS\s*=\s*(\{[\s\S]*\});?\s*$/);
const manifest = manifestMatch ? JSON.parse(manifestMatch[1]) : {};
const missing = expected.filter(file => !manifest[file] || !/^https:\/\/res\.cloudinary\.com\//.test(manifest[file]));

dragons.forEach(file => {
  const key = `assets/debt-dragons/${file}.png`;
  if (!manifest[key]) missing.push(key);
});

if (missing.length) {
  console.error('Missing required Cloudinary asset(s):');
  missing.forEach(file => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`Checked ${classes.length * genders.length + 3} RPG portrait/skin assets, ${dragons.length} debt dragon assets, and loot chest icon in Cloudinary manifest.`);
