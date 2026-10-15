// Статична перевірка збірки: ALL_IN_ONE.gs свіжий, без дублів і без викликів невизначених функцій (так Google впав би лише під час роботи).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const dir = path.join(__dirname, '..', 'apps-script');

test('ALL_IN_ONE.gs відповідає окремим файлам, синтаксично коректний, без дублів і без невизначених викликів', () => {
  const before = fs.readFileSync(path.join(dir, 'ALL_IN_ONE.gs'), 'utf8');
  cp.execSync('node build.js', { cwd: path.join(__dirname, '..') });
  const after = fs.readFileSync(path.join(dir, 'ALL_IN_ONE.gs'), 'utf8');
  assert.equal(before, after, 'ALL_IN_ONE.gs застарілий: запустіть node build.js');
  new vm.Script(after);
  const names = [...after.matchAll(/^function (\w+)/gm)].map(m => m[1]);
  assert.deepEqual(names.filter((n, i) => names.indexOf(n) !== i), [], 'дублікати функцій');
  const defs = new Set(names);
  const calls = new Set([...after.matchAll(/\b(bot_\w+)\(/g)].map(m => m[1]));
  assert.deepEqual([...calls].filter(c => !defs.has(c)), [], 'виклики невизначених функцій');
  // кожен пункт меню посилається на існуючу функцію
  const menu = [...after.matchAll(/\.addItem\('[^']+',\s*'(\w+)'\)/g)].map(m => m[1]);
  assert.deepEqual(menu.filter(f => !defs.has(f)), [], 'пункти меню без функції');
});
