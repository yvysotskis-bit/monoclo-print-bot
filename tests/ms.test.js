// Інтеграційні тести модулів A–D (аркуш «ТТН», опис, запис у НП, реєстр) на імітації Apps Script.
const test = require('node:test');
const assert = require('node:assert/strict');
const { newEnv } = require('./gasmock');

const OWNER = 111, GROUP = -1001234567890, ORD_T = 5, REP_T = 7;
let mid = 5000;
const ts = (iso) => Math.floor(Date.parse(iso) / 1000);
const groupMsg = (caption, extra, kind) => ({ [kind || 'message']: Object.assign({ message_id: ++mid, date: ts('2026-10-07T05:00:00Z'), chat: { id: GROUP, type: 'supergroup', title: 'Виробництво' }, from: { id: 999, first_name: 'Склад' }, is_topic_message: true, message_thread_id: ORD_T, caption }, extra) });
const edit = (id, caption) => ({ edited_message: { message_id: id, date: ts('2026-10-07T05:00:00Z'), edit_date: ts('2026-10-07T05:05:00Z'), chat: { id: GROUP, type: 'supergroup' }, from: { id: 999 }, is_topic_message: true, message_thread_id: ORD_T, caption } });
const privMsg = (text) => ({ message: { message_id: ++mid, date: ts('2026-10-07T05:00:00Z'), chat: { id: OWNER, type: 'private' }, from: { id: OWNER, first_name: 'Юрій' }, text } });
const cb = (data, msgId) => ({ callback_query: { id: 'cb' + (++mid), from: { id: OWNER, first_name: 'Юрій' }, message: { message_id: msgId, chat: { id: OWNER } }, data } });

const T1 = '20451556067718', T2 = '20451556067719', TEST = '20450000000001';
const MSG1 = `15089. Принт Russel-Art\nФутболка чорна\nM\n\nПринт позаду\n\n15090. Принт George-Russell (B)\nФутболка сіра\nM\n\nПринт позаду\n\n15091. Принт george halftone\nХуді x1 ❗️БЕЗ ФЛІСУ\nM\n\nПринт позаду\n\n15092. Принт Russell Lines (W)\nХуді x3 ❗️БЕЗ ФЛІСУ\nM\n\nПринт позаду\n\n${T1}`;
const MSG2 = `15093. Принт No-Risk (W)\nХуді x3 ❗️БЕЗ ФЛІСУ\nS\nПринт позаду\n\n${T2}`;

function npDoc(ttn) {
  return { Ref: 'ref-' + ttn, IntDocNumber: ttn, DateTime: '07.10.2026 12:00:00', PayerType: 'Recipient', PaymentMethod: 'Cash', CargoType: 'Cargo', Weight: '0.5',
    ServiceType: 'WarehouseWarehouse', SeatsAmount: '1', Description: 'Одяг', Cost: '500', CitySender: 'cs', Sender: 's', SenderAddress: 'sa', ContactSender: 'cts',
    SendersPhone: '380931112233', CityRecipient: 'cr', Recipient: 'r', RecipientAddress: 'ra', ContactRecipient: 'ctr', RecipientsPhone: '380501112233',
    BackwardDeliveryData: [{ PayerType: 'Recipient', CargoType: 'Money', RedeliveryString: '1509' }], AdditionalInformation: '' };
}

function fresh() {
  const env = newEnv({});
  env.setup();
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; env.props.BOT_ENABLED = '1'; env.props.NP_API_KEY = 'SECRETKEY';
  const c = env.ctx;
  c.bot_setSetting('OWNER_IDS', String(OWNER)); c.bot_setSetting('GROUP_CHAT_ID', GROUP);
  c.bot_setSetting('ORDERS_THREAD_ID', ORD_T); c.bot_setSetting('REPORT_THREAD_ID', REP_T);
  env.setNow('2026-10-07T05:00:00Z');                                  // 08:00 Київ
  env.docs = {}; env.calls = [];
  env.corrupt = null; env.scanNo = '105-0001';
  env.np.handler = (p) => {
    const m = p.methodProperties || {};
    env.calls.push(p.modelName + '.' + p.calledMethod);
    if (p.calledMethod === 'getDocumentList') { const d = env.docs[m.IntDocNumber]; return d ? [JSON.parse(JSON.stringify(d))] : []; }
    if (p.calledMethod === 'update') {
      env.updates = (env.updates || []).concat([m]);
      const d = Object.values(env.docs).find(x => x.Ref === m.Ref); if (!d) return [];
      d.AdditionalInformation = m.AdditionalInformation; if (env.corrupt) d[env.corrupt] = 'ЗМІНЕНО';
      return [{ Ref: d.Ref }];
    }
    if (p.calledMethod === 'insertDocuments') { env.scans = (env.scans || []).concat([m]); return [{ Ref: 'scan-1', Number: env.scanNo, Data: { Success: m.DocumentRefs.map(r => ({ Ref: r })), Errors: [] } }]; }
    return [];
  };
  return env;
}
const ttnRows = (env) => env.ctx.bot_readTtnRows();
const ownerTexts = (env) => env.sentTo(OWNER).map(s => s.text);
const groupDocs = (env) => (env.tg.documents || []);

test('A: повідомлення гілки → рядок «ТТН» (оригінал + опис ≤100), старі замовлення (≤15088) не чіпаємо', () => {
  const env = fresh();
  env.update(groupMsg(MSG1));
  env.update(groupMsg(`15050. Принт Old\nФутболка чорна\nM\nПринт позаду\n\n20451556000000`));
  env.poll();
  const rows = ttnRows(env);
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.ttn, T1); assert.equal(r.orders, '15089, 15090, 15091, 15092');
  assert.equal(r.original, MSG1);
  assert.ok(r.desc && r.len <= 100 && r.len === [...r.desc].length, r.desc);
  ['15089', '15090', '15091', '15092'].forEach(n => assert.ok(r.desc.includes(n)));
  assert.equal(env.ctx.bot_readOrders().length, 5);                    // усі 5 замовлень у «Замовлення» (як у Монокло)
});

