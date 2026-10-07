// Інтеграційні тести Google-шару на імітації Apps Script (див. gasmock.js): замовлення з групи, імпорт,
// звірка, оплата, відкат, ранковий звіт, НП. Дані — з test-data/.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { newEnv, oldWorkbook } = require('./gasmock');
const { readSheet, ROOT } = require('./helpers');

const OWNER = 111, GROUP = -1001234567890, ORD_T = 5, REP_T = 7;

function fresh(withImport) {
  const env = newEnv({ oldWorkbook });
  env.setup();
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; env.props.BOT_ENABLED = '1';
  env.ctx.bot_setSetting('OWNER_IDS', String(OWNER));
  env.ctx.bot_setSetting('GROUP_CHAT_ID', GROUP);
  env.ctx.bot_setSetting('ORDERS_THREAD_ID', ORD_T);
  env.ctx.bot_setSetting('REPORT_THREAD_ID', REP_T);
  env.setNow('2026-10-07T05:00:00Z');                   // середа 08:00 за Києвом — планувальник ще мовчить
  if (withImport) env.rep = env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old');
  return env;
}
let mid = 1000;
const ts = (iso) => Math.floor(Date.parse(iso) / 1000);
const groupMsg = (caption, extra, kind) => ({ [kind || 'message']: Object.assign({ message_id: ++mid, date: ts('2026-10-07T14:18:00Z'), chat: { id: GROUP, type: 'supergroup', title: 'Виробництво' }, from: { id: 999, first_name: 'Менеджер' }, is_topic_message: true, message_thread_id: ORD_T, caption }, extra) });
const privMsg = (text, extra) => ({ message: Object.assign({ message_id: ++mid, date: ts('2026-10-07T14:18:00Z'), chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'Юрій' }, text }, extra) });
const cb = (data, msgId, from) => ({ callback_query: { id: 'cb' + (++mid), from: from || { id: OWNER, first_name: 'Юрій', last_name: 'В.' }, message: { message_id: msgId, chat: { id: OWNER } }, data } });
const O = (env) => env.ctx.bot_readOrders();
const CAP = '1538. Принт Ferar1\nХуді чорне без флісу\nL\n\nПринт позаду\n\n20451553931463';

// ---------------------------------------------------------------- Модуль 1
test('Налаштування: усі аркуші, заголовки за ТЗ, ціни', () => {
  const env = fresh();
  ['Підсумки', 'Замовлення', 'Оплати', 'Прайс', 'Довідники', 'Звірки', 'Звірки_деталі', 'Місячні звіти', 'Налаштування', 'Лог'].forEach(n => assert.ok(env.sheet(n), n));
  const h = env.sheet('Замовлення').getRange(1, 1, 1, 21).getValues()[0];
  assert.deepEqual(h.slice(0, 20), ['№ замовлення', 'Дата замовлення', 'Принт', 'Тип речі', 'Колір', 'Розмір', 'Розміщення принту', 'Принтів', 'ТТН', 'Дата створення ТТН', 'Етап доставки', 'Статус НП', 'Собівартість, грн', 'Статус замовлення', 'Оплата', 'Дата оплати', 'Звірка', 'Примітка', 'msg_id', 'Дата передачі НП']);
  assert.deepEqual(env.rows('Прайс').map(r => r.slice(0, 2)), [['Футболка', 420], ['Худі фліс', 740], ['Худі не утеплене', 740]]);
  env.setup();                                           // повторний запуск нічого не ламає і не дублює
  assert.equal(env.rows('Прайс').length, 3);
  assert.equal(env.sheet('Налаштування').getLastRow(), 13);
});

test('Приймання: повідомлення 1538 → рядок за ≤1 хв, 👌; файл принта і «++++++» ігноруються', () => {
  const env = fresh();
  const m = env.update(groupMsg(CAP));
  env.update(groupMsg('', { document: { file_name: 'FERAR1 - WHITE.png' }, caption: undefined }));
  env.update(groupMsg('++++++', { caption: undefined, text: '++++++' }));
  env.poll();
  const rows = O(env);
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.no, 1538); assert.equal(r.print, 'Принт Ferar1'); assert.equal(r.type, 'Худі не утеплене'); assert.equal(r.color, 'Чорний');
  assert.equal(r.size, 'L'); assert.equal(r.placement, 'Позаду'); assert.equal(r.ttn, '20451553931463'); assert.equal(r.cost, 740);
  assert.equal(r.status, 'В роботі'); assert.equal(r.paid, 'Не оплачено'); assert.equal(r.msgId, String(m.message.message_id));
  assert.equal(env.ctx.bot_dayKey(r.date), '2026-10-07');
  // ТТН записана текстом
  const raw = env.sheet('Замовлення').getRange(2, 9).getValue();
  assert.equal(typeof raw, 'string');
  assert.equal(env.tg.reactions.length, 1);
  assert.equal(env.tg.reactions[0].reaction[0].emoji, '👌');
  assert.equal(env.tg.reactions[0].message_id, m.message.message_id);
  assert.equal(env.sentTo(OWNER).length, 0, 'без помилок власнику нічого не пишемо');
  assert.equal(env.props.UPDATE_OFFSET, String(3 + 0 + 0 + 1 - 0));
});

test('Повторна обробка того самого повідомлення не дублює рядок; чужа гілка / чужа група ігноруються', () => {
  const env = fresh();
  const u = groupMsg(CAP);
  env.update(u); env.poll();
  env.update(JSON.parse(JSON.stringify(u))); env.poll();            // той самий message_id ще раз
  env.update(groupMsg('1539. Принт X\nФутболка чорна\nS\nПринт позаду\n20451553934449', { message_thread_id: 99 }));
  env.update(groupMsg('1540. Принт X\nФутболка чорна\nS\nПринт позаду\n20451553934450', { chat: { id: -100999, type: 'supergroup' } }));
  env.poll();
  assert.equal(O(env).length, 1);
});

