import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const artifacts = path.join(root, 'mobile/.artifacts/backend-emulator');
mkdirSync(artifacts, { recursive: true });
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const child = spawn(process.execPath, [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'),
  'emulators:exec', '--project', 'demo-coin-quest', '--config', path.join(root, 'firebase.test.json'),
  '--only', 'firestore,auth', `${quote(process.execPath)} --test ${quote(path.join(root, 'tests/backend'))}/*.test.mjs`
], { cwd: artifacts, stdio: 'inherit', env: { ...process.env, CI: '1',
  FIREBASE_EMULATORS_PATH: path.join(artifacts, 'binaries'), XDG_CONFIG_HOME: path.join(artifacts, 'config') } });
child.on('exit', code => { process.exitCode = code ?? 1; });
