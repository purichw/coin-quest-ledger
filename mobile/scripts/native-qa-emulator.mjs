// Local-only native QA. Uses the real Auth SDK, Firestore Rules and native
// domain contracts; never injects a session or fixture into the app UI.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const artifacts = path.join(root, 'mobile/.artifacts/native-qa-emulator');
const projectId = 'demo-coin-quest';
const authHost = '127.0.0.1:19098';
const firestoreHost = '127.0.0.1:18088';
const fixture = { uid: 'native-qa-adventurer', username: 'nativeqa', userId: '8601', password: 'CoinQuest-QA-2026!', email: 'nativeqa@coinquest.local' };
async function main() {
const mode = process.argv[2] || 'start';
if (!['start', 'serve', 'seed', 'verify', 'web', 'public-fixture'].includes(mode)) throw new Error('Usage: node scripts/native-qa-emulator.mjs [start|seed|verify|web|public-fixture]');

// Do not accept caller-supplied remote emulator targets or real project IDs.
for (const [key, expected] of Object.entries({ FIREBASE_AUTH_EMULATOR_HOST: authHost, FIRESTORE_EMULATOR_HOST: firestoreHost, GCLOUD_PROJECT: projectId })) {
  if (process.env[key] && process.env[key] !== expected) throw new Error(`Refusing unexpected ${key}; this harness only uses its fixed local demo project.`);
  process.env[key] = expected;
}

if (mode === 'start') {
  const config = JSON.parse(readFileSync(path.join(root, 'firebase.test.json'), 'utf8'));
  assert.deepEqual(config.emulators.auth, { host: '127.0.0.1', port: 19098 });
  assert.deepEqual(config.emulators.firestore, { host: '127.0.0.1', port: 18088 });
  assert.equal(config.firestore.rules, 'firestore.rules');
  mkdirSync(artifacts, { recursive: true });
  const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
  const command = `${quote(process.execPath)} ${quote(fileURLToPath(import.meta.url))} serve`;
  const child = spawn(process.execPath, [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'),
    'emulators:exec', '--project', projectId, '--config', path.join(root, 'firebase.test.json'), '--only', 'firestore,auth', command,
  ], { cwd: artifacts, stdio: 'inherit', env: { ...process.env, CI: '1',
    FIREBASE_EMULATORS_PATH: path.join(root, 'mobile/.artifacts/backend-emulator/binaries'), XDG_CONFIG_HOME: path.join(artifacts, 'config'),
    JAVA_TOOL_OPTIONS: `${process.env.JAVA_TOOL_OPTIONS || ''} -Xms64m -Xmx512m`.trim(),
  } });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} else {
  // Verify the actual local Emulator Hub before constructing any Admin client.
  const response = await fetch('http://127.0.0.1:14408/emulators', { signal: AbortSignal.timeout(5000) });
  assert.ok(response.ok, 'Local Emulator Hub is not ready');
  const emulators = await response.json();
  assert.equal(emulators.auth?.port, 19098);
  assert.equal(emulators.firestore?.port, 18088);
  assert.ok(['127.0.0.1', 'localhost'].includes(emulators.auth?.host));
  assert.ok(['127.0.0.1', 'localhost'].includes(emulators.firestore?.host));
  if (mode === 'public-fixture') { await seedPublicCharacter(); return; }
  if (mode === 'web') {
    const server = createQaWebServer();
    server.listen(4570, '127.0.0.1', () => {
      console.log('Local web QA: http://127.0.0.1:4570/');
      console.log(`Login: ${fixture.username} / ${fixture.password}`);
      console.log('Shared demo-coin-quest emulator data; no reseed. Production APIs and Admin routes blocked.');
    });
    const close = () => { server.closeAllConnections(); server.close(); };
    process.once('SIGINT', close); process.once('SIGTERM', close);
    return;
  }
  if (mode !== 'verify') await seed();
  await verify();
  if (mode === 'serve') {
    console.log('\nLocal native QA is ready. Keep this process running.');
    console.log('Metro: EXPO_PUBLIC_NATIVE_QA_EMULATORS=1 npm run start:simulator');
    console.log(`Login: ${fixture.username} / ${fixture.password}`);
    console.log('Project: demo-coin-quest · fixture data only · recovery API disabled');
    console.log('Stop this harness before running npm run test:backend (shared emulator ports).\n');
    const keepAlive = setInterval(() => {}, 60_000);
    await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
    clearInterval(keepAlive);
  }
}
}