test('Приймання: без розміру → рядок, жовта клітинка, примітка, повідомлення власнику, ✍', () => {
  const env = fresh();
  const m = env.update(groupMsg('1541. Принт Test\nФутболка чорна\n\nПринт позаду\n\n20451553934449'));
  env.poll();
  const r = O(env)[0];
  assert.equal(r.no, 1541); assert.equal(r.size, ''); assert.equal(r.cost, 420);
  assert.match(r.note, /не вказано розмір/);
  assert.equal(env.sheet('Замовлення').getRange(2, 6).getBackground(), '#fff2cc');
  assert.equal(env.tg.reactions[0].reaction[0].emoji, '✍');
  const toOwner = env.sentTo(OWNER);
  assert.equal(toOwner.length, 1);
  assert.ok(toOwner[0].text.includes('не вказано розмір') && toOwner[0].text.includes('https://t.me/c/1234567890/5/' + m.message.message_id));
});

test('Худі без уточнення і нема ТТН: рядок додано, типу нема, власник попереджений', () => {
  const env = fresh();
  env.update(groupMsg('1542. Принт Y\nХуді чорне\nL\nПринт позаду'));
  env.poll();
  const r = O(env)[0];
  assert.equal(r.type, ''); assert.equal(r.ttn, ''); assert.equal(r.stage, 'Немає ТТН');
  assert.match(env.sentTo(OWNER)[0].text, /Худі: не вказано/);
});

test('Редагування оновлює той самий рядок (додає ТТН, виправляє розмір); оплачений рядок не чіпає', () => {
  const env = fresh();
  const first = env.update(groupMsg('1543. Принт Z\nФутболка біла\nПринт позаду'));
  env.poll();
  assert.equal(O(env).length, 1); assert.equal(O(env)[0].size, '');
  const id = first.message.message_id;
  env.update(groupMsg('1543. Принт Z\nФутболка біла\nM\nПринт позаду\n20451553934449', { message_id: id }, 'edited_message'));
  env.poll();
  let rows = O(env);
  assert.equal(rows.length, 1); assert.equal(rows[0].size, 'M'); assert.equal(rows[0].ttn, '20451553934449'); assert.equal(rows[0].note, '');
  assert.equal(env.sheet('Замовлення').getRange(2, 6).getBackground(), null);
  assert.equal(env.tg.reactions[env.tg.reactions.length - 1].reaction[0].emoji, '👌');
  // оплачений рядок
  env.ctx.bot_patchOrders([{ row: 2, fields: { paid: 'Оплачено' } }]);
  env.update(groupMsg('1543. Принт Z\nФутболка біла\nXL\nПринт позаду\n20451553934449', { message_id: id }, 'edited_message'));
  env.poll();
  assert.equal(O(env)[0].size, 'M');
  assert.match(env.lastSent().text, /вже оплачено/);
});

test('Дубль номера → не додається, власник отримує повідомлення', () => {
  const env = fresh();
  env.update(groupMsg(CAP)); env.poll();
  env.update(groupMsg(CAP)); env.poll();
  assert.equal(O(env).length, 1);
  assert.match(env.lastSent().text, /Дубль/);
});

test('Нове замовлення в кінець таблиці, а не поверх імпортованих', () => {
  const env = fresh(true);
  const before = O(env).length;
  env.update(groupMsg(CAP.replace('1538', '1600').replace('20451553931463', '20451553931999'))); env.poll();
  assert.equal(O(env).length, before + 1);
  assert.equal(O(env).pop().no, 1600);
});

test('/cancel: скасовує, собівартість 0; оплачене не скасовує', () => {
  const env = fresh();
  env.update(groupMsg(CAP)); env.poll();
  env.update(privMsg('/cancel 1538')); env.poll();
  let r = O(env)[0];
  assert.equal(r.status, 'Скасовано'); assert.equal(r.cost, 0); assert.match(r.note, /було 740/);
  env.update(groupMsg(CAP.replace('1538', '1539').replace('20451553931463', '20451553931464'))); env.poll();
  env.ctx.bot_patchOrders([{ row: 3, fields: { paid: 'Оплачено' } }]);
  env.update(privMsg('/cancel 1539')); env.poll();
  assert.equal(O(env)[1].status, 'В роботі');
  assert.match(env.lastSent().text, /уже оплачено/);
});

// ---------------------------------------------------------------- безпека
test('Безпека: чужий користувач і чужі кнопки ігноруються; перший /start стає власником', () => {
  const env = fresh();
  env.update({ message: { message_id: 1, date: 1, chat: { id: 222, type: 'private' }, from: { id: 222 }, text: '/borg' } });
  env.update({ message: { message_id: 2, date: 1, chat: { id: 222, type: 'private' }, from: { id: 222 }, document: { file_name: 'x.xlsx', file_id: 'f' } } });
  env.update(cb('pay|З-2026-10-07-1', 5, { id: 222 }));
  env.update({ message: { message_id: 3, date: 1, chat: { id: GROUP, type: 'supergroup' }, from: { id: 222 }, text: '/bind orders', is_topic_message: true, message_thread_id: 77 } });
  env.poll();
  assert.equal(env.sentTo(222).length, 0);
  assert.equal(env.ctx.bot_setting('ORDERS_THREAD_ID'), String(ORD_T), 'чужий /bind не діє');
  assert.ok(env.tg.answers.some(a => /Немає доступу/.test(a.text)));
  // новий бот без власника
  const e2 = newEnv(); e2.setup(); e2.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  e2.update({ message: { message_id: 1, date: 1, chat: { id: 555, type: 'private' }, from: { id: 555, username: 'u' }, text: '/start' } });
  e2.update({ message: { message_id: 2, date: 1, chat: { id: 666, type: 'private' }, from: { id: 666 }, text: '/start' } });
  e2.poll();
  assert.equal(e2.ctx.bot_setting('OWNER_IDS'), '555');
  assert.equal(e2.sentTo(666).length, 0);
});

