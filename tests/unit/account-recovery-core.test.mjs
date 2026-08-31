import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildResetRecords,
  cleanRecoveryCode,
  generateRecoveryCode,
  recoveryHashFor,
  safeHashEqual
} from '../../api/account-recovery-core.js';

test('recovery code generation uses the human-readable 12 character format', () => {
  const code = generateRecoveryCode();
  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal(/[IO01]/.test(code), false);
});

test('recovery hashing normalizes username and typed code formatting', () => {
  const canonical = recoveryHashFor('Pointy.Name', 'ABCD-EFGH-JK2M');
  const typed = recoveryHashFor(' pointy.name ', ' abcd efgh jk2m ');
  assert.equal(typed, canonical);
  assert.equal(cleanRecoveryCode(' abcd-efgh jk2m '), 'ABCDEFGHJK2M');
  assert.equal(safeHashEqual(canonical, typed), true);
});

test('reset records never persist the raw recovery code', () => {
  const records = buildResetRecords({
    uid: 'uid-new',
    username: 'hero',
    authEmail: 'hero@coinquest.local',
    userId: '1234',
    oldUser: {
      uid: 'uid-new',
      name: 'Hero',
      character: { id: '1234', name: 'Hero', class: 'warrior', gender: 'male' }
    },
    oldMapping: { userId: '1234', recoveryHash: 'legacy-public-hash' },
    recoveryHash: 'next-private-hash',
    recoveryIssuedAt: 1784050000000,
    timestamp: 'server-now',
    deleteField: '__DELETE_FIELD__',
    actor: 'admin',
    actorEmail: 'admin@example.test'
  });

  assert.equal(Object.hasOwn(records.userRecord, 'recoveryCode'), false);
  assert.equal(records.userRecord.recoveryHash, 'next-private-hash');
  assert.equal(records.userRecord.tempPasswordRequired, true);
  assert.equal(records.usernameRecord.recoveryHash, '__DELETE_FIELD__');
  assert.equal(records.characterPatch.ownerUid, 'uid-new');
  assert.equal(records.userIdRecord.uid, 'uid-new');
});
