import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { request } from 'node:http';
import ts from 'typescript';
import { createQaWebServer, qaWebCsp, qaWebFirebaseSource } from './native-qa-emulator.mjs';

const source = readFileSync(new URL('../src/auth/firebase.ts', import.meta.url), 'utf8');
const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function runtime(dev, flag, previousApps = []) {
  const calls = [], apps = [...previousApps];
  const authFor = app => ({ app });
  const mocks = {
    '@react-native-async-storage/async-storage': { default: {} },
    'firebase/app': { getApps: () => apps, initializeApp: (options, name) => { const app = { options, name }; apps.push(app); calls.push(['initializeApp', app]); return app; } },
    'firebase/auth': { getAuth: authFor, getReactNativePersistence: () => 'native-persistence', initializeAuth: authFor, connectAuthEmulator: (...args) => calls.push(['authEmulator', ...args]) },
    'firebase/firestore': { getFirestore: app => ({ app }), connectFirestoreEmulator: (...args) => calls.push(['firestoreEmulator', ...args]) },
  };
  const run = () => {
    const exports = {};
    new Function('require', 'exports', 'process', '__DEV__', script)(name => {
      assert.ok(name in mocks, `Unexpected dependency ${name}`);
      return mocks[name];
    }, exports, { env: { EXPO_PUBLIC_NATIVE_QA_EMULATORS: flag } }, dev);
    return exports;
  };
  return { calls, apps, run };
}

test('normal release uses the existing production Firebase identity without emulator calls', () => {
  const target = runtime(false, undefined), result = target.run();
  assert.equal(result.nativeQaEmulators, false);
  assert.equal(result.auth.app.name, '[DEFAULT]');
  assert.equal(result.auth.app.options.projectId, 'pointy-personal-toolkit');
  assert.deepEqual(target.calls.map(call => call[0]), ['initializeApp']);
});

test('explicit development QA uses only demo project + loopback and isolates remembered production credentials', () => {
  const prod = { name: '[DEFAULT]', options: { projectId: 'pointy-personal-toolkit' } };
  const target = runtime(true, '1', [prod]), result = target.run();
  assert.equal(result.nativeQaEmulators, true);
  assert.equal(result.auth.app.name, 'coinquest-native-qa');
  assert.equal(result.auth.app.options.projectId, 'demo-coin-quest');
  assert.equal(result.auth.app.options.apiKey, 'coinquest-native-qa-emulator-only');
  assert.equal(target.calls.find(call => call[0] === 'authEmulator')[2], 'http://127.0.0.1:19098');
  assert.deepEqual(target.calls.find(call => call[0] === 'firestoreEmulator').slice(2), ['127.0.0.1', 18088]);
  assert.equal(target.apps[0], prod);
  target.run();
  assert.equal(target.calls.filter(call => call[0] === 'authEmulator').length, 1, 'hot reload must not reconnect an initialized Auth instance');
});

test('QA flag in release refuses startup before any Firebase connection; it never falls back to production', () => {
  const target = runtime(false, '1');
  assert.throws(target.run, /disabled in release builds/);
  assert.deepEqual(target.calls, []);
});

test('web response initializes demo Firebase and both emulators before page services run', () => {
  const source = qaWebFirebaseSource(readFileSync(new URL('../../shared/firebase-client.js', import.meta.url), 'utf8'));
  const calls = [], apps = [];
  const auth = { useEmulator: (...args) => calls.push(['auth', ...args]) };
  const db = { useEmulator: (...args) => calls.push(['firestore', ...args]) };
  const context = { firebase: { apps, initializeApp: config => { calls.push(['init', config]); apps.push(config); }, auth: () => auth, firestore: () => db }, location: { hostname: '127.0.0.1', port: '4570' }, console: { info() {} } };
  context.window = context;
  vm.runInNewContext(source, context);
  assert.equal(calls[0][1].projectId, 'demo-coin-quest');
  assert.equal(calls[0][1].apiKey, 'coinquest-native-qa-emulator-only');
  assert.deepEqual(calls.map(call => call[0]), ['init', 'auth', 'firestore']);
  assert.equal(calls[1][1], 'http://127.0.0.1:19098');
  assert.deepEqual(calls[2].slice(1), ['127.0.0.1', 18088]);
  assert.doesNotMatch(source, /pointy-personal-toolkit/);
  assert.throws(() => vm.runInNewContext(source, { ...context, location: { hostname: 'coinquestledger.vercel.app', port: '' } }), /Local QA origin required/);
  assert.throws(() => qaWebFirebaseSource('layout changed'), /refusing unsafe response adaptation/);
});

test('web server serves only local player source and blocks API, Admin, private files and remote connects', async () => {
  const server = createQaWebServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const get = (url, host = '127.0.0.1:4570', method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path: url, method, headers: { Host: host } }, response => {
      let body = ''; response.setEncoding('utf8'); response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body, headers: response.headers }));
    });
    req.on('error', reject); req.end();
  });
  try {
    const home = await get('/');
    assert.equal(home.status, 200); assert.match(home.body, /LOCAL QA · demo-coin-quest/);
    assert.equal(home.headers['cache-control'], 'no-store');
    assert.equal(home.headers['content-security-policy'], qaWebCsp);
    assert.equal(qaWebCsp.split('; ').find(rule => rule.startsWith('connect-src')), "connect-src 'self' http://127.0.0.1:19098 http://127.0.0.1:18088");
    assert.match((await get('/shared/firebase-client.js')).body, /useEmulator/);
    const resources = new Set(['/lang.js']);
    const scriptPolicy = qaWebCsp.split('; ').find(rule => rule.startsWith('script-src')).split(' ');
    for (const page of ['index.html', 'trip/index.html', 'character/index.html', 'debt/index.html', 'treasury/index.html']) {
      const html = readFileSync(new URL(`../../${page}`, import.meta.url), 'utf8');
      for (const match of html.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css))"/g)) resources.add(match[1]);
      for (const match of html.matchAll(/<script src="(https:[^"]+)"/g)) assert.ok(scriptPolicy.includes(match[1]) || scriptPolicy.includes(new URL(match[1]).origin), `CSP blocks required player script ${match[1]}`);
    }
    for (const resource of resources) assert.equal((await get(resource)).status, 200, `Missing player dependency ${resource}`);
    for (const route of ['/api/recover-account', '/admin/', '/mobile/.env', '/shared/%2e%2e/mobile/package.json']) assert.equal((await get(route)).status, 403);
    assert.equal((await get('/', 'evil.example:4570')).status, 403);
    assert.equal((await get('/', undefined, 'POST')).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
