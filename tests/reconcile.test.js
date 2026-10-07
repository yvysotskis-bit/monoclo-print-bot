const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBot, readSheet, OLD } = require('./helpers');
const B = loadBot();
const plain = x => JSON.parse(JSON.stringify(x));

const TODAY = new Date('2026-10-07T10:00:00Z');
const PRICES = [
  { type: 'Футболка', price: 420, from: B.bot_makeDate(2026, 1, 1) },
  { type: 'Худі фліс', price: 740, from: B.bot_makeDate(2026, 1, 1) },
  { type: 'Худі не утеплене', price: 740, from: B.bot_makeDate(2026, 1, 1) }];

function importedOrders() {
  const v = readSheet(OLD, 'Замовлення'); const h = v[0]; const ix = n => h.indexOf(n);
  const rows = v.slice(2).map((r, i) => ({ r, line: i + 3 })).filter(x => x.r.some(c => c !== '')).map(({ r, line }) => {
    const m = B.bot_mapOldOrderRow({
      no: r[ix('№ з чату')], print: r[ix('Назва принта / позиції')], color: r[ix('Колір')], size: r[ix('Розмір')],
      placement: r[ix('Розміщення принту')], ttn: r[ix('ТТН (Штрих-код)')], cost: r[ix('Собівартість (грн)')],
      npStatus: r[ix('Статус доставки')], paid: r[ix('Оплата')]
    }).row;
    m._row = line; return m;
  });
  B.bot_importPropagatePaid(rows);
  return rows;
}
const fileRows = () => B.bot_parseProductionFile(readSheet('46000.xlsx')).rows;
const compute = (f, o) => plain(B.bot_reconcileCompute(f, o, { priceRows: PRICES, today: TODAY }));
const unpay = (orders, f) => { const set = new Set(f.map(x => x.ttn)); orders.forEach(o => { if (set.has(o.ttn)) { o.paid = 'Не оплачено'; o.recon = ''; } }); };

test('46000.xlsx на поточній (імпортованій) таблиці: 74 × 🔁, до оплати 0 грн, кнопки оплати немає', () => {
  const d = compute(fileRows(), importedOrders());
  const S = B.bot_reconSummary(d);
  assert.equal(d.length, 74);
  assert.equal(S.cats.PAID.length, 74);
  assert.equal(S.pay.sum, 0);
  assert.equal(S.fileTotal, 46000);
  assert.equal(d.filter(x => x.category === 'MISMATCH').length, 0);
  assert.ok(!JSON.stringify(B.bot_reconKeyboard({ id: 'З-2026-10-07-1' }, d)).includes('pay|'));
  assert.ok(B.bot_buildDiffMessage({ id: 'З-1', fileName: '46000.xlsx' }, d).includes('Вже оплачено раніше (74)'));
});

test('46000.xlsx на копії, де ТТН не оплачені: 74 ✅, 46 000 грн, відмов 4, 92 рядки', () => {
  const orders = importedOrders(); const f = fileRows(); unpay(orders, f);
  const d = compute(f, orders);
  const S = B.bot_reconSummary(d);
  assert.equal(S.cats.OK.length, 74);
  assert.equal(S.pay.sum, 46000);
  assert.equal(S.refusals.count, 4);
  assert.equal(S.pay.rows, 92);
  assert.equal(B.bot_planPayment(d).rows.length, 92);
  assert.equal(B.bot_buildDiffMessage({ id: 'З-1', fileName: '46000.xlsx' }, d), null);
  assert.ok(B.bot_buildReconSummary({ id: 'З-1', fileName: '46000.xlsx' }, d).includes('✅ Розбіжностей немає'));
  assert.ok(JSON.stringify(B.bot_reconKeyboard({ id: 'З-1' }, d)).includes('pay|З-1'));
});

