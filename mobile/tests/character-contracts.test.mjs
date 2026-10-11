import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { readAccount } from '../src/auth/contracts.ts';
import { classes, levelFromXp, normalizeClass } from '../src/character/catalog.ts';
import { prepareCharacter, readCharacter, validateCharacter } from '../src/character/contracts.ts';

const web = {};
vm.runInNewContext(readFileSync(new URL('../../shared/pointy-logic.js', import.meta.url), 'utf8'), web);
const canon = web.PointyLogic;
const account = readAccount('owner-a', { uid: 'owner-a', username: 'hero', userId: '2150', name: 'Hero' });
const lookup = { uid: account.uid, userId: account.userId, characterId: '' };
const reservation = { ...lookup };
const draft = { name: 'ผู้กล้า', classId: 'ranger', gender: 'female' };
const create = (a = account, d = draft, previous = undefined, l = lookup, r = reservation) => prepareCharacter(a, d, previous, l, r, 123456789);

test('all 18 web classes, names, aliases and 36 base portraits are preserved', () => {
  assert.deepEqual(classes.map(item => item.id), Array.from(canon.CLASS_ORDER));
  for (const item of classes) {
    assert.equal(item.th, canon.CLASSES[item.id].th);
    assert.equal(item.en, canon.CLASSES[item.id].en);
    for (const gender of ['female', 'male']) assert.ok(existsSync(new URL(`../../assets/rpg-portraits/${item.id}-${gender}.png`, import.meta.url)));
  }
  for (const id of [...classes.map(item => item.id), 'mage', 'knight', 'rogue', 'druid', 'legacy-class']) assert.equal(normalizeClass(id), canon.normalizeClass(id));
});

test('level boundaries, rounding and tail levels match the web curve', () => {
  const values = [-1, 0, 0.5, 100000, ...canon.CHARACTER_LEVEL_THRESHOLDS.flatMap(xp => [xp - 1, xp, xp + 0.5]), 20999, 21000, 25999, 26000];
  for (const xp of values) assert.deepEqual(levelFromXp(xp), JSON.parse(JSON.stringify(canon.levelFromXp(xp))), `XP ${xp}`);
});

test('creation validates name and real catalog choices before any write', () => {
  assert.equal(validateCharacter(draft), '');
  for (const bad of [{ ...draft, name: ' ' }, { ...draft, name: 'x'.repeat(31) }, { ...draft, classId: '' }, { ...draft, classId: 'missing' }, { ...draft, gender: 'unknown' }]) assert.notEqual(validateCharacter(bad), '');
});

test('new character uses reserved User ID and preserves account identity', () => {
  const result = create();
  assert.equal(result.isNew, true);
  assert.equal(result.character.id, account.userId);
  assert.equal(result.record.ownerUid, account.uid);
  assert.equal(result.record.xp, 0);
  assert.equal(result.summary.class, draft.classId);
  assert.equal(result.summary.cls, draft.classId);
  assert.equal(result.record.createdAt, 123456789);
  assert.ok(!('recoveryHash' in result.record));
});

test('repeat submission keeps first character and never resets XP or timestamps', () => {
  const previous = { ...create().record, xp: 450, updatedAt: 987, createdAt: 123 };
  const result = create({ ...account, characterId: '2150' }, { ...draft, name: 'Replacement', classId: 'wizard' }, previous);
  assert.equal(result.isNew, false);
  assert.equal(result.record, previous);
  assert.equal(result.character.name, draft.name);
  assert.equal(result.character.classId, draft.classId);
  assert.equal(result.character.xp, 450);
});

test('another character owner is never overwritten or attached to this account', () => {
  const previous = { ...create().record, ownerUid: 'someone-else' };
  assert.throws(() => create(account, draft, previous), { code: 'character/identity-conflict' });
});

test('missing or conflicting identity reservations fail closed', () => {
  for (const bad of [undefined, { ...lookup, uid: 'other' }, { ...lookup, userId: '9999' }, { ...lookup, characterId: '9999' }]) {
    assert.throws(() => prepareCharacter(account, draft, undefined, bad, reservation, 1), { code: 'character/identity-conflict' });
    assert.throws(() => prepareCharacter(account, draft, undefined, lookup, bad, 1), { code: 'character/identity-conflict' });
  }
});

test('missing linked character requires recovery, not a replacement', () => {
  assert.throws(() => create({ ...account, characterId: '2150' }), { code: 'character/missing' });
  assert.throws(() => create(account, draft, undefined, { ...lookup, characterId: '2150' }), { code: 'character/missing' });
});

test('suspended identity pointers cannot create a character', () => {
  assert.throws(() => create(account, draft, undefined, { ...lookup, status: 'archived' }), { code: 'account/blocked' });
  assert.throws(() => create(account, draft, undefined, lookup, { ...reservation, lifecycleStatus: 'deleted' }), { code: 'account/blocked' });
});

test('existing linked legacy ID is preserved instead of regenerated', () => {
  const previous = { ...create().record, id: '1234' };
  const result = create({ ...account, characterId: '1234' }, draft, previous, { ...lookup, characterId: '1234' }, { ...reservation, characterId: '1234' });
  assert.equal(result.character.id, '1234');
  assert.equal(result.isNew, false);
});

test('missing XP is unknown, while a saved zero remains real zero', () => {
  const { xp, ...legacy } = create().record;
  assert.equal(readCharacter('2150', legacy, account).xp, null);
  assert.equal(readCharacter('2150', { ...legacy, xp: 0 }, account).xp, 0);
  assert.equal(readCharacter('2150', { ...legacy, xp: Number.NaN }, account).xp, null);
});

test('conflicting account character pointers fail before accessing another ID', () => {
  assert.throws(() => readAccount(account.uid, { ...account, characterId: '2150', character: { id: '9999' } }), { code: 'account/profile-invalid' });
  assert.throws(() => readAccount(account.uid, { ...account, characterId: '../users' }), { code: 'account/profile-invalid' });
});
