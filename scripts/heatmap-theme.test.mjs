import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function fixture() {
  const classes = new Set(['light']);
  const observers = [];
  const cleanups = [];
  const persisted = new Map();
  let notifications = 0;
  const root = {
    classList: {
      contains: (name) => classes.has(name),
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
    },
  };
  const exports = {};
  const source = readFileSync(
    new URL('../src/hooks/useTheme.ts', import.meta.url),
    'utf8'
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require: () => ({
      useCallback: (callback) => callback,
      useSyncExternalStore: (subscribe, getSnapshot) => {
        cleanups.push(subscribe(() => notifications++));
        return getSnapshot();
      },
    }),
    document: { documentElement: root },
    localStorage: { setItem: (key, value) => persisted.set(key, value) },
    MutationObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        observers.push(this);
      }
      observe(element, options) {
        assert.equal(element, root);
        assert.deepEqual(Array.from(options.attributeFilter), ['class']);
      }
      disconnect() {
        this.disconnected = true;
      }
    },
  });
  return {
    useTheme: exports.useTheme,
    root,
    observers,
    cleanups,
    persisted,
    notifications: () => notifications,
    mutateTheme(theme) {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      observers.forEach((observer) => {
        if (!observer.disconnected) observer.callback([]);
      });
    },
  };
}

test('preview class changes publish the theme without persisting the toolbar choice', () => {
  const view = fixture();
  assert.equal(view.useTheme().theme, 'light');
  view.mutateTheme('dark');
  assert.equal(view.notifications(), 1);
  assert.equal(view.persisted.size, 0);
  const current = view.useTheme();
  assert.equal(current.theme, 'dark');
  current.toggleTheme();
  assert.equal(view.root.classList.contains('light'), true);
  assert.equal(view.persisted.get('theme'), 'light');
});

test('theme subscription cleanup disconnects the class observer', () => {
  const view = fixture();
  view.useTheme();
  assert.equal(view.observers.length, 1);
  view.cleanups[0]();
  assert.equal(view.observers[0].disconnected, true);
  view.mutateTheme('dark');
  assert.equal(view.notifications(), 0);
});