test('Приймання 5.4: 420→740 + вигадана ТТН на 420 → +320 (худі замість футболки), +420, разом +740', () => {
  const orders = importedOrders(); const f = fileRows(); unpay(orders, f);
  const one = f.findIndex(x => x.price === 420 && orders.filter(o => o.ttn === x.ttn).length === 1);
  f[one] = Object.assign({}, f[one], { price: 740 });
  f.push({ ttn: '20451545999999', price: 420, status: 'Получено', refusal: false });
  const d = compute(f, orders);
  const S = B.bot_reconSummary(d);
  assert.equal(S.cats.MISMATCH.length, 1);
  assert.equal(S.cats.MISSING.length, 1);
  assert.equal(S.cats.MISMATCH[0].diff, 320);
  assert.match(S.cats.MISMATCH[0].hint, /худі замість футболки \(740 − 420\)/);
  assert.equal(S.cats.MISSING[0].diff, 420);
  assert.equal(S.diffTotal, 740);
  assert.equal(S.pay.count, 73);                      // 74 − 1 спірна; вигадана не платиться
  const msg = B.bot_buildDiffMessage({ id: 'З-1', fileName: '46000.xlsx' }, d);
  assert.ok(msg.includes('+320 грн') && msg.includes('+420 грн') && msg.includes('Разом різниця: +740 грн'));
  assert.ok(msg.includes('на 740 грн більше'));
  // рішення по спірній ТТН перераховує «До оплати»
  const base = S.pay.sum; const mm = d.find(x => x.category === 'MISMATCH');
  mm.decision = 'table'; assert.equal(B.bot_reconSummary(d).pay.sum, base + mm.tableSum);
  mm.decision = 'file'; assert.equal(B.bot_reconSummary(d).pay.sum, base + 740);
  mm.decision = 'defer'; assert.equal(B.bot_reconSummary(d).pay.sum, base);
  // 🔁 і ❌ додати не можна
  d.filter(x => x.category === 'MISSING').forEach(x => { x.decision = 'file'; });
  assert.equal(B.bot_reconSummary(d).pay.count, 73);
});

test('Підказки: зайвий виріб, нестача, нова ціна', () => {
  const items = [{ type: 'Футболка', cost: 420 }];
  assert.match(B.bot_diffHint(420, items, PRICES, TODAY), /зайвий виріб/);
  assert.match(B.bot_diffHint(-420, [{ type: 'Футболка', cost: 420 }, { type: 'Футболка', cost: 420 }], PRICES, TODAY), /не вистачає/);
  const withNew = PRICES.concat([{ type: 'Футболка', price: 450, from: B.bot_makeDate(2026, 10, 1) }]);
  assert.match(B.bot_diffHint(30, items, withNew, TODAY), /нова ціна з 01\.10\.2026/);
  assert.equal(B.bot_diffHint(5, items, PRICES, TODAY), '');
});

test('Категорії: дубль у файлі, частково оплачено, спірна, підказка за № з чату', () => {
  const orders = [
    { _row: 2, no: 1, print: 'A', type: 'Футболка', ttn: '11111111111111', cost: 420, status: 'В роботі', paid: 'Оплачено', recon: 'З-1', paidDate: '' },
    { _row: 3, no: 2, print: 'B', type: 'Футболка', ttn: '11111111111111', cost: 420, status: 'В роботі', paid: 'Не оплачено' },
    { _row: 4, no: 3, print: 'C', type: 'Футболка', ttn: '22222222222222', cost: 420, status: 'В роботі', paid: 'Спірна', note: 'Спірна, З-2026-10-01-1' },
    { _row: 5, no: 4, print: 'D', type: 'Футболка', ttn: '33333333333333', cost: 420, status: 'В роботі', paid: 'Не оплачено' }];
  const f = [
    { ttn: '11111111111111', price: 840 }, { ttn: '22222222222222', price: 420 },
    { ttn: '22222222222222', price: 420 }, { ttn: '99999999999999', price: 420, chatNo: 4 }];
  const d = compute(f, orders);
  assert.deepEqual(d.map(x => x.category), ['PARTIAL', 'OK', 'DUP', 'MISSING']);
  assert.equal(d[1].deferred, 'З-2026-10-01-1');
  assert.match(d[3].hint, /№4 має іншу ТТН 33333333333333/);
  assert.equal(B.bot_reconSummary(d).pay.sum, 420);
  assert.ok(B.bot_buildReconSummary({ id: 'З-2', fileName: 'x.xlsx' }, d).includes('раніше відкладено у З-2026-10-01-1'));
});

