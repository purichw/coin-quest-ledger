import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'shared/firebase-client.js'), 'utf8');

function loadClient() {
  const context = {
    window: {},
    firebase: {
      apps: [{}],
      initializeApp() {},
      auth() { return {}; },
      firestore() {
        return {
          FieldValue: {
            serverTimestamp() { return 'server-now'; }
          }
        };
      }
    }
  };
  context.window.firebase = context.firebase;
  vm.runInNewContext(source, context, { filename: 'shared/firebase-client.js' });
  return context.window.PointyFirebase;
}

test('PointyFirebase freshGet requests a server-source Firestore read', async () => {
  const client = loadClient();
  const calls = [];
  const snap = { exists: true };
  const ref = {
    get(options) {
      calls.push(options);
      return Promise.resolve(snap);
    }
  };

  assert.equal(await client.freshGet(ref), snap);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].source, 'server');
});

test('PointyFirebase freshGet does not retry with default cached reads on failure', async () => {
  const client = loadClient();
  const calls = [];
  const ref = {
    get(options) {
      calls.push(options);
      return Promise.reject(new Error('server unavailable'));
    }
  };

  await assert.rejects(() => client.freshGet(ref), /server unavailable/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].source, 'server');
});
