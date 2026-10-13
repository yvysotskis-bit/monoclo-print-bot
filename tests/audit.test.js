// Тести за результатами глибокого аудиту: кожен тест відтворює конкретний збій з реальної роботи
// (втрата замовлення, перевищення ліміту Telegram, випадкова оплата, витік токена, повторні спроби тощо).
// Більшість із них падали на коді до виправлень.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { newEnv, oldWorkbook } = require('./gasmock');
const { loadBot, readSheet, ROOT } = require('./helpers');
const B = loadBot();
const plain = x => JSON.parse(JSON.stringify(x));

const OWNER = 111, GROUP = -1001234567890, ORD_T = 5, REP_T = 7;
const TOKEN = '123456789:AAEabcdefghijklmnopqrstuvwxyz012345';
function fresh(opts) {
  const env = newEnv(Object.assign({ oldWorkbook }, opts || {}));
  env.setup(); env.setNow('2026-10-07T05:00:00Z');
  env.props.TG_TOKEN = TOKEN; env.props.BOT_ENABLED = '1';
  env.ctx.bot_setSetting('OWNER_IDS', String(OWNER)); env.ctx.bot_setSetting('GROUP_CHAT_ID', GROUP);
  env.ctx.bot_setSetting('ORDERS_THREAD_ID', ORD_T); env.ctx.bot_setSetting('REPORT_THREAD_ID', REP_T);
  return env;
}
let mid = 5000;
const gmsg = (caption, id, kind) => ({ [kind || 'message']: { message_id: id || ++mid, date: Math.floor(Date.parse('2026-10-07T12:00:00Z') / 1000), chat: { id: GROUP, type: 'supergroup' }, from: { id: 9 }, is_topic_message: true, message_thread_id: ORD_T, caption } });
const priv = (text, extra) => ({ message: Object.assign({ message_id: ++mid, date: 1, chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'Юрій' }, text }, extra) });
const cb = (data, msgId) => ({ callback_query: { id: 'cb' + (++mid), from: { id: OWNER, first_name: 'Юрій' }, message: { message_id: msgId, chat: { id: OWNER } }, data } });
const CAP = (n, ttn) => n + '. Принт Test' + n + '\nФутболка чорна\nL\n\nПринт позаду\n\n' + ttn;
const O = env => env.ctx.bot_readOrders();
const visible = t => t.replace(/<[^>]+>/g, '').replace(/&(lt|gt|amp|quot);/g, 'x');
const set46 = new Set(readSheet('46000.xlsx').slice(1).map(r => String(r[0])).filter(x => /^\d{14}$/.test(x)));

// ===================================================================== втрата даних / повторні спроби
test('A1. Тимчасовий збій під час запису замовлення НЕ губить його: оновлення лишається в черзі, повтор без дубля', () => {
  const env = fresh();
  const real = env.ctx.bot_appendOrderRow; let fails = 1;
  env.ctx.bot_appendOrderRow = (...a) => { if (fails-- > 0) throw new Error('Service Spreadsheets timed out'); return real(...a); };
  env.update(gmsg(CAP(1700, '20451550000001')));
  env.poll();
  assert.equal(O(env).length, 0);
  assert.ok(!env.props.UPDATE_OFFSET || env.props.UPDATE_OFFSET === '0', 'offset не просунуто — Telegram віддасть оновлення знову');
  assert.equal(env.sentTo(OWNER).length, 0, 'про перший збій власника не турбуємо');
  env.poll();
  assert.equal(O(env).length, 1); assert.equal(O(env)[0].no, 1700);
  env.poll();
  assert.equal(O(env).length, 1, 'без дублів');
});

test('A1b. Стійка помилка: після 3 спроб оновлення пропускається, власник дізнається, решта черги не блокується', () => {
  const env = fresh();
  env.update(gmsg(CAP(1701, '20451550000002'))); env.update(gmsg(CAP(1702, '20451550000003')));
  const real = env.ctx.bot_appendOrderRow;
  env.ctx.bot_appendOrderRow = (obj, y) => { if (obj.no === 1701) throw new Error('boom'); return real(obj, y); };
  env.poll(); env.poll(); env.poll();
  assert.deepEqual(plain(O(env).map(o => o.no)), [1702]);
  assert.ok(env.sentTo(OWNER).some(s => /не вдалося обробити/i.test(s.text) && /boom/.test(s.text)));
  assert.equal(env.props.UPDATE_OFFSET, '3');
});

test('A2. Мережевий збій getUpdates не валить запуск; токен не потрапляє ні в «Лог», ні власнику', () => {
  const env = fresh();
  env.state.netFail = (url) => /getUpdates/.test(url);
  env.poll();                                               // не кидає
  env.poll();
  const logs = env.rows('Лог').map(r => r.join(' ')).join('\n');
  assert.ok(logs.includes('getUpdates'), 'збій записано в лог');
  assert.ok(!logs.includes(TOKEN) && !/bot\d+:AAE/.test(logs), 'токен у логу');
  assert.equal(env.props.POLL_LOCK_TS, undefined, 'блокування опитування знято');
  // помилка обробки, що містить URL з токеном, теж очищується
  env.state.netFail = null;
  env.update(priv('/find 1')); const real = env.ctx.bot_cmdFind;
  env.ctx.bot_cmdFind = () => { throw new Error('Exception: Address unavailable: https://api.telegram.org/bot' + TOKEN + '/sendMessage'); };
  env.poll(); env.poll(); env.poll();
  const sent = env.tg.sent.map(s => s.text).join('\n') + env.rows('Лог').map(r => r.join(' ')).join('\n');
  assert.ok(!sent.includes(TOKEN), 'токен у повідомленні власнику або логу');
});

test('A3. Знайдена на «Замовленнях» остання непорожня клітинка — нові рядки не затирають кінець таблиці (рядок без №)', () => {
  const env = fresh();
  env.ctx.bot_appendOrderRow({ no: 1, print: 'A', type: 'Футболка', ttn: '20451550000010', cost: 420, status: 'В роботі', paid: 'Не оплачено' }, []);
  env.ctx.bot_appendOrderRow({ no: '', print: 'Рядок без номера', type: 'Футболка', ttn: '20451550000011', cost: 420, status: 'В роботі', paid: 'Не оплачено' }, []);
  env.ctx.bot_appendOrderRow({ no: 2, print: 'B', type: 'Футболка', ttn: '20451550000012', cost: 420, status: 'В роботі', paid: 'Не оплачено' }, []);
  assert.deepEqual(plain(O(env).map(o => o.ttn)), ['20451550000010', '20451550000011', '20451550000012']);
});

test('A4. Редагування повідомлення не скидає вручну виправлену собівартість (і не чіпає «за файлом»)', () => {
  const env = fresh();
  env.update(gmsg('1710. Принт X\nХуді чорне з флісом\nL\n\nПринт позаду\n\n20451550000020', 7100)); env.poll();
  env.ctx.bot_patchOrders([{ row: 2, fields: { cost: 810 } }]);                           // власник виправив вручну
  env.update(gmsg('1710. Принт X\nХуді чорне з флісом\nXL\n\nПринт позаду\n\n20451550000020', 7100, 'edited_message')); env.poll();
  let r = O(env)[0];
  assert.equal(r.size, 'XL'); assert.equal(r.cost, 810, 'ручна ціна збережена');
  env.update(gmsg('1710. Принт X\nФутболка чорна\nXL\n\nПринт позаду\n\n20451550000020', 7100, 'edited_message')); env.poll();
  assert.equal(O(env)[0].cost, 420, 'змінився тип речі — ціна перерахована за прайсом');
});

test('A5. Повторні номери в одному повідомленні та в кількох оновленнях одразу: жодних дублів рядків', () => {
  const env = fresh();
  const cap = CAP(1720, '20451550000030') + '\n\n' + CAP(1720, '20451550000030');
  env.update(gmsg(cap, 7200)); env.update(gmsg(CAP(1720, '20451550000030'), 7201)); env.poll();
  assert.equal(O(env).filter(o => o.no === 1720).length, 1);
});

