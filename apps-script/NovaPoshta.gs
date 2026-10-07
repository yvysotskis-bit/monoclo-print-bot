/**
 * NovaPoshta.gs — статуси Нової пошти (розділ 7.6 ТЗ): оновлення кожні 30 хв пакетами до 100 ТТН,
 * етап доставки за StatusCode, «Дата створення ТТН», «Дата передачі НП» (7.7), «Прибуло у відділення».
 *
 * УВАГА: цей файл написано за документацією API НП, бо старий скрипт NovaPoshtaStatus.gs не було передано.
 * Таблиця відповідності кодів (BOT_NP_STAGE_BY_CODE) — в одному місці, її легко звірити зі старим скриптом.
 */

// StatusCode → «Етап доставки». Невідомий код → етап НЕ змінюємо, пишемо в «Лог».
var BOT_NP_STAGE_BY_CODE = {
  '1': 'Не передана',      // Відправник самостійно створив цю накладну, але ще не надав до відправки
  '2': 'Немає ТТН',        // Видалено
  '3': 'Немає ТТН',        // Номер не знайдено
  '4': 'В дорозі',         // Відправлення у місті відправлення
  '41': 'В дорозі',
  '5': 'В дорозі',         // Відправлення прямує до міста одержувача
  '6': 'В дорозі',         // Відправлення у місті одержувача
  '12': 'В дорозі',        // Нова Пошта комплектує відправлення
  '101': 'В дорозі',       // На шляху до одержувача
  '104': 'В дорозі',       // Змінено адресу
  '111': 'В дорозі',       // Невдала спроба доставки
  '112': 'В дорозі',       // Дату доставки перенесено
  '7': 'На відділенні',    // Прибув на відділення
  '8': 'На відділенні',    // Прибув на відділення (завантажено в поштомат)
  '9': 'Отримано',         // Відправлення отримано
  '10': 'Отримано',
  '11': 'Отримано',
  '102': 'Відмова',        // Відмова від отримання (відправником)
  '103': 'Відмова',        // Відмова одержувача (створюється заявка на повернення)
  '105': 'Повернення',     // Припинено зберігання
  '106': 'Повернення'      // Одержано і створено ЄН зворотної доставки
};

function bot_npStageByCode(code) {
  var c = String(code === null || code === undefined ? '' : code).trim();
  return Object.prototype.hasOwnProperty.call(BOT_NP_STAGE_BY_CODE, c) ? BOT_NP_STAGE_BY_CODE[c] : '';
}

function bot_isFinalStage(stage) { return BOT_FINAL_STAGES.indexOf(stage) >= 0; }

/** «dd-mm-yyyy hh:mm:ss» (як у старій таблиці). */
function bot_fmtNpDate(date) {
  var p = bot_kyivParts(date);
  return bot_pad2(p.d) + '-' + bot_pad2(p.m) + '-' + p.y + ' ' + bot_pad2(p.h) + ':' + bot_pad2(p.mi) + ':' + bot_pad2(p.s);
}

/** Відповідь getStatusDocuments для однієї ТТН → зручна структура. */
function bot_npParseItem(raw) {
  var scheduled = bot_parseDate(raw.ScheduledDeliveryDate);
  var status = bot_trim(raw.Status);
  var item = {
    ttn: bot_normTtn(raw.Number),
    code: String(raw.StatusCode === undefined || raw.StatusCode === null ? '' : raw.StatusCode).trim(),
    status: status,
    created: bot_parseDate(raw.DateCreated),
    scheduled: scheduled,
    actualDelivery: bot_parseDate(raw.ActualDeliveryDate),
    firstStorageDay: bot_parseDate(raw.DateFirstDayStorage),
    payedKeepingFrom: bot_parseDate(raw.DatePayedKeeping),
    name: bot_trim(raw.RecipientFullName),
    phone: bot_trim(raw.PhoneRecipient || raw.RecipientPhone)
  };
  item.stage = bot_npStageByCode(item.code);
  item.statusText = status + (scheduled ? ' (очік. доставка: ' + bot_fmtNpDate(scheduled) + ')' : '');
  item.notFound = item.code === '3' || /не знайдено/i.test(status);
  return item;
}

/**
 * Що записати в рядок «Замовлення» за відповіддю НП (чиста функція).
 * order — поточний рядок; item — bot_npParseItem; now — Date.
 * @return {fields, unknownCode}
 */
