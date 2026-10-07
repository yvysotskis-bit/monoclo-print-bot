const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadBot, ROOT } = require('./helpers');
const { newEnv, oldWorkbook } = require('./gasmock');
const B = loadBot();
const plain = x => JSON.parse(JSON.stringify(x));
const html = fs.readFileSync(path.join(ROOT, 'test-data', 'telegram-export-sample.html'), 'utf8');
const PRICES = [{ type: 'Футболка', price: 420, from: B.bot_makeDate(2026, 1, 1) }, { type: 'Худі фліс', price: 740, from: B.bot_makeDate(2026, 1, 1) }, { type: 'Худі не утеплене', price: 740, from: B.bot_makeDate(2026, 1, 1) }];

// ---------------------------------------------------------------- розбір живих форматів (Б)
test('Кілька замовлень в одному повідомленні зі спільною ТТН внизу', () => {
  const t = '1492. Принт nos inside\nХуді чорне без флісу\nXL\n\nПринт позаду\n\n1493. Принт no risk\nХуді чорне без флісу\nXL\n\nПринт позаду\n\n1494. Принт BMW\nХуді біле без флісу\nXL\n\nПринт позаду\n\n20451550339713';
  const list = B.bot_parseOrderMessage(t);
  assert.deepEqual(plain(list.map(p => p.no)), [1492, 1493, 1494]);
  assert.ok(list.every(p => p.ttn === '20451550339713' && p.issues.length === 0));
  assert.deepEqual(plain(list.map(p => p.ttnShared)), [true, true, false]);
  assert.equal(list[2].color, 'Білий');
  // своя ТТН у кожного — не змішуються
  const two = B.bot_parseOrderMessage('1. Принт A\nФутболка чорна\nS\nПринт позаду\n20451550000001\n\n2. Принт B\nФутболка чорна\nM\nПринт позаду\n20451550000002');
  assert.deepEqual(plain(two.map(p => p.ttn)), ['20451550000001', '20451550000002']);
  // замовлення без ТТН не «краде» ТТН у попереднього
  const noTtn = B.bot_parseOrderMessage('1. Принт A\nФутболка чорна\nS\n20451550000001\n\n2. Принт B\nФутболка чорна\nM');
  assert.deepEqual(plain(noTtn.map(p => p.ttn)), ['20451550000001', '']);
  assert.equal(noTtn[1].issues.some(i => i.field === 'ttn'), true);
});

test('Номер без крапки, «❗️ТЕРМІНОВО», фліс без «з», латинська c в «cіра», опис принта на кількох рядках', () => {
  let p = B.bot_parseOrderCaption('1542 Принт - F1 FERRARI\nФутболка чорна\nМ\n\nПринт позаду\n\n20451554216085');
  assert.equal(p.no, 1542); assert.equal(p.size, 'M'); assert.equal(p.issues.length, 0);
  p = B.bot_parseOrderCaption('❗️ТЕРМІНОВО\n\n1520. Принт meteora\nФутболка чорна\nL\n\nПринт позаду\n\n20451553511580');
  assert.equal(p.ok, true); assert.equal(p.no, 1520); assert.equal(p.ttn, '20451553511580');
  p = B.bot_parseOrderCaption('❗️ТЕРМІНОВО\n\n1550 Принт — odesa\nФутболка чорна\nL\n\nПринт позаду\n\n20451554216401');
  assert.equal(p.no, 1550);
  assert.equal(B.bot_parseOrderCaption('1. X\nХуді чорне фліс\nL\n20451550000001').type, 'Худі фліс');
  assert.equal(B.bot_parseOrderCaption('1. X\nХуді чорне ❗️БЕЗ ФЛІСУ\nL\n20451550000001').type, 'Худі не утеплене');
  assert.equal(B.bot_parseOrderCaption('1. X\nФутболка cіра\nL\n20451550000001').color, 'Сірий');
  p = B.bot_parseOrderCaption('1497. Принт \nFC BARCA (PERED) W - ПЕРЕД\nCamp Nou (w) - ЗАД\nХуді чорне фліс\nL\n\nПринти як на візуалі\n\n20451551430335');
  assert.equal(p.print, 'Принт FC BARCA (PERED) W - ПЕРЕД / Camp Nou (w) - ЗАД');
  assert.equal(p.placement, 'Як на візуалі'); assert.equal(p.type, 'Худі фліс'); assert.equal(p.issues.length, 0);
});

test('Чат і числа, що лише схожі на замовлення, не стають замовленнями', () => {
  ['20451552766220 по цій накладній їдуть додаткові футболки', '+++++++++', 'Привіт, зможете відправити сьогодні?', '/bind orders', '@alexturb по цьому дай інфу', '5 футболок на завтра'].forEach(t =>
    assert.deepEqual(plain(B.bot_parseOrderMessage(t)), [], t));
});