test('Повторний файл: хеш або набір ТТН уже підтверджено; ID звірки', () => {
  const hist = [{ id: 'З-2026-10-07-1', status: 'Підтверджено', hash: 'abc', ttns: ['2', '1'] }, { id: 'З-2026-10-06-1', status: 'Скасовано', hash: 'zzz', ttns: ['9'] }];
  assert.equal(B.bot_findPreviousRecon(hist, 'abc', ['x']).id, 'З-2026-10-07-1');
  assert.equal(B.bot_findPreviousRecon(hist, 'new', ['1', '2']).id, 'З-2026-10-07-1');
  assert.equal(B.bot_findPreviousRecon(hist, 'zzz', ['9']), null);
  assert.equal(B.bot_nextReconId(['З-2026-10-07-1', 'З-2026-10-07-2', 'З-2026-10-06-5'], TODAY), 'З-2026-10-07-3');
  assert.equal(B.bot_nextReconId([], TODAY), 'З-2026-10-07-1');
});

test('Перевірка перед оплатою і зміна собівартості «за файлом»', () => {
  const orders = [
    { _row: 2, no: 1, ttn: '1', cost: 420, paid: 'Не оплачено', note: '' },
    { _row: 3, no: 2, ttn: '1', cost: 420, paid: 'Не оплачено', note: 'старе' }];
  const d = compute([{ ttn: '1', price: 1160 }], orders);
  assert.equal(d[0].category, 'MISMATCH');
  const plan = B.bot_planCostUpdate(orders, 1160, 'З-1');
  assert.equal(plan.row, 2); assert.equal(plan.cost, 740); assert.match(plan.note, /було 840 → стало 1 160/);
  d[0].decision = 'file';
  assert.deepEqual(plain(B.bot_recheckPayable(d, orders)), ['1'], 'таблицю ще не оновлено — зупинка');
  orders[0].cost = 740;
  assert.deepEqual(plain(B.bot_recheckPayable(d, orders)), []);
  orders[1].paid = 'Оплачено';
  assert.deepEqual(plain(B.bot_recheckPayable(d, orders)), ['1'], 'з’явилась оплата — зупинка');
});

test('Борг: 642 200 − 522 547 = 119 653', () => {
  const orders = importedOrders();
  const pays = readSheet(OLD, 'Оплати').slice(1).filter(r => typeof r[2] === 'number').map(r => ({ sum: r[2] }));
  assert.equal(pays.length, 24);
  const debt = B.bot_computeDebt(orders, pays);
  assert.equal(debt.cost, 642200); assert.equal(debt.paid, 522547); assert.equal(debt.debt, 119653);
});

test('Тексти: «Текст для виробництва», ліміт 30 проблемних, розбиття довгих повідомлень', () => {
  const orders = [{ _row: 2, no: 1301, print: 'X', type: 'Футболка', ttn: '1', cost: 420, status: 'В роботі', paid: 'Не оплачено' },
    { _row: 3, no: 1302, print: 'X', type: 'Футболка', ttn: '1', cost: 420, status: 'В роботі', paid: 'Не оплачено' }];
  const d = compute([{ ttn: '1', price: 1160 }], orders);
  const t = B.bot_buildSupplierText({ id: 'З-1', fileName: '46000.xlsx' }, d);
  assert.ok(t.includes('У файлі 46000.xlsx не сходяться:') && t.includes('у вас 1 160, у нас 840 (№1301, №1302)') && !t.includes('З-1') && !t.includes('ймовірно'));
  const many = Array.from({ length: 40 }, (_, i) => ({ ttn: String(10000000000000 + i), price: 420 }));
  assert.ok(B.bot_buildReconSummary({ id: 'З-1', fileName: 'f.xlsx' }, compute(many, [])).includes('ще 10'));
  const parts = Array.from({ length: 50 }, (_, i) => 'x'.repeat(300) + i);
  B.bot_splitMessages(parts, 4000).forEach(m => assert.ok(m.length <= 4000));
});
