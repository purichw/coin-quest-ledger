import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { recoveryHashInput } from '../src/auth/contracts.ts';
import { acknowledgeDisplayedRecovery, verifiedRecoveryCandidate } from '../src/auth/recovery-display-contract.ts';

const digest = async input => createHash('sha256').update(input).digest('hex');
const candidate = { username: 'hero_1', code: 'ABCD-EFGH-2345' };
const hash = await digest(recoveryHashInput(candidate.username, candidate.code));

test('owner-held recovery key is revealed only against its current server hash', async () => {
  assert.equal(await verifiedRecoveryCandidate('hero_1', hash, { ...candidate, code: 'abcd efgh 2345' }, digest), candidate.code);
  assert.equal(await verifiedRecoveryCandidate('hero_1', await digest('rotated'), candidate, digest), null);
  assert.equal(await verifiedRecoveryCandidate('another_owner', hash, candidate, digest), null);
  assert.equal(await verifiedRecoveryCandidate('hero_1', undefined, candidate, digest), null);
});

test('hash-only records, malformed keys and corrupt local values do not reveal a key', async () => {
  for (const value of [null, '{bad json}', { username: 'hero_1', recoveryHash: hash }, { ...candidate, code: 'ABCD-EFGH-234!' }, { ...candidate, username: null }]) {
    assert.equal(await verifiedRecoveryCandidate('hero_1', hash, value, digest), null);
  }
});

test('stored=false recovery can acknowledge the displayed new key without any temporary Keychain record', async () => {
  // API reset succeeded, but temporary SecureStore write failed. The reveal
  // screen still owns the new key and the user confirmed their external copy.
  const resetResult = { username: candidate.username, code: candidate.code, stored: false };
  let attemptedCode;
  const result = await acknowledgeDisplayedRecovery(resetResult.username, hash, resetResult.code, digest, async code => {
    attemptedCode = code;
    throw new Error('Keychain unavailable');
  });
  assert.equal(attemptedCode, candidate.code);
  assert.deepEqual(result, { stored: false });
});

test('acknowledgment rejects an old or foreign key before attempting local persistence', async () => {
  let writes = 0;
  const persist = async () => { writes += 1; };
  await assert.rejects(acknowledgeDisplayedRecovery(candidate.username, await digest('rotated'), candidate.code, digest, persist), { code: 'account/profile-invalid' });
  await assert.rejects(acknowledgeDisplayedRecovery('another_owner', hash, candidate.code, digest, persist), { code: 'account/profile-invalid' });
  assert.equal(writes, 0);
  assert.deepEqual(await acknowledgeDisplayedRecovery(candidate.username, hash, candidate.code, digest, persist), { stored: true });
  assert.equal(writes, 1);
});