// ---------------------------------------------------------------- імпорт з експорту (А)
test('Експорт Telegram: дати, службові повідомлення, відповіді, сутності HTML', () => {
  assert.equal(B.bot_dayKey(B.bot_parseUaDate('3 жовтня 2026, 13:19:40')), '2026-10-03');
  assert.equal(B.bot_kyivParts(B.bot_parseUaDate('3 жовтня 2026, 13:19:40')).h, 13);
  assert.equal(B.bot_parseUaDate('xx'), null);
  assert.equal(B.bot_decodeEntities('A &amp; B &lt;x&gt; &#39;q&#39; &quot;z&quot;'), "A & B <x> 'q' \"z\"");
  const msgs = B.bot_parseTelegramExport(html);
  assert.ok(msgs.length > 200);
  const root = msgs.find(m => m.service && /Замовлення на клієнта/.test(m.service));
  assert.equal(root.id, 2);
  const m1483 = msgs.find(m => /^1483\./.test(m.text));
  assert.equal(m1483.replyTo, 2); assert.equal(m1483.id, 4619);
  assert.equal(m1483.text.split('\n')[0].trim(), '1483. Принт Skoda Octavia 1 VRS');
});

test('План імпорту після №1482: 74 замовлення №1483–№1557, пропуски лише №1491, без дублів і чужих гілок', () => {
  const msgs = B.bot_parseTelegramExport(html);
  const plan = B.bot_planTelegramImport(msgs, { afterNo: 1482, existingNos: [], priceRows: PRICES });
  const nos = plan.rows.map(r => r.no);
  assert.equal(plan.rootFound, true);
  assert.equal(plan.rows.length, 74);
  assert.equal(Math.min(...nos), 1483); assert.equal(Math.max(...nos), 1557);
  assert.equal(new Set(nos).size, 74);
  assert.deepEqual(plain(plan.gaps), [1491]);
  assert.equal(plan.repeats, 0);                                         // у повному файлі користувача — 8 повторних публікацій
  assert.equal(plan.problems.length, 0);
  const row = n => plan.rows.find(r => r.no === n).obj;
  // багатозамовленнєві повідомлення: 1493–1495 більше не губляться, ТТН спільна
  ['1492', '1493', '1494', '1495'].forEach(n => assert.equal(row(+n).ttn, '20451550339713'));
  assert.ok(row(1493).msgId.endsWith('.1') && row(1495).msgId.endsWith('.3'));
  assert.equal(row(1496).ttn, '20451551928053');                         // з «ТЕРМІНОВО»
  assert.equal(row(1542).type, 'Футболка');                              // без крапки
  assert.equal(row(1497).type, 'Худі фліс'); assert.equal(row(1497).cost, 740);
  assert.equal(row(1523).color, 'Сірий');
  assert.equal(row(1556).prints, 2);
  assert.equal(B.bot_dayKey(row(1483).date), '2026-10-03');
  assert.equal(row(1483).msgId, '4619');
  assert.ok(plan.rows.every(r => /^\d{14}$/.test(r.obj.ttn)));
  assert.equal(plan.sharedTtn, 13);
  // рядки, що вже є в таблиці (за №), пропускаються
  const again = B.bot_planTelegramImport(msgs, { afterNo: 1482, existingNos: [1483, 1490, 1500], priceRows: PRICES });
  assert.equal(again.rows.length, 71); assert.equal(again.skippedExisting, 3);
  // повний імпорт «з нуля» теж не падає
  assert.ok(B.bot_planTelegramImport(msgs, { afterNo: 0, existingNos: [], priceRows: PRICES }).rows.length >= 74);
  assert.match(B.bot_tgImportReportText(plan, false, false), /Буде додано замовлень: 74 \(№1483–№1557\)/);
});

// ---------------------------------------------------------------- Google-шар
const GROUP = -1001234567890, OWNER = 111, ORD_T = 5;
function fresh(files) {
  const env = newEnv({ oldWorkbook, driveFiles: files });
  env.setup(); env.setNow('2026-10-07T05:00:00Z');
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  env.ctx.bot_setSetting('OWNER_IDS', String(OWNER)); env.ctx.bot_setSetting('GROUP_CHAT_ID', GROUP); env.ctx.bot_setSetting('ORDERS_THREAD_ID', ORD_T);
  return env;
}
const gmsg = (id, caption, kind) => ({ [kind || 'message']: { message_id: id, date: Math.floor(Date.parse('2026-10-07T12:00:00Z') / 1000), chat: { id: GROUP, type: 'supergroup' }, from: { id: 9 }, is_topic_message: true, message_thread_id: ORD_T, caption } });