function bot_npPlanPatch(order, item, now) {
  var f = {};
  var unknown = false;
  if (item.statusText && item.statusText !== order.npStatus) f.npStatus = item.statusText;
  if (item.created && (!order.ttnDate || order.ttnDate.getTime() !== item.created.getTime())) f.ttnDate = item.created;
  if (!item.stage) {
    unknown = true;                                           // етап не змінюємо
  } else {
    if (item.stage !== order.stage) f.stage = item.stage;
    // перша передача НП: етап вперше змінився з «Не передана» на будь-який інший (7.7)
    if (order.stage === 'Не передана' && item.stage !== 'Не передана' && item.stage !== 'Немає ТТН' && !order.handoff) f.handoff = now;
    if (item.stage === 'На відділенні' && !order.arrived) f.arrived = item.actualDelivery || item.firstStorageDay || now;
  }
  return { fields: f, unknownCode: unknown };
}

// ---------- API ----------

function bot_npCall_(modelName, calledMethod, props) {
  var key = bot_prop(BOT_PROP.NP_KEY);
  if (!key) throw new Error('Не введено ключ API Нової пошти. Меню 🤖 Бот → Ввести ключ Нової пошти.');
  var resp = UrlFetchApp.fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ apiKey: key, modelName: modelName, calledMethod: calledMethod, methodProperties: props })
  });
  var body;
  try { body = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('НП відповіла не JSON (HTTP ' + resp.getResponseCode() + ')'); }
  if (!body.success) throw new Error('НП: ' + ((body.errors || []).join('; ') || 'невідома помилка'));
  return body.data || [];
}

/** ТТН → розібрані дані НП. Пакети по 100. */
function bot_npFetch(ttns, phone) {
  var out = {};
  for (var i = 0; i < ttns.length; i += 100) {
    var docs = ttns.slice(i, i + 100).map(function (t) {
      var d = { DocumentNumber: t };
      if (phone) d.Phone = phone;
      return d;
    });
    bot_npCall_('TrackingDocument', 'getStatusDocuments', { Documents: docs }).forEach(function (raw) {
      var it = bot_npParseItem(raw);
      if (it.ttn) out[it.ttn] = it;
    });
  }
  return out;
}

/** Перевірка ключа (для «Перевірити, що все працює»). */
function bot_npPing() {
  bot_npCall_('TrackingDocument', 'getStatusDocuments', { Documents: [{ DocumentNumber: '20400048799000' }] });
  return true;
}

// ---------- оновлення таблиці ----------

/**
 * @param opts {rows:[номери рядків]|null — лише ці рядки, onlyUnsent:true — лише «Не передана»,
 *              maxTtn: ліміт ТТН за запуск}
 * @return {updated, checked, unknown:[...], error}
 */
function bot_npUpdate(opts) {
  opts = opts || {};
  if (!bot_prop(BOT_PROP.NP_KEY)) return { skipped: 'немає ключа НП' };
  var orders = bot_readOrders().filter(function (o) { return bot_isTtn(o.ttn) && o.status !== 'Скасовано'; });
  var rowSet = null;
  if (opts.rows) { rowSet = {}; opts.rows.forEach(function (r) { rowSet[r] = true; }); }
  var want = {};
  orders.forEach(function (o) {
    if (rowSet && !rowSet[o._row]) return;
    if (opts.onlyUnsent) { if (o.stage !== 'Не передана') return; }
    else if (!rowSet && bot_isFinalStage(o.stage) && o.ttnDate) return;
    want[o.ttn] = true;
  });
  var ttns = Object.keys(want).slice(0, opts.maxTtn || 600);
  if (!ttns.length) return { checked: 0, updated: 0, unknown: [] };

  var items;
  try { items = bot_npFetch(ttns, bot_setting('NP_SENDER_PHONE')); }
  catch (e) { bot_log('ПОМИЛКА', 'НП', e.message); return { error: e.message }; }

  var now = new Date(), updated = 0, unknown = [];
  bot_withLock(function () {
    var patches = [];
    bot_readOrders().forEach(function (o) {
      var it = items[o.ttn];
      if (!it) return;
      var plan = bot_npPlanPatch(o, it, now);
      if (plan.unknownCode && unknown.indexOf(it.code) < 0) { unknown.push(it.code); bot_log('УВАГА', 'невідомий код НП', 'код ' + it.code + ' · «' + it.status + '» · ТТН ' + it.ttn); }
      if (Object.keys(plan.fields).length) { patches.push({ row: o._row, fields: plan.fields }); updated++; }
    });
    bot_patchOrders(patches);
  });
  bot_setProp(BOT_PROP.LAST_NP_TS, Date.now());
  return { checked: ttns.length, updated: updated, unknown: unknown, items: items };
}
