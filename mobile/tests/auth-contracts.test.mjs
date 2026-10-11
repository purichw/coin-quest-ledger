import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { authMessage, isBlocked, isReusable, normalizeUsername, readAccount, recoveryHashInput, validateSignup, validateRecovery } from '../src/auth/contracts.ts';

const web = { window: {}, crypto: webcrypto, TextEncoder };
vm.runInNewContext(readFileSync(new URL('../../shared/profile-auth.js', import.meta.url), 'utf8'), web);
vm.runInNewContext(readFileSync(new URL('../../shared/profile-recovery.js', import.meta.url), 'utf8'), web);
const good = { username: 'hero_1', name: 'นักผจญภัย', password: 'example-pass', confirmation: 'example-pass' };

test('recovery validates identifier, key and matching password before calling the backend', () => {
  assert.equal(validateRecovery('hero_1', 'ABCD-EFGH-2345', 'example-pass', 'example-pass'), '');
  assert.notEqual(validateRecovery('hero ไทย', 'ABCD-EFGH-2345', 'example-pass', 'example-pass'), '');
  assert.notEqual(validateRecovery('hero', 'wrong', 'example-pass', 'example-pass'), '');
  assert.notEqual(validateRecovery('hero', 'ABCD-EFGH-2345', 'short', 'short'), '');
  assert.notEqual(validateRecovery('hero', 'ABCD-EFGH-2345', 'example-pass', 'different'), '');
});

test('existing web usernames resolve to the same native identity', () => {
  for (const input of [' Hero_1 ', 'HERO.Name-2', 'A@ B!', 'ไทยHero', 'a'.repeat(40)]) {
    assert.equal(normalizeUsername(input), web.window.PointyAuthCore.normalizeUsername(input));
  }
});

test('native signup recovery hash can be verified by the existing web/backend contract', async () => {
  const input = recoveryHashInput(' Hero_1 ', 'abcd - efgh - 2345');
  const nativeHash = createHash('sha256').update(input).digest('hex');
  assert.equal(nativeHash, await web.window.PointyRecovery.hash(' Hero_1 ', 'abcd - efgh - 2345'));
});

test('signup rejects username changes that normalization would silently discard', () => {
  assert.equal(validateSignup(good), '');
  assert.notEqual(validateSignup({ ...good, username: 'hero ไทย' }), '');
  assert.notEqual(validateSignup({ ...good, username: 'h'.repeat(33) }), '');
  assert.equal(validateSignup({ ...good, username: ' HERO_1 ' }), '');
});

test('signup rejects missing name, short passwords and mismatched confirmation', () => {
  assert.notEqual(validateSignup({ ...good, name: ' ' }), '');
  assert.notEqual(validateSignup({ ...good, password: '12345', confirmation: '12345' }), '');
  assert.notEqual(validateSignup({ ...good, confirmation: 'different' }), '');
});

test('both current and legacy lifecycle blocks deny account access', () => {
  for (const status of ['archived', 'deactivated', 'delete_requested', 'deleted']) {
    assert.equal(isBlocked({ status }), true);
    assert.equal(isBlocked({ status: 'active', lifecycleStatus: status }), true);
  }
});

test('reclaim requires all deployed tombstone conditions', () => {
  assert.equal(isReusable({ deleteReusable: true, lifecycleStatus: 'deleted', userId: '1234' }), true);
  assert.equal(isReusable({ deleteReusable: true, status: 'deleted', userId: '1234' }), false);
  assert.equal(isReusable({ deleteReusable: false, lifecycleStatus: 'deleted', userId: '1234' }), false);
  assert.equal(isReusable({ deleteReusable: true, lifecycleStatus: 'deleted', userId: 'oops' }), false);
});

test('profile reads preserve User ID and fail closed instead of inventing an identity', () => {
  const data = { uid: 'uid-a', username: 'hero_1', name: 'Hero', userId: '1234' };
  assert.equal(readAccount('uid-a', data).userId, '1234');
  assert.throws(() => readAccount('uid-b', data), { code: 'account/profile-invalid' });
  assert.throws(() => readAccount('uid-a', { ...data, userId: '' }), { code: 'account/profile-invalid' });
  assert.throws(() => readAccount('uid-a', { ...data, status: 'deleted' }), { code: 'account/blocked' });
});

test('credential failures stay generic; unknown Firebase errors do not leak internals', () => {
  assert.equal(authMessage({ code: 'auth/user-not-found' }), authMessage({ code: 'auth/wrong-password' }));
  assert.equal(authMessage({ code: 'auth/invalid-credential' }), authMessage({ code: 'auth/wrong-password' }));
  assert.ok(!authMessage(new Error('secret')).includes('secret'));
});