test('/bind orders і /bind report зберігають гілку; відповідь видаляється через 10 с', () => {
  const env = newEnv(); env.setup(); env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  env.ctx.bot_setSetting('OWNER_IDS', '111');
  const mk = (arg, thread) => ({ message: { message_id: ++mid, date: 1, chat: { id: GROUP, type: 'supergroup' }, from: { id: OWNER }, text: '/bind ' + arg, is_topic_message: true, message_thread_id: thread } });
  env.update(mk('orders', 11)); env.update(mk('report', 22));
  env.poll();
  assert.equal(env.ctx.bot_setting('GROUP_CHAT_ID'), String(GROUP));
  assert.equal(env.ctx.bot_setting('ORDERS_THREAD_ID'), '11');
  assert.equal(env.ctx.bot_setting('REPORT_THREAD_ID'), '22');
  assert.ok(env.sentTo(GROUP).every(s => s.message_thread_id === 11 || s.message_thread_id === 22));
  assert.ok(JSON.parse(env.props.PENDING_DELETE).length === 2);
});

// ---------------------------------------------------------------- Імпорт
test('Імпорт: 1470 рядків, 642 200 / 522 547 / 119 653, ТТН текстом, оплачено поширено', () => {
  const env = fresh(true);
  const rep = env.rep;
  assert.equal(rep.rows, 1470); assert.equal(rep.cost, 642200); assert.equal(rep.paid, 522547); assert.equal(rep.debt, 119653);
  assert.equal(rep.payments, 24);
  const rows = O(env);
  assert.equal(rows.length, 1470);
  assert.ok(rows.filter(r => r.ttn).every(r => /^\d{14}$/.test(r.ttn)));
  assert.equal(env.ctx.bot_sumBy_(rows, r => r.cost), 642200);
  assert.ok(rows.filter(r => r.paid === 'Оплачено').every(r => r.recon === 'Імпорт'));
  const pays = env.ctx.bot_readPayments();
  assert.equal(pays.length, 24);
  assert.match(String(env.sheet('Оплати').getRange(2, 6).getValue()), /^=SUM\(\$C\$2:C2\)$/);
  // друга спроба в непорожню таблицю — відмова
  assert.throws(() => env.ctx.bot_importFromUrl('https://docs.google.com/spreadsheets/d/old'), /порожню/);
  assert.match(env.ctx.bot_importReportText(rep, false), /Рядків замовлень: 1470/);
  const d = env.ctx.bot_computeDebt(rows, pays);
  assert.equal(d.debt, 119653);
});

// ---------------------------------------------------------------- Звірка
const FILE = path.join(ROOT, 'test-data', '46000.xlsx');
function sendFile(env, vals, name) {
  env.ctx.__vals = vals;
  env.run('bot_blobToValues_ = function () { return __vals; };');
  env.state.nextFile = { name: name || '46000.xlsx', bytes: fs.readFileSync(FILE) };
  env.update(privMsg(undefined, { text: undefined, document: { file_name: name || '46000.xlsx', file_id: 'f1', file_size: 5000 } }));
  env.poll();
}
const unpay46000 = (env) => {
  const set = new Set(readSheet('46000.xlsx').slice(1).map(r => String(r[0])).filter(x => /^\d{14}$/.test(x)));
  env.ctx.bot_patchOrders(O(env).filter(o => set.has(o.ttn)).map(o => ({ row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } })));
};

test('Приймання: 46000.xlsx на поточній таблиці → 74 × 🔁, до оплати 0, кнопки «Оплатити» немає', () => {
  const env = fresh(true);
  sendFile(env, readSheet('46000.xlsx'));
  const summary = env.tg.sent.find(s => /Звірка З-/.test(s.text));
  assert.ok(summary, 'зведення надіслано');
  assert.match(summary.text, /ТТН у файлі: 74 · сума файлу: 46 000 грн/);
  assert.match(summary.text, /До оплати: 0 ТТН — 0 грн/);
  assert.match(summary.text, /Вже оплачено: 74 ТТН — 46 000 грн/);
  assert.ok(!JSON.stringify(summary.reply_markup).includes('pay|'));
  assert.equal(env.rows('Звірки')[0][9], 'Чернетка');
  assert.equal(env.rows('Звірки_деталі').length, 74);
  assert.ok(env.files.created.length === 1 && /^\d{4}-\d{2}-\d{2}_З-/.test(env.files.created[0].name));
  assert.ok(env.rows('Звірки')[0][2].startsWith('https://drive.example/'));       // посилання на архів файлу
  const diffs = env.tg.sent.filter(s => /Розбіжності|^•/.test(s.text));
  assert.ok(diffs.length >= 1 && /Вже оплачено раніше \(74\)/.test(diffs[0].text));
  const lastDiff = diffs[diffs.length - 1];                                        // кнопки — під останньою частиною
  assert.ok(JSON.stringify(lastDiff.reply_markup).includes('sup|') && JSON.stringify(lastDiff.reply_markup).includes('📁'));
});

