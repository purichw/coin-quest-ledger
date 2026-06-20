import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanLegacyTripData, resolveUser } from '../../api/admin-delete-user.js';

function makeSnap(data, id = '') {
  return {
    id,
    exists: !!data,
    data: () => data
  };
}

function makeQuerySnap(entries) {
  return {
    empty: entries.length === 0,
    docs: entries.map(([id, data]) => makeSnap(data, id))
  };
}

function makeDb(seed) {
  return {
    collection(name) {
      return {
        doc(id) {
          return {
            async get() {
              return makeSnap(seed[name]?.[id] || null, id);
            }
          };
        },
        where(field, op, value) {
          assert.equal(op, '==');
          return {
            limit(count) {
              assert.equal(count, 1);
              return {
                async get() {
                  const entries = Object.entries(seed[name] || {})
                    .filter(([, data]) => String(data?.[field] || '') === String(value));
                  return makeQuerySnap(entries.slice(0, count));
                }
              };
            }
          };
        }
      };
    }
  };
}

test('resolveUser follows display name to username mapping when admin row lacks uid', async () => {
  const db = makeDb({
    users: {
      uidPointy: { name: 'Pointy', characterId: '3720' }
    },
    usernames: {
      pointy: { username: 'pointy', uid: 'uidPointy', userId: '3720', characterId: '3720' }
    },
    characters: {}
  });

  const resolved = await resolveUser(db, {
    userId: '3720',
    displayName: 'Pointy',
    characterIds: ['3720']
  });

  assert.equal(resolved.uid, 'uidPointy');
  assert.equal(resolved.username, 'pointy');
  assert.deepEqual(resolved.characterIds, ['3720']);
});

test('resolveUser does not trust a display-name username when the mapped User ID differs', async () => {
  const db = makeDb({
    users: {
      uidOther: { name: 'Pointy', characterId: '9999' }
    },
    usernames: {
      pointy: { username: 'pointy', uid: 'uidOther', userId: '9999', characterId: '9999' }
    },
    characters: {}
  });

  const resolved = await resolveUser(db, {
    userId: '3720',
    displayName: 'Pointy',
    characterIds: ['3720']
  });

  assert.equal(resolved, null);
});

test('resolveUser can recover uid from character owner link', async () => {
  const db = makeDb({
    users: {
      uidHero: { username: 'hero.owner', userId: '6880', characterId: '6880' }
    },
    usernames: {},
    characters: {
      6880: { ownerUid: 'uidHero', userId: '6880', username: 'hero.owner' }
    }
  });

  const resolved = await resolveUser(db, {
    userId: '6880',
    characterIds: ['6880']
  });

  assert.equal(resolved.uid, 'uidHero');
  assert.equal(resolved.username, 'hero.owner');
  assert.deepEqual(resolved.characterIds, ['6880']);
});

test('cleanLegacyTripData removes no-auth character references from board data', () => {
  const cleaned = cleanLegacyTripData({
    tripName: 'Legacy Board',
    participants: ['Pointy', 'Mira'],
    characterIds: { Pointy: '3720', Mira: '2222' },
    heroClasses: { Pointy: 'archfiend', Mira: 'bard' },
    heroGenders: { Pointy: 'male', Mira: 'female' },
    heroSkins: { Pointy: 'crimson' },
    settleXp: { Pointy: 400, Mira: 10 },
    characterXp: { 3720: 400, 2222: 10 },
    expenses: [
      { paidBy: 'Pointy', amount: 100, sharedBy: ['Pointy', 'Mira'] },
      { paidBy: 'Mira', amount: 50, sharedBy: ['Mira'] }
    ],
    admin: { adminName: 'Pointy', characterId: '3720', adminId: 'ADM-LEGACY' }
  }, {
    targetIds: ['3720'],
    targetNames: ['Pointy']
  });

  assert.equal(cleaned.changed, true);
  assert.deepEqual(cleaned.removedNames, ['Pointy']);
  assert.deepEqual(cleaned.data.participants, ['Mira']);
  assert.deepEqual(cleaned.data.characterIds, { Mira: '2222' });
  assert.deepEqual(cleaned.data.heroClasses, { Mira: 'bard' });
  assert.deepEqual(cleaned.data.characterXp, { 2222: 10 });
  assert.equal(cleaned.data.expenses.length, 1);
  assert.equal(cleaned.data.expenses[0].paidBy, 'Mira');
  assert.equal(cleaned.data.admin.adminName, undefined);
  assert.equal(cleaned.data.admin.characterId, undefined);
});

test('cleanLegacyTripData also cleans campaign references', () => {
  const cleaned = cleanLegacyTripData({
    participants: [],
    characterIds: {},
    campaigns: [{
      id: 'campaign-a',
      participants: ['Pointy'],
      characterIds: { Pointy: '3720' },
      heroClasses: { Pointy: 'archfiend' },
      expenses: [{ paidBy: 'Pointy', amount: 20, sharedBy: ['Pointy'] }]
    }]
  }, {
    targetIds: ['3720'],
    targetNames: ['Pointy']
  });

  assert.equal(cleaned.changed, true);
  assert.deepEqual(cleaned.data.campaigns, []);
});
