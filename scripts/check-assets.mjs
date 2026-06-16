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
const portraitDir = path.join(process.cwd(), 'assets', 'rpg-portraits');
const dragonDir = path.join(process.cwd(), 'assets', 'debt-dragons');
const expected = [
  ...classes.flatMap(cls => genders.map(gender => `${cls}-${gender}.png`)),
  'crimson-regent-male.png',
  'archfiend-swimmer-male.png',
  'archfiend-swimmer-blackred-male.png',
];
const dragons = ['card', 'autoloan', 'student', 'mortgage', 'medical', 'tax', 'other'];
const missing = expected.filter(file => !fs.existsSync(path.join(portraitDir, file)));
dragons.forEach(file => {
  if (!fs.existsSync(path.join(dragonDir, `${file}.png`))) missing.push(`assets/debt-dragons/${file}.png`);
});

if (!fs.existsSync(path.join(process.cwd(), 'assets', 'icons', 'loot-chest.svg'))) {
  missing.push('assets/icons/loot-chest.svg');
}

if (missing.length) {
  console.error('Missing required asset(s):');
  missing.forEach(file => console.error(`- ${file}`));
  process.exit(1);
}

console.log(`Checked ${expected.length} RPG portrait/skin assets, ${dragons.length} debt dragon assets, and loot chest icon.`);
