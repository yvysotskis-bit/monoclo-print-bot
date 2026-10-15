// Наскрізний сценарій робочого дня (на імітації Apps Script і Нової пошти): замовлення → описи → збої НП → редагування →
// оплати з чату → розподіл → реєстр (зі збоєм відправки) → повтори. Перевіряє взаємодію модулів, а не окремі функції.
const test = require('node:test');
const assert = require('node:assert/strict');
const { newEnv } = require('./gasmock');

const OWNER = 111, GROUP = -1001234567890, ORD_T = 5, REP_T = 7, PAY = -1009999999999;
let mid = 20000, uid0 = 0;
const ts = (iso) => Math.floor(Date.parse(iso) / 1000);
const thread = (caption, id, from) => ({ message: { message_id: id || ++mid, date: ts('2026-10-07T05:10:00Z'), chat: { id: GROUP, type: 'supergroup' }, from: { id: from || 999 }, is_topic_message: true, message_thread_id: ORD_T, caption } });
const edit = (id, caption) => ({ edited_message: { message_id: id, date: ts('2026-10-07T05:10:00Z'), edit_date: ts('2026-10-07T05:20:00Z'), chat: { id: GROUP, type: 'supergroup' }, from: { id: 999 }, is_topic_message: true, message_thread_id: ORD_T, caption } });
const priv = (text) => ({ message: { message_id: ++mid, date: ts('2026-10-07T05:10:00Z'), chat: { id: OWNER, type: 'private' }, from: { id: OWNER }, text } });
const cb = (data, msgId) => ({ callback_query: { id: 'c' + (++mid), from: { id: OWNER }, message: { message_id: msgId, chat: { id: OWNER } }, data } });
const payMsg = (text, id) => ({ message: { message_id: id, date: ts('2026-10-12T16:35:00Z'), chat: { id: PAY, type: 'supergroup', title: 'Отправка отчет' }, from: { id: OWNER }, text } });

const A = '20451560000001', B = '20451560000002', C = '20451560000003';
const doc = (t) => ({ Ref: 'ref-' + t, IntDocNumber: t, DateTime: '07.10.2026 10:00:00', PayerType: 'Recipient', PaymentMethod: 'Cash', CargoType: 'Parcel', Weight: '1.00', ServiceType: 'WarehouseWarehouse', SeatsAmount: '1', Description: 'Одяг', Cost: '200.00', CitySender: 'cs', Sender: 's', SenderAddress: 'sa', ContactSender: 'cts', SendersPhone: '1', CityRecipient: 'cr', Recipient: 'r', RecipientAddress: 'ra', ContactRecipient: 'ctr', RecipientsPhone: '2', AfterpaymentOnGoodsCost: '0.00', AdditionalInformation: '' });

