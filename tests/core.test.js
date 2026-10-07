const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBot, readSheet, OLD } = require('./helpers');
const B = loadBot();
const plain = x => JSON.parse(JSON.stringify(x));

test('ТТН: число, текст, пробіли, .0, експонента, апостроф', () => {
  assert.equal(B.bot_normTtn(20451553931463), '20451553931463');
  assert.equal(B.bot_normTtn('20451553931463'), '20451553931463');
  assert.equal(B.bot_normTtn(' 2045 1553 931463 '), '20451553931463');
  assert.equal(B.bot_normTtn('20451553931463.0'), '20451553931463');
  assert.equal(B.bot_normTtn("'20451553931463"), '20451553931463');
  assert.equal(B.bot_normTtn('2.0451553931463e13'), '20451553931463');
  assert.equal(B.bot_normTtn(''), '');
  assert.equal(B.bot_normTtn(null), '');
});

test('Розміри: кирилиця, регістр, 2XL', () => {
  assert.equal(B.bot_normSize('М'), 'M');
  assert.equal(B.bot_normSize('l'), 'L');
  assert.equal(B.bot_normSize('ХL'), 'XL');
  assert.equal(B.bot_normSize('2XL'), 'XXL');
  assert.equal(B.bot_normSize('3xl'), 'XXXL');
  assert.equal(B.bot_normSize('С'), 'S');
  assert.equal(B.bot_normSize('Худі'), '');
  assert.equal(B.bot_normSize(''), '');
});

test('Розміщення принту', () => {
  const n = B.bot_normPlacement;
  assert.equal(n('Позаду'), 'Позаду');
  assert.equal(n('Принт позаду'), 'Позаду');
  assert.equal(n('Спереду'), 'Спереду');
  assert.equal(n('Попереду'), 'Спереду');
  assert.equal(n('Спереду і позаду'), 'Спереду і позаду');
  assert.equal(n('Перед + Зад'), 'Спереду і позаду');
  assert.equal(n('Перед + Спина'), 'Спереду і позаду');
  assert.equal(n('Принти як на візуалі'), 'Як на візуалі');
  assert.equal(n('Принти як на візуалі - перед, спина, обидва рукави'), 'Як на візуалі');
  assert.equal(n('Стандартне'), '');
  assert.equal(n('—'), '');
  assert.equal(n('Без принту'), '');
});

test('Підпис з розділу 2.1 → рядок', () => {
  const p = B.bot_parseOrderCaption('1538. Принт Ferar1\nХуді чорне без флісу\nL\n\nПринт позаду\n\n20451553931463');
  assert.equal(p.ok, true);
  assert.equal(p.no, 1538);
  assert.equal(p.print, 'Принт Ferar1');
  assert.equal(p.type, 'Худі не утеплене');
  assert.equal(p.color, 'Чорний');
  assert.equal(p.size, 'L');
  assert.equal(p.placement, 'Позаду');
  assert.equal(p.ttn, '20451553931463');
  assert.equal(p.prints, 1);
  assert.deepEqual(plain(p.issues), []);
});

test('Підпис 1539 (футболка, S)', () => {
  const p = B.bot_parseOrderCaption('1539. Принт Zaporizhzhia\nФутболка чорна\nS\n\nПринт позаду\n\n20451553934449');
  assert.equal(p.type, 'Футболка'); assert.equal(p.size, 'S'); assert.equal(p.ttn, '20451553934449');
  assert.equal(p.issues.length, 0);
});

test('Не замовлення: ++++++, назва файлу, без номера — ігноруються', () => {
  ['++++++', 'FERAR1 - WHITE.png', 'Привіт, як справи', '', 'Принт 1538.', '  Manager Kuznecoff'].forEach(t =>
    assert.equal(B.bot_parseOrderCaption(t).ok, false, t));
});

test('Порядок рядків довільний, порожні рядки, дужка замість крапки', () => {
  const p = B.bot_parseOrderCaption('\n1540) Принт Test ДВА\n\n20451553934449\nПринт спереду і позаду\nM\n\nФутболка біла');
  assert.equal(p.ok, true); assert.equal(p.prints, 2);
  assert.equal(p.type, 'Футболка'); assert.equal(p.color, 'Білий'); assert.equal(p.size, 'M');
  assert.equal(p.placement, 'Спереду і позаду'); assert.equal(p.issues.length, 0);
});

test('Кириличні розміри в підписі', () => {
  assert.equal(B.bot_parseOrderCaption('10. Принт\nФутболка чорна\nМ\nПринт позаду\n20451553934449').size, 'M');
  assert.equal(B.bot_parseOrderCaption('10. Принт\nФутболка чорна\nХL\nПринт позаду\n20451553934449').size, 'XL');
});

