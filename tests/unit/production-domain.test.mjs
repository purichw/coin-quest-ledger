import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const productionHost = 'coinquestledger.vercel.app';
const retiredHost = ['coin', 'quest', 'ledger'].join('-') + '.vercel.app';
const root = process.cwd();

function codeFiles(directory) {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? codeFiles(relative) : [relative];
  });
}

test('active web/native code and deployment workflow never target the retired production host', () => {
  const files = ['index.html', 'vercel.json',
    ...['admin', 'api', 'character', 'debt', 'shared', 'treasury', 'trip',
      'scripts', 'mobile/src', '.github/workflows'].flatMap(codeFiles)];
  const stale = files.filter(file => /\.(?:[cm]?js|jsx|ts|tsx|html|css|json|ya?ml)$/.test(file))
    .filter(file => readFileSync(path.join(root, file), 'utf8').includes(retiredHost));
  assert.deepEqual(stale, [], 'Retired production URL would be restored by code or CI');
});

test('deployment, smoke checks, native recovery and shared links agree on the production host', () => {
  for (const file of ['.github/workflows/test.yml', 'scripts/prod-smoke.mjs',
    'mobile/src/auth/account-service.ts', 'mobile/src/character/Profile.tsx',
    'mobile/src/app/split/board.tsx', 'mobile/src/ledger/contracts.ts']) {
    assert.ok(readFileSync(path.join(root, file), 'utf8').includes(productionHost), file);
  }
  assert.match(readFileSync(path.join(root, '.github/workflows/test.yml'), 'utf8'),
    /vercel alias set[^\n]+ coinquestledger\.vercel\.app /);
});