test('A6. Ключі msg_id багатозамовленнєвих повідомлень не збігаються і не перетворюються на числа (id.1 vs id.10)', () => {
  const env = fresh();
  const cap = Array.from({ length: 12 }, (_, i) => CAP(1730 + i, '20451550000040').replace(/\n\n20451550000040$/, '')).join('\n\n') + '\n\n20451550000040';
  env.update(gmsg(cap, 7300)); env.poll();
  const rows = O(env);
  assert.equal(rows.length, 12);
  const keys = rows.map(r => r.msgId);
  assert.equal(new Set(keys).size, 12, 'ключі унікальні: ' + keys.join(','));
  // редагування 11-го замовлення змінює саме його
  const edited = cap.replace('Test1740\nФутболка чорна\nL', 'Test1740\nФутболка чорна\nXL');
  env.update(gmsg(edited, 7300, 'edited_message')); env.poll();
  const after = O(env);
  assert.equal(after.length, 12);
  assert.equal(after.find(o => o.no === 1740).size, 'XL');
  assert.equal(after.filter(o => o.size === 'XL').length, 1);
  // сумісність зі старим форматом ключа «id.N» (рядки, створені до виправлення)
  const env2 = fresh();
  env2.update(gmsg(CAP(1750, '20451550000050') + '\n\n' + CAP(1751, '20451550000050').replace(/\n\n20451550000050$/, ''), 7400)); env2.poll();
  env2.ctx.bot_patchOrders(O(env2).map(o => ({ row: o._row, fields: { msgId: o.msgId.replace('#', '.') } })));
  env2.update(gmsg(CAP(1750, '20451550000050') + '\n\n' + CAP(1751, '20451550000050').replace(/\n\n20451550000050$/, '').replace('L\n', 'XXL\n'), 7400, 'edited_message')); env2.poll();
  assert.equal(O(env2).length, 2); assert.equal(O(env2).find(o => o.no === 1751).size, 'XXL');
});

// ===================================================================== парсер
test('A7. «2 принти на завтра» та інші короткі числа не стають замовленням; «1600 Принт …» — стає', () => {
  ['2 принти потрібно на завтра', '3 Принт ось цей', '15 принтів з вами', '99 Принт'].forEach(t => assert.deepEqual(plain(B.bot_parseOrderMessage(t)), [], t));
  assert.equal(B.bot_parseOrderMessage('1600 Принт X\nФутболка чорна\nL\n20451550000060').length, 1);
  assert.equal(B.bot_parseOrderMessage('1600. Принт X\nФутболка чорна\nL\n20451550000060').length, 1);
  assert.equal(B.bot_parseOrderMessage('7. Принт X\nФутболка чорна\nL\n20451550000060').length, 1, 'з крапкою — будь-який номер');
});

test('A8. Фаззінг: жодний вхід не викидає виняток; інваріанти результатів дотримані', () => {
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pieces = ['1538.', '1540)', ' ', '\n', '\n\n', 'Принт', 'Худі', 'чорне', 'фліс', 'без флісу', 'Футболка', 'L', 'XL', 'М', 'XXL', '2XL', '20451553931463', '2045155393146', '❗️ТЕРМІНОВО', '‼️ДВА', 'позаду', 'спереду', 'візуал', ' ', '\t', '"', '<b>', '&', '\\', '0', '-1', '1e21', 'ТТН:', '№', '🙂', 'cіра', '   '];
  for (let i = 0; i < 4000; i++) {
    let t = ''; const n = Math.floor(rnd() * 25);
    for (let k = 0; k < n; k++) t += pieces[Math.floor(rnd() * pieces.length)] + (rnd() < 0.5 ? '' : ' ');
    const list = B.bot_parseOrderMessage(t);
    list.forEach(p => {
      assert.ok(Number.isInteger(p.no) && p.no >= 0);
      assert.ok(p.ttn === '' || /^\d{14}$/.test(p.ttn));
      assert.ok(p.size === '' || B.BOT_SIZES.includes(p.size));
      assert.ok(p.type === '' || B.BOT_TYPES.includes(p.type));
      assert.ok(p.color === '' || B.BOT_COLORS.includes(p.color));
      assert.ok(p.placement === '' || B.BOT_PLACEMENTS.includes(p.placement));
      assert.ok(p.prints === 1 || p.prints === 2);
    });
    B.bot_normTtn(t); B.bot_normSize(t); B.bot_normPlacement(t); B.bot_parseTypeColor(t); B.bot_toNumber(t); B.bot_parseDate(t); B.bot_parseUaDate(t);
    B.bot_parseProductionFile([[t, t, t], [t, t, t]]);
    B.bot_printDesign(t);
  }
  [null, undefined, 0, NaN, {}, [], 1e21, -5, '', '   '].forEach(x => { B.bot_normTtn(x); B.bot_normSize(x); B.bot_toNumber(x); B.bot_parseOrderMessage(x); });
  assert.ok(!B.bot_isTtn(B.bot_normTtn(1e21)), 'величезне число не вважається ТТН і не дає «1e+21»');
});

// ===================================================================== файл виробництва
test('A9. CSV у кодуванні windows-1251 (типовий експорт Excel) розпізнається, а не «Не знайшов колонку ТТН»', () => {
  const env = fresh();
  const iconv = (s) => Uint8Array.from(Array.from(s).map(ch => { const c = ch.charCodeAt(0); if (c < 128) return c; if (c >= 0x410 && c <= 0x44f) return c - 0x410 + 0xc0; if (c === 0x406) return 0xb2; if (c === 0x456) return 0xb3; return 63; }));
  const csv = 'ТТН;Статус;Ціна\n20451545005600;Получено;420\n20451544999695;Получено;740\n';
  const blob = env.mkBlob({ name: 'x.csv', bytes: iconv(csv), encoding: 'windows-1251' });
  const vals = env.ctx.bot_blobToValues_(blob, 'x.csv');
  const f = env.ctx.bot_parseProductionFile(vals);
  assert.equal(f.error, undefined, f.error);
  assert.equal(f.rows.length, 2); assert.equal(f.rows[1].price, 740);
});

test('A10. Кілька колонок з ціною: береться «Дроп. ціна», а власник бачить попередження', () => {
  const f = B.bot_parseProductionFile([['ТТН', 'Ціна продажу', 'Дроп. ціна', 'Статус'], ['20451545005600', 999, 420, 'Получено']]);
  assert.equal(f.rows[0].price, 420);
  assert.ok(f.warnings && f.warnings.some(w => /ціна/i.test(w)), JSON.stringify(f.warnings));
  const g = B.bot_parseProductionFile([['TTH', 'Сумма'], ['20451545005600', '1 160,00']]);       // латинські «TTH»
  assert.equal(g.error, undefined); assert.equal(g.rows[0].price, 1160);
  const h = B.bot_parseProductionFile([['ТТН', 'Ціна'], ['', ''], ['разом', 1000]]);
  assert.equal(h.rows.length, 0);
});