test('Наскрізний день: описи, збої НП, редагування, оплати, розподіл, реєстр зі збоєм — без дублів і втрат', () => {
  const env = newEnv({}); env.setup(); const c = env.ctx;
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; env.props.BOT_ENABLED = '1'; env.props.NP_API_KEY = 'SECRET';
  c.bot_setSetting('OWNER_IDS', String(OWNER)); c.bot_setSetting('GROUP_CHAT_ID', GROUP); c.bot_setSetting('ORDERS_THREAD_ID', ORD_T); c.bot_setSetting('REPORT_THREAD_ID', REP_T);
  c.bot_setSetting('PAY_CHAT_ID', PAY); c.bot_setSetting('NP_MODE', 'бойовий'); env.props.NP_TEST_OK = '1';
  c.bot_setSetting('OPENING_DEBT', '1000000'); c.bot_setSetting('OPENING_ORDERS_AFTER', '31.08.2026'); c.bot_setSetting('OPENING_PAYS_AFTER', '08.09.2026');
  env.setNow('2026-10-07T05:00:00Z');                                                        // 08:00 Київ
  const docs = { [A]: doc(A), [B]: doc(B), [C]: doc(C) }; let rateLimit = 0; const calls = [];
  env.np.handler = (p) => {
    const m = p.methodProperties || {}; calls.push(p.calledMethod);
    if (p.calledMethod === 'getDocumentList') { const d = docs[m.IntDocNumber]; return d ? [JSON.parse(JSON.stringify(d))] : []; }
    if (p.calledMethod === 'update') { if (rateLimit > 0) { rateLimit--; throw Object.assign(new Error('x'), {}); } const d = Object.values(docs).find(x => x.Ref === m.Ref); d.AdditionalInformation = m.AdditionalInformation.charAt(0).toUpperCase() + m.AdditionalInformation.slice(1); return [{ Ref: d.Ref }]; }
    if (p.calledMethod === 'insertDocuments') { env.scans = (env.scans || []).concat([m]); return [{ Ref: 'scan', Number: '105-777', Data: { Success: m.DocumentRefs.map(r => ({ Ref: r })), Errors: [] } }]; }
    return [];
  };
  const upd = (u) => { env.update(u); };
  // 1) три повідомлення: одне замовлення; два замовлення; замовлення без ТТН
  const m1 = ++mid, m2 = ++mid, m3 = ++mid;
  upd(thread(`15200. Принт Test-One (W)\nФутболка чорна\nM\nПринт позаду\n\n${A}`, m1));
  upd(thread(`15201. Принт Two\nХуді x3 БЕЗ ФЛІСУ\nS\nПринт позаду\n\n15202. Принт Three\nФутболка біла\nL\nПринт позаду\n\n${B}`, m2));
  upd(thread(`15203. Принт Four\nФутболка сіра\nXL\nПринт позаду`, m3));
  upd(thread(`15200. Принт Test-One (W)\nФутболка чорна\nM\nПринт позаду\n\n${A}`, ++mid));              // повторна публікація тієї ж ТТН
  env.poll();
  assert.equal(c.bot_readOrders().length, 4);                                                // 4 замовлення, повтор не додав п'яте
  assert.equal(c.bot_readTtnRows().length, 2);                                               // дві ТТН (замовлення без ТТН ще немає)
  assert.ok(c.bot_readTtnRows().every(r => r.status === 'Записано в НП'));
  assert.equal(docs[A].AdditionalInformation, '15200 Test-One (W) футболка чорна M, принт позаду');
  // 2) повторний запуск тригера і повтор того самого оновлення Telegram — без нових записів у НП
  const updatesBefore = calls.filter(x => x === 'update').length;
  env.poll(); env.poll();
  assert.equal(calls.filter(x => x === 'update').length, updatesBefore);
  // 3) ТТН дописали редагуванням → з'являється опис; редагування тексту → опис перебудовується й перезаписується один раз
  docs[C].AdditionalInformation = ''; upd(edit(m3, `15203. Принт Four\nФутболка сіра\nXL\nПринт позаду\n\n${C}`)); env.poll();
  assert.equal(c.bot_readTtnRows().length, 3); assert.equal(docs[C].AdditionalInformation, '15203 Four футболка сіра XL, принт позаду');
  upd(edit(m1, `15200. Принт Test-One (W)\nФутболка чорна\nL\nПринт позаду\n\n${A}`)); env.poll();
  assert.equal(docs[A].AdditionalInformation, '15200 Test-One (W) футболка чорна L, принт позаду');
  // 4) оплата з чату «Отправка отчет» → оплата, розподіл по кнопці
  env.setNow('2026-10-12T16:40:00Z');
  const costA = c.bot_readOrders().filter(o => o.ttn === A).reduce((s, o) => s + o.cost, 0);
  upd(payMsg('+' + costA, 5001)); upd(payMsg('+' + costA, 5001)); env.poll();                // друге оновлення — повтор того ж повідомлення
  assert.equal(c.bot_readPayments().length, 1);
  const alloc = env.sentTo(OWNER).filter(s => s.reply_markup && /aly\|/.test(JSON.stringify(s.reply_markup))).pop();
  assert.ok(alloc, 'пропозиція розподілу надійшла власнику');
  assert.ok(c.bot_readOrders().every(o => o.paid === 'Не оплачено'));                          // без кнопки — нічого не оплачено
  upd(cb(alloc.reply_markup.inline_keyboard[0][0].callback_data, alloc.message_id)); env.poll();
  const paidNow = c.bot_readOrders().filter(o => o.paid === 'Оплачено');
  assert.ok(paidNow.length >= 1 && paidNow.every(o => o.ttn === A));                          // оплачено лише ТТН, яку покриває сума
  // 5) реєстр о 10:00 зі збоєм відправки PDF: у НП створюється один раз, PDF не дублюється
  env.setNow('2026-10-13T07:00:00Z');
  let sendFails = 1; const realFetch = c.UrlFetchApp.fetch;
  c.UrlFetchApp.fetch = (u, o) => { if (/sendDocument/.test(u) && sendFails-- > 0) throw new Error('мережа'); return realFetch(u, o); };
  env.poll(); env.poll(); env.poll();
  assert.equal(env.scans.length, 1);
  assert.equal((env.tg.documents || []).length, 1);
  assert.deepEqual(env.scans[0].DocumentRefs.sort(), ['ref-' + A, 'ref-' + B, 'ref-' + C]);
  assert.equal(env.sheet('Реєстри').getRange(2, 7).getValue(), 'Надіслано');
  assert.ok(c.bot_readTtnRows().every(r => r.registry === '105-777'));
  // 6) подальші запуски в цей день: нічого нового; ключ НП не потрапив у Telegram
  env.poll(); env.poll();
  assert.equal(env.scans.length, 1); assert.equal((env.tg.documents || []).length, 1);
  assert.ok(!JSON.stringify(env.tg.calls).includes('SECRET'));
  assert.equal(env.tg.documents[0].document.name, '15200-15203.pdf');
});