test('Приймання: 46000.xlsx на копії, де не оплачено → 74 ✅ 46 000 грн; після підтвердження 92 рядки; захист від подвійного тапу', () => {
  const env = fresh(true);
  unpay46000(env);
  sendFile(env, readSheet('46000.xlsx'));
  const summary = env.tg.sent.find(s => /Звірка З-/.test(s.text));
  assert.match(summary.text, /До оплати: 74 ТТН — 46 000 грн/);
  assert.match(summary.text, /з них відмов: 4/);
  assert.match(summary.text, /Розбіжностей немає/);
  assert.ok(!env.tg.sent.some(s => /Розбіжності ·/.test(s.text)), 'другого повідомлення немає');
  const id = summary.text.match(/Звірка (З-[\d-]+)/)[1];
  assert.equal(id, 'З-2026-10-07-1');
  const payBtn = JSON.stringify(summary.reply_markup);
  assert.ok(payBtn.includes('Оплатити 46 000 грн'));
  // 1-й крок: «Точно?»
  env.update(cb('pay|' + id, summary.message_id)); env.poll();
  const ask = env.lastSent();
  assert.match(ask.text, /Точно\?.*92.*рядки.*46 000 грн/s);
  // таблиця ще не змінилась
  assert.equal(O(env).filter(o => o.recon === id).length, 0);
  // 2-й крок + подвійний тап
  env.update(cb('payy|' + id, ask.message_id)); env.update(cb('payy|' + id, ask.message_id)); env.poll();
  const paid = O(env).filter(o => o.recon === id);
  assert.equal(paid.length, 92);
  assert.ok(paid.every(o => o.paid === 'Оплачено' && o.paidDate));
  const rec = env.ctx.bot_reconGet(id);
  assert.equal(rec.status, 'Підтверджено'); assert.equal(rec.confirmedSum, 46000); assert.equal(rec.rowsCount, 92);
  assert.equal(env.tg.answers.filter(a => /Вже підтверджено/.test(a.text || '')).length, 1);
  assert.equal(env.tg.answers.filter(a => a.text === 'Підтверджено').length, 1);
  assert.ok(env.tg.edits.some(e => /Підтверджено \d\d\.\d\d \d\d:\d\d · 92 рядки · 46 000 грн/.test(e.text) && e.message_id === summary.message_id));
  // пропозиція записати оплату
  const q = env.lastSent();
  assert.match(q.text, /Додати оплату <b>46 000 грн<\/b>/);
  const before = env.ctx.bot_readPayments().length;
  env.update(cb('opy|' + id + '|46000', q.message_id)); env.update(cb('opy|' + id + '|46000', q.message_id)); env.poll();
  const pays = env.ctx.bot_readPayments();
  assert.equal(pays.length, before + 1);
  assert.equal(pays[pays.length - 1].sum, 46000); assert.equal(pays[pays.length - 1].recon, id); assert.equal(pays[pays.length - 1].no, 25);
  assert.match(env.sheet('Оплати').getRange(pays[pays.length - 1]._row, 7).getValue(), /Підсумки/);
  assert.ok(env.tg.edits.some(e => /Оплату <b>46 000 грн<\/b> додано/.test(e.text)));
  assert.ok(env.tg.edits.some(e => /уже додано/.test(e.text)));
  // повторне надсилання файлу → червоне попередження і 0 до оплати
  sendFile(env, readSheet('46000.xlsx'));
  const again = env.tg.sent.filter(s => /Звірка З-/.test(s.text)).pop();
  assert.match(again.text, new RegExp('Цей файл уже оплачено звіркою ' + id));
  assert.match(again.text, /До оплати: 0 ТТН/);
  // /undo
  env.update(privMsg('/undo ' + id)); env.poll();
  const uq = env.lastSent();
  assert.match(uq.text, /Відкликати звірку/);
  env.update(cb('undy|' + id, uq.message_id)); env.poll();
  assert.equal(O(env).filter(o => o.recon === id).length, 0);
  assert.equal(O(env).filter(o => o.paid === 'Оплачено' && set46(env, o)).length, 0);
  assert.equal(env.ctx.bot_reconGet(id).status, 'Відкликано');
  assert.ok(env.tg.edits.some(e => /Рядок оплати №25/.test(e.text)), 'нагадує про рядок оплати');
  assert.equal(env.ctx.bot_readPayments().length, before + 1, 'рядок оплати не видаляється');
});
const set46 = (env, o) => new Set(readSheet('46000.xlsx').slice(1).map(r => String(r[0])).filter(x => /^\d{14}$/.test(x))).has(o.ttn);

test('Скасувати звірку: таблиця не змінюється; стара кнопка — «вже скасовано»', () => {
  const env = fresh(true);
  unpay46000(env);
  sendFile(env, readSheet('46000.xlsx'));
  const s = env.tg.sent.find(x => /Звірка З-/.test(x.text));
  const id = s.text.match(/Звірка (З-[\d-]+)/)[1];
  env.update(cb('cnc|' + id, s.message_id)); env.poll();
  assert.equal(env.ctx.bot_reconGet(id).status, 'Скасовано');
  assert.equal(O(env).filter(o => o.recon === id).length, 0);
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  assert.ok(env.tg.edits.some(e => /Вже скасовано/.test(e.text)));
  assert.equal(O(env).filter(o => o.recon === id).length, 0);
});