test('A11. Дуже великий файл: або повна обробка, або зрозуміла відмова ДО створення чернетки й архіву', () => {
  const env = fresh(true && { });
  const rows = [['ТТН', 'Ціна']];
  for (let i = 0; i < 2200; i++) rows.push([String(20451600000000 + i), 420]);
  env.ctx.__vals = rows;
  env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: 'big.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
  env.update(priv(undefined, { text: undefined, document: { file_name: 'big.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
  const drafts = env.rows('Звірки');
  const msg = env.sentTo(OWNER).map(s => s.text).join('\n');
  if (drafts.length) {                                       // оброблено повністю — тоді дані файлу збережено цілком
    assert.equal(JSON.parse(env.ctx.bot_reconList()[0].fileData).length, 2200);
  } else {
    assert.match(msg, /завеликий|забагато/i);
    assert.equal(env.files.created.length, 0, 'файл не архівується, якщо чернетку створити неможливо');
  }
  assert.ok(drafts.length || /завеликий|забагато/i.test(msg));
});

test('A12. Зведення не вдалося надіслати (Telegram відхилив) → чернетка скасовується, власник отримує зрозуміле пояснення', () => {
  const env = fresh({ driveFiles: {} });
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  const real = env.ctx.bot_tgRaw;
  env.ctx.bot_tgRaw = (m, p) => (m === 'sendMessage' && /Звірка З-/.test(p.text || '') ? { ok: false, description: "Bad Request: can't parse entities" } : real(m, p));
  env.ctx.__vals = readSheet('46000.xlsx');
  env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: '46000.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
  env.update(priv(undefined, { text: undefined, document: { file_name: '46000.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
  const list = env.ctx.bot_reconList();
  assert.equal(list.length, 1); assert.equal(list[0].status, 'Скасовано');
  assert.ok(env.sentTo(OWNER).some(s => /не вдалося надіслати зведення/i.test(s.text)));
});

// ===================================================================== гроші
const readyToPay = () => {
  const env = fresh();
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  env.ctx.bot_patchOrders(O(env).filter(o => set46.has(o.ttn)).map(o => ({ row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } })));
  env.ctx.__vals = readSheet('46000.xlsx');
  env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: '46000.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
  env.update(priv(undefined, { text: undefined, document: { file_name: '46000.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
  const s = env.tg.sent.find(x => /Звірка З-/.test(x.text));
  return { env, s, id: s.text.match(/Звірка (З-[\d-]+)/)[1] };
};

test('A13. Випадкове число в чаті НЕ створює оплату: «Інша сума» потребує підтвердження кнопкою і діє обмежений час', () => {
  const { env, s, id } = readyToPay();
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  const q = env.lastSent();
  env.update(cb('opc|' + id, q.message_id)); env.poll();
  const before = env.ctx.bot_readPayments().length;
  env.update(priv('30000')); env.poll();
  assert.equal(env.ctx.bot_readPayments().length, before, 'до підтвердження кнопкою нічого не записано');
  const ask = env.lastSent();
  assert.match(ask.text, /30 000 грн/); assert.ok(JSON.stringify(ask.reply_markup).includes('opy|' + id + '|30000'));
  env.update(priv('777')); env.poll();                                           // повторне «випадкове» число — ігнорується
  assert.equal(env.ctx.bot_readPayments().length, before);
  env.update(cb('opy|' + id + '|30000', ask.message_id)); env.update(cb('opy|' + id + '|30000', ask.message_id)); env.poll();
  const pays = env.ctx.bot_readPayments();
  assert.equal(pays.length, before + 1); assert.equal(pays[pays.length - 1].sum, 30000);
  // прострочене очікування суми
  const r2 = readyToPay(); r2.env.update(cb('payy|' + r2.id, r2.s.message_id)); r2.env.poll();
  r2.env.update(cb('opc|' + r2.id, r2.env.lastSent().message_id)); r2.env.poll();
  r2.env.setNow('2026-10-07T07:00:00Z');                                         // +2 години
  const b2 = r2.env.ctx.bot_readPayments().length;
  r2.env.update(priv('555')); r2.env.poll();
  assert.equal(r2.env.sentTo(OWNER).filter(x => /555/.test(x.text)).length, 0);
  assert.equal(r2.env.ctx.bot_readPayments().length, b2);
});

test('A14. Збій після запису «Оплачено» (до оновлення звірки): повторний тап завершує операцію, а не лишає чернетку; подвійної оплати немає', () => {
  const { env, s, id } = readyToPay();
  const real = env.ctx.bot_reconPatch; let fail = 1;
  env.ctx.bot_reconPatch = (i, f) => { if (f.status === 'Підтверджено' && fail-- > 0) throw new Error('Service timed out'); return real(i, f); };
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  assert.equal(O(env).filter(o => o.recon === id).length, 92, 'рядки вже позначено');
  assert.equal(env.ctx.bot_reconGet(id).status, 'Чернетка');
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  const rec = env.ctx.bot_reconGet(id);
  assert.equal(rec.status, 'Підтверджено'); assert.equal(rec.confirmedSum, 46000); assert.equal(rec.rowsCount, 92);
  assert.equal(O(env).filter(o => o.recon === id).length, 92);
  assert.equal(env.ctx.bot_readPayments().length, 24, 'оплату в «Оплати» без окремого підтвердження не додано');
});

test('A15. /undo з латинською «Z» замість «З» знаходить звірку', () => {
  const { env, s, id } = readyToPay();
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  env.update(priv('/undo ' + id.replace('З', 'Z'))); env.poll();
  assert.match(env.lastSent().text, /Відкликати звірку/);
});

// ===================================================================== НП, звіти, планувальник
test('A16. Помилка API Нової пошти не повторюється щохвилини: пауза до наступного циклу (30 хв), без спаму в логу', () => {
  const env = fresh();
  env.props.NP_API_KEY = 'key'; env.np.fail = 'Invalid API key';
  env.ctx.bot_appendOrderRow({ no: 1, print: 'A', type: 'Футболка', ttn: '20451550000070', cost: 420, status: 'В роботі', paid: 'Не оплачено', stage: '' }, []);
  env.setNow('2026-10-07T06:00:00Z'); env.poll();
  const c1 = env.np.calls.length; assert.ok(c1 >= 1);
  const errLogs = () => env.rows('Лог').filter(r => /Invalid API key/.test(r.join(' '))).length;
  const l1 = errLogs();
  env.setNow('2026-10-07T06:01:00Z'); env.poll(); env.setNow('2026-10-07T06:02:00Z'); env.poll();
  assert.equal(env.np.calls.length, c1, 'нових запитів до НП немає');
  assert.equal(errLogs(), l1, 'лог не росте щохвилини');
  env.setNow('2026-10-07T06:31:00Z'); env.poll();
  assert.ok(env.np.calls.length > c1, 'через 30 хв — нова спроба');
});

test('A17. Ранковий звіт з кількох частин: збій на другій частині не дублює першу при повторі', () => {
  const env = fresh();
  for (let i = 0; i < 120; i++) env.ctx.bot_appendOrderRow({ no: 3000 + i, date: env.ctx.bot_makeDate(2026, 10, 1), print: 'Принт ' + 'довга назва '.repeat(3) + i, type: 'Футболка', color: 'Чорний', size: 'S', ttn: String(20451560000000 + i), ttnDate: env.ctx.bot_makeDate(2026, 10, 1), stage: 'Не передана', cost: 420, status: 'В роботі', paid: 'Не оплачено' }, []);
  const parts = env.ctx.bot_morningParts_();
  assert.ok(parts.length >= 2);
  const real = env.ctx.bot_tgRaw; let groupSends = 0, failed = false;
  env.ctx.bot_tgRaw = (m, p) => { if (m === 'sendMessage' && String(p.chat_id) === String(GROUP)) { groupSends++; if (groupSends === 2 && !failed) { failed = true; return { ok: false, description: 'Too Many Requests: retry later' }; } } return real(m, p); };
  env.setNow('2026-10-05T06:01:00Z'); env.poll();
  env.setNow('2026-10-05T06:02:00Z'); env.poll();
  env.setNow('2026-10-05T06:03:00Z'); env.poll();
  const g = env.sentTo(GROUP);
  assert.equal(g.length, parts.length, 'кожна частина рівно один раз');
  assert.equal(new Set(g.map(x => x.text)).size, parts.length);
});

test('A18. Звіт не вдається доставити (бота вилучили з групи): власник попереджений, без нескінченних повторів', () => {
  const env = fresh();
  env.ctx.bot_appendOrderRow({ no: 1, date: env.ctx.bot_makeDate(2026, 10, 1), print: 'A', type: 'Футболка', color: 'Чорний', size: 'S', ttn: '20451550000080', ttnDate: env.ctx.bot_makeDate(2026, 10, 1), stage: 'Не передана', cost: 420, status: 'В роботі', paid: 'Не оплачено' }, []);
  const real = env.ctx.bot_tgRaw;
  env.ctx.bot_tgRaw = (m, p) => (m === 'sendMessage' && String(p.chat_id) === String(GROUP) ? { ok: false, description: 'Forbidden: bot was kicked from the supergroup chat' } : real(m, p));
  for (let i = 1; i <= 8; i++) { env.setNow('2026-10-05T06:0' + i + ':00Z'); env.poll(); }
  const warns = env.sentTo(OWNER).filter(s => /Ранковий звіт не надіслано/.test(s.text));
  assert.equal(warns.length, 1, 'одне попередження: ' + warns.length);
  assert.ok(env.props.LAST_REPORT_DATE, 'за день більше не пробуємо');
});

test('A19. REPORT_DAYS у вигляді діапазону «Пн-Сб», REPORT_TIME «9.00» або час-клітинка — розуміються; сміття → значення за замовчуванням', () => {
  const env = fresh();
  env.ctx.bot_setSetting('REPORT_DAYS', 'Пн-Сб');
  assert.deepEqual(Array.from(env.ctx.bot_reportDays_()).sort(), [1, 2, 3, 4, 5, 6]);
  env.ctx.bot_setSetting('REPORT_DAYS', 'пн, ср,Пт');
  assert.deepEqual(Array.from(env.ctx.bot_reportDays_()).sort(), [1, 3, 5]);
  env.ctx.bot_setSetting('REPORT_DAYS', 'щось не те');
  assert.deepEqual(Array.from(env.ctx.bot_reportDays_()).sort(), [1, 2, 3, 4, 5, 6]);
  assert.equal(env.ctx.bot_parseTimeSetting_('9.00', 0), 540);
  assert.equal(env.ctx.bot_parseTimeSetting_('09:30', 0), 570);
  assert.equal(env.ctx.bot_parseTimeSetting_('', 540), 540);
});

test('A20. Місячний звіт: якщо надсилання не вдалось, його буде повторено (мітка «надіслано» ставиться після успіху)', () => {
  const env = fresh({ driveFiles: {} });
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  env.state.netFail = (url) => /sendMessage/.test(url);
  env.setNow('2026-11-02T07:05:00Z'); env.poll();                  // 1-ше було вихідним; 2-го — не день звіту
  env.setNow('2026-11-01T07:05:00Z'); env.poll();
  env.state.netFail = null;
  env.setNow('2026-11-01T07:10:00Z'); env.poll();
  assert.equal(env.sentTo(OWNER).filter(s => /Місячний звіт/.test(s.text)).length, 1);
});

// ===================================================================== повідомлення Telegram: ліміти
test('A21. Довге зведення звірки вміщається в 4096 символів; довгий текст у bot_send ділиться, а не губиться', () => {
  const { env } = (() => {
    const env = fresh();
    env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
    env.ctx.bot_patchOrders(O(env).map(o => ({ row: o._row, fields: { print: 'Дуже довга назва принта '.repeat(8) + o.no } })));
    env.ctx.__vals = readSheet('46000.xlsx');
    env.run('bot_blobToValues_ = function () { return __vals; };');
    env.state.nextFile = { name: 'довга-назва-файлу-'.repeat(5) + '.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
    env.update(priv(undefined, { text: undefined, document: { file_name: 'довга-назва-файлу-'.repeat(5) + '.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
    return { env };
  })();
  const summary = env.tg.sent.find(x => /Звірка З-/.test(x.text));
  assert.ok(summary, 'зведення надіслано (Telegram не відхилив за довжину)');
  assert.ok(visible(summary.text).length <= 4096);
  env.ctx.bot_send(OWNER, Array.from({ length: 700 }, (_, i) => 'рядок ' + i + ' ' + 'x'.repeat(20)).join('\n'));
  const tail = env.tg.sent.slice(-5).map(x => x.text).join('\n');
  assert.ok(tail.includes('рядок 699'), 'кінець довгого тексту дійшов');
  env.tg.sent.forEach(x => assert.ok(visible(x.text).length <= 4096));
});

// ===================================================================== імпорт з Telegram
test('A22. Імпорт з експорту: власний початковий номер; повторне застосування одного плану не дублює рядки', () => {
  const html = fs.readFileSync(path.join(ROOT, 'test-data', 'telegram-export-sample.html'), 'utf8');
  const env = fresh({ driveFiles: { 'FILEID_1234567890ABCDEF': html } });
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  const url = 'https://drive.google.com/file/d/FILEID_1234567890ABCDEF/view';
  const planAll = env.ctx.bot_tgImportPlan(url);
  assert.equal(planAll.rows.length, 74);
  const plan = env.ctx.bot_tgImportPlan(url, 1550);
  assert.equal(plan.afterNo, 1550); assert.equal(plan.rows.length, 7);                      // 1551–1557
  env.ctx.bot_tgImportApply(plan); env.ctx.bot_tgImportApply(plan);
  assert.equal(O(env).filter(o => o.no >= 1551).length, 7, 'двічі застосований план не дублює');
});

test('A23. Повторна обробка файлу з кількома однаковими ТТН і порожніми рядками не ламає звірку', () => {
  const env = fresh();
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  const vals = [['ТТН', 'Статус', 'Ціна'], ['', '', ''], ['20451545005600', 'Получено', 420], ['20451545005600', 'Получено', 420], [null, null, null], ['  ', '', 'abc']];
  env.ctx.__vals = vals; env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: 'a.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
  env.update(priv(undefined, { text: undefined, document: { file_name: 'a.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
  assert.ok(env.tg.sent.some(x => /Звірка З-/.test(x.text)));
  const empty = [['ТТН', 'Ціна']];
  env.ctx.__vals = empty;
  env.update(priv(undefined, { text: undefined, document: { file_name: 'e.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
  assert.match(env.lastSent().text, /немає жодної ТТН/);
});

// ===================================================================== запис у таблицю без побічних втрат
test('A24. Запис у «Замовлення» змінює ЛИШЕ потрібні клітинки: чужі примітки («10.10», «1/2»), формули і ручні правки не перезаписуються', () => {
  const env = fresh();
  ['A', 'B', 'C'].forEach((x, i) => env.ctx.bot_appendOrderRow({ no: 1800 + i, print: x, type: 'Футболка', ttn: '2045155000009' + i, cost: 420, status: 'В роботі', paid: 'Не оплачено', note: '' }, []));
  const sh = env.sheet('Замовлення');
  const map = env.ctx.bot_ordersMap(sh);
  sh.data[2][map.note - 1] = '10.10';                         // рядок 3: примітка-текст, що схожа на дату (лежить текстом)
  sh.data[3][map.note - 1] = '=SUM(1,2)';                     // рядок 4: у примітці формула (власник)
  sh.data[3][map.print - 1] = 'Ручна правка';
  env.ctx.bot_patchOrders([{ row: 2, fields: { paid: 'Оплачено', note: 'x' } }]);          // змінюємо лише рядок 2
  assert.equal(sh.data[2][map.note - 1], '10.10', 'примітка іншого рядка не чіпана і не стала датою');
  assert.equal(sh.data[3][map.note - 1], '=SUM(1,2)', 'формула в чужій клітинці збережена');
  assert.equal(sh.data[3][map.print - 1], 'Ручна правка');
  assert.equal(sh.data[1][map.paid - 1], 'Оплачено'); assert.equal(sh.data[1][map.note - 1], 'x');
  assert.equal(sh.data[2][map.paid - 1], 'Не оплачено');
});

test('A25. Позначення 92 рядків «Оплачено» — кілька викликів API, а не по клітинці; дані інших колонок цілі', () => {
  const env = fresh();
  for (let i = 0; i < 92; i++) env.ctx.bot_appendOrderRow({ no: 2000 + i, print: 'П' + i, type: 'Футболка', ttn: String(20451570000000 + i), cost: 420, status: 'В роботі', paid: 'Не оплачено', note: i % 7 === 0 ? '3/4' : '' }, []);
  const sh = env.sheet('Замовлення'), map = env.ctx.bot_ordersMap(sh);
  sh.data.forEach((r, i) => { if (i > 0 && r[map.note - 1] === '') r[map.note - 1] = ''; });
  const notesBefore = sh.data.map(r => r[map.note - 1]);
  env.ss.rangeListCalls = 0; env.ss.writeCalls = 0;
  const rows = env.ctx.bot_readOrders().map(o => o._row);
  env.ctx.bot_patchOrders(rows.map(r => ({ row: r, fields: { recon: 'З-2026-10-07-9', paidDate: env.ctx.bot_makeDate(2026, 10, 7), paid: 'Оплачено' } })));
  assert.ok(env.ss.rangeListCalls >= 1 && env.ss.rangeListCalls <= 6, 'викликів RangeList: ' + env.ss.rangeListCalls);
  assert.ok(env.ss.writeCalls <= 6, 'викликів setValues: ' + env.ss.writeCalls);
  assert.equal(env.ctx.bot_readOrders().filter(o => o.paid === 'Оплачено' && o.recon === 'З-2026-10-07-9').length, 92);
  assert.deepEqual(plain(sh.data.map(r => r[map.note - 1])), plain(notesBefore), 'колонку приміток не чіпано');
});

test('A26. Службові дані звірки не псуються Google-ом: «чат:повідомлення» з малим номером (напр. 390203400:12) лишається текстом', () => {
  const { env, s, id } = (() => {
    const env = fresh();
    env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
    env.ctx.bot_patchOrders(O(env).filter(o => set46.has(o.ttn)).map(o => ({ row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } })));
    env.tg.nextId = 12;
    env.ctx.__vals = readSheet('46000.xlsx'); env.run('bot_blobToValues_ = function () { return __vals; };');
    env.state.nextFile = { name: '46000.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
    env.update(priv(undefined, { text: undefined, document: { file_name: '46000.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
    const s = env.tg.sent.find(x => /Звірка З-/.test(x.text));
    return { env, s, id: s.text.match(/Звірка (З-[\d-]+)/)[1] };
  })();
  const rec = env.ctx.bot_reconGet(id);
  assert.equal(typeof rec.summaryMsg, 'string'); assert.match(rec.summaryMsg, /^\d+:\d+$/);
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  assert.ok(env.tg.edits.some(e => e.message_id === s.message_id && /Підтверджено/.test(e.text)), 'зведення оновлено — посилання на повідомлення збереглось');
});

test('A27. Повторна обробка того самого файлу після збою надсилання не створює другу чернетку й другий архівний файл', () => {
  const env = fresh();
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  env.ctx.bot_patchOrders(O(env).filter(o => set46.has(o.ttn)).map(o => ({ row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } })));
  env.ctx.__vals = readSheet('46000.xlsx'); env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: '46000.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
  const real = env.ctx.bot_send; let boom = 1;
  env.ctx.bot_send = (c, t, o) => { if (/Звірка З-/.test(t) && boom-- > 0) throw new Error('Address unavailable'); return real(c, t, o); };
  env.update(priv(undefined, { text: undefined, document: { file_name: '46000.xlsx', file_id: 'f', file_size: 5000 } }));
  env.poll();                                                // збій на надсиланні зведення → повторна спроба
  env.poll();
  const recons = env.ctx.bot_reconList();
  assert.equal(recons.length, 1, 'одна чернетка');
  assert.equal(env.files.created.length, 1, 'один архівний файл');
  assert.ok(env.tg.sent.some(x => /Звірка З-/.test(x.text)), 'зведення таки надіслано');
  assert.ok(recons[0].summaryMsg);
});

test('A28. «Оплачено» ставиться останнім: перерваний запис не лишає «Оплачено» без ID звірки', () => {
  const env = fresh();
  for (let i = 0; i < 3; i++) env.ctx.bot_appendOrderRow({ no: 2500 + i, print: 'П' + i, type: 'Футболка', ttn: '2045158000000' + i, cost: 420, status: 'В роботі', paid: 'Не оплачено' }, []);
  const rows = O(env).map(o => o._row);
  // емуляція обриву: після запису першого поля (recon) виконання зупиняється
  const sh = env.sheet('Замовлення'); const realRL = sh.getRangeList.bind(sh); let calls = 0;
  sh.getRangeList = (l) => { if (++calls === 3) throw new Error('Exceeded maximum execution time'); return realRL(l); };
  assert.throws(() => env.ctx.bot_patchOrders(rows.map(r => ({ row: r, fields: { recon: 'З-1', paidDate: env.ctx.bot_makeDate(2026, 10, 7), paid: 'Оплачено' } }))), /execution time/);
  const after = O(env);
  assert.ok(after.every(o => o.recon === 'З-1'), 'ID звірки записано');
  assert.ok(after.every(o => o.paid === 'Не оплачено'), 'але «Оплачено» ще не поставлено — повтор безпечний');
});

test('A29. Скасований рядок багатопозиційної ТТН не робить її «частково оплаченою»; оплата такої ТТН працює', () => {
  const orders = [
    { _row: 2, no: 1, print: 'A', type: 'Футболка', ttn: '11111111111111', cost: 420, status: 'В роботі', paid: 'Оплачено', recon: 'З-1' },
    { _row: 3, no: 2, print: 'B', type: 'Футболка', ttn: '11111111111111', cost: 0, status: 'Скасовано', paid: 'Не оплачено' },
    { _row: 4, no: 3, print: 'C', type: 'Футболка', ttn: '22222222222222', cost: 420, status: 'В роботі', paid: 'Не оплачено' },
    { _row: 5, no: 4, print: 'D', type: 'Футболка', ttn: '22222222222222', cost: 0, status: 'Брак', paid: 'Не оплачено' }];
  const d = plain(B.bot_reconcileCompute([{ ttn: '11111111111111', price: 420 }, { ttn: '22222222222222', price: 420 }], orders, { priceRows: [], today: new Date() }));
  assert.equal(d[0].category, 'PAID');
  assert.equal(d[1].category, 'OK');
  assert.deepEqual(plain(B.bot_planPayment(d).rows), [4, 5], 'позначаються всі рядки ТТН, включно з нульовим');
});

test('A30. Точна повторна публікація замовлення («ТЕРМІНОВО») — без зайвих повідомлень власнику; інша ТТН з тим самим № — попередження', () => {
  const env = fresh();
  env.update(gmsg(CAP(1900, '20451550000090'), 9001)); env.poll();
  env.update(gmsg('❗️ТЕРМІНОВО\n\n' + CAP(1900, '20451550000090'), 9002)); env.poll();
  assert.equal(O(env).length, 1); assert.equal(env.sentTo(OWNER).length, 0);
  env.update(gmsg(CAP(1900, '20451550000091'), 9003)); env.poll();
  assert.equal(O(env).length, 1); assert.match(env.lastSent().text, /Дубль/);
});

test('A31. Дата «прибуло у відділення» скидається, коли посилка залишила відділення, і рахується заново', () => {
  const env = fresh();
  env.props.NP_API_KEY = 'k';
  env.ctx.bot_appendOrderRow({ no: 1, print: 'A', type: 'Футболка', ttn: '20451550000095', cost: 420, status: 'В роботі', paid: 'Не оплачено', stage: '' }, []);
  const item = (code, st) => [{ Number: '20451550000095', StatusCode: String(code), Status: st, DateCreated: '2026-10-01 10:00:00' }];
  env.np.handler = () => item(7, 'Прибув на відділення'); env.setNow('2026-10-02T07:00:00Z'); env.ctx.bot_npUpdate({});
  assert.ok(O(env)[0].arrived);
  env.np.handler = () => item(104, 'Змінено адресу'); env.setNow('2026-10-03T07:00:00Z'); env.ctx.bot_npUpdate({});
  assert.equal(O(env)[0].arrived, null);
  env.np.handler = () => item(7, 'Прибув на відділення'); env.setNow('2026-10-08T07:00:00Z'); env.ctx.bot_npUpdate({});
  assert.equal(env.ctx.bot_dayKey(O(env)[0].arrived), '2026-10-08');
});

// ===================================================================== час, блокування, повторне налаштування
test('A32. Київський час (літній/зимовий) збігається з Intl (Europe/Kyiv) для 4000 випадкових моментів 2024–2032', () => {
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Kyiv', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const lo = Date.UTC(2024, 0, 1), hi = Date.UTC(2032, 11, 31);
  const edges = [];
  for (let y = 2024; y <= 2032; y++) for (const m of [2, 9]) { const d = new Date(Date.UTC(y, m + 1, 0, 1)); const t = d.getTime() - d.getUTCDay() * 86400000; edges.push(t - 1000, t, t + 1000, t - 3600000, t + 3600000); }
  const times = edges.concat(Array.from({ length: 4000 }, () => lo + Math.floor(rnd() * (hi - lo))));
  times.forEach(t => {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(t)).map(p => [p.type, p.value]));
    const k = B.bot_kyivParts(new Date(t));
    assert.deepEqual([k.y, k.m, k.d, k.h, k.mi, k.s], [+parts.year, +parts.month, +parts.day, +parts.hour, +parts.minute, +parts.second], new Date(t).toISOString());
  });
  const mk = B.bot_makeDate(2026, 3, 29), mk2 = B.bot_makeDate(2026, 10, 25);          // дні переходу
  assert.equal(B.bot_kyivParts(mk).h, 0); assert.equal(B.bot_kyivParts(mk2).h, 0);
  assert.equal(B.bot_dayKey(mk), '2026-03-29'); assert.equal(B.bot_dayKey(mk2), '2026-10-25');
  ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'].forEach((m, i) =>
    assert.equal(B.bot_dayKey(B.bot_parseUaDate('5 ' + m + ' 2026, 10:00:00')), '2026-' + String(i + 1).padStart(2, '0') + '-05'));
});

test('A33. Блокування таблиці недоступне (інший процес): замовлення не губиться — повтор через хвилину', () => {
  const env = fresh();
  let busy = 1;
  env.ctx.LockService = { getScriptLock: () => ({ waitLock() { if (busy-- > 0) throw new Error('Lock timeout: Could not obtain lock after 30 seconds.'); }, releaseLock() {}, tryLock: () => true }) };
  env.update(gmsg(CAP(1950, '20451550000099'))); env.poll();
  assert.equal(O(env).length, 0);
  env.poll();
  assert.equal(O(env).length, 1);
});

test('A34. Опитування не запускається двічі одночасно (свіжа мітка блокування); застаріла мітка не блокує назавжди', () => {
  const env = fresh();
  env.update(gmsg(CAP(1951, '20451550000098')));
  env.props.POLL_LOCK_TS = String(env.ctx.Date.now() - 1000);
  env.poll();
  assert.equal(O(env).length, 0, 'інший запуск ще працює');
  env.props.POLL_LOCK_TS = String(env.ctx.Date.now() - 400000);
  env.poll();
  assert.equal(O(env).length, 1, 'застаріла мітка (запуск обірвано) не блокує');
  assert.equal(env.props.POLL_LOCK_TS, undefined);
});

test('A35. Повторне «Перше налаштування» на заповненій таблиці нічого не губить (замовлення, оплати, налаштування, прайс, звірки)', () => {
  const env = fresh();
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  env.ctx.bot_setSetting('REPORT_WARN_DAYS', '5');
  env.ctx.bot_setSetting('NP_SENDER_PHONE', '380670000000');
  env.update(priv('/price Худі фліс 810 08.10.2026')); env.poll();
  env.update(cb(env.lastSent().reply_markup.inline_keyboard[0][0].callback_data, env.lastSent().message_id)); env.poll();
  const snap = () => JSON.stringify([env.rows('Замовлення'), env.rows('Оплати'), env.rows('Прайс'), env.rows('Налаштування'), env.rows('Звірки')]);
  const before = snap();
  env.setup(); env.setup();
  assert.equal(snap(), before);
  assert.ok(env.sheet('Замовлення').getMaxRows() >= 10000);
  assert.equal(env.ctx.bot_setting('REPORT_WARN_DAYS'), '5');
});

test('A36. Номер ТТН із числа не залежить від toLocaleString/Intl (Apps Script)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'apps-script', 'Core.gs'), 'utf8');
  assert.ok(!/toLocale|Intl\./.test(src), 'у чистій логіці немає Intl/toLocale*');
  assert.equal(B.bot_normTtn(20451553931463), '20451553931463');
  assert.equal(B.bot_normTtn(20451553931463.4), '20451553931463');
  assert.equal(B.bot_normTtn(-5), '');
});

// ===================================================================== меню (діалоги)
function fakeUi(env, answers) {
  const log = [];
  const ui = {
    Button: { OK: 'OK', CANCEL: 'CANCEL', YES: 'YES', NO: 'NO' }, ButtonSet: { OK: 'OK', OK_CANCEL: 'OK_CANCEL', YES_NO: 'YES_NO' },
    alert: (t, text, buttons) => { log.push({ kind: 'alert', t, text }); return buttons === 'YES_NO' ? 'YES' : 'OK'; },
    prompt: (t, text) => { const a = answers.shift(); log.push({ kind: 'prompt', t, text, a }); return { getSelectedButton: () => (a === null ? 'CANCEL' : 'OK'), getResponseText: () => (a === null ? '' : a) }; }
  };
  env.ctx.SpreadsheetApp.getUi = () => ui;
  return log;
}

test('A37. Пункти меню: токен, ключ НП, імпорт зі старої таблиці, імпорт з Telegram — без помилок виконання, з правильними повідомленнями', () => {
  const html = fs.readFileSync(path.join(ROOT, 'test-data', 'telegram-export-sample.html'), 'utf8');
  const env = fresh({ driveFiles: { 'FILEID_1234567890ABCDEF': html } });
  // токен: невалідний → відмова; валідний → прийнято
  let log = fakeUi(env, ['не токен', TOKEN]);
  env.props.TG_TOKEN = '';
  assert.equal(env.ctx.bot_menuToken(), false);
  assert.equal(env.props.TG_TOKEN || '', '');
  assert.equal(env.ctx.bot_menuToken(), true);
  assert.equal(env.props.TG_TOKEN, TOKEN);
  assert.ok(log.some(l => l.kind === 'alert' && /monoclo_test_bot/.test(l.text)));
  // ключ НП
  log = fakeUi(env, ['TESTKEY123']); env.np.handler = () => [];
  env.ctx.bot_menuNpKey(); assert.equal(env.props.NP_API_KEY, 'TESTKEY123');
  log = fakeUi(env, ['']); env.ctx.bot_menuNpKey(); assert.equal(env.props.NP_API_KEY, undefined, 'порожнє поле видаляє ключ');
  // імпорт зі старої таблиці: неправильне посилання, потім правильне
  log = fakeUi(env, ['https://example.com/x']); env.ctx.bot_menuImport();
  assert.ok(log.some(l => /не схоже на посилання/i.test(l.t + l.text)));
  log = fakeUi(env, ['https://docs.google.com/spreadsheets/d/old']); env.ctx.bot_menuImport();
  assert.equal(O(env).length, 1470);
  assert.ok(log.some(l => /Імпорт завершено/.test(l.t)));
  // повторний імпорт у непорожню — відмова
  log = fakeUi(env, []); env.ctx.bot_menuImport();
  assert.ok(log.some(l => /неможливий/i.test(l.t)));
  // імпорт з Telegram: посилання + «з якого номера» (порожньо)
  log = fakeUi(env, ['https://drive.google.com/file/d/FILEID_1234567890ABCDEF/view', '']);
  env.ctx.bot_menuTgImport();
  assert.equal(O(env).length, 1470 + 74);
  assert.ok(log.some(l => /Готово/.test(l.t) && /Додано замовлень: 74/.test(l.text)));
  assert.ok(env.sentTo(OWNER).some(s => /Імпорт замовлень з Telegram завершено/.test(s.text)));
  // нечислове «з якого номера»
  log = fakeUi(env, ['https://drive.google.com/file/d/FILEID_1234567890ABCDEF/view', 'abc']); env.ctx.bot_menuTgImport();
  assert.ok(log.some(l => /Не число/.test(l.t)));
  // файл без доступу → зрозуміла помилка, а не виняток
  log = fakeUi(env, ['https://drive.google.com/file/d/NOACCESS_1234567890ABCDE/view', '']); env.ctx.bot_menuTgImport();
  assert.ok(log.some(l => /Імпорт не вдався/.test(l.t)));
  // увімкнення / вимкнення
  log = fakeUi(env, []); env.ctx.bot_menuEnable(); env.ctx.bot_menuDisable();
  assert.equal(env.props.BOT_ENABLED, '0');
  env.ctx.bot_menuHealth(); env.ctx.bot_menuLog();
});

test('A38. Службові функції: hex від MD5, «Перше налаштування» з меню на повністю налаштованій таблиці, перевірка часового поясу', () => {
  const env = fresh();
  assert.equal(env.ctx.bot_hex_([10, -1, 0, 127, -128, 1]), '0aff007f8001');
  const log = fakeUi(env, []);
  env.ctx.bot_menuSetup();
  assert.ok(log.some(l => /Готово!/.test(l.t)));
  assert.ok(env.ctx.bot_healthChecks().some(c => /Часовий пояс таблиці: Київ/.test(c) && c.startsWith('🟢')));
});

// ===================================================================== HTML-розмітка повідомлень (parse_mode=HTML)
function htmlProblems(text) {
  const problems = [];
  const allowed = new Set(['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'code', 'pre', 'a']);
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^<>]*)>/g;
  let m, last = 0, plain = '';
  while ((m = re.exec(text))) {
    plain += text.slice(last, m.index); last = re.lastIndex;
    const [, close, tag] = m; const t = tag.toLowerCase();
    if (!allowed.has(t)) problems.push('недозволений тег <' + tag + '>');
    if (close) { if (stack.pop() !== t) problems.push('незбалансований тег </' + tag + '>'); } else stack.push(t);
  }
  plain += text.slice(last);
  if (stack.length) problems.push('незакриті теги: ' + stack.join(','));
  if (/[<>]/.test(plain)) problems.push('неекранований < або > у тексті: ' + (plain.match(/.{0,15}[<>].{0,15}/) || [''])[0]);
  if (/&(?!(amp|lt|gt|quot);)/.test(plain)) problems.push('неекранований & у тексті: ' + (plain.match(/.{0,15}&(?!(amp|lt|gt|quot);).{0,15}/) || [''])[0]);
  return problems;
}

test('A39. Усі повідомлення бота — коректний HTML для Telegram навіть із «підступними» назвами (<, >, &, лапки), довгими списками і різними сценаріями', () => {
  const env = fresh();
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  const nasty = ['Принт <b>жирний</b> & "лапки" <script>', "O'Reilly <3 & more", 'a < b > c &amp; d'];
  const orders = O(env);
  env.ctx.bot_patchOrders(orders.filter(o => set46.has(o.ttn)).map((o, i) => ({ row: o._row, fields: { print: nasty[i % 3], paid: 'Не оплачено', paidDate: '', recon: '', note: 'Спірна, <x>' } })));
  // файл зі зміненою сумою + вигаданою ТТН + дублем + назвою з «<»
  const vals = readSheet('46000.xlsx').map(r => r.slice());
  vals[1][3] = 740; vals.splice(3, 0, ['20451545999999', 'Получено', '', 420]); vals.splice(4, 0, [vals[1][0], 'Получено', '', 420]);
  env.ctx.__vals = vals; env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: 'a&b<c>.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
  env.update(priv(undefined, { text: undefined, document: { file_name: 'a&b<c>.xlsx', file_id: 'f', file_size: 5000 } })); env.poll();
  const sum = env.tg.sent.find(x => /Звірка З-/.test(x.text)); const id = sum.text.match(/Звірка (З-[\d-]+)/)[1];
  const diff = env.tg.sent.filter(x => /Розбіжності|^•/.test(x.text)).pop();
  env.update(cb('det|' + id, sum.message_id)); env.update(cb('sup|' + id, diff.message_id)); env.update(cb('dsp|' + id, diff.message_id)); env.poll();
  const dec = env.tg.sent.find(x => /⚖️/.test(x.text));
  env.update(cb(dec.reply_markup.inline_keyboard[0][2].callback_data, dec.message_id)); env.poll();          // відкласти
  env.update(cb(dec.reply_markup.inline_keyboard[0][1].callback_data, dec.message_id)); env.poll();          // за файлом (підтвердження)
  env.update(priv('/find 20451545005600')); env.update(priv('/borg')); env.update(priv('/disputes')); env.update(priv('/history')); env.update(priv('/price')); env.update(priv('/help')); env.update(priv('/month 2026-09')); env.update(priv('/report')); env.update(priv('/files'));
  env.update(cb('pay|' + id, sum.message_id)); env.poll();
  env.update(cb('payy|' + id, env.lastSent().message_id)); env.poll();
  env.update(cb('cnc|' + id, sum.message_id)); env.poll();
  // живе замовлення з «підступним» текстом + помилкою
  env.update(gmsg('1990. Принт <i>&</i>\nХуді\nL\n\nПринт позаду\n\n204515', 9990)); env.poll();
  // ранковий звіт
  env.setNow('2026-10-05T06:01:00Z'); env.poll();
  const all = env.tg.sent.map(x => ({ t: x.text, w: 'sent' })).concat(env.tg.edits.map(x => ({ t: x.text, w: 'edit' })));
  const joined = all.map(x => x.t).join('\n=====\n');
  ['Звірка З-', 'Розбіжності', 'Деталі ·', 'У файлі', '⚖️', 'Знайдено рядків', 'Борг:', 'Відкладені ТТН', 'Останні звірки', 'Чинні ціни', 'Що вмію',
    'Місячний звіт', 'Папка', 'Точно?', 'Підтверджено', 'не вказано', 'Не передані до відправки'].forEach(k =>
    assert.ok(joined.includes(k), 'у перевірці немає сценарію: ' + k));
  const bad = all.map(x => ({ x, p: htmlProblems(x.t) })).filter(r => r.p.length);
  assert.equal(bad.length, 0, bad.slice(0, 3).map(r => r.p.join('; ') + ' ⟶ ' + r.x.t.slice(0, 160).replace(/\n/g, '⏎')).join('\n'));
  all.forEach(x => assert.ok(visible(x.t).length <= 4096));
});

// ===================================================================== хаос-тест: випадкові дії + випадкові збої → інваріанти
function prng(seed) { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }

function chaosScenario(seed, steps) {
  const rnd = prng(seed);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const env = fresh();
  env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  env.ctx.bot_patchOrders(O(env).filter(o => set46.has(o.ttn)).map(o => ({ row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } })));
  env.props.NP_API_KEY = 'k'; env.np.handler = (p) => p.methodProperties.Documents.map(d => ({ Number: d.DocumentNumber, StatusCode: pick(['1', '5', '7', '9', '102']), Status: 'x', DateCreated: '2026-10-01 10:00:00' }));
  const base = readSheet('46000.xlsx');
  let chaos = 0;
  ['bot_patchOrders', 'bot_appendOrderRow', 'bot_reconPatch', 'bot_addPaymentRow_', 'bot_send', 'bot_edit', 'bot_writeDetails_', 'bot_refreshDetails_', 'bot_setDetailDecision_', 'bot_archiveFile'].forEach(name => {
    const real = env.ctx[name];
    env.ctx[name] = (...a) => { if (chaos > 0 && rnd() < chaos) throw new Error('chaos:' + name); return real(...a); };
  });
  const posted = [];
  let nextNo = 3000, msgSeq = 80000;
  const sendFile = (mut) => {
    const vals = base.map(r => r.slice());
    if (mut) mut(vals);
    env.ctx.__vals = vals; env.run('bot_blobToValues_ = function () { return __vals; };');
    env.state.nextFile = { name: '46000.xlsx', bytes: fs.readFileSync(path.join(ROOT, 'test-data', '46000.xlsx')) };
    env.update(priv(undefined, { text: undefined, document: { file_name: '46000.xlsx', file_id: 'f' + (++mid), file_size: 5000 } }));
  };
  const lastBtn = (re) => { for (let i = env.tg.sent.length - 1; i >= 0; i--) { const m = env.tg.sent[i]; const kb = m.reply_markup && m.reply_markup.inline_keyboard; if (kb) for (const row of kb) for (const b of row) if (re.test(b.callback_data || '')) return { b, m }; } return null; };
  const actions = [
    () => { const no = nextNo++; const id = ++msgSeq; posted.push({ id, no }); env.update(gmsg(CAP(no, String(20451590000000 + no)) + (rnd() < 0.3 ? '\n\n' + CAP(nextNo++, String(20451590000000 + no)).replace(/\n\n\d+$/, '') : ''), id)); },
    () => { if (posted.length) { const p = pick(posted); env.update(gmsg(CAP(p.no, String(20451590000000 + p.no)).replace('L\n', pick(['S', 'M', 'XL']) + '\n'), p.id, 'edited_message')); } },
    () => { if (posted.length) { const p = pick(posted); env.update(gmsg(CAP(p.no, String(20451590000000 + p.no)), ++msgSeq)); } },
    () => sendFile(null),
    () => sendFile(v => { v[1 + Math.floor(rnd() * 70)][3] = pick([420, 740, 1160, 810]); }),
    () => { const x = lastBtn(/^pay\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); },
    () => { const x = lastBtn(/^payy\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); },
    () => { const x = lastBtn(/^payy\|/) || lastBtn(/^pay\|/); if (x) { env.update(cb('payy|' + x.b.callback_data.split('|')[1], x.m.message_id)); env.update(cb('payy|' + x.b.callback_data.split('|')[1], x.m.message_id)); } },
    () => { const x = lastBtn(/^dsp\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); },
    () => { const x = lastBtn(/^rs\|/); if (x) env.update(cb(x.b.callback_data.replace(/\|[tfd]$/, '|' + pick(['t', 'f', 'd'])), x.m.message_id)); },
    () => { const x = lastBtn(/^rsy\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); },
    () => { const x = lastBtn(/^opy\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); },
    () => { const rec = env.ctx.bot_reconList().filter(r => r.status === 'Підтверджено').pop(); if (rec) { env.update(priv('/undo ' + rec.id)); const x = lastBtn(/^undy\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); } },
    () => { const x = lastBtn(/^cnc\|/); if (x) env.update(cb(x.b.callback_data, x.m.message_id)); },
    () => { if (posted.length) env.update(priv('/cancel ' + pick(posted).no)); },
    () => env.update(priv(pick(['/borg', '/history', '/disputes', '/report', '/find ' + pick(Array.from(set46))]))),
    () => { env.ctx.bot_npUpdate({}); },
    () => env.update(priv('/price ' + pick(['Футболка 430', 'Худі фліс 810', 'Худі не утеплене 760']) + ' 08.10.2026')),
  ];
  for (let i = 0; i < steps; i++) {
    chaos = rnd() < 0.55 ? 0.25 : 0;
    try { pick(actions)(); } catch (e) { /* дія в тесті могла впасти через збій — це теж частина хаосу */ }
    const polls = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < polls; k++) env.poll();
  }
  chaos = 0;
  for (let k = 0; k < 6; k++) env.poll();                      // дренаж: повторні спроби
  return env;
}

function checkInvariants(env, label) {
  const rows = O(env);
  const recs = env.ctx.bot_reconList();
  const pays = env.ctx.bot_readPayments();
  // I1: ключі msg_id унікальні; № замовлень, створених ботом, унікальні
  const keys = rows.filter(r => r.msgId).map(r => r.msgId);
  assert.equal(new Set(keys).size, keys.length, label + ': дублікати msg_id');
  const liveNos = rows.filter(r => r.msgId).map(r => r.no);
  assert.equal(new Set(liveNos).size, liveNos.length, label + ': дублікати № замовлень, створених ботом');
  // I2: ТТН не оплачена двома різними звірками
  const byTtn = {};
  rows.filter(r => r.ttn && r.paid === 'Оплачено' && /^З-/.test(r.recon)).forEach(r => { (byTtn[r.ttn] = byTtn[r.ttn] || new Set()).add(r.recon); });
  Object.keys(byTtn).forEach(t => assert.equal(byTtn[t].size, 1, label + ': ТТН ' + t + ' оплачена кількома звірками: ' + [...byTtn[t]].join(',')));
  // I3: «Оплачено» зі звіркою завжди має дату оплати; рядок кожної ТТН оплачений цілком
  rows.filter(r => r.paid === 'Оплачено' && /^З-/.test(r.recon)).forEach(r => assert.ok(r.paidDate, label + ': «Оплачено» без дати, №' + r.no));
  Object.keys(byTtn).forEach(t => {
    const all = rows.filter(r => r.ttn === t && (r.status === 'В роботі' || r.cost > 0));
    assert.ok(all.every(r => r.paid === 'Оплачено'), label + ': ТТН ' + t + ' оплачена частково (' + all.map(r => r.paid).join(',') + ')');
  });
  // I4: підтверджена звірка = сума оплачених нею рядків; відкликана — без рядків
  recs.forEach(rec => {
    const mine = rows.filter(r => r.recon === rec.id);
    if (rec.status === 'Підтверджено') {
      assert.ok(mine.length > 0 && mine.every(r => r.paid === 'Оплачено'), label + ': ' + rec.id + ' підтверджена, але рядки не оплачені');
      assert.equal(env.ctx.bot_sumBy_(mine, r => r.cost), Number(rec.confirmedSum), label + ': ' + rec.id + ' сума підтвердження ≠ сумі рядків');
      assert.equal(mine.length, Number(rec.rowsCount), label + ': ' + rec.id + ' кількість рядків');
    }
    if (rec.status === 'Відкликано' || rec.status === 'Скасовано') assert.equal(mine.filter(r => r.paid === 'Оплачено').length, 0, label + ': ' + rec.id + ' ' + rec.status + ', але є оплачені рядки');
  });
  // I5: не більше одного запису в «Оплатах» на звірку
  const ids = pays.map(p => p.recon).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, label + ': дубль оплати для звірки');
  // I6: усі повідомлення Telegram валідні й у межах ліміту
  env.tg.sent.concat(env.tg.edits).forEach(m => { assert.ok(visible(m.text).length <= 4096, label + ': задовге повідомлення'); const pr = htmlProblems(m.text); assert.equal(pr.length, 0, label + ': ' + pr.join('; ') + ' в «' + m.text.slice(0, 80) + '»'); });
  // I7: у логах і повідомленнях немає токена
  const logs = env.rows('Лог').map(r => r.join(' ')).join('\n') + env.tg.sent.map(m => m.text).join('\n');
  assert.ok(!logs.includes(TOKEN), label + ': токен у логах');
}

test('A40. Хаос-тест: 14 випадкових сценаріїв × 45 дій зі збоями — інваріанти (без подвійної оплати, дублів, часткових оплат, розбіжності сум) дотримані', () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  seeds.forEach(seed => { const env = chaosScenario(seed, 45); checkInvariants(env, 'seed ' + seed); });
});