// This adapter exists only in the response from the explicit loopback QA server.
// Eager initialization also prevents older page-level production fallbacks from
// creating an app before the shared client is first used. Page services, Rules,
// account mapping, trip transactions and progress calculations stay unchanged.
export function qaWebFirebaseSource(source) {
  const config = /const CONFIG = \{[\s\S]*?\n  \};/g;
  assert.equal([...source.matchAll(config)].length, 1, 'Firebase source layout changed; refusing unsafe response adaptation');
  const result = source.replace(config, `const CONFIG = ${JSON.stringify({
    projectId, apiKey: 'coinquest-native-qa-emulator-only', authDomain: 'demo-coin-quest.firebaseapp.com',
  })};`);
  return `if (location.hostname !== '127.0.0.1' || location.port !== '4570') throw new Error('Local QA origin required');\n${result}\n` +
    `PointyFirebase.init();\nPointyFirebase.auth().useEmulator('http://${authHost}', { disableWarnings: true });\n` +
    `PointyFirebase.firestore().useEmulator('127.0.0.1', 18088);\nconsole.info('[Coin Quest local QA] demo-coin-quest · shared native/web emulator');\n`;
}

export const qaWebCsp = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com", "img-src 'self' data: blob: https://res.cloudinary.com",
  `connect-src 'self' http://${authHost} http://${firestoreHost}`,
  "object-src 'none'", "frame-src 'none'", "worker-src 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');

// DOM-backed diagnostics for the unchanged readiness gate. This reports the
// blocking phase in local QA; it never releases a hold or removes the overlay.
export function qaWebLoadingSource(source) {
  const replace = (before, after) => {
    assert.equal(source.split(before).length, 2, 'Readiness source changed; refusing diagnostic adaptation');
    source = source.replace(before, after);
  };
  replace('holds.add(pending); revision++;', "holds.add(pending); revision++; overlay.dataset.qaHolds = String(holds.size);");
  replace('if (holds.delete(pending)) { revision++; release(); }', 'if (holds.delete(pending)) { revision++; overlay.dataset.qaHolds = String(holds.size); release(); }');
  replace('async function prepareContent() {', "async function prepareContent() { overlay.dataset.qaReadyPhase = 'styles';");
  replace('const images = [...document.images].filter', "overlay.dataset.qaReadyPhase = 'images';\n    const images = [...document.images].filter");
  replace('const urls = new Set();', "overlay.dataset.qaReadyPhase = 'backgrounds';\n    const urls = new Set();");
  replace('if (document.fonts) await document.fonts.ready;', "overlay.dataset.qaReadyPhase = 'fonts';\n    if (document.fonts) await document.fonts.ready;");
  replace('await Promise.all([...holds]);', "overlay.dataset.qaReadyPhase = 'data'; overlay.dataset.qaHolds = String(holds.size);\n        await Promise.all([...holds]);");
  replace('await prepareContent();', "await prepareContent(); overlay.dataset.qaReadyPhase = 'paint';");
  replace('if (holds.size || version !== revision) continue;', "overlay.dataset.qaRevision = String(revision); overlay.dataset.qaPass = String(Number(overlay.dataset.qaPass || 0) + 1);\n        if (holds.size || version !== revision) continue;");
  replace("status.textContent = copy.failed;", "overlay.dataset.qaReadyError = String(_?.message || _); console.error('[Local QA readiness]', _);\n      status.textContent = copy.failed;");
  return source;
}