test('Живе повідомлення з кількома замовленнями → кілька рядків, одна реакція, ТТН спільна; повтор і редагування ідемпотентні', () => {
  const env = fresh();
  const cap = '1492. Принт nos inside\nХуді чорне без флісу\nXL\n\nПринт позаду\n\n1493. Принт no risk\nХуді чорне фліс\nXL\n\nПринт позаду\n\n20451550339713';
  env.update(gmsg(7001, cap)); env.poll();
  let rows = env.ctx.bot_readOrders();
  assert.deepEqual(plain(rows.map(r => [r.no, r.msgId, r.ttn, r.cost])), [[1492, '7001', '20451550339713', 740], [1493, '7001.1', '20451550339713', 740]]);
  assert.equal(env.tg.reactions.length, 1); assert.equal(env.tg.reactions[0].reaction[0].emoji, '👌');
  env.update(gmsg(7001, cap)); env.poll();                                   // те саме повідомлення ще раз
  assert.equal(env.ctx.bot_readOrders().length, 2);
  env.update(gmsg(7001, cap.replace('XL\n\nПринт позаду\n\n20451550339713', 'XXL\n\nПринт позаду\n\n20451550339713'), 'edited_message')); env.poll();
  rows = env.ctx.bot_readOrders();
  assert.equal(rows.length, 2); assert.equal(rows[1].size, 'XXL'); assert.equal(rows[0].size, 'XL');
  // повідомлення з проблемним другим замовленням → ✍ на все повідомлення
  env.update(gmsg(7002, '1500. Принт A\nФутболка чорна\nS\nПринт позаду\n\n1501. Принт B\nФутболка чорна\nПринт позаду\n\n20451550339000')); env.poll();
  assert.equal(env.tg.reactions[env.tg.reactions.length - 1].reaction[0].emoji, '✍');
  assert.equal(env.ctx.bot_readOrders().length, 4);
});

test('Меню-імпорт з Диска: план → запис 74 рядків у кінець; повторний імпорт нічого не додає; рядки відповідають живим (msg_id)', () => {
  const env = fresh({ 'FILEID_1234567890ABCDEF': html });
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');                   // стара таблиця: 1470 рядків
  const before = env.ctx.bot_readOrders().length;
  assert.equal(before, 1470);
  const url = 'https://drive.google.com/file/d/FILEID_1234567890ABCDEF/view?usp=sharing';
  const plan = env.ctx.bot_tgImportPlan(url);
  assert.equal(plan.afterNo, 1482);
  assert.equal(plan.rows.length, 74);
  const res = env.ctx.bot_tgImportApply(plan);
  assert.equal(res.added, 74);
  const rows = env.ctx.bot_readOrders();
  assert.equal(rows.length, before + 74);
  const last = rows[rows.length - 1];
  assert.equal(last.no, 1557); assert.equal(last.ttn, '20451554592308'); assert.equal(last.cost, 740); assert.equal(last.status, 'В роботі');
  assert.ok(rows.slice(-74).every(r => /^\d{14}$/.test(r.ttn) && r.msgId && r.paid === 'Не оплачено'));
  assert.equal(env.ctx.bot_sumBy_(rows.slice(-74), r => r.cost), 38440 + 0);
  // ТТН у тексті, а не числом
  assert.equal(typeof env.sheet('Замовлення').getRange(rows[rows.length - 1]._row, 9).getValue(), 'string');
  // повторно — нічого нового
  const again = env.ctx.bot_tgImportPlan(url);
  assert.equal(again.rows.length, 0);
  // редагування в групі вже імпортованого замовлення оновлює той самий рядок
  env.update(gmsg(Number(last.msgId), '1557. Принт нижче ‼️ДВА\nХуді чорне з флісом\nXL\n\nПринти як на візуалі\n\n20451554592308', 'edited_message')); env.poll();
  const after = env.ctx.bot_readOrders();
  assert.equal(after.length, before + 74); assert.equal(after[after.length - 1].size, 'XL');
  // помилки
  assert.throws(() => env.ctx.bot_tgImportPlan('https://example.com/x'), /посилання на файл Google Диска/);
  assert.throws(() => env.ctx.bot_tgImportPlan('https://drive.google.com/file/d/NOPE_1234567890ABCDEF/view'), /Немає доступу/);
});

test('Імпорт з Telegram: у файлі без повідомлень — зрозуміла помилка; пункт меню існує', () => {
  const env = fresh({ 'BADFILE_1234567890ABCDEF': '<html>нічого</html>' });
  assert.throws(() => env.ctx.bot_tgImportPlan('https://drive.google.com/file/d/BADFILE_1234567890ABCDEF/view'), /немає повідомлень Telegram/);
  assert.match(fs.readFileSync(path.join(ROOT, 'apps-script', 'Menu.gs'), 'utf8'), /Імпорт замовлень з експорту Telegram/);
});