test('A: повтор того самого оновлення і редагування — без дублів; ТТН, дописана редагуванням, створює рядок', () => {
  const env = fresh();
  const noTtn = MSG2.replace(`\n\n${T2}`, '');
  const m = env.update(groupMsg(noTtn));
  env.poll();
  assert.equal(ttnRows(env).length, 0);                               // немає ТТН — рядка «ТТН» ще немає
  env.update(edit(m.message.message_id, MSG2)); env.poll();
  assert.equal(ttnRows(env).length, 1);
  env.update(edit(m.message.message_id, MSG2)); env.poll();           // те саме редагування ще раз
  assert.equal(ttnRows(env).length, 1);
  assert.equal(env.ctx.bot_readOrders().length, 1);
});

test('C: режим перевірки — нічого не пишемо в НП, власнику приходить «ТТН → опис», статус «Перевірка»', () => {
  const env = fresh(); env.docs[T1] = npDoc(T1);
  env.update(groupMsg(MSG1)); env.poll();
  assert.equal(ttnRows(env)[0].status, 'Перевірка');
  assert.ok(ownerTexts(env).some(t => /Режим перевірки/.test(t) && t.includes(T1) && t.includes(ttnRows(env)[0].desc.slice(0, 20))));
  assert.ok(!env.calls.includes('InternetDocument.update'));
  env.poll(); env.poll();
  assert.equal(ownerTexts(env).filter(t => /Режим перевірки/.test(t)).length, 1);   // не повторюється
});

test('C: /live заблоковано, поки не пройдено /nptest', () => {
  const env = fresh();
  env.update(privMsg('/live')); env.poll();
  assert.match(env.lastSent().text, /nptest/);
  assert.equal(env.ctx.bot_setting('NP_MODE'), 'перевірка');
});

test('C: /nptest → кнопка → запис лише AdditionalInformation, решта полів без змін (з BackwardDeliveryData) → /live', () => {
  const env = fresh(); env.docs[TEST] = npDoc(TEST);
  const before = JSON.parse(JSON.stringify(env.docs[TEST]));
  env.update(privMsg(`/nptest ${TEST} тест 123`)); env.poll();
  const q = env.lastSent();
  assert.ok(!env.calls.includes('InternetDocument.update'));         // без підтвердження — нічого
  env.update(cb(q.reply_markup.inline_keyboard[0][0].callback_data, q.message_id)); env.poll();
  assert.equal(env.updates.length, 1);
  const sent = env.updates[0];
  assert.equal(sent.AdditionalInformation, 'тест 123');
  assert.deepEqual(sent.BackwardDeliveryData, before.BackwardDeliveryData);
  assert.equal(sent.Cost, '500'); assert.equal(sent.Recipient, 'r'); assert.equal(sent.RecipientsPhone, '380501112233');
  const after = env.docs[TEST];
  Object.keys(before).filter(k => k !== 'AdditionalInformation').forEach(k => assert.deepEqual(after[k], before[k], k));
  assert.equal(env.props.NP_TEST_OK, '1');
  assert.match(env.tg.edits[env.tg.edits.length - 1].text, /Тест пройдено/);
  env.update(privMsg('/live')); env.poll();
  assert.equal(env.ctx.bot_setting('NP_MODE'), 'бойовий');
});

test('C: бракує обов\'язкового поля в документі НП → нічого не пишемо, тест не пройдено', () => {
  const env = fresh(); env.docs[TEST] = npDoc(TEST); delete env.docs[TEST].ContactRecipient;
  const res = env.ctx.bot_npWriteDesc(TEST, 'x');
  assert.equal(res.state, 'error'); assert.match(res.error, /ContactRecipient/);
  assert.ok(!env.calls.includes('InternetDocument.update'));
});

test('C: якщо після запису змінилось інше поле — помилка з переліком полів', () => {
  const env = fresh(); env.docs[TEST] = npDoc(TEST); env.corrupt = 'Cost';
  const res = env.ctx.bot_npWriteDesc(TEST, 'x');
  assert.equal(res.state, 'error'); assert.match(res.error, /Cost/);
});

test('C: бойовий режим — запис в НП, статус «Записано в НП», ідемпотентно; відмова НП → «Помилка НП» без повторів', () => {
  const env = fresh(); env.docs[T1] = npDoc(T1); env.docs[T2] = npDoc(T2);
  env.props.NP_TEST_OK = '1'; env.ctx.bot_setSetting('NP_MODE', 'бойовий');
  env.update(groupMsg(MSG1)); env.update(groupMsg(MSG2)); env.poll();
  const rows = ttnRows(env);
  assert.deepEqual([...rows.map(r => r.status)], ['Записано в НП', 'Записано в НП']);
  assert.equal(env.docs[T1].AdditionalInformation, rows[0].desc);
  assert.equal(env.docs[T2].AdditionalInformation, '15093 No-Risk (W) худі x3 БЕЗ ФЛІСУ S, принт позаду');
  env.updates = []; env.poll(); env.poll();
  assert.equal((env.updates || []).length, 0);
  // НП відмовляє
  env.np.handler = (p) => { throw new Error('boom'); };
  const env2 = fresh(); env2.props.NP_TEST_OK = '1'; env2.ctx.bot_setSetting('NP_MODE', 'бойовий');
  env2.np.fail = 'Документ вже відскановано'; env2.np.handler = () => [];
  env2.update(groupMsg(MSG2)); env2.poll();
  assert.equal(ttnRows(env2)[0].status, 'Помилка НП'); assert.match(ttnRows(env2)[0].note, /відскановано|не знайшла/);
});