export function createQaWebServer() {
  const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', qaWebCsp);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const reject = (status, message) => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(message); };
    if (request.headers.host !== '127.0.0.1:4570') return reject(403, 'Local QA origin required');
    if (!['GET', 'HEAD'].includes(request.method)) return reject(405, 'Local QA serves source files only');
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4570').pathname); }
    catch { return reject(400, 'Invalid path'); }
    if (pathname.endsWith('/')) pathname += 'index.html';
    if (!['/index.html', '/lang.js'].includes(pathname) && !/^\/(shared|assets|trip|character|debt|treasury|about|privacy|terms)\//.test(pathname)) return reject(403, 'Unavailable in local QA; production APIs and Admin are disabled');
    const target = path.resolve(root, `.${pathname}`), type = mime[path.extname(target).toLowerCase()];
    if (!target.startsWith(`${root}${path.sep}`) || !type || pathname.split('/').some(segment => segment.startsWith('.'))) return reject(403, 'Unavailable in local QA');
    try {
      let content = await readFile(target);
      if (pathname === '/shared/firebase-client.js') content = qaWebFirebaseSource(content.toString());
      if (pathname === '/shared/first-load.js') content = qaWebLoadingSource(content.toString());
      if (path.extname(target) === '.html') {
        content = content.toString().replace('<title>', '<title>LOCAL QA · ').replace('</body>',
          '<aside aria-label="Local emulator QA" style="position:fixed;bottom:8px;left:8px;z-index:2147483647;pointer-events:none;background:#244b3c;color:#fff4d6;border:1px solid #cfb76f;padding:3px 6px;border-radius:4px;font:11px system-ui">LOCAL QA · demo-coin-quest</aside></body>');
      }
      response.writeHead(200, { 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) { reject(error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : 'Local QA response failed safely'); }
  });
}

async function seed() {
  const [{ initializeApp, deleteApp }, { getAuth }, { getFirestore }] = await Promise.all([
    import('firebase-admin/app'), import('firebase-admin/auth'), import('firebase-admin/firestore'),
  ]);
  const [{ readAccount }, { prepareCharacter }, { addGuest, freshBoard, syncCampaign, withoutUndefined }, { normalizeModule, validateDragon, validateOffer }] = await Promise.all([
    import('../src/auth/contracts.ts'), import('../src/character/contracts.ts'), import('../src/ledger/contracts.ts'), import('../src/modules/contracts.ts'),
  ]);
  const app = initializeApp({ projectId }, 'native-qa-seed');
  try {
    const auth = getAuth(app), db = getFirestore(app), now = Date.now();
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
    const identity = { uid: fixture.uid, username: fixture.username, userId: fixture.userId, characterId: '', name: 'นักผจญภัย QA', status: 'active', lifecycleStatus: 'active', createdAt: now, updatedAt: now };
    const account = readAccount(fixture.uid, identity);
    const hero = prepareCharacter(account, { name: 'ไอริส QA', classId: 'bard', gender: 'female' }, undefined, identity, identity, now);
    const user = { uid: fixture.uid, email: fixture.email, password: fixture.password, displayName: fixture.username, disabled: false };
    let existingUser;
    try { existingUser = await auth.getUser(fixture.uid); }
    catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
    if (existingUser) {
      assert.equal(existingUser.email, fixture.email, 'Refusing to overwrite a different local fixture identity');
      await auth.updateUser(fixture.uid, user);
    } else await auth.createUser(user);
    const linked = { ...identity, characterId: hero.character.id };
    let board = addGuest(freshBoard({ ...account, characterId: hero.character.id }, hero.character, 'ปาร์ตี้ทดสอบ · Local QA', now), 'มีรา QA', 'ranger', 'female');
    board = syncCampaign({ ...board, expenses: [{ id: 'qa-meal', desc: 'อาหารระหว่างทาง · QA', icon: '🍜', amount: 680, paidBy: hero.character.name, sharedBy: board.participants, split: { mode: 'equal' }, date }] }, now);
    const dragon = { id: 'qa-dragon', name: 'อุปกรณ์ผจญภัย · QA', type: 'card', original: 18000, balance: 12000, apr: 12, payment: 1800, payMode: 'monthly', interestMode: 'compound', dueDay: 25, log: [], createdAt: now, interestAccruedAt: now, slain: false, slainAt: null };
    validateDragon(dragon);
    const debt = normalizeModule('debt', { dragons: [dragon], strategy: 'avalanche', slayer: {}, art: {}, stats: { interest: 0 }, lastAccrued: now });
    const treasury = normalizeModule('treasury', { month: date.slice(0, 7), income: 28000, keeper: {}, categories: [{ id: 'qa-food', name: 'อาหาร', budget: 6000, glyph: '🍜' }, { id: 'qa-travel', name: 'เดินทาง', budget: 2500, glyph: '🧭' }], expenses: [{ id: 'qa-lunch', catId: 'qa-food', amount: 180, note: 'อาหารกลางวัน · QA', date }], bills: [], history: [], stats: { monthsWon: 0, logged: 1, onTime: 0 } });
    const comparison = { id: 'qa-water', name: 'น้ำดื่ม · QA', icon: '💧', baseUnit: 'ml', offers: [{ id: 'qa-store-a', merchant: 'ร้าน A · QA', price: 60, qty: 1500, unit: 'ml', perPack: 1, buy: 1, free: 0 }, { id: 'qa-store-b', merchant: 'ร้าน B · QA', price: 20, qty: 500, unit: 'ml', perPack: 1, buy: 1, free: 0 }] };
    comparison.offers.forEach(offer => validateOffer(offer, comparison));
    const batch = db.batch();
    for (const [document, value] of Object.entries({
      [`users/${fixture.uid}`]: { ...linked, email: fixture.email, provider: 'firebase', character: hero.summary },
      [`usernames/${fixture.username}`]: { ...linked, authEmail: fixture.email, deleteReusable: false },
      [`userIds/${fixture.userId}`]: { ...linked, deleteReusable: false },
      [`characters/${hero.character.id}`]: { ...hero.record, xp: 860 },
      [`trips/native-qa-party`]: { ...board, createdAt: now, updatedAt: now },
      [`playerModules/${fixture.uid}`]: { uid: fixture.uid, characterId: hero.character.id, schemaVersion: 2, debt, treasury, comparisons: normalizeModule('comparisons', [comparison]), updatedAt: now },
    })) batch.set(db.doc(document), withoutUndefined(value));
    await batch.commit();
    console.log('Seeded one local QA identity, character, board and three finance modules.');
  } finally { await deleteApp(app); }
}

async function seedPublicCharacter() {
  const [{ initializeApp, deleteApp }, { getFirestore }] = await Promise.all([import('firebase-admin/app'), import('firebase-admin/firestore')]);
  const app = initializeApp({ projectId }, 'native-qa-public-seed');
  try {
    const ref = getFirestore(app).doc('characters/8602'); const existing = await ref.get();
    if (existing.exists) {
      assert.equal(existing.data().ownerUid, 'native-qa-public-owner', 'Refusing to replace another fixture character');
      console.log('Public QA character8602 already exists; preserved unchanged.');
      return;
    }
    await ref.create({ id: '8602', userId: '8602', ownerUid: 'native-qa-public-owner', name: 'มีรา · Public QA',
      class: 'ranger', cls: 'ranger', gender: 'female', skin: '', xp: 420, debtXp: 0, trips: {}, createdAt: Date.now(), updatedAt: Date.now() });
    console.log('Added read-only public character8602 (420XP). Existing account, board and module fixtures unchanged.');
  } finally { await deleteApp(app); }
}

async function verify() {
  const [{ initializeApp, deleteApp }, { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut }, { getFirestore, connectFirestoreEmulator, doc, getDocFromServer, getDocsFromServer, collection, runTransaction, terminate }] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
  ]);
  const app = initializeApp({ projectId, apiKey: 'coinquest-native-qa-emulator-only' }, 'native-qa-verify');
  const auth = getAuth(app), db = getFirestore(app);
  connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 18088);
  try {
    const mapping = await getDocFromServer(doc(db, 'usernames', fixture.username));
    const credential = await signInWithEmailAndPassword(auth, mapping.data().authEmail, fixture.password);
    assert.equal(credential.user.uid, fixture.uid);
    const { readAccount } = await import('../src/auth/contracts.ts');
    const { readCharacter } = await import('../src/character/contracts.ts');
    const account = readAccount(fixture.uid, (await getDocFromServer(doc(db, 'users', fixture.uid))).data());
    readCharacter(account.characterId, (await getDocFromServer(doc(db, 'characters', account.characterId))).data(), account);
    assert.ok((await getDocsFromServer(collection(db, 'trips'))).docs.some(document => document.id === 'native-qa-party'));
    const ref = doc(db, 'playerModules', fixture.uid);
    await runTransaction(db, async tx => { const snapshot = await tx.get(ref); tx.set(ref, { uid: fixture.uid, characterId: account.characterId, comparisons: snapshot.data().comparisons }, { mergeFields: ['uid', 'characterId', 'comparisons'] }); });
    await assert.rejects(getDocFromServer(doc(db, 'playerModules', 'another-owner')), error => error.code === 'permission-denied');
    await signOut(auth);
    await assert.rejects(getDocFromServer(doc(db, 'users', fixture.uid)), error => error.code === 'permission-denied');
    console.log('Verified local client login, account/character, board list, owner module write, other-owner deny and signed-out deny under repository Rules.');
  } finally { await terminate(db); await deleteApp(app); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
