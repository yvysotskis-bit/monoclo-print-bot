const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBot, readSheet, OLD } = require('./helpers');
const B = loadBot();
const D = (y, m, d, h) => new Date(B.bot_makeDate(y, m, d).getTime() + (h || 0) * 3600000);
const NOW = new Date('2026-10-07T06:00:00Z');   // 07.10.2026 09:00 Київ (середа)

const mk = (o) => Object.assign({ no: 1, print: 'Принт X', type: 'Футболка', color: 'Чорний', size: 'S', ttn: '', stage: 'Не передана', status: 'В роботі', cost: 420, paid: 'Не оплачено' }, o);

test('Ранковий звіт: приклад з ТЗ — порядок, ❗️, групування по ТТН, <code>', () => {
  const orders = [
    mk({ no: 1479, print: 'Принт crown neymar', ttn: '20451550732615', ttnDate: D(2026, 10, 6), size: 'M' }),
    mk({ no: 1466, print: 'Принт Mariupol', color: 'Білий', ttn: '20451549653731', ttnDate: D(2026, 10, 2), size: 'S' }),
    mk({ no: 1462, print: 'Принт BMW-F30-PITON', ttn: '20451548987230', ttnDate: D(2026, 10, 1), size: 'S' }),
    mk({ no: 1465, print: 'Принт — Dnipro', ttn: '20451549653731', ttnDate: D(2026, 10, 2), size: 'L' }),
    mk({ no: 1, ttn: '20451500000000', stage: 'В дорозі' }),              // не потрапляє
    mk({ no: 2, ttn: '', stage: 'Немає ТТН' }),                           // не потрапляє
    mk({ no: 3, ttn: '20451500000001', status: 'Скасовано', cost: 0 })    // не потрапляє
  ];
  const msgs = B.bot_buildMorningReport(orders, NOW, { warnDays: 3 });
  assert.equal(msgs.length, 1);
  const t = msgs[0];
  assert.match(t, /Не передані до відправки 3\+ дні — 2 ТТН<\/b> · середа, 07\.10/);
  assert.ok(t.indexOf('20451548987230') < t.indexOf('20451549653731'));
  assert.ok(!t.includes('20451550732615'), 'ТТН віком 1 день (менше 3) у звіт не потрапляє');
  assert.match(t, /1\. <code>20451548987230<\/code> · створена 01\.10 · ❗️6 дн\./);
  assert.match(t, /2\. <code>20451549653731<\/code> · створена 02\.10 · ❗️5 дн\./);
  assert.ok(t.includes('№1465 — Принт — Dnipro · Футболка чорна · L') && t.includes('№1466 — Принт Mariupol · Футболка біла · S'));
  assert.ok(t.indexOf('№1465') < t.indexOf('№1466'));
});

test('Ранковий звіт: порожньо → «Немає ТТН, не переданих 3+ дні», довгий — кілька повідомлень без розриву пункту', () => {
  assert.deepEqual(Array.from(B.bot_buildMorningReport([], NOW)), ['✅ Немає ТТН, не переданих 3+ дні']);
  const many = Array.from({ length: 120 }, (_, i) => mk({ no: i + 1, ttn: String(20451500000000 + i), ttnDate: D(2026, 10, 1) }));
  const msgs = B.bot_buildMorningReport(many, NOW);
  assert.ok(msgs.length > 1);
  msgs.forEach(m => { assert.ok(m.length <= 4096); assert.equal((m.match(/<code>/g) || []).length, (m.match(/<\/code>/g) || []).length); });
  assert.equal(msgs.join('\n').match(/<code>/g).length, 120);
});

test('Ранковий звіт: без дати створення — за датою замовлення, потім за №; HTML екранується', () => {
  const orders = [mk({ no: 20, ttn: '1', date: D(2026, 10, 2), print: 'A<B' }), mk({ no: 10, ttn: '2', date: D(2026, 10, 3) }), mk({ no: 5, ttn: '3' })];
  const t = B.bot_buildMorningReport(orders, NOW)[0];
  assert.ok(t.indexOf('<code>1</code>') < t.indexOf('<code>2</code>') && t.indexOf('<code>2</code>') < t.indexOf('<code>3</code>'));
  assert.ok(t.includes('A&lt;B'));
});