test('/setdesc: перевірка довжини, свій текст, захист від редагування і /desc', () => {
  const env = fresh(); env.docs[T2] = npDoc(T2);
  env.update(groupMsg(MSG2)); env.poll();
  env.update(privMsg(`/setdesc ${T2} ${'я'.repeat(101)}`)); env.poll();
  assert.match(env.lastSent().text, /101 символів/);
  env.update(privMsg(`/setdesc ${T2} 15093 мій текст`)); env.poll();
  assert.equal(ttnRows(env)[0].desc, '15093 мій текст'); assert.equal(ttnRows(env)[0].note, '✏️ свій текст');
  env.update(privMsg(`/desc ${T2}`)); env.poll();
  assert.match(env.lastSent().text, /15093 мій текст/);
});

function liveEnv() {
  const env = fresh(); env.docs[T1] = npDoc(T1); env.docs[T2] = npDoc(T2);
  env.props.NP_TEST_OK = '1'; env.ctx.bot_setSetting('NP_MODE', 'бойовий');
  return env;
}

test('D: о 10:00 — реєстр у НП, PDF 100×100 у гілку «Реєстри» з назвою мін-макс; повторний запуск дубля не створює', () => {
  const env = liveEnv();
  env.update(groupMsg(MSG1)); env.update(groupMsg(MSG2)); env.poll();
  env.setNow('2026-10-07T07:00:00Z'); env.poll();                      // 10:00 Київ
  assert.equal(env.scans.length, 1);
  assert.deepEqual(env.scans[0].DocumentRefs.sort(), ['ref-' + T1, 'ref-' + T2]);
  const docs = groupDocs(env);
  assert.equal(docs.length, 1);
  assert.equal(String(docs[0].chat_id), String(GROUP)); assert.equal(docs[0].message_thread_id, String(REP_T));
  assert.equal(docs[0].document.name, '15089-15093.pdf');
  assert.equal(docs[0].caption, 'Реєстр №105-0001 · 2 ТТН · 07.10');
  assert.ok(env.np.printUrls[0].includes('printMarking100x100/orders[]/' + T1 + '/orders[]/' + T2 + '/type/pdf/apiKey/SECRETKEY'));
  assert.ok(!JSON.stringify(env.tg.calls).includes('SECRETKEY'));        // ключ НП не потрапляє в Telegram
  assert.ok(!ownerTexts(env).join('\n').includes('SECRETKEY'));
  assert.deepEqual([...ttnRows(env).map(r => r.registry)], ['105-0001', '105-0001']);
  env.poll(); env.poll();
  assert.equal(env.scans.length, 1); assert.equal(groupDocs(env).length, 1);
  // /registry вручну, коли реєстр сьогодні вже є, — лише перевідправляє той самий PDF
  env.update(privMsg('/registry')); env.poll();
  const q = env.lastSent();
  env.update(cb(q.reply_markup.inline_keyboard[0][0].callback_data, q.message_id)); env.poll();
  assert.equal(env.scans.length, 1); assert.equal(groupDocs(env).length, 2);
  assert.equal(groupDocs(env)[1].document, groupDocs(env)[0].document ? 'FILEID' + (groupDocs(env)[0].message_id) : '');
  assert.equal(env.sheet('Реєстри').getLastRow(), 2);
});

test('D: у реєстр не потрапляють ТТН без повідомлення в гілці, «Помилка НП», «Чекає рішення»; попередження — лише власнику', () => {
  const env = liveEnv();
  env.update(groupMsg(MSG2)); env.poll();
  const c = env.ctx;
  // «чужа» ТТН: рядок у «ТТН» без замовлення з гілки
  c.bot_ttnAppend({ ttn: '20451999999999', orders: '15200', original: 'x', desc: '15200 test', len: 10, status: 'Записано в НП', msgId: '1' });
  c.bot_ttnAppend({ ttn: '20451999999998', orders: '15201', original: 'x', desc: 'x', len: 1, status: 'Помилка НП', note: 'відскановано', msgId: '2' });
  c.bot_ttnAppend({ ttn: '20451999999997', orders: '15202', original: 'x', desc: 'x', len: 1, status: 'Чекає рішення', msgId: '3' });
  env.setNow('2026-10-07T06:45:00Z'); env.poll();                      // 09:45 — нагадування
  assert.ok(ownerTexts(env).some(t => /НЕ ввійдуть/.test(t) && t.includes('20451999999998') && t.includes('20451999999997')));
  env.setNow('2026-10-07T07:00:00Z'); env.poll();
  assert.deepEqual(env.scans[0].DocumentRefs, ['ref-' + T2]);
  assert.ok(ownerTexts(env).some(t => /не ввійшли/.test(t) && t.includes('20451999999999') && /немає повідомлення в гілці/.test(t)));
  assert.equal(env.sentTo(GROUP).filter(s => /не ввійшли|помилка/i.test(s.text)).length, 0);   // у групу — нічого, окрім PDF
});

test('D: немає ТТН — мовчимо; режим перевірки — реєстр не створюємо; /registry preview', () => {
  const env = liveEnv();
  env.setNow('2026-10-07T07:00:00Z'); env.poll();
  assert.equal((env.scans || []).length, 0); assert.equal(groupDocs(env).length, 0);
  assert.equal(env.sentTo(GROUP).filter(x => /Реєстр/.test(x.text)).length, 0); assert.equal(env.sentTo(OWNER).length, 0);   // (ранковий звіт Монокло-типу — окрема річ)
  const env2 = fresh(); env2.docs[T2] = npDoc(T2);
  env2.update(groupMsg(MSG2)); env2.poll();
  env2.setNow('2026-10-07T07:00:00Z'); env2.poll();
  assert.equal((env2.scans || []).length, 0);
  env2.update(privMsg('/registry preview')); env2.poll();
  assert.match(env2.lastSent().text, /Реєстр \(попередній перегляд\)/);
});

