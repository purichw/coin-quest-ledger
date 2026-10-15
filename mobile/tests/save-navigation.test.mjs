import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function navigationHook(busy = false) {
  let focusEffect, cleanup;
  const dependencies = {
    react: { useRef: value => ({ current: value }), useCallback: callback => callback },
    'expo-router': { useFocusEffect: effect => { focusEffect = effect; } },
  };
  const source = readFileSync(new URL('../src/player/useSaveNavigation.ts', import.meta.url), 'utf8');
  const script = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  new Function('require', 'exports', script)(name => {
    assert.ok(name in dependencies, `Unexpected hook dependency ${name}`);
    return dependencies[name];
  }, exports);
  return { ...exports.useSaveNavigation(busy), focus: () => { cleanup = focusEffect(); }, blur: () => cleanup?.() };
}

test('a successful save returns from its still-focused form', async () => {
  const navigation = navigationHook(true), stack = ['board', 'expense'];
  navigation.focus();
  await Promise.resolve();
  navigation.finish(() => stack.pop());
  assert.deepEqual(stack, ['board']);
  assert.deepEqual(navigation.options, { gestureEnabled: false, headerBackVisible: false });
  assert.deepEqual(navigationHook(false).options, { gestureEnabled: true, headerBackVisible: true });
});

test('a delayed save cannot pop a different screen after its form is left', async () => {
  const navigation = navigationHook(true), stack = ['board', 'expense'];
  navigation.focus();
  let completeWrite;
  const write = new Promise(resolve => { completeWrite = resolve; });
  const saving = (async () => { await write; navigation.finish(() => stack.pop()); })();
  navigation.blur();
  stack.pop();
  stack.push('another-expense');
  completeWrite();
  await saving;
  assert.deepEqual(stack, ['board', 'another-expense']);
});

test('an old unmounted form cannot replace a newly focused form', () => {
  const previous = navigationHook(true), current = navigationHook();
  previous.focus(); previous.blur(); current.focus();
  let destination = 'current';
  previous.finish(() => { destination = 'old-saved-record'; });
  assert.equal(destination, 'current');
  current.finish(() => { destination = 'current-saved-record'; });
  assert.equal(destination, 'current-saved-record');
});