test('Помилки: немає розміру / худі без уточнення / немає ТТН / ТТН не 14 цифр', () => {
  let p = B.bot_parseOrderCaption('1541. Принт X\nФутболка чорна\nПринт позаду\n20451553934449');
  assert.deepEqual(plain(p.issues.map(i => i.field)), ['size']);
  p = B.bot_parseOrderCaption('1542. Принт X\nХуді чорне\nL\nПринт позаду\n20451553934449');
  assert.equal(p.type, ''); assert.equal(p.typeAmbiguous, true);
  assert.deepEqual(plain(p.issues.map(i => i.field)), ['type']);
  p = B.bot_parseOrderCaption('1543. Принт X\nХуді чорне з флісом\nL\nПринт позаду');
  assert.equal(p.type, 'Худі фліс'); assert.deepEqual(plain(p.issues.map(i => i.field)), ['ttn']);
  p = B.bot_parseOrderCaption('1544. Принт X\nХуді біле без флісу\nL\n204515539344');
  assert.deepEqual(plain(p.issues.map(i => i.field)), ['ttn']); assert.match(p.issues[0].text, /14 цифр/);
});

test('Тип/колір: худі з/без флісу, утеплене', () => {
  const t = B.bot_parseTypeColor;
  assert.equal(t('Худі чорне з флісом').type, 'Худі фліс');
  assert.equal(t('Худі чорне без флісу').type, 'Худі не утеплене');
  assert.equal(t('Худі сіре не утеплене').type, 'Худі не утеплене');
  assert.equal(t('Худі сіре утеплене').type, 'Худі фліс');
  assert.equal(t('Худі графіт').ambiguous, true);
  assert.equal(t('Худі графіт').color, 'Сірий');
  assert.equal(t('Футболка біла').color, 'Білий');
});

test('Дати Києва: літній/зимовий час, формат', () => {
  const summer = new Date('2026-10-07T06:00:00Z');   // 09:00 за Києвом (EEST)
  assert.equal(B.bot_kyivParts(summer).h, 9);
  assert.equal(B.bot_fmtDate(summer), '07.10.2026');
  const winter = new Date('2026-12-01T07:00:00Z');   // 09:00 (EET)
  assert.equal(B.bot_kyivParts(winter).h, 9);
  const edge = new Date('2026-10-25T00:30:00Z');     // ще літній час (перехід о 01:00 UTC)
  assert.equal(B.bot_kyivParts(edge).h, 3);
  const d = B.bot_makeDate(2026, 10, 7);
  assert.equal(B.bot_dayKey(d), '2026-10-07');
  assert.equal(B.bot_kyivParts(d).h, 0);
  assert.equal(B.bot_daysBetween(B.bot_makeDate(2026, 10, 1), B.bot_makeDate(2026, 10, 7)), 6);
  assert.equal(B.bot_dayKey(B.bot_parseDate('15.11.2026')), '2026-11-15');
  assert.equal(B.bot_dayKey(B.bot_parseDate('01-10-2026 14:03:26')), '2026-10-01');
  assert.equal(B.bot_dayKey(B.bot_parseDate('2026-10-01 14:03:26')), '2026-10-01');
});

test('Гроші', () => {
  assert.equal(B.bot_fmtMoney(43240), '43 240 грн');
  assert.equal(B.bot_fmtMoney(642200), '642 200 грн');
  assert.equal(B.bot_fmtMoney(1160.5), '1 160,50 грн');
  assert.equal(B.bot_fmtSigned(320), '+320 грн');
  assert.equal(B.bot_fmtSigned(-420), '−420 грн');
  assert.equal(B.bot_toNumber('1 160,5'), 1160.5);
  assert.equal(B.bot_toNumber('420'), 420);
  assert.equal(B.bot_toNumber('abc'), null);
});

test('Прайс: історія цін', () => {
  const rows = [
    { type: 'Худі фліс', price: 740, from: B.bot_makeDate(2026, 1, 1) },
    { type: 'Худі фліс', price: 780, from: B.bot_makeDate(2026, 11, 15) },
    { type: 'Футболка', price: 420, from: B.bot_makeDate(2026, 1, 1) }];
  assert.equal(B.bot_priceFor(rows, 'Худі фліс', B.bot_makeDate(2026, 10, 7)), 740);
  assert.equal(B.bot_priceFor(rows, 'Худі фліс', B.bot_makeDate(2026, 11, 15)), 780);
  assert.equal(B.bot_priceFor(rows, 'Футболка', B.bot_makeDate(2026, 12, 1)), 420);
  assert.equal(B.bot_priceFor(rows, 'Кепка', B.bot_makeDate(2026, 12, 1)), null);
  const cmd = B.bot_parsePriceCommand('Худі фліс 780 15.11.2026', ['Футболка', 'Худі фліс'], new Date('2026-10-07T10:00:00Z'));
  assert.equal(cmd.type, 'Худі фліс'); assert.equal(cmd.price, 780); assert.equal(B.bot_dayKey(cmd.from), '2026-11-15');
});

test('Файл виробництва 46000.xlsx: 74 ТТН, 46 000 грн, 4 відмови', () => {
  const vals = readSheet('46000.xlsx');
  const f = B.bot_parseProductionFile(vals);
  assert.equal(f.error, undefined);
  assert.equal(f.rows.length, 74);
  assert.equal(f.rows.reduce((s, r) => s + r.price, 0), 46000);
  assert.equal(f.rows.filter(r => r.refusal).length, 4);
  assert.equal(new Set(f.rows.map(r => r.ttn)).size, 74);
  assert.ok(f.rows.every(r => /^\d{14}$/.test(r.ttn)));
});