test('Посилки на відділенні: ≥4 дні, сортування, ім’я/телефон з НП, порожньо → []', () => {
  const orders = [
    mk({ no: 1460, print: 'Принт AUDI A6 C7', type: 'Худі фліс', size: 'S', ttn: '20451548992026', stage: 'На відділенні' }),
    mk({ no: 1, ttn: '20451500000002', stage: 'На відділенні' }),
    mk({ no: 2, ttn: '20451500000003', stage: 'На відділенні', arrived: D(2026, 10, 6) })];
  const info = { '20451548992026': { arrived: D(2026, 10, 1), payedKeepingFrom: D(2026, 10, 8), name: 'Олена К.', phone: '+380671234567' },
    '20451500000002': { arrived: D(2026, 10, 3) } };
  const t = B.bot_buildStorageReport(orders, info, NOW, { warnDays: 4 })[0];
  assert.match(t, /Чекають на відділенні 4\+ дні — 2 посилки/);
  assert.ok(t.indexOf('20451548992026') < t.indexOf('20451500000002'));
  assert.ok(t.includes('на відділенні 6 дн.') && t.includes('платне зберігання з 08.10') && t.includes('Худі чорне з флісом') && t.includes('Олена К. · +380671234567'));
  assert.ok(!t.includes('20451500000003'));
  assert.deepEqual(Array.from(B.bot_buildStorageReport([], {}, NOW)), []);
});

test('Швидкість (7.7): замовлення 06.10, передача 08.10 → 2 дні, кошик «2 дні»', () => {
  const orders = [mk({ no: 1, ttn: 'A', date: D(2026, 10, 6), handoff: D(2026, 10, 8, 10) }),
    mk({ no: 2, ttn: 'B', date: D(2026, 10, 7), handoff: D(2026, 10, 8, 9) }),
    mk({ no: 3, ttn: 'B', date: D(2026, 10, 5), handoff: D(2026, 10, 8, 9) }),
    mk({ no: 4, ttn: 'C', date: D(2026, 10, 8), handoff: D(2026, 10, 8, 12) }),
    mk({ no: 5, ttn: 'D', date: null, handoff: D(2026, 10, 8) }),             // імпорт — не враховується
    mk({ no: 6, ttn: 'E', date: D(2026, 10, 1), handoff: D(2026, 10, 8), status: 'Скасовано' })];
  const s = B.bot_computeSpeed(orders, D(2026, 10, 1), D(2026, 11, 1));
  assert.deepEqual(Array.from(s.terms).sort(), [0, 2, 3]);
  assert.equal(s.count, 3); assert.equal(s.avg, 1.7); assert.equal(s.median, 2);
  assert.equal(s.pct1, 33); assert.equal(s.pct2, 33); assert.equal(s.pct3, 33);
  assert.equal(s.longest.days, 3); assert.equal(s.longest.no, 3);
  const one = B.bot_computeSpeed([orders[0]], null, null);
  assert.equal(one.avg, 2); assert.equal(one.pct2, 100);
});

function oldOrders() {
  const v = readSheet(OLD, 'Замовлення'); const h = v[0]; const ix = n => h.indexOf(n);
  return v.slice(2).filter(r => r.some(c => c !== '')).map(r => Object.assign(B.bot_mapOldOrderRow({
    no: r[ix('№ з чату')], print: r[ix('Назва принта / позиції')], color: r[ix('Колір')], size: r[ix('Розмір')],
    placement: r[ix('Розміщення принту')], ttn: r[ix('ТТН (Штрих-код)')], cost: r[ix('Собівартість (грн)')],
    npStatus: r[ix('Статус доставки')], paid: r[ix('Оплата')] }).row, {}));
}

test('Місячний звіт: оплати за вересень 2026 = 178 380 грн (оплати №17–24)', () => {
  const pays = readSheet(OLD, 'Оплати').slice(1).filter(r => typeof r[2] === 'number').map(r => ({ no: r[0], date: r[1], sum: r[2] }));
  const m = B.bot_monthMetrics([], pays, 2026, 9);
  assert.equal(m.paid, 178380);
  assert.deepEqual(pays.filter(p => B.bot_kyivParts(p.date).m === 9).map(p => p.no), [17, 18, 19, 20, 21, 22, 23, 24]);
});