test('Приймання: змінена сума + вигадана ТТН → ⚠️ і ❌, +320 «худі замість футболки», +420, разом +740; рішення «за таблицею / за файлом / відкласти»', () => {
  const env = fresh(true);
  unpay46000(env);
  const vals = readSheet('46000.xlsx').map(r => r.slice());
  const orders = O(env);
  const idx = vals.findIndex((r, i) => i > 0 && r[3] === 420 && orders.filter(o => o.ttn === String(r[0])).length === 1);
  const changed = String(vals[idx][0]);
  vals[idx][3] = 740;
  vals.splice(vals.length - 4, 0, ['20451545999999', 'Получено', '', 420]);
  sendFile(env, vals);
  const summary = env.tg.sent.find(x => /Звірка З-/.test(x.text));
  const id = summary.text.match(/Звірка (З-[\d-]+)/)[1];
  assert.match(summary.text, /Сума не збігається: 1 ТТН — файл 740 \/ таблиця 420/);
  assert.match(summary.text, /Немає в таблиці: 1 ТТН — 420 грн/);
  assert.match(summary.text, /До оплати: 73 ТТН — 45 580 грн/);                 // 46 000 − 420 (спірна)
  const diff = env.tg.sent.find(x => /Розбіжності ·/.test(x.text));
  assert.match(diff.text, /\+320 грн/); assert.match(diff.text, /худі замість футболки \(740 − 420\)/);
  assert.match(diff.text, /20451545999999.*\+420 грн/);
  assert.match(diff.text, /Разом різниця: \+740 грн/);
  assert.ok(JSON.stringify(diff.reply_markup).includes('dsp|'));
  // текст для виробництва
  env.update(cb('sup|' + id, diff.message_id)); env.poll();
  const sup = env.lastSent().text;
  assert.ok(sup.includes('У файлі 46000.xlsx не сходяться:') && sup.includes('у вас 740, у нас 420') && sup.includes('не має') === false && !sup.includes(id));
  // рішення по ТТН
  env.update(cb('dsp|' + id, diff.message_id)); env.poll();
  const dec = env.lastSent();
  assert.ok(dec.text.includes(changed));
  const kb = dec.reply_markup.inline_keyboard[0];
  assert.equal(kb.length, 3);
  const tap = (btn) => { env.update(cb(btn.callback_data, dec.message_id)); env.poll(); };
  tap(kb[0]);                                                                      // за таблицею 420 → ТТН повертається в «До оплати»
  let rec = env.ctx.bot_reconGet(id);
  assert.equal(rec.toPay, 46000);                                                  // 73 ТТН (45 580) + спірна за таблицею 420
  tap(kb[2]);                                                                      // відкласти → «Спірна» + примітка, сума знову без неї
  assert.equal(env.ctx.bot_reconGet(id).toPay, 45580);
  let row = O(env).find(o => o.ttn === changed);
  assert.equal(row.paid, 'Спірна'); assert.match(row.note, new RegExp('Спірна, ' + id));
  env.update(privMsg('/disputes')); env.poll();
  assert.match(env.lastSent().text, new RegExp(changed));
  tap(kb[1]);                                                                      // за файлом → підтвердження → собівартість 740
  assert.ok(env.tg.edits.some(e => /Оновити собівартість ТТН з <b>420<\/b> на <b>740<\/b>/.test(e.text)));
  env.update(cb('rsy|' + id + '|' + kb[1].callback_data.split('|')[2], dec.message_id)); env.poll();
  row = O(env).find(o => o.ttn === changed);
  assert.equal(row.cost, 740); assert.equal(row.paid, 'Не оплачено'); assert.match(row.note, /було 420 → стало 740/);
  assert.equal(env.ctx.bot_reconGet(id).toPay, 46320);                             // 45 580 + 740 за файлом
});

// ---------------------------------------------------------------- Планувальник і звіти
const mkOrder = (env, over) => {
  const base = { no: 1, date: env.ctx.bot_makeDate(2026, 10, 1), print: 'Принт X', type: 'Футболка', color: 'Чорний', size: 'S', placement: 'Позаду', prints: 1, ttn: '', stage: 'Не передана', cost: 420, status: 'В роботі', paid: 'Не оплачено' };
  return env.ctx.bot_appendOrderRow(Object.assign(base, over), []);
};

test('Ранковий звіт: пн 09:01 — одне повідомлення в гілку «Реєстри»; повторно ні; неділя — ні; /report лише власнику', () => {
  const env = fresh();
  mkOrder(env, { no: 1462, ttn: '20451548987230', ttnDate: env.ctx.bot_makeDate(2026, 10, 1) });
  mkOrder(env, { no: 1465, ttn: '20451549653731', ttnDate: env.ctx.bot_makeDate(2026, 10, 2) });
  mkOrder(env, { no: 1466, ttn: '20451549653731', ttnDate: env.ctx.bot_makeDate(2026, 10, 2), color: 'Білий' });
  env.setNow('2026-10-05T05:55:00Z');                       // пн 08:55 — ще рано
  env.poll();
  assert.equal(env.sentTo(GROUP).length, 0);
  env.setNow('2026-10-05T06:01:00Z');                       // пн 09:01
  env.poll();
  let g = env.sentTo(GROUP);
  assert.equal(g.length, 1);
  assert.equal(g[0].message_thread_id, REP_T);
  assert.match(g[0].text, /Не передані до відправки — 2 ТТН/);
  assert.ok(g[0].text.indexOf('20451548987230') < g[0].text.indexOf('20451549653731'));
  env.setNow('2026-10-05T06:03:00Z'); env.poll();
  assert.equal(env.sentTo(GROUP).length, 1, 'двічі не надсилається');
  env.setNow('2026-10-11T06:30:00Z'); env.poll();            // неділя
  assert.equal(env.sentTo(GROUP).length, 1);
  env.setNow('2026-10-12T06:30:00Z'); env.poll();            // наступний понеділок
  assert.equal(env.sentTo(GROUP).length, 2);
  // /report — лише власнику, не в групу
  env.update(privMsg('/report')); env.poll();
  assert.equal(env.sentTo(GROUP).length, 2);
  assert.match(env.sentTo(OWNER).pop().text, /Не передані до відправки/);
});