test('D: назва файлу: діапазон, одне замовлення; PDF не PDF → помилка і повтор, без дубля реєстру в НП', () => {
  const env = fresh();
  assert.equal(env.ctx.bot_regFileName([15038, 15050, 15088]), '15038-15088.pdf');
  assert.equal(env.ctx.bot_regFileName([15038]), '15038.pdf');
  const e2 = liveEnv(); e2.np.printBad = true;
  e2.update(groupMsg(MSG2)); e2.poll();
  e2.setNow('2026-10-07T07:00:00Z'); e2.poll();
  assert.equal(e2.scans.length, 1); assert.equal(groupDocs(e2).length, 0);
  assert.equal(e2.sheet('Реєстри').getRange(2, 7).getValue(), 'Створено');
  e2.np.printBad = false; e2.poll();                                    // наступна хвилина: реєстр НЕ створюється вдруге
  assert.equal(e2.scans.length, 1); assert.equal(groupDocs(e2).length, 1);
});

test('C: вікно дат getDocumentList менше трьох місяців (обмеження НП)', () => {
  const env = fresh();
  const w = env.ctx.bot_npDocWindow_();
  const d = (x) => { const [dd, mm, yy] = x.split('.').map(Number); return new Date(yy, mm - 1, dd); };
  const days = (d(w.to) - d(w.from)) / 86400000;
  assert.ok(days > 30 && days < 88, String(days));
});

test('Початковий залишок 2 227 020 (на 31.08, оплати по 08.09 включно): борг = залишок + нові замовлення − нові оплати', () => {
  const env = newEnv({});
  env.setup();
  const c = env.ctx;
  c.bot_setSetting('OPENING_DEBT', '2227020'); c.bot_setSetting('OPENING_ORDERS_AFTER', '31.08.2026'); c.bot_setSetting('OPENING_PAYS_AFTER', '08.09.2026');
  const op = c.bot_openingFromSettings();
  assert.equal(op.debt, 2227020);
  const d = (y, m, dd) => c.bot_makeDate(y, m, dd);
  const orders = [{ date: d(2026, 8, 30), cost: 1000 }, { date: d(2026, 9, 1), cost: 740 }, { date: d(2026, 9, 10), cost: 420, ttn: '', status: 'В роботі' }];
  const pays = [{ date: d(2026, 9, 8), sum: 564835 }, { date: d(2026, 9, 9), sum: 100000 }];
  const r = c.bot_computeDebt(orders, pays, op);
  assert.equal(r.debt, 2227020 + 740 + 420 - 100000);      // 30.08 і оплата 08.09 — уже в залишку, вдруге не рахуються
  assert.equal(r.opening, 2227020);
  // без налаштування — як було
  assert.equal(c.bot_computeDebt(orders, pays).debt, 1000 + 740 + 420 - 564835 - 100000);
  // /borg показує залишок
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.bot_setSetting('OWNER_IDS', '111');
  c.bot_cmdBorg(111);
  assert.match(env.lastSent().text, /2\s?227\s?020/);
  // місячний звіт: борг на кінець вересня включає залишок
  const m = c.bot_monthMetrics(orders, pays, 2026, 9, op);
  assert.equal(m.debtEnd, 2227020 + 740 + 420 - 100000);
});

test('/backfill: ТТН замовлень з таблиці (імпорт) → рядки «ТТН» з описом; колір худі → хN; ідемпотентно; далі режим перевірки', () => {
  const env = fresh(); const c = env.ctx;
  const mk = (no, ttn, type, color, size, extra) => c.bot_appendOrderRow(Object.assign({ no, date: c.bot_makeDate(2026, 10, 12), print: 'Принт No-Risk (W)', type, color, size, placement: 'Позаду', prints: 1, ttn, cost: 740, status: 'В роботі', paid: 'Не оплачено', msgId: String(900 + no) }, extra), []);
  mk(15100, T1, 'Худі не утеплене', 'Графітовий', 'S');
  mk(15101, T1, 'Футболка', 'Чорний', 'M', { print: 'Принт CV (W)' });
  mk(15000, '20451555000000', 'Футболка', 'Чорний', 'M');                       // старе (≤15088) — не чіпаємо
  mk(15102, T2, 'Футболка', 'Чорний', 'M', { status: 'Скасовано' });             // скасоване — пропуск
  const r = c.bot_ttnBackfill();
  assert.equal(r.added, 1);
  const row = ttnRows(env)[0];
  assert.equal(row.ttn, T1); assert.equal(row.orders, '15100, 15101'); assert.equal(row.status, 'Новий'); assert.equal(row.msgId, '16000');
  assert.ok(row.desc.includes('15100') && row.desc.includes('x3') && row.desc.includes('БЕЗ ФЛІСУ') && row.desc.includes('15101'));
  assert.ok(row.len <= 100);
  assert.equal(c.bot_ttnBackfill().added, 0);                                      // повторно — нічого
  env.poll();                                                                       // режим перевірки → власнику
  assert.equal(ttnRows(env)[0].status, 'Перевірка');
  assert.ok(ownerTexts(env).some(t => /Режим перевірки/.test(t) && t.includes(T1)));
});

test('«Виварене»: розбір — худі/футболка/кепка виварена, ціна 1490, кольори, без зайвих зауважень', () => {
  const env = fresh(); const B = env.ctx;
  const P = (t) => B.bot_parseOrderMessage(t)[0];
  const hg = P(`14900. Принт не потрібен\nХуді графіт виварене\nS\n\n${T1}`);
  assert.equal(hg.type, 'Худі виварене'); assert.equal(hg.color, 'Графітовий'); assert.deepEqual([...hg.issues], []);
  const hs = P(`14832. Принт не потрібен\nХуді сіре виварене\nS\n\n${T1}`);
  assert.equal(hs.type, 'Худі виварене'); assert.equal(hs.color, 'Сірий'); assert.deepEqual([...hs.issues], []);
  const cap = P(`14759. Кепка сіра виварена Макларен - K-MC-GRAPHITE-1\n\n${T1}`);
  assert.equal(cap.type, 'Кепка виварена'); assert.deepEqual([...cap.issues], []);
  const tee = P(`15000. Принт A\nФутболка чорна виварена\nM\nПринт позаду\n${T1}`);
  assert.equal(tee.type, 'Футболка виварена');
  const plain = P(`15001. Принт A\nХуді x3 БЕЗ ФЛІСУ\nM\n${T1}`);
  assert.equal(plain.type, 'Худі не утеплене');
  const prices = B.bot_readPriceRows();
  [hg, hs, cap, tee].forEach(p => assert.equal(B.bot_buildOrderFields_(p, new Date(), prices, 'В роботі').fields.cost, 1490));
  // опис: «виварене» і колір (код) не губляться
  assert.equal(B.bot_buildDescription([hg]).text, '14900 без принта худі виварене x3 S');
  assert.match(B.bot_buildDescription([hs]).text, /без принта худі виварене x4 S/);
  assert.match(B.bot_buildDescription([tee]).text, /футболка чорна виварена M/);
});