test('Місячний звіт: рядки, відмови, борг на кінець, порівняння ▲/▼, топ принтів', () => {
  const orders = [
    mk({ no: 1, print: 'Принт Ferar1', ttn: 'A', ttnDate: D(2026, 9, 3), stage: 'Отримано', cost: 420 }),
    mk({ no: 2, print: 'Принт ferar1', type: 'Худі фліс', ttn: 'B', ttnDate: D(2026, 9, 10), stage: 'Відмова', cost: 740 }),
    mk({ no: 3, print: 'Принт нижче ДВА', ttn: 'C', date: D(2026, 9, 20), stage: 'Отримано', cost: 420 }),   // без ttnDate → за датою замовлення
    mk({ no: 4, print: 'Принт нижче (bmw-f30)', ttn: 'D', ttnDate: D(2026, 9, 30), stage: 'Отримано' }),
    mk({ no: 5, ttn: 'E', ttnDate: D(2026, 10, 2), stage: 'Отримано' }),                                     // жовтень
    mk({ no: 6, ttn: 'F', ttnDate: D(2026, 9, 5), status: 'Скасовано', cost: 0 }),
    mk({ no: 7, ttn: 'G', ttnDate: D(2026, 8, 5), stage: 'Отримано', cost: 420 })];
  const pays = [{ date: D(2026, 8, 20), sum: 100 }, { date: D(2026, 9, 15), sum: 500 }, { date: D(2026, 10, 3), sum: 999 }];
  const sep = B.bot_monthMetrics(orders, pays, 2026, 9);
  assert.equal(sep.items, 4); assert.equal(sep.byType['Футболка'], 3); assert.equal(sep.byType['Худі фліс'], 1);
  assert.equal(sep.cost, 420 + 740 + 420 + 420);
  assert.equal(sep.paid, 500);
  assert.equal(sep.debtEnd, (420 * 4 + 740) - 600);   // рядки 1,2,3,4,7 (+6 = 0) до кінця вересня − оплати до 30.09
  assert.equal(sep.refusals, 1); assert.equal(sep.refusalsSum, 740); assert.equal(sep.refusalPct, 25);
  assert.deepEqual(Array.from(sep.top, t => t.name + ':' + t.count), ['ferar1:2', 'bmw-f30:1']);
  const aug = B.bot_monthMetrics(orders, pays, 2026, 8);
  const text = B.bot_buildMonthReport(sep, aug);
  assert.ok(text.includes('вересень 2026') && text.includes('▲ +300%') && text.includes('Борг на кінець місяця'));
  assert.ok(text.includes('Топ-10 принтів') && text.includes('1. ferar1 — 2'));
  const row = B.bot_monthlyRow(sep);
  assert.equal(row.length, B.BOT_MONTHLY_COLS.length);
  assert.equal(row[0], '2026-09');
});

test('Топ принтів на старих даних: загальні «нижче» не рахуються', () => {
  const top = B.bot_topPrints(oldOrders(), 10);
  assert.ok(top.length > 0);
  assert.ok(top.every(t => !/^нижче/.test(t.name) && !/^принт/.test(t.name)), JSON.stringify(top));
  assert.equal(B.bot_printDesign('Принт нижче'), '');
  assert.equal(B.bot_printDesign('Принт нижче ❗️ДВА ПРИНТА'), '');
  assert.equal(B.bot_printDesign('Принти Ferar1'), 'ferar1');
});

test('Ранковий звіт: лише ТТН, не передані 3 дні і більше (поріг з налаштувань)', () => {
  const orders = [
    mk({ no: 1, ttn: 'A1', ttnDate: D(2026, 10, 4) }),      // 3 дні — входить
    mk({ no: 2, ttn: 'B2', ttnDate: D(2026, 10, 5) }),      // 2 дні — ні
    mk({ no: 3, ttn: 'C3', ttnDate: D(2026, 10, 7) }),      // сьогодні — ні
    mk({ no: 4, ttn: 'D4', ttnDate: D(2026, 9, 20) })];     // 17 днів — входить, першою
  const t = B.bot_buildMorningReport(orders, NOW, { warnDays: 3 })[0];
  assert.match(t, /3\+ дні — 2 ТТН/);
  assert.ok(t.includes('A1') && t.includes('D4') && !t.includes('B2') && !t.includes('C3'));
  assert.ok(t.indexOf('D4') < t.indexOf('A1'));
  const t5 = B.bot_buildMorningReport(orders, NOW, { warnDays: 5 })[0];
  assert.match(t5, /5\+ днів — 1 ТТН/); assert.ok(t5.includes('D4') && !t5.includes('A1'));
  assert.deepEqual(Array.from(B.bot_buildMorningReport(orders.slice(1, 3), NOW, { warnDays: 3 })), ['✅ Немає ТТН, не переданих 3+ дні']);
});
