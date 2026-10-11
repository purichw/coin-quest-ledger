import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildResetRecords,
  cleanRecoveryCode,
  generateRecoveryCode,
  recoveryHashFor,
  safeHashEqual,
  readBody,
  verifySuperAdminToken
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

  assert.equal(records.userRecord.recoveryCode, '__DELETE_FIELD__');
  assert.equal(records.userRecord.recoveryHash, 'next-private-hash');
  assert.equal(records.userRecord.tempPasswordRequired, true);
  assert.equal(records.usernameRecord.recoveryHash, '__DELETE_FIELD__');
  assert.equal(records.characterPatch.ownerUid, 'uid-new');
  assert.equal(records.userIdRecord.uid, 'uid-new');
});

test('hash comparison rejects partial hex and malformed hashes', () => {
  assert.equal(safeHashEqual('abXX', 'abYY'), false);
  assert.equal(safeHashEqual('aa', 'aa'), false);
  assert.equal(safeHashEqual('a'.repeat(64), 'a'.repeat(64)), true);
});

test('body reader handles parsed platform requests and rejects non-object input', async () => {
  assert.deepEqual(await readBody({ body: { username: 'hero' } }), { username: 'hero' });
  assert.deepEqual(await readBody({ body: '{"username":"hero"}' }), { username: 'hero' });
  for (const body of [null, [], 'null', '4', '{']) await assert.rejects(readBody({ body }));
  await assert.rejects(readBody({ body: { name: 'a'.repeat(32_000) } }), /too large/);
});

test('admin authorization requires verified email and checks revoked tokens', async () => {
  const req = { headers: { authorization: 'Bearer fixture-token' } };
  let revokeCheck;
  const fake = verified => ({ async verifyIdToken(token, checkRevoked) { revokeCheck = checkRevoked; return { uid: 'admin', email: 'purich.wc@gmail.com', ...(verified === undefined ? {} : { email_verified: verified }) }; } });
  await assert.rejects(verifySuperAdminToken(req, fake(undefined)), { status: 403 });
  await assert.rejects(verifySuperAdminToken(req, fake(false)), { status: 403 });
  await verifySuperAdminToken(req, fake(true)); assert.equal(revokeCheck, true);
});