test('Ранковий звіт: «thread not found» → не в загальний чат, а власнику з проханням /bind report', () => {
  const env = fresh();
  mkOrder(env, { no: 1, ttn: '20451548987230' });
  env.tg.fail.sendMessage = null;
  env.setNow('2026-10-06T06:01:00Z');
  const origCalls = env.tg.calls.length;
  // перше повідомлення в групу падає, власнику — проходить
  const real = env.ctx.bot_tgRaw;
  env.ctx.bot_tgRaw = (m, p) => (m === 'sendMessage' && String(p.chat_id) === String(GROUP) ? { ok: false, description: 'Bad Request: message thread not found' } : real(m, p));
  env.poll();
  const owner = env.sentTo(OWNER);
  assert.ok(owner.some(s => /thread not found/.test(s.text) && /\/bind report/.test(s.text)));
  assert.ok(owner.some(s => /Не передані до відправки/.test(s.text)));
  assert.equal(env.tg.sent.filter(s => String(s.chat_id) === String(GROUP)).length, 0);
  assert.ok(env.props.LAST_REPORT_DATE, 'не повторюємо щохвилини');
});

test('Звіт: «Усі ТТН передані», коли нічого немає', () => {
  const env = fresh();
  env.setNow('2026-10-06T06:01:00Z'); env.poll();
  assert.match(env.sentTo(GROUP)[0].text, /Усі ТТН передані до відправки/);
});

const npItem = (ttn, code, status, extra) => Object.assign({ Number: ttn, StatusCode: String(code), Status: status, DateCreated: '2026-10-06 12:00:00' }, extra);

test('Нова пошта: етап за кодом, дата створення, дата передачі пишеться один раз, невідомий код не міняє етап', () => {
  const env = fresh();
  env.props.NP_API_KEY = 'key';
  mkOrder(env, { no: 1, ttn: '20451553931463', stage: '' });
  mkOrder(env, { no: 2, ttn: '20451553934449', stage: '' });
  let items = { '20451553931463': npItem('20451553931463', 1, 'Відправник самостійно створив цю накладну, але ще не надав до відправки'), '20451553934449': npItem('20451553934449', 777, 'Дивний статус') };
  env.np.handler = () => Object.values(items);
  env.setNow('2026-10-07T07:00:00Z');
  let r = env.ctx.bot_npUpdate({});
  assert.equal(r.checked, 2);
  let o = O(env);
  assert.equal(o[0].stage, 'Не передана'); assert.match(o[0].npStatus, /^Відправник самостійно створив/);
  assert.equal(env.ctx.bot_dayKey(o[0].ttnDate), '2026-10-06');
  assert.equal(o[0].handoff, null);
  assert.equal(o[1].stage, '', 'невідомий код — етап не змінюємо');
  assert.ok(env.rows('Лог').some(l => /невідомий код НП/.test(l[2])));
  // ТТН передали
  items['20451553931463'] = npItem('20451553931463', 5, 'Відправлення прямує до м. Київ', { ScheduledDeliveryDate: '2026-10-09 12:00:00' });
  env.setNow('2026-10-08T07:00:00Z');
  env.ctx.bot_npUpdate({});
  o = O(env);
  assert.equal(o[0].stage, 'В дорозі'); assert.match(o[0].npStatus, /\(очік\. доставка: 09-10-2026 12:00:00\)$/);
  assert.equal(env.ctx.bot_dayKey(o[0].handoff), '2026-10-08');
  const h1 = o[0].handoff.getTime();
  // повторне оновлення не міняє «Дату передачі НП»
  items['20451553931463'] = npItem('20451553931463', 7, 'Прибув на відділення');
  env.setNow('2026-10-09T07:00:00Z');
  env.ctx.bot_npUpdate({});
  o = O(env);
  assert.equal(o[0].stage, 'На відділенні'); assert.equal(o[0].handoff.getTime(), h1);
  assert.ok(o[0].arrived);
  // кінцеві етапи більше не опитуються
  items['20451553931463'] = npItem('20451553931463', 9, 'Відправлення отримано');
  env.ctx.bot_npUpdate({});
  const callsBefore = env.np.calls.length;
  env.ctx.bot_npUpdate({});
  assert.equal(O(env)[0].stage, 'Отримано');
  assert.equal(env.np.calls.length, callsBefore + 1, 'ТТН 2 ще без етапу — запит лише на неї');
  assert.equal(env.np.calls[env.np.calls.length - 1].methodProperties.Documents.length, 1);
});

test('Нова пошта: пакети по 100 ТТН; нове замовлення з ТТН одразу отримує статус', () => {
  const env = fresh();
  env.props.NP_API_KEY = 'key';
  for (let i = 0; i < 230; i++) mkOrder(env, { no: i + 1, ttn: String(20451500000000 + i), stage: '' });
  env.np.handler = (p) => p.methodProperties.Documents.map(d => npItem(d.DocumentNumber, 1, 'Відправник самостійно створив цю накладну, але ще не надав до відправки'));
  env.setNow('2026-10-07T07:00:00Z');
  const r = env.ctx.bot_npUpdate({});
  assert.equal(r.checked, 230);
  assert.deepEqual(env.np.calls.map(c => c.methodProperties.Documents.length), [100, 100, 30]);
  // нове замовлення з групи
  const env2 = fresh(); env2.props.NP_API_KEY = 'key';
  env2.np.handler = (p) => p.methodProperties.Documents.map(d => npItem(d.DocumentNumber, 1, 'Відправник самостійно створив цю накладну, але ще не надав до відправки'));
  env2.update(groupMsg(CAP)); env2.poll();
  assert.equal(O(env2)[0].stage, 'Не передана');
});