test('«Виварене»: виправлення вже доданих рядків — тип і собівартість, оплачені не чіпаємо, повтор нічого не міняє', () => {
  const env = fresh(); const c = env.ctx;
  const d = c.bot_makeDate(2026, 9, 10);
  const mk = (no, type, cost, extra) => c.bot_appendOrderRow(Object.assign({ no, date: d, print: 'Принт не потрібен', type, color: 'Сірий', size: 'S', placement: '', prints: 1, ttn: T1, cost, status: 'В роботі', paid: 'Не оплачено', msgId: String(no) }, extra), []);
  mk(14832, '', 0);                                   // худі виварене, колись ✍️ (не розпізнано)
  mk(14900, 'Худі не утеплене', 740);                 // графіт виварене, записано як звичайне
  mk(14901, 'Худі не утеплене', 740, { paid: 'Оплачено' });
  const msg = (id, no, line) => ({ id, service: '', date: d, text: `${no}. Принт не потрібен\n${line}\nS\n\n${T1}` });
  const messages = [msg(1, 14832, 'Худі сіре виварене'), msg(2, 14900, 'Худі графіт виварене'), msg(3, 14901, 'Худі графіт виварене'), msg(4, 14999, 'Худі графіт виварене')];
  const plan = c.bot_planWashedFix(messages, c.bot_readOrders(), c.bot_readPriceRows());
  assert.equal(plan.changes.length, 2); assert.equal(plan.paidSkipped.length, 1); assert.deepEqual([...plan.missing], [14999]);
  assert.equal(plan.delta, 1490 + (1490 - 740));
  c.bot_washedFixApply(plan);
  const rows = c.bot_readOrders();
  const g = (n) => rows.find(r => r.no === n);
  assert.equal(g(14832).type, 'Худі виварене'); assert.equal(g(14832).cost, 1490);
  assert.equal(g(14900).type, 'Худі виварене'); assert.equal(g(14900).cost, 1490); assert.equal(g(14900).color, 'Графітовий');
  assert.equal(g(14901).cost, 740);                    // оплачений — без змін
  const again = c.bot_planWashedFix(messages, c.bot_readOrders(), c.bot_readPriceRows());
  assert.equal(again.changes.length, 0); assert.equal(again.unchanged, 2);
});

test('Оплати з чату «Отправка отчет»: розбір сум, пропуск до 08.09, ідемпотентність, борг падає', () => {
  const env = fresh(); const c = env.ctx;
  const P = c.bot_parsePayText;
  assert.equal(P('+15к'), 15000); assert.equal(P('+ 21 401'), 21401); assert.equal(P('+14300'), 14300); assert.equal(P('+10 000'), 10000);
  assert.equal(P('+14,5к'), 14500); assert.equal(P('+25.000'), 25000); assert.equal(P('Пораховано+'), null); assert.equal(P('+ потім'), null);
  const d = (y, m, dd) => new Date(Date.UTC(y, m - 1, dd, 12));
  const msgs = [
    { id: 1, text: '+15к', date: d(2026, 8, 25) }, { id: 2, text: '+20к', date: d(2026, 9, 8) }, { id: 3, text: 'Пораховано+', date: d(2026, 9, 9) },
    { id: 4, text: '+ 21 401', date: d(2026, 9, 12) }, { id: 5, text: '+14300', date: d(2026, 9, 23) }, { id: 6, text: '+25000', date: d(2026, 9, 30) },
    { id: 7, text: '+9000', date: d(2026, 9, 30) }, { id: 8, text: '+10 000', date: d(2026, 10, 12) }, { id: 9, text: '+ щось', date: d(2026, 10, 13) }];
  c.bot_setSetting('OPENING_DEBT', '2227020'); c.bot_setSetting('OPENING_ORDERS_AFTER', '31.08.2026'); c.bot_setSetting('OPENING_PAYS_AFTER', '08.09.2026');
  const op = c.bot_openingFromSettings();
  const plan = c.bot_planPayImport(msgs, { after: op.ordersAfter, existingIds: [] });
  assert.equal(plan.rows.length, 6); assert.equal(plan.total, 20000 + 21401 + 14300 + 25000 + 9000 + 10000); assert.equal(plan.skippedOld, 1); assert.equal(plan.unclear.length, 1);
  assert.equal(c.bot_payImportApply(plan), 6);
  const plan2 = c.bot_planPayImport(msgs, { after: op.ordersAfter, existingIds: c.bot_existingPayKeys_() });
  assert.equal(plan2.rows.length, 0); assert.equal(plan2.skippedExisting, 6);
  assert.equal(c.bot_payImportApply(plan), 0);                                    // повтор — без дублів
  const pays = c.bot_readPayments();
  assert.equal(pays.length, 6);   // оплата 08.09 збережена (для покриття місяця), але в борг не йде
  assert.equal(c.bot_computeDebt([], pays, op).debt, 2227020 - 79701);
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.bot_setSetting('OWNER_IDS', String(OWNER));
  c.bot_cmdAddPay(OWNER, '5к 14.10.2026');
  assert.equal(c.bot_readPayments().length, 7);
  assert.ok(env.tg.sent.some(m => /Оплату 5\s?000/.test(m.text)));
});

