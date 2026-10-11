import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

test('Firestore rules do not expose trip or user records to anonymous public access', () => {
  assert.doesNotMatch(rules, /allow\s+read\s*,\s*write\s*:\s*if\s+true/);
  assert.match(rules, /match\s+\/trips\/\{tripId\}\s*\{[\s\S]*allow\s+read:\s+if\s+request\.auth\s+!=\s+null/);
  assert.match(rules, /allow create, update: if isSuperAdmin\(\) \|\| activePlayer\(\)/);
  assert.match(rules, /match\s+\/users\/\{uid\}\s*\{[\s\S]*allow\s+get:\s+if\s+isOwner\(uid\)\s+\|\|\s+isSuperAdmin\(\)/);
  assert.match(rules, /allow\s+list:\s+if\s+isSuperAdmin\(\)/);
});

test('Firestore rules prevent new public recovery secret writes', () => {
  assert.match(rules, /createsNoRawRecoverySecret/);
  assert.match(rules, /updatesNoRawRecoverySecret/);
  assert.match(rules, /createsNoPublicRecoveryHash/);
  assert.match(rules, /updatesNoPublicRecoveryHash/);
  assert.match(rules, /match\s+\/usernames\/\{username\}/);
  assert.match(rules, /match\s+\/userIds\/\{userId\}/);
});