test('Посилки на відділенні 4+ дні — власнику в особисті, з ім’ям і телефоном з НП', () => {
  const env = fresh();
  env.props.NP_API_KEY = 'key';
  env.ctx.bot_setSetting('NP_SENDER_PHONE', '380670000000');
  mkOrder(env, { no: 1460, print: 'Принт AUDI A6 C7', type: 'Худі фліс', size: 'S', ttn: '20451548992026', stage: 'На відділенні' });
  mkOrder(env, { no: 1461, ttn: '20451548992027', stage: 'На відділенні' });
  env.np.handler = (p) => {
    assert.equal(p.methodProperties.Documents[0].Phone, '380670000000');
    return [npItem('20451548992026', 7, 'Прибув на відділення', { ActualDeliveryDate: '2026-10-01 10:00:00', DatePayedKeeping: '2026-10-08 00:00:00', RecipientFullName: 'Олена Коваль', PhoneRecipient: '380671112233' }),
      npItem('20451548992027', 7, 'Прибув на відділення', { ActualDeliveryDate: '2026-10-06 10:00:00' })];
  };
  env.setNow('2026-10-07T06:30:00Z');
  env.ctx.bot_sendStorageReportToOwners_();
  const t = env.sentTo(OWNER)[0].text;
  assert.match(t, /Чекають на відділенні 4\+ дні — 1 посилка/);
  assert.ok(t.includes('20451548992026') && t.includes('на відділенні 6 дн.') && t.includes('платне зберігання з 08.10') && t.includes('Олена Коваль') && !t.includes('20451548992027'));
  assert.equal(env.sentTo(GROUP).length, 0);
});

test('Місячний звіт: /month 2026-09 → оплати 178 380 грн, рядок у «Місячних звітах» (без дубля при повторі)', () => {
  const env = fresh(true);
  env.update(privMsg('/month 2026-09')); env.poll();
  const t = env.sentTo(OWNER).map(s => s.text).join('\n');
  assert.match(t, /Місячний звіт · вересень 2026/);
  assert.match(t, /Оплачено: <b>178 380 грн<\/b>/);
  let rows = env.rows('Місячні звіти');
  assert.equal(rows.length, 1); assert.equal(rows[0][0], '2026-09'); assert.equal(rows[0][6], 178380);
  env.update(privMsg('/month 2026-09')); env.poll();
  assert.equal(env.rows('Місячні звіти').length, 1);
  env.update(privMsg('/month 2026-13')); env.poll();
  assert.match(env.lastSent().text, /Формат/);
});

test('Місячний звіт 1-го числа о 09:00: автоматично власнику, один раз; якщо 1-ше — неділя, теж надсилається', () => {
  const env = fresh(true);
  env.setNow('2026-11-01T07:05:00Z');                        // 1 листопада 2026 — неділя, 09:05 Київ
  env.poll();
  const month = env.sentTo(OWNER).filter(s => /Місячний звіт/.test(s.text));
  assert.equal(month.length, 1); assert.match(month[0].text, /жовтень 2026/);
  env.setNow('2026-11-01T07:10:00Z'); env.poll();
  assert.equal(env.sentTo(OWNER).filter(s => /Місячний звіт/.test(s.text)).length, 1);
});

test('Команди: /find, /borg, /history, /price (з підтвердженням), /files', () => {
  const env = fresh(true);
  env.update(privMsg('/borg')); env.update(privMsg('/find 1470')); env.update(privMsg('/find 20451482476846')); env.update(privMsg('/find 99999999')); env.poll();
  const texts = env.sentTo(OWNER).map(s => s.text);
  assert.ok(texts.some(t => /Борг: 119 653 грн/.test(t) && /642 200 грн/.test(t) && /522 547 грн/.test(t)));
  assert.ok(texts.some(t => /№1/.test(t) && /Оплачено/.test(t) && /Імпорт/.test(t)));
  assert.ok(texts.some(t => /Нічого не знайшов/.test(t)));
  env.update(privMsg('/price')); env.poll();
  assert.match(env.lastSent().text, /Худі фліс — 740 грн/);
  env.update(privMsg('/price Худі фліс 780 15.11.2026')); env.poll();
  const q = env.lastSent();
  assert.match(q.text, /Додати нову ціну/);
  env.update(cb(q.reply_markup.inline_keyboard[0][0].callback_data, q.message_id)); env.poll();
  const prices = env.rows('Прайс');
  assert.equal(prices.length, 4); assert.equal(prices[3][0], 'Худі фліс'); assert.equal(prices[3][1], 780);
  // старі рядки не змінені, нове замовлення 14.11 — за старою ціною, 16.11 — за новою
  assert.equal(env.ctx.bot_priceFor(env.ctx.bot_readPriceRows(), 'Худі фліс', env.ctx.bot_makeDate(2026, 11, 14)), 740);
  assert.equal(env.ctx.bot_priceFor(env.ctx.bot_readPriceRows(), 'Худі фліс', env.ctx.bot_makeDate(2026, 11, 16)), 780);
  env.update(privMsg('/history')); env.update(privMsg('/files')); env.update(privMsg('/disputes')); env.update(privMsg('/help')); env.poll();
  assert.ok(env.sentTo(OWNER).length > 8);
});

test('Інша сума оплати: після «✏️ Інша сума» бот чекає число і додає рядок в «Оплати»', () => {
  const env = fresh(true);
  unpay46000(env);
  sendFile(env, readSheet('46000.xlsx'));
  const s = env.tg.sent.find(x => /Звірка З-/.test(x.text)); const id = s.text.match(/Звірка (З-[\d-]+)/)[1];
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  const q = env.lastSent();
  env.update(cb('opc|' + id, q.message_id)); env.poll();
  assert.match(env.lastSent().text, /Напишіть суму/);
  env.update(privMsg('abc')); env.poll();
  assert.match(env.lastSent().text, /Не зрозумів суму/);
  env.update(privMsg('30 000')); env.poll();
  const pays = env.ctx.bot_readPayments();
  assert.equal(pays[pays.length - 1].sum, 30000); assert.equal(pays[pays.length - 1].recon, id);
});