test('Покриття собівартості місяця: 🟢 покрито / 🟡 недоплата ≤ порогу / 🔴 велика різниця; формули на «Підсумках»', () => {
  const env = fresh(); const c = env.ctx;
  const S = (cost, paid, pct) => { const r = c.bot_coverageStatus(cost, paid, pct); return r.icon + '|' + r.diff; };
  assert.equal(S(100000, 100000), '🟢|0'); assert.equal(S(100000, 120000), '🟢|20000');
  assert.equal(S(100000, 91000, 10), '🟡|-9000'); assert.equal(S(100000, 90000, 10), '🟡|-10000'); assert.equal(S(100000, 89999, 10), '🔴|-10001');
  assert.equal(S(0, 5000), '|0'); assert.equal(S(100000, 0), '🔴|-100000');
  const v = env.sheet('Підсумки').getDataRange().getValues();
  const flat = [].concat(...v).filter(x => typeof x === 'string');
  assert.ok(flat.some(f => f.includes('Покриття собівартості')));
  assert.ok(flat.some(f => f.startsWith('=IF($G') && f.includes('🟢 Покрито') && f.includes('🟡 Недоплата') && f.includes('🔴 Велика різниця')));
  assert.ok(flat.some(f => f.includes('PAY_RED_PERCENT')));
  // місячний звіт містить рядок покриття
  const cur = c.bot_monthMetrics([{ date: c.bot_makeDate(2026, 9, 5), cost: 100000, status: 'В роботі', type: 'Футболка', print: 'A' }], [{ date: c.bot_makeDate(2026, 9, 6), sum: 50000 }], 2026, 9);
  cur.redPct = 10;
  assert.match(c.bot_buildMonthReport(cur, null), /🔴 Покриття собівартості: Велика різниця/);
});