test('Файл без колонки ТТН → чітка помилка із заголовками', () => {
  const f = B.bot_parseProductionFile([['Номер', 'Ціна'], ['1', 420]]);
  assert.match(f.error, /Не знайшов колонку ТТН/);
  assert.match(f.error, /Номер \| Ціна/);
});

test('Файл: заголовки за назвою, будь-який порядок колонок, число замість тексту', () => {
  const f = B.bot_parseProductionFile([['Сума', 'Накладна', 'Статус'], [420, 20451545005600, 'Получено'], ['', '', ''], ['1 160,00', '2045 1544 9996 95', 'Отказ получателя']]);
  assert.equal(f.rows.length, 2);
  assert.equal(f.rows[0].ttn, '20451545005600');
  assert.equal(f.rows[1].price, 1160); assert.equal(f.rows[1].refusal, true);
});

// ---------- Імпорт старої таблиці (контрольні цифри з CLAUDE.md) ----------
function oldRows() {
  const v = readSheet(OLD, 'Замовлення');
  const h = v[0];
  const ix = n => h.indexOf(n);
  return v.slice(2).filter(r => r.some(c => c !== '')).map(r => ({
    no: r[ix('№ з чату')], print: r[ix('Назва принта / позиції')], color: r[ix('Колір')], size: r[ix('Розмір')],
    placement: r[ix('Розміщення принту')], ttn: r[ix('ТТН (Штрих-код)')], cost: r[ix('Собівартість (грн)')],
    npStatus: r[ix('Статус доставки')], paid: r[ix('Оплата')]
  }));
}

test('Імпорт: 1470 рядків, 642 200 грн, правила типів / розмірів / ДВА', () => {
  const old = oldRows();
  assert.equal(old.length, 1470);
  const mapped = old.map(B.bot_mapOldOrderRow);
  const rows = mapped.map(m => m.row);
  assert.equal(rows.reduce((s, r) => s + r.cost, 0), 642200);
  // «Колір» без типу → Футболка: 1329
  const bareColor = old.filter(o => ['Чорна', 'Біла', 'Сіра'].includes(String(o.color).trim())).length;
  assert.equal(bareColor, 1329);
  assert.equal(old.filter((o, i) => ['Чорна', 'Біла', 'Сіра'].includes(String(o.color).trim()) && rows[i].type === 'Футболка').length, 1329);
  assert.equal(rows.filter(r => r.type === 'Худі не утеплене').length, 67);
  assert.equal(rows.filter(r => r.type === 'Худі фліс').length, 21);
  assert.equal(old.filter(o => o.color === 'Футболка чорна' || o.color === 'Футболка біла' || o.color === 'Футболка сіра').length, 51);
  // кириличне «М»: 190
  assert.equal(old.filter(o => o.size === 'М').length, 190);
  assert.equal(rows.filter(r => r.size === 'M').length, 190 + 243);
  // «ДВА» → 2 принти: 150
  assert.equal(rows.filter(r => r.prints === 2).length, 150);
  // собівартість 0 → статус за назвою
  const zero = rows.filter(r => r.cost === 0);
  assert.equal(zero.length, 8);       // 7 нулів + 1 порожня собівартість
  assert.ok(zero.some(r => r.status === 'Переробка'));
  assert.ok(zero.some(r => r.status === 'Брак'));
  assert.ok(zero.some(r => r.status === 'Скасовано'));
  // розміщення: тільки допустимі значення або порожньо
  assert.ok(rows.every(r => r.placement === '' || ['Позаду', 'Спереду', 'Спереду і позаду', 'Як на візуалі'].includes(r.placement)));
  // ТТН: усі 14 цифр або порожні
  assert.ok(rows.every(r => r.ttn === '' || /^\d{14}$/.test(r.ttn)), 'ТТН');
  // етапи розпізнані для всіх статусів старої таблиці
  const unknownStages = mapped.filter(m => m.unrecognized.some(u => u.startsWith('статус доставки')));
  assert.equal(unknownStages.length, 0, JSON.stringify(unknownStages.slice(0, 3)));
});

test('Імпорт: «Оплачено» поширюється на всі рядки ТТН, Звірка = Імпорт', () => {
  const rows = oldRows().map(B.bot_mapOldOrderRow).map(m => m.row);
  const before = rows.filter(r => r.paid === 'Оплачено').length;
  assert.equal(before, 1059);
  const res = B.bot_importPropagatePaid(rows);
  const after = rows.filter(r => r.paid === 'Оплачено');
  assert.equal(after.length, before + res.propagated);
  assert.ok(after.every(r => r.recon === 'Імпорт'));
  // жодної ТТН, де частина рядків оплачена, а частина ні
  const by = {};
  rows.filter(r => r.ttn).forEach(r => { (by[r.ttn] = by[r.ttn] || new Set()).add(r.paid); });
  assert.equal(Object.values(by).filter(s => s.size > 1).length, 0);
});