test('Таблицю змінили після звірки → «Оплатити» зупиняється і показує нове зведення', () => {
  const env = fresh(true);
  unpay46000(env);
  sendFile(env, readSheet('46000.xlsx'));
  const s = env.tg.sent.find(x => /Звірка З-/.test(x.text)); const id = s.text.match(/Звірка (З-[\d-]+)/)[1];
  const victim = O(env).find(o => set46(env, o));
  env.ctx.bot_patchOrders([{ row: victim._row, fields: { paid: 'Оплачено', recon: 'З-ІНША' } }]);        // хтось оплатив вручну
  env.update(cb('payy|' + id, s.message_id)); env.poll();
  assert.equal(O(env).filter(o => o.recon === id).length, 0, 'нічого не оплачено');
  assert.ok(env.tg.edits.some(e => /Таблиця змінилась/.test(e.text)));
  assert.equal(env.ctx.bot_reconGet(id).status, 'Чернетка');
});

test('Файл без колонки ТТН і не-Excel файл → зрозуміла помилка', () => {
  const env = fresh();
  sendFile(env, [['Номер', 'Ціна'], ['1', 420]], 'bad.xlsx');
  assert.match(env.lastSent().text, /Не знайшов колонку ТТН.*Номер \| Ціна/);
  env.update(privMsg(undefined, { text: undefined, document: { file_name: 'photo.png', file_id: 'x', file_size: 100 } })); env.poll();
  assert.match(env.lastSent().text, /не підходить/);
});

test('Помилка в одному оновленні не блокує решту; offset рухається', () => {
  const env = fresh();
  env.update(privMsg('/find')); env.update(groupMsg(CAP));
  const real = env.ctx.bot_cmdFind; env.ctx.bot_cmdFind = () => { throw new Error('boom'); };
  env.poll();
  assert.equal(O(env).length, 1);
  assert.ok(env.sentTo(OWNER).some(s => /boom/.test(s.text)));
  assert.equal(env.props.UPDATE_OFFSET, '3');
  assert.ok(env.rows('Лог').some(l => l[1] === 'ПОМИЛКА'));
});

// ---------------------------------------------------------------- Самоперевірка, меню, збірка
test('bot_selfTest() проходить усі приклади (він же є в меню «Перевірити, що все працює»)', () => {
  const env = fresh();
  const r = env.ctx.bot_selfTest();
  assert.equal(r.failed, 0, r.lines.join('\n'));
  assert.ok(r.total >= 10);
});

test('Увімкнення бота і «Перевірити, що все працює»: вебхук прибирається, команди реєструються, перевірки без винятків', () => {
  const env = fresh();
  const u = env.ctx.bot_enableBot();
  assert.equal(u, 'monoclo_test_bot');
  const methods = env.tg.calls.map(c => c.method);
  assert.ok(methods.includes('deleteWebhook') && methods.includes('setMyCommands'));
  assert.deepEqual(env.tg.calls.find(c => c.method === 'getUpdates'), undefined);
  assert.equal(env.tg.calls.find(c => c.method === 'setMyCommands').payload.commands.length, 11);
  const checks = env.ctx.bot_healthChecks();
  assert.ok(checks.length >= 8 && checks.every(c => /^(🟢|🔴) /.test(c)));
  assert.ok(checks.some(c => /Токен Telegram введено/.test(c) && c.startsWith('🟢')));
});

test('Збірка ALL_IN_ONE.gs працює так само: налаштування, замовлення, імпорт', () => {
  const env = newEnv({ oldWorkbook, allInOne: true });
  env.setup(); env.setNow('2026-10-07T05:00:00Z');
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  env.ctx.bot_setSetting('OWNER_IDS', '111'); env.ctx.bot_setSetting('GROUP_CHAT_ID', GROUP); env.ctx.bot_setSetting('ORDERS_THREAD_ID', ORD_T);
  env.update(groupMsg(CAP)); env.poll();
  assert.equal(env.ctx.bot_readOrders().length, 1);
  assert.equal(env.ctx.bot_selfTest().failed, 0);
});

test('appsscript.json: пояс Europe/Kyiv, Drive v2, потрібні дозволи', () => {
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps-script', 'appsscript.json'), 'utf8'));
  assert.equal(j.timeZone, 'Europe/Kyiv'); assert.equal(j.runtimeVersion, 'V8');
  assert.deepEqual(j.dependencies.enabledAdvancedServices[0], { userSymbol: 'Drive', version: 'v2', serviceId: 'drive' });
  ['spreadsheets', 'drive', 'script.external_request', 'script.scriptapp', 'script.container.ui'].forEach(sc => assert.ok(j.oauthScopes.some(x => x.endsWith('/' + sc)), sc));
});

test('У коді немає doPost (вебхук не використовується) і токенів у відкритому вигляді', () => {
  const src = fs.readdirSync(path.join(ROOT, 'apps-script')).filter(f => f.endsWith('.gs')).map(f => fs.readFileSync(path.join(ROOT, 'apps-script', f), 'utf8')).join('\n');
  assert.ok(!/function\s+doPost|function\s+doGet/.test(src));
  assert.ok(!/\d{8,}:[A-Za-z0-9_-]{30,}/.test(src));
  const names = [...src.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]).filter(n => n !== 'onOpen');
  assert.ok(names.every(n => n.startsWith('bot_')), names.filter(n => !n.startsWith('bot_')).join(','));
});

test('Кнопка «📋 Деталі» показує повний список проблемних ТТН і посилання на файл', () => {
  const env = fresh(true);
  sendFile(env, readSheet('46000.xlsx'));
  const s = env.tg.sent.find(x => /Звірка З-/.test(x.text)); const id = s.text.match(/Звірка (З-[\d-]+)/)[1];
  const before = env.tg.sent.length;
  env.update(cb('det|' + id, s.message_id)); env.poll();
  const added = env.tg.sent.slice(before).map(x => x.text).join('\n');
  assert.match(added, /Деталі · З-/);
  assert.equal((added.match(/<code>\d{14}<\/code>/g) || []).length, 74);
  assert.match(added, /drive\.example/);
});
