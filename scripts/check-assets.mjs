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
const dragons = ['card', 'autoloan', 'student', 'mortgage', 'medical', 'tax', 'other'];
const cloudinaryExpected = [
  ...classes.flatMap(cls => genders.map(gender => `assets/rpg-portraits/${cls}-${gender}.png`)),
  'assets/rpg-portraits/crimson-regent-male.png',
  'assets/rpg-portraits/archfiend-swimmer-male.png',
  'assets/rpg-portraits/archfiend-swimmer-blackred-male.png',
  'assets/icons/loot-chest.svg',
];
const localFallbackExpected = [
  ...dragons.flatMap(name => ['png', 'webp'].map(ext => `assets/debt-dragons/${name}.${ext}`)),
  ...['title-scroll', 'shield', 'swords', 'scroll', 'coins', 'split', 'key', 'star', 'box'].map(name => `assets/admin-board-info/${name}.webp`),
  ...['tavern-shell', 'mountain-footer', 'medallions'].map(name => `assets/admin-reference/${name}.webp`),
  ...['castle-banner', 'coins', 'swords', 'chest', 'hourglass', 'home', 'food', 'transport', 'fun', 'shop', 'health', 'forecast', 'history', 'slime'].map(name => `assets/treasury-reference/${name}.webp`),
  'assets/price-reference/market-banner.webp',
  'assets/debt-reference/valley-dragon.webp',
  'assets/loading-reference/night-quest.webp',
  ...['tavern', 'tavern-mobile', 'guild-banner', 'owl-note'].map(name => `assets/auth-reference/${name}.webp`),
  ...['tavern', 'doorway', 'treasury-seal', 'parchment'].map(name => `assets/auth-guild/${name}.webp`),
  ...['welcome', 'party', 'debt', 'treasury', 'compare', 'friends', 'budget'].map(name => `assets/tour/${name}.webp`),
  'assets/character-reference/forest-valley.webp',
  'assets/board-reference/village-dusk.webp',
  ...['camp', 'key', 'clock', 'crown', 'mountains'].map(name => `assets/split-entry/${name}.svg`),
  ...['chest', 'dragon', 'scales', 'treasury', 'crest', 'tavern-banner', 'tavern-mobile'].map(name => `assets/home-reference/${name}.webp`),
  ...cloudinaryExpected,
  'assets/rpg-portraits/tiderunner-classic-female.png',
  'assets/rpg-portraits/tiderunner-classic-male.png',
  'fallback-assets/tiderunner-classic-female.png',
  'fallback-assets/tiderunner-classic-male.png',
];
const manifestPath = path.join(process.cwd(), 'shared', 'cloudinary-assets.js');
const manifestText = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';
const manifestMatch = manifestText.match(/window\.POINTY_CLOUDINARY_ASSETS\s*=\s*(\{[\s\S]*\});?\s*$/);
const manifest = manifestMatch ? JSON.parse(manifestMatch[1]) : {};
const missingCloudinary = cloudinaryExpected.filter(file => !manifest[file] || !/^https:\/\/res\.cloudinary\.com\//.test(manifest[file]));
const missingLocal = localFallbackExpected.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
const vercelIgnorePath = path.join(process.cwd(), '.vercelignore');
const vercelIgnore = fs.existsSync(vercelIgnorePath) ? fs.readFileSync(vercelIgnorePath, 'utf8') : '';
const missingVercelAllowlist = localFallbackExpected.filter(file => vercelIgnore.split(/\r?\n/).some(line => line && !line.startsWith('!') && file.startsWith(line.replace(/\/+$/, '/'))));
const missing = [
  ...missingCloudinary,
  ...missingLocal.map(file => `${file} (missing local fallback file)`),
  ...missingVercelAllowlist.map(file => `${file} (blocked by .vercelignore)`),
];

if (missing.length) {
  console.error('Missing required asset(s):');
  missing.forEach(file => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`Checked ${localFallbackExpected.length} deployed local assets and ${cloudinaryExpected.length} optional CDN manifest entries.`);
