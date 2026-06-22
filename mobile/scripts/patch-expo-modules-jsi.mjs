import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh', import.meta.url));

if (!existsSync(target)) {
  console.log('[postinstall] ExpoModulesJSI build script not found; skipping patch.');
  process.exit(0);
}

let source = readFileSync(target, 'utf8');
let next = source;

next = next.replace(
  'local env_args=(PATH="$PATH" HOME="$HOME" PODS_ROOT="$PODS_ROOT" RN_ROOT="$RN_ROOT")',
  'local env_args=(PATH="$PATH" HOME="$HOME" PODS_ROOT="$PODS_ROOT" RN_ROOT="$RN_ROOT" COPYFILE_DISABLE=1)',
);

if (!next.includes('CODE_SIGNING_ALLOWED=NO')) {
  next = next.replace(
    'SWIFT_COMPILATION_MODE=wholemodule \\\n',
    'SWIFT_COMPILATION_MODE=wholemodule \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\\n',
  );
}

if (next !== source) {
  writeFileSync(target, next);
  console.log('[postinstall] Patched ExpoModulesJSI xcframework build for local Xcode builds.');
} else {
  console.log('[postinstall] ExpoModulesJSI xcframework build patch already present.');
}
