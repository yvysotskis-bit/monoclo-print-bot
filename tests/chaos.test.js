// Хаос-тест на згенерованих повідомленнях (без реальних даних): повтори оновлень Telegram, збої НП («To many requests») і збої надсилання
// повідомлень мають давати ТОЙ САМИЙ підсумковий стан, що й чистий прогін; у НП — рівно по одному запису на ТТН.
const test = require('node:test');
const assert = require('node:assert/strict');
const { newEnv } = require('./gasmock');

function gen(seed0) {
  let seed = seed0; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; const pick = a => a[Math.floor(rnd() * a.length)];
  const msgs = []; let no = 15100, ttnN = 1;
  for (let i = 0; i < 160; i++) {
    const k = 1 + Math.floor(rnd() * (rnd() < 0.2 ? 8 : 3)); const blocks = [];
    for (let j = 0; j < k; j++, no++) {
      const r = rnd();
      if (r < 0.08) blocks.push(`${no}. Стікерпак ${pick(['ГТА', 'Ландо Норріс'])}`);
      else if (r < 0.14) blocks.push(`${no}. Кепка сіра ${pick(['', 'виварена '])}Red Bull - SK69`);
      else blocks.push([`${no}. Принт ${pick(['no-risk (W)', 'CV (B)', 'Norris World Champion', 'McLaren 1963 (W) + Lando-Logo', 'A'])}`, pick(['Футболка чорна', 'Футболка біла', 'Худі x3 ❗️БЕЗ ФЛІСУ', 'Худі x1 БЕЗ ФЛІСУ', 'Худі графіт виварене']), pick(['S', 'M', 'L', 'XL']), pick(['Принт позаду', 'Принт спереду', 'Принти як на візуалі'])].join('\n'));
    }
    const noTtn = rnd() < 0.05;
    msgs.push({ id: 30000 + i, date: Date.UTC(2026, 9, 1 + Math.floor(i / 14), 8 + (i % 9), i % 60), text: blocks.join('\n\n') + (noTtn ? '' : '\n\n2045' + String(1500000000 + ttnN++).padStart(10, '0')) });
    if (rnd() < 0.1) msgs.push({ id: 30000 + i + 0.5, repost: true, date: msgs[msgs.length - 1].date + 1000, text: msgs[msgs.length - 1].text });     // повторна публікація
  }
  return msgs;
}

function run(chaos) {
  let seed = 4242; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const OWNER = 111, GROUP = -1001234567890, ORD_T = 5;
  const env = newEnv({}); env.setup(); const c = env.ctx;
  env.props.TG_TOKEN = '123:ABCDEFGHIJKLMNOPQRSTUVWXYZ'; env.props.BOT_ENABLED = '1'; env.props.NP_API_KEY = 'K'; env.props.NP_TEST_OK = '1';
  c.bot_setSetting('OWNER_IDS', String(OWNER)); c.bot_setSetting('GROUP_CHAT_ID', GROUP); c.bot_setSetting('ORDERS_THREAD_ID', ORD_T); c.bot_setSetting('REPORT_THREAD_ID', 7);
  c.bot_setSetting('NP_MODE', 'бойовий'); c.bot_setSetting('REACTIONS', 'ні');
  const docs = {}; const writes = {};
  env.np.handler = (p) => {
    const m = p.methodProperties || {};
    if (chaos && rnd() < 0.25) { const e = new Error('збій'); throw e; }                       // «збій зв'язку/ліміт» — виняток до виконання
    if (p.calledMethod === 'getDocumentList') { const t = m.IntDocNumber; docs[t] = docs[t] || { Ref: 'ref-' + t, IntDocNumber: t, DateTime: '01.10.2026 10:00:00', PayerType: 'Recipient', PaymentMethod: 'Cash', CargoType: 'Parcel', Weight: '1', ServiceType: 'WarehouseWarehouse', SeatsAmount: '1', Description: 'x', Cost: '200.00', CitySender: 'a', Sender: 'a', SenderAddress: 'a', ContactSender: 'a', SendersPhone: '1', CityRecipient: 'a', Recipient: 'a', RecipientAddress: 'a', ContactRecipient: 'a', RecipientsPhone: '2', AdditionalInformation: '' }; return [JSON.parse(JSON.stringify(docs[t]))]; }
    if (p.calledMethod === 'update') { const d = Object.values(docs).find(x => x.Ref === m.Ref); d.AdditionalInformation = m.AdditionalInformation; writes[d.IntDocNumber] = (writes[d.IntDocNumber] || 0) + 1; return [{ Ref: d.Ref }]; }
    return [];
  };
  if (chaos) env.state.netFail = (url) => /sendMessage|sendDocument|setMessageReaction/.test(url) && rnd() < 0.15;
  let n = 0;
  gen(99).forEach(m => {
    const u = { message: { message_id: Math.floor(m.id) + (m.repost ? 500000 : 0), date: Math.floor(m.date / 1000), chat: { id: GROUP, type: 'supergroup' }, from: { id: 999 }, is_topic_message: true, message_thread_id: ORD_T, caption: m.text } };
    env.update(u); if (chaos && rnd() < 0.3) env.update(JSON.parse(JSON.stringify(u)));       // дубль того ж повідомлення (інший update_id)
    if (++n % 20 === 0) { env.setNow(new Date(m.date + 60000).toISOString()); env.poll(); if (chaos) env.poll(); }
  });
  for (let i = 0; i < 100; i++) { env.setNow('2026-10-20T05:00:00Z'); env.poll(); }
  return {
    orders: [...c.bot_readOrders().map(o => [o.no, o.ttn, o.type, o.color, o.size, o.cost].join('|')).sort()],
    ttn: [...c.bot_readTtnRows().map(r => [r.ttn, r.orders, r.desc, r.status].join('|')).sort()],
    docs: [...Object.keys(docs).sort().map(k => k + '=' + docs[k].AdditionalInformation)], writes
  };
}

test('Хаос: повтори оновлень + збої НП і Telegram → той самий підсумковий стан, по одному запису в НП на ТТН', { timeout: 600000 }, () => {
  const clean = run(false), noisy = run(true);
  assert.ok(clean.orders.length > 200 && clean.ttn.length > 80);
  assert.deepEqual(noisy.orders, clean.orders);
  assert.deepEqual(noisy.ttn, clean.ttn);
  assert.deepEqual(noisy.docs, clean.docs);
  Object.keys(noisy.writes).forEach(t => assert.equal(noisy.writes[t], 1, 'ТТН ' + t + ' записано в НП ' + noisy.writes[t] + ' разів'));
  assert.ok(clean.ttn.every(r => r.endsWith('|Записано в НП')));
});
