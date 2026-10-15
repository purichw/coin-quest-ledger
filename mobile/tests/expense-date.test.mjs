import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { canon } from '../src/domain/canon.ts';
import { validateExpense } from '../src/ledger/contracts.ts';

const existing = { id: 'web-expense', desc: 'Web expense', icon: 'coin', amount: 200, paidBy: 'Hero', sharedBy: ['Hero', 'Guest'] };
const source = readFileSync(new URL('../src/app/split/expense.tsx', import.meta.url), 'utf8');
const script = ts.transpileModule(source + '\nexport { ExpenseForm };', { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;

// Exercise the real editor's draft and save callback with native rendering and
// Firestore replaced by deterministic boundaries; ledger validation stays real.
function editor(original) {
  const states = []; let cursor = 0, pending, saved;
  const board = { participants: ['Hero', 'Guest'], expenses: original ? [original] : [] };
  const node = (type, props) => ({ type, props });
  const components = names => Object.fromEntries(names.map(name => [name, name]));
  const dependencies = {
    react: { useCallback: fn => fn, useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = value; }];
    } },
    'react/jsx-runtime': { jsx: node, jsxs: node, Fragment: 'Fragment' },
    'expo-router': { router: { back() {} }, Stack: { Screen: 'Screen' } },
    'react-native': components(['Image', 'Text', 'View']),
    '../../auth/ui': { ...components(['Action', 'ErrorNote', 'Field']), ui: {} },
    '../../domain/canon': { canon },
    '../../ledger/contracts': { validateExpense },
    '../../ledger/service': { makeId: () => 'new-expense', changeBoard: async (_id, _account, change) => {
      const next = change(board); saved = next.expenses.at(-1); return next;
    } },
    '../../ledger/files': {},
    '../../player/DateField': { DateField: 'DateField' },
    '../../player/useSaveNavigation': { useSaveNavigation: () => ({ options: {}, finish: fn => fn() }) },
    '../../player/ui': { ...components(['Body', 'Card', 'Choice', 'LoadError', 'Loading', 'Page', 'PlayerGate']),
      p: {}, today: () => '2026-10-16', number: canon.parseNumberInput, money: String,
      useWork: () => ({ busy: false, error: '', run: fn => { pending = fn(); return pending; } }) },
  };
  const exports = {};
  new Function('require', 'exports', script)(name => {
    assert.ok(name in dependencies, `Unexpected editor dependency ${name}`); return dependencies[name];
  }, exports);
  function render() { cursor = 0; return exports.ExpenseForm({ account: { uid: 'owner' }, id: 'board', board, original }); }
  function find(tree, type, predicate = () => true) {
    if (!tree || typeof tree !== 'object') return undefined;
    if (Array.isArray(tree)) return tree.map(child => find(child, type, predicate)).find(Boolean);
    if (tree.type === type && predicate(tree.props)) return tree.props;
    return find(tree.props?.children, type, predicate);
  }
  return { render, find, save: async tree => { find(tree, 'Action', props => props.title === 'บันทึกรายการ').onPress(); await pending; return saved; } };
}

test('editing an undated web expense never silently adds today', async () => {
  const form = editor(existing), tree = form.render();
  assert.equal(form.find(tree, 'DateField').value, '');
  form.find(tree, 'Field', props => props.label === 'ชื่อรายการ').onChangeText('Updated description');
  const saved = await form.save(form.render());
  assert.equal(saved.desc, 'Updated description');
  assert.equal(Object.hasOwn(saved, 'date'), false);
  assert.equal(saved.amount, 200);
  assert.deepEqual(canon.splitShares(saved, ['Hero', 'Guest']), { Hero: 100, Guest: 100 });
});

test('an existing web timestamp is preserved until a date is explicitly chosen', async () => {
  const form = editor({ ...existing, date: '2026-10-12T09:30' });
  assert.equal((await form.save(form.render())).date, '2026-10-12T09:30');
  form.find(form.render(), 'DateField').onChange('2026-10-14');
  assert.equal((await form.save(form.render())).date, '2026-10-14');
});

test('new expenses default to today and an undated record accepts an explicit date', async () => {
  const fresh = editor();
  assert.equal(fresh.find(fresh.render(), 'DateField').value, '2026-10-16');
  const form = editor(existing);
  form.find(form.render(), 'DateField').onChange('2026-10-15');
  assert.equal((await form.save(form.render())).date, '2026-10-15');
});