test('Формули «Оплат» під «;»-мову: нові рядки й переписування старих (без #ERROR!)', () => {
  const env = newEnv({ semi: true }); env.setup();
  const c = env.ctx; const sh = env.sheet('Оплати');
  c.bot_addPaymentRow_('tg-1', 20000, c.bot_makeDate(2026, 9, 4));
  c.bot_addPaymentRow_('tg-2', 21401, c.bot_makeDate(2026, 9, 12));
  const f = (r, col) => sh.getRange(r, col).getValue();
  [2, 3].forEach(r => { const acc = f(r, 6); assert.ok(acc.startsWith('=SUMIFS('), acc); assert.ok(!/,(?=(?:[^"]*"[^"]*")*[^"]*$)/.test(acc), 'без ком поза лапками: ' + acc); assert.ok(acc.includes(';')); });
  sh.getRange(2, 6).setFormula("=SUMIFS($C$2:C2,$B$2:B2,\">\"&'Підсумки'!$H$6)");     // «зламана» формула з комами → #ERROR!
  assert.equal(sh.getRange(2, 6).getValue(), '#ERROR!');
  c.bot_rewritePaymentFormulas();
  assert.ok(f(2, 6).includes(';') && !f(2, 6).includes('",'));
  assert.equal(f(3, 7), "='Підсумки'!$A$5");
  assert.equal(f(3, 8), '=G3-F3');
});

test('C: AfterpaymentOnGoodsCost = 0 не передаємо (НП: «is invalid»); непорожнє — передаємо; /npdoc показує службові значення', () => {
  const env = fresh(); const c = env.ctx;
  const d0 = npDoc(TEST); d0.AfterpaymentOnGoodsCost = '0';
  assert.ok(!('AfterpaymentOnGoodsCost' in c.bot_npBuildPayload(d0, 'x').payload));
  const d1 = npDoc(TEST); d1.AfterpaymentOnGoodsCost = '1509.1';
  assert.equal(c.bot_npBuildPayload(d1, 'x').payload.AfterpaymentOnGoodsCost, '1509.1');
  assert.deepEqual([...c.bot_npDiffDocs(d0, npDoc(TEST))], []);                 // «0» і «немає» — не зміна
  env.docs[TEST] = d1; env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.bot_setSetting('OWNER_IDS', String(OWNER));
  c.bot_cmdNpDoc(OWNER, TEST);
  assert.match(env.lastSent().text, /AfterpaymentOnGoodsCost=1509\.1/);
  assert.ok(!/380501112233/.test(env.lastSent().text));                         // телефони не показуємо
});

test('C: реальна відповідь НП (тестова ТТН): без AfterpaymentOnGoodsCost=0.00 і порожньої дати; накладений платіж із Backward*-полів; зміна Backward* після запису ловиться', () => {
  const env = fresh(); const c = env.ctx;
  const real = Object.assign(npDoc(TEST), { AfterpaymentOnGoodsCost: '0.00', PreferredDeliveryDate: '0001-01-01 00:00:00', SaturdayDelivery: null, CargoType: 'Parcel', Weight: '1.00', Cost: '200.00',
    OptionsSeat: [{ volumetricVolume: '0.0006', weight: '1', cost: '200', specialCargo: false, description: null, packRef: null }] });
  delete real.BackwardDeliveryData;
  const p = c.bot_npBuildPayload(real, 'x');
  assert.deepEqual([...p.missing], []);
  assert.ok(!('AfterpaymentOnGoodsCost' in p.payload)); assert.ok(!('PreferredDeliveryDate' in p.payload)); assert.ok(!('SaturdayDelivery' in p.payload));
  assert.equal(p.payload.OptionsSeat.length, 1); assert.ok(!('BackwardDeliveryData' in p.payload));
  // ТТН з накладеним платежем (поля Backward*)
  const cod = Object.assign({}, real, { BackwardDeliveryCargoType: 'Money', BackwardDeliverySum: '1509.00', BackwardDeliveryMoney: '1509.00', AfterpaymentOnGoodsCost: '1509.10' });
  const q = c.bot_npBuildPayload(cod, 'x').payload;
  assert.deepEqual(JSON.parse(JSON.stringify(q.BackwardDeliveryData)), [{ PayerType: 'Recipient', CargoType: 'Money', RedeliveryString: '1509.00' }]);
  assert.equal(q.AfterpaymentOnGoodsCost, '1509.10');
  // якщо після запису накладений платіж зник — помилка
  const lost = Object.assign({}, cod, { BackwardDeliverySum: '0.00', BackwardDeliveryMoney: '0.00', BackwardDeliveryCargoType: '' });
  assert.ok(c.bot_npDiffDocs(cod, lost).includes('BackwardDeliverySum'));
});

test('C: НП віддає старий текст одразу після запису — повторне читання; якщо так і не збігся — у помилці видно, що повернула НП', () => {
  const env = fresh(); env.docs[TEST] = npDoc(TEST);
  let reads = 0, realUpdate = env.np.handler;
  env.np.handler = (p) => {
    if (p.calledMethod === 'getDocumentList') { reads++; const d = JSON.parse(JSON.stringify(env.docs[TEST])); if (reads === 2) d.AdditionalInformation = env.docs[TEST]._pending ? '' : d.AdditionalInformation; return [d]; }
    return realUpdate(p);
  };
  // 1) затримка: перше читання після запису ще старе
  env.docs[TEST].AdditionalInformation = '';
  let delayed = true;
  env.np.handler = (p) => {
    if (p.calledMethod === 'update') { env.pending = p.methodProperties.AdditionalInformation; return [{ Ref: env.docs[TEST].Ref, IntDocNumber: TEST }]; }
    if (p.calledMethod === 'getDocumentList') { const d = JSON.parse(JSON.stringify(env.docs[TEST])); if (env.pending !== undefined) { if (delayed) delayed = false; else d.AdditionalInformation = env.pending; } return [d]; }
    return [];
  };
  assert.equal(env.ctx.bot_npWriteDesc(TEST, 'тест 123').state, 'written');
  // 2) НП так і не оновила — помилка містить фактичне значення
  const env2 = fresh(); env2.docs[TEST] = npDoc(TEST); env2.docs[TEST].AdditionalInformation = 'Вввв';
  env2.np.handler = (p) => p.calledMethod === 'update' ? [{ Ref: 'r', IntDocNumber: '20450000000999' }] : (p.calledMethod === 'getDocumentList' ? [JSON.parse(JSON.stringify(env2.docs[TEST]))] : []);
  const res = env2.ctx.bot_npWriteDesc(TEST, 'тест 123');
  assert.equal(res.state, 'error'); assert.match(res.error, /Вввв/); assert.match(res.error, /ІНШИЙ номер ТТН/);
});

test('C: НП робить першу літеру великою («тест 123» → «Тест 123») — це не помилка', () => {
  const env = fresh(); env.docs[TEST] = npDoc(TEST);
  const base = env.np.handler;
  env.np.handler = (p) => { const r = base(p); if (p.calledMethod === 'update') { const d = env.docs[TEST]; d.AdditionalInformation = d.AdditionalInformation.charAt(0).toUpperCase() + d.AdditionalInformation.slice(1); } return r; };
  assert.equal(env.ctx.bot_npWriteDesc(TEST, 'тест 123').state, 'written');
  assert.equal(env.docs[TEST].AdditionalInformation, 'Тест 123');
  assert.equal(env.ctx.bot_npWriteDesc(TEST, 'тест 123').state, 'same');          // повтор — нічого не робимо
});

test('Розподіл оплат на ТТН: черга від старіших, повністю покриті позначаються лише кнопкою, скасування /undoalloc', () => {
  const env = fresh(); const c = env.ctx;
  c.bot_setSetting('OPENING_DEBT', '2227020'); c.bot_setSetting('OPENING_ORDERS_AFTER', '31.08.2026'); c.bot_setSetting('OPENING_PAYS_AFTER', '08.09.2026');
  const d = (m, dd) => c.bot_makeDate(2026, m, dd);
  const mk = (no, ttn, cost, date, extra) => c.bot_appendOrderRow(Object.assign({ no, date, print: 'A', type: 'Футболка', color: 'Чорний', size: 'M', placement: 'Позаду', prints: 1, ttn, cost, status: 'В роботі', paid: 'Не оплачено', msgId: String(no) }, extra), []);
  mk(14500, '20451000000001', 5000, d(8, 20));                  // до зрізу — не рахується
  mk(14600, '20451000000010', 420, d(9, 1)); mk(14601, '20451000000010', 420, d(9, 1));     // ТТН1: 840
  mk(14602, '20451000000011', 740, d(9, 2));                                                 // ТТН2: 740
  mk(14603, '20451000000012', 420, d(9, 3));                                                 // ТТН3: 420
  mk(14604, '20451000000013', 420, d(9, 4), { status: 'Скасовано' });                          // скасоване — пропуск
  const pay = (sum, date) => c.bot_addPaymentRow_('t' + sum, sum, date);
  pay(1000, d(9, 5)); pay(600, d(9, 9));                                                      // разом 1600: покриває ТТН1 (840) і ТТН2 (840+740=1580), на ТТН3 бракує 400
  const plan = c.bot_planAllocation(c.bot_readOrders(), c.bot_readPayments(), c.bot_openingFromSettings());
  assert.equal(plan.pool, 1600); assert.equal(plan.covered.length, 2); assert.equal(plan.leftover, 20); assert.equal(plan.nextNeed, 400);
  assert.equal(plan.covered[0].ttn, '20451000000010'); assert.equal(plan.covered[1].ttn, '20451000000011');
  // без кнопки нічого не змінюється; кнопка — позначає
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.bot_setSetting('OWNER_IDS', String(OWNER));
  env.update(privMsg('/allocate')); env.poll();
  const q = env.lastSent();
  assert.ok(c.bot_readOrders().every(o => o.paid === 'Не оплачено'));
  env.update(cb(q.reply_markup.inline_keyboard[0][0].callback_data, q.message_id)); env.poll();
  const paid = c.bot_readOrders().filter(o => o.paid === 'Оплачено');
  assert.equal(paid.length, 3); assert.ok(paid.every(o => /^Розподіл-/.test(o.recon)));
  assert.equal(c.bot_readOrders().find(o => o.no === 14500).paid, 'Не оплачено');
  assert.equal(c.bot_readOrders().find(o => o.no === 14603).paid, 'Не оплачено');
  // повторний розподіл — нічого нового; /undoalloc знімає
  const again = c.bot_planAllocation(c.bot_readOrders(), c.bot_readPayments(), c.bot_openingFromSettings());
  assert.equal(again.covered.length, 0); assert.equal(again.alreadyPaid, 2);
  env.update(privMsg('/undoalloc ' + paid[0].recon)); env.poll();
  assert.ok(c.bot_readOrders().every(o => o.paid === 'Не оплачено'));
});

test('НП: дата в минулому → сьогодні; «To many requests» — тимчасова помилка з повтором, не «Помилка НП»; /retry', () => {
  const env = fresh(); const c = env.ctx;
  const old = npDoc(TEST); old.DateTime = '01.10.2026 10:00:00';
  const p = c.bot_npBuildPayload(old, 'x').payload;
  assert.equal(p.DateTime, '07.10.2026');                                              // сьогодні в тесті — 07.10.2026
  assert.equal(c.bot_npBuildPayload(npDoc(TEST), 'x').payload.DateTime, '07.10.2026');
  const future = npDoc(TEST); future.DateTime = '20.10.2026 10:00:00';
  assert.equal(c.bot_npBuildPayload(future, 'x').payload.DateTime, '20.10.2026');
  const after = Object.assign({}, old, { DateTime: '07.10.2026 00:00:00' });
  assert.ok(!c.bot_npDiffDocs(old, after).includes('DateTime'));
  // ліміт запитів
  env.docs[TEST] = npDoc(TEST); let limited = 0;
  env.np.handler = (p2) => { limited++; return []; };
  env.np.fail = 'To many requests';
  const r = c.bot_npWriteDesc(TEST, 'x');
  assert.equal(r.state, 'transient'); assert.ok(limited >= 0);
  env.np.fail = null;
  // /retry повертає «Помилка НП» у «Новий»
  c.bot_ttnAppend({ ttn: TEST, orders: '15200', original: 'x', desc: '15200 test', len: 10, status: 'Помилка НП', note: 'DateTime cannot be less then now', msgId: '1' });
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.bot_setSetting('OWNER_IDS', String(OWNER));
  c.bot_cmdRetry(OWNER, '');
  assert.equal(ttnRows(env)[0].status, 'Новий');
});

test('Екстрений реєстр: /registry now створює додатковий реєстр навіть якщо сьогодні вже був', () => {
  const env = liveEnv();
  env.update(groupMsg(MSG1)); env.poll();
  env.setNow('2026-10-07T07:00:00Z'); env.poll();                                       // 10:00 — звичайний реєстр
  assert.equal(env.scans.length, 1);
  env.update(groupMsg(MSG2)); env.docs[T2] = npDoc(T2); env.poll();                    // нова ТТН після реєстру
  env.scanNo = '105-0002';
  env.update(privMsg('/registry')); env.poll();
  let q = env.lastSent();
  env.update(cb(q.reply_markup.inline_keyboard[0][0].callback_data, q.message_id)); env.poll();
  assert.equal(env.scans.length, 1);                                                    // звичайний /registry нового не створює
  env.update(privMsg('/registry now')); env.poll();
  q = env.lastSent();
  assert.match(q.text, /Екстрений реєстр/);
  env.update(cb(q.reply_markup.inline_keyboard[0][0].callback_data, q.message_id)); env.poll();
  assert.equal(env.scans.length, 2);
  assert.deepEqual([...env.scans[1].DocumentRefs], ['ref-' + T2]);
  assert.equal(groupDocs(env).length >= 2, true);
  assert.equal(ttnRows(env).find(r => r.ttn === T2).registry, '105-0002');
});

test('Чат «Отправка отчет»: /bind payments, «+10 000» власника → оплата автоматично; чужі/інші повідомлення ігноруються; повтор і редагування', () => {
  const env = newEnv({}); env.setup(); const c = env.ctx;
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; c.bot_setSetting('OWNER_IDS', String(OWNER));
  c.bot_setSetting('OPENING_DEBT', '2227020'); c.bot_setSetting('OPENING_ORDERS_AFTER', '31.08.2026'); c.bot_setSetting('OPENING_PAYS_AFTER', '08.09.2026');
  env.setNow('2026-10-12T16:35:00Z');
  const PAY = -1009999999999;
  const m = (text, from, id, kind) => ({ [kind || 'message']: { message_id: id, date: ts('2026-10-12T16:35:00Z'), chat: { id: PAY, type: 'supergroup', title: 'Отправка отчет' }, from: { id: from }, text } });
  env.update(m('/bind payments', OWNER, 1)); env.poll();
  assert.equal(c.bot_setting('PAY_CHAT_ID'), String(PAY));
  assert.equal(env.sentTo(PAY).length, 0);                                              // у чаті оплат бот мовчить
  env.update(m('+10 000', OWNER, 2)); env.poll();
  assert.equal(c.bot_readPayments().length, 1); assert.equal(c.bot_readPayments()[0].sum, 10000);
  assert.ok(env.sentTo(OWNER).some(s => /Оплату з чату/.test(s.text)));
  assert.equal(env.sentTo(PAY).length, 0);
  env.update(m('+5000', 999, 3)); env.update(m('Пораховано+', OWNER, 4)); env.update(m('привіт', OWNER, 5)); env.poll();
  assert.equal(c.bot_readPayments().length, 1);                                         // чужий «+5000» і не-оплати — ігноруємо
  env.update(m('+10 000', OWNER, 2)); env.poll();                                       // повторна обробка того ж повідомлення
  assert.equal(c.bot_readPayments().length, 1);
  env.update(m('+12 000', OWNER, 2, 'edited_message')); env.poll();                    // редагування суми
  assert.equal(c.bot_readPayments().length, 1); assert.equal(c.bot_readPayments()[0].sum, 12000);
  assert.ok(env.sentTo(OWNER).some(s => /виправлено/.test(s.text)));
});
