/**
 * Telegram.gs — Telegram Bot API через UrlFetchApp, опитування getUpdates з тригера щохвилини,
 * маршрутизація оновлень і команд. Вебхук (doPost) НЕ використовується (302-редирект → дублі).
 */

// =====================================================================
// API
// =====================================================================

function bot_token() {
  var t = bot_prop(BOT_PROP.TG_TOKEN);
  if (!t) throw new Error('Не введено токен Telegram. Меню 🤖 Бот → Ввести токен Telegram.');
  return t;
}

/** Сирий виклик: повертає розібрану відповідь Telegram ({ok, result, description, ...}). */
function bot_tgRaw(method, payload) {
  var url = 'https://api.telegram.org/bot' + bot_token() + '/' + method;
  var opts = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload || {}), muteHttpExceptions: true };
  for (var attempt = 0; attempt < 3; attempt++) {
    var resp = UrlFetchApp.fetch(url, opts);
    var body;
    try { body = JSON.parse(resp.getContentText()); } catch (e) { body = { ok: false, description: 'HTTP ' + resp.getResponseCode() }; }
    if (!body.ok && body.error_code === 429 && body.parameters && body.parameters.retry_after && body.parameters.retry_after <= 10) {
      Utilities.sleep((body.parameters.retry_after + 1) * 1000);
      continue;
    }
    return body;
  }
  return { ok: false, description: 'Забагато запитів до Telegram' };
}

function bot_tg(method, payload) {
  var r = bot_tgRaw(method, payload);
  if (!r.ok) throw new Error('Telegram ' + method + ': ' + r.description);
  return r.result;
}

/** Довжина тексту так, як її рахує Telegram: без HTML-тегів, сутності — по 1 символу (ліміт 4096). */
function bot_visibleLen_(t) {
  return String(t).replace(/<[^>]+>/g, '').replace(/&(lt|gt|amp|quot);/g, 'x').length;
}

var BOT_TG_LIMIT_ = 3900;

/** Ділить довгий текст по рядках на частини, що вміщаються в повідомлення. */
function bot_chunkText_(text, limit) {
  limit = limit || BOT_TG_LIMIT_;
  var out = [], cur = '';
  String(text).split('\n').forEach(function (line) {
    while (bot_visibleLen_(line) > limit) {                 // один надто довгий рядок — ріжемо жорстко
      if (cur) { out.push(cur); cur = ''; }
      out.push(line.slice(0, limit)); line = line.slice(limit);
    }
    if (cur && bot_visibleLen_(cur) + 1 + bot_visibleLen_(line) > limit) { out.push(cur); cur = line; }
    else cur = cur ? cur + '\n' + line : line;
  });
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

/** Надіслати повідомлення (довгі діляться на кілька). opts: {thread, keyboard, silent} */
function bot_send(chatId, text, opts) {
  opts = opts || {};
  var chunks = bot_visibleLen_(text) > BOT_TG_LIMIT_ ? bot_chunkText_(text) : [String(text)];
  var r = null;
  for (var i = 0; i < chunks.length; i++) {
    var p = { chat_id: chatId, text: chunks[i], parse_mode: 'HTML', disable_web_page_preview: true };
    if (opts.thread) p.message_thread_id = Number(opts.thread);
    if (opts.keyboard && i === chunks.length - 1) p.reply_markup = opts.keyboard;
    if (opts.silent) p.disable_notification = true;
    r = bot_tgRaw('sendMessage', p);
    if (!r.ok) { bot_log('ПОМИЛКА', 'sendMessage', r.description + ' · chat ' + chatId); return r; }
  }
  return r;
}

function bot_edit(chatId, messageId, text, keyboard) {
  if (bot_visibleLen_(text) > BOT_TG_LIMIT_) text = bot_chunkText_(text)[0] + '\n…';
  var p = { chat_id: chatId, message_id: messageId, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  p.reply_markup = keyboard || { inline_keyboard: [] };
  var r = bot_tgRaw('editMessageText', p);
  if (!r.ok && !/not modified/i.test(r.description || '')) bot_log('ПОМИЛКА', 'editMessageText', r.description);
  return r;
}

function bot_answerCb(id, text, alert) {
  bot_tgRaw('answerCallbackQuery', { callback_query_id: id, text: String(text || '').slice(0, 190), show_alert: !!alert });
}

function bot_react(chatId, messageId, emoji) {
  if (String(bot_setting('REACTIONS', 'так')).toLowerCase() === 'ні') return;
  var r = bot_tgRaw('setMessageReaction', { chat_id: chatId, message_id: messageId, reaction: [{ type: 'emoji', emoji: emoji }] });
  if (!r.ok) bot_log('УВАГА', 'setMessageReaction', r.description);
}

function bot_sendToOwners(text, opts) {
  bot_ownerIds().forEach(function (id) { bot_send(id, text, opts); });
}

/** Звичайні повідомлення, довші за ліміт, надсилаємо кількома. */
function bot_sendMany(chatId, parts, opts) {
  var ok = true;
  parts.forEach(function (p) { var r = bot_send(chatId, p, opts); if (r && !r.ok) ok = false; });
  return ok;
}

/** Скачати файл з Telegram як Blob. */
function bot_downloadFile(fileId, name) {
  var info = bot_tg('getFile', { file_id: fileId });
  var url = 'https://api.telegram.org/file/bot' + bot_token() + '/' + info.file_path;
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error('Не вдалося завантажити файл (' + resp.getResponseCode() + ')');
  return resp.getBlob().setName(name || 'file');
}

// ---------- відкладене видалення службових відповідей ----------

function bot_scheduleDelete(chatId, messageId, afterSec) {
  var list = [];
  try { list = JSON.parse(bot_prop(BOT_PROP.PENDING_DELETE) || '[]'); } catch (e) { list = []; }
  list.push({ c: chatId, m: messageId, t: Date.now() + afterSec * 1000 });
  bot_setProp(BOT_PROP.PENDING_DELETE, JSON.stringify(list.slice(-50)));
}

function bot_flushDeletes() {
  var list = [];
  try { list = JSON.parse(bot_prop(BOT_PROP.PENDING_DELETE) || '[]'); } catch (e) { list = []; }
  if (!list.length) return;
  var now = Date.now(), rest = [];
  list.forEach(function (x) {
    if (x.t <= now) bot_tgRaw('deleteMessage', { chat_id: x.c, message_id: x.m });
    else rest.push(x);
  });
  bot_setProp(BOT_PROP.PENDING_DELETE, JSON.stringify(rest));
}

// ---------- тимчасові дані для кнопок (callback_data ≤ 64 байти) ----------

function bot_pendingPut(payload) {
  var map = {};
  try { map = JSON.parse(bot_prop(BOT_PROP.PENDING_INPUT) || '{}'); } catch (e) { map = {}; }
  var now = Date.now();
  Object.keys(map).forEach(function (k) { if (now - map[k].t > 3 * 86400000) delete map[k]; });
  var token = Utilities.getUuid().slice(0, 8);
  map[token] = { t: now, p: payload };
  bot_setProp(BOT_PROP.PENDING_INPUT, JSON.stringify(map));
  return token;
}

function bot_pendingGet(token) {
  try { var m = JSON.parse(bot_prop(BOT_PROP.PENDING_INPUT) || '{}'); return m[token] ? m[token].p : null; } catch (e) { return null; }
}

function bot_pendingDrop(token) {
  try {
    var m = JSON.parse(bot_prop(BOT_PROP.PENDING_INPUT) || '{}'); delete m[token];
    bot_setProp(BOT_PROP.PENDING_INPUT, JSON.stringify(m));
  } catch (e) { /* ігноруємо */ }
}

/** Користувач, від якого чекаємо число (інша сума оплати). */
function bot_awaitPut(userId, payload) {
  var m = {};
  try { m = JSON.parse(bot_prop('AWAIT_INPUT') || '{}'); } catch (e) { m = {}; }
  m[String(userId)] = { t: Date.now(), p: payload };
  bot_setProp('AWAIT_INPUT', JSON.stringify(m));
}

function bot_awaitTake(userId) {
  try {
    var m = JSON.parse(bot_prop('AWAIT_INPUT') || '{}');
    var x = m[String(userId)];
    if (!x) return null;
    delete m[String(userId)];
    bot_setProp('AWAIT_INPUT', JSON.stringify(m));
    return (Date.now() - x.t < 900000) ? x.p : null;      // очікуємо число не довше 15 хв
  } catch (e) { return null; }
}

// =====================================================================
// Опитування
// =====================================================================

function bot_threadOf(msg) {
  return (msg.is_topic_message && msg.message_thread_id) ? String(msg.message_thread_id) : '0';
}

var BOT_MAX_ATTEMPTS_ = 3;

/** Атомарно «займає» опитування (два запуски тригера одночасно не можуть обробляти ті самі оновлення). */
function bot_pollEnter_(now) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return false;
  try {
    var ts = Number(bot_prop(BOT_PROP.POLL_LOCK_TS) || 0);
    if (ts && now - ts < 290000) return false;               // попередній запуск ще працює
    bot_setProp(BOT_PROP.POLL_LOCK_TS, now);
    return true;
  } finally { lock.releaseLock(); }
}

function bot_retryState_() {
  try { return JSON.parse(bot_prop('UPDATE_RETRY') || '{}'); } catch (e) { return {}; }
}

/** Забирає оновлення з Telegram. Оновлення «підтверджується» (offset) лише після успішної обробки
 *  або після 3 невдалих спроб — тимчасовий збій не губить замовлення. */
function bot_pollUpdates_(started) {
  var offset = Number(bot_prop(BOT_PROP.OFFSET) || 0);
  var payload = { timeout: 0, limit: 100, allowed_updates: BOT_ALLOWED_UPDATES };
  if (offset) payload.offset = offset;
  var res = bot_tgRaw('getUpdates', payload);
  if (!res.ok) { bot_log('ПОМИЛКА', 'getUpdates', res.description); return; }
  bot_setProp(BOT_PROP.LAST_POLL_TS, Date.now());
  var list = res.result.slice().sort(function (a, b) { return a.update_id - b.update_id; });
  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    if (Date.now() - started > 200000) return;                // решта — у наступному запуску
    try {
      bot_handleUpdate(u);
    } catch (e) {
      var st = bot_retryState_();
      var n = (st.id === u.update_id ? st.n : 0) + 1;
      bot_log('ПОМИЛКА', 'update ' + u.update_id + ' (спроба ' + n + ')', e.message + ' | ' + (e.stack || '').split('\n')[1]);
      if (n < BOT_MAX_ATTEMPTS_) {
        bot_setProp('UPDATE_RETRY', JSON.stringify({ id: u.update_id, n: n }));
        return;                                               // оновлення лишається в черзі Telegram, порядок зберігається
      }
      try { bot_sendToOwners('⚠️ Не вдалося обробити оновлення Telegram після ' + n + ' спроб (пропущено): ' + bot_esc(bot_scrub(e.message))); } catch (e2) { /* ігноруємо */ }
    }
    bot_delProp('UPDATE_RETRY');
    bot_setProp(BOT_PROP.OFFSET, u.update_id + 1);
  }
}

/** Тригер «щохвилини». */
function bot_poll() {
  if (bot_prop(BOT_PROP.ENABLED) === '0') return;
  var started = Date.now();
  if (!bot_pollEnter_(started)) return;
  try {
    try { bot_pollUpdates_(started); } catch (e) { bot_log('ПОМИЛКА', 'опитування Telegram', e.message); }
    try { bot_flushDeletes(); } catch (e) { bot_log('ПОМИЛКА', 'flushDeletes', e.message); }
    if (Date.now() - started < 150000) {
      try { bot_tickScheduled(started); } catch (e) { bot_log('ПОМИЛКА', 'tickScheduled', e.message); }
    }
  } finally {
    bot_delProp(BOT_PROP.POLL_LOCK_TS);
  }
}

function bot_handleUpdate(u) {
  if (u.message) return bot_onMessage(u.message, false);
  if (u.edited_message) return bot_onMessage(u.edited_message, true);
  if (u.callback_query) return bot_onCallback(u.callback_query);
  if (u.my_chat_member) {
    var m = u.my_chat_member;
    bot_log('ІНФО', 'my_chat_member', (m.chat && m.chat.title ? m.chat.title : m.chat.id) + ' → ' + (m.new_chat_member && m.new_chat_member.status));
  }
}

// =====================================================================
// Повідомлення
// =====================================================================

function bot_onMessage(msg, edited) {
  var chat = msg.chat || {};
  var from = msg.from || {};
  var text = msg.text || '';

  // ----- особисті повідомлення -----
  if (chat.type === 'private') {
    var cmd0 = bot_parseCommand(text);
    if (cmd0 && cmd0.cmd === 'start' && !bot_ownerIds().length) {
      bot_setSetting('OWNER_IDS', String(from.id));
      bot_log('ІНФО', 'owner', 'Власник: ' + from.id + ' ' + (from.username || ''));
      bot_send(chat.id, '👋 Вітаю! Ви — власник бота. Далі:\n1) додайте бота в групу виробництва;\n2) у гілці «Замовлення на клієнта» напишіть <code>/bind orders</code>;\n3) у гілці «Реєстри» — <code>/bind registry</code>.\n\n' + bot_helpText());
      return;
    }
    if (!bot_isOwner(from.id)) { bot_log('УВАГА', 'чужий користувач', 'private ' + from.id + ' ' + (from.username || '')); return; }
    if (edited) return;
    if (msg.document) return bot_onDocument(msg);
    if (cmd0) return bot_onCommand(msg, cmd0);
    var awaiting = bot_awaitTake(from.id);
    if (awaiting) return bot_onAwaitedInput(msg, awaiting);
    return;
  }

  // ----- група -----
  if (chat.type === 'group' || chat.type === 'supergroup') {
    var cmd = bot_parseCommand(text);
    if (cmd && cmd.cmd === 'bind') {
      if (!bot_isOwner(from.id)) return;
      return bot_cmdBind(msg, cmd.arg);
    }
    var payChat = bot_setting('PAY_CHAT_ID');
    if (payChat && String(chat.id) === String(payChat)) return bot_handlePayMessage(msg, edited);   // чат «Отправка отчет»
    var groupId = bot_setting('GROUP_CHAT_ID');
    if (!groupId || String(chat.id) !== String(groupId)) return;                       // чужа група
    var ordersThread = bot_setting('ORDERS_THREAD_ID');
    if (ordersThread === '' ) return;
    if (bot_threadOf(msg) !== String(ordersThread)) return;                            // інша гілка
    var caption = msg.caption || msg.text || '';
    if (!caption) return;
    return bot_handleOrderMessage(msg, caption, edited);
  }
}

function bot_botUsername() {
  var u = bot_prop(BOT_PROP.BOT_USERNAME);
  if (!u) {
    try { u = bot_tg('getMe', {}).username || ''; bot_setProp(BOT_PROP.BOT_USERNAME, u); } catch (e) { u = ''; }
  }
  return u;
}

/** «/bind@my_bot orders» → {cmd:'bind', arg:'orders'}; команда для іншого бота → null. */
function bot_parseCommand(text) {
  var m = String(text || '').match(/^\/([A-Za-z_]+)(?:@(\w+))?(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  if (m[2]) {
    var me = bot_botUsername();
    if (me && m[2].toLowerCase() !== me.toLowerCase()) return null;
  }
  return { cmd: m[1].toLowerCase(), arg: (m[3] || '').trim() };
}

function bot_helpText() {
  return '<b>Що вмію</b>\n' +
    '• Надішліть файл виробництва <b>.xlsx</b> — зроблю звірку і покажу, що можна оплатити.\n' +
    '• /borg — борг і неоплачені доставлені ТТН\n' +
    '• /find &lt;ТТН або №&gt; — знайти замовлення\n' +
    '• /cancel &lt;№&gt; — скасувати замовлення\n' +
    '• /history — останні 10 звірок\n' +
    '• /undo &lt;ID&gt; — відкликати звірку\n' +
    '• /disputes — відкладені спірні ТТН\n' +
    '• /files — папка з файлами виробництва\n' +
    '• /price — чинні ціни; /price Худі фліс 780 15.11.2026 — нова ціна\n' +
    '• /report — ранковий звіт зараз (тільки вам)\n' +
    '• /month — місячний звіт (/month 2026-08 — за вказаний місяць)\n' +
    '• /desc &lt;ТТН&gt; — опис ТТН і його статус\n' +
    '• /setdesc &lt;ТТН&gt; &lt;текст&gt; — свій текст опису (до 100 символів; «-» — повернути автоматичний)\n' +
    '• /backfill — створити описи для замовлень із таблиці (імпорт), яких ще немає в «ТТН»\n' +
    '• /allocate — які ТТН покривають внесені оплати (позначу «Оплачено» після вашої кнопки); /undoalloc &lt;ID&gt; — скасувати\n' +
    '• /addpay &lt;сума&gt; [дата] — додати оплату вручну (напр. <code>/addpay 21401 12.09.2026</code>)\n' +
    '• /registry — реєстр зараз; /registry preview — що ввійде; /registry now — ЕКСТРЕНИЙ додатковий реєстр\n' +
    '• /nptest &lt;ТТН&gt; &lt;текст&gt; — перевірка запису на ТЕСТОВІЙ ТТН; /npdoc &lt;ТТН&gt; — що віддає НП\n' +
    '• /retry [ТТН] — повторити запис опису для ТТН з «Помилка НП»\n' +
    '• /live — бойовий режим (запис у НП); /preview — режим перевірки\n' +
    '• /help — ця довідка';
}

function bot_onCommand(msg, c) {
  var chatId = msg.chat.id;
  switch (c.cmd) {
    case 'start': case 'help': return bot_send(chatId, bot_helpText());
    case 'borg': return bot_cmdBorg(chatId);
    case 'find': return bot_cmdFind(chatId, c.arg);
    case 'cancel': return bot_cmdCancel(chatId, c.arg);
    case 'history': return bot_cmdHistory(chatId);
    case 'undo': return bot_cmdUndo(chatId, c.arg);
    case 'disputes': return bot_cmdDisputes(chatId);
    case 'files': return bot_cmdFiles(chatId);
    case 'price': return bot_cmdPrice(chatId, c.arg);
    case 'report': return bot_cmdReport(chatId);
    case 'month': return bot_cmdMonth(chatId, c.arg);
    case 'desc': return bot_cmdDesc(chatId, c.arg);
    case 'backfill': return bot_cmdBackfill(chatId);
    case 'addpay': return bot_cmdAddPay(chatId, c.arg);
    case 'allocate': return bot_cmdAllocate(chatId);
    case 'undoalloc': return bot_cmdUndoAlloc(chatId, c.arg);
    case 'setdesc': return bot_cmdSetDesc(chatId, c.arg);
    case 'registry': return bot_cmdRegistry(chatId, c.arg);
    case 'live': return bot_cmdLive(chatId);
    case 'retry': return bot_cmdRetry(chatId, c.arg);
    case 'preview': return bot_cmdPreviewMode(chatId);
    case 'npdoc': return bot_cmdNpDoc(chatId, c.arg);
    case 'nptest': return bot_cmdNpTest(chatId, c.arg);
    default: return bot_send(chatId, 'Не знаю такої команди. /help — що я вмію.');
  }
}

/** /bind orders | /bind report — запам'ятати цю гілку. */
function bot_cmdBind(msg, arg) {
  var what = String(arg || '').trim().toLowerCase();
  var chatId = msg.chat.id, thread = bot_threadOf(msg);
  var opts = thread !== '0' ? { thread: thread } : {};
  if (what === 'registry') what = 'report';
  if (what === 'payments') {                                      // чат «Отправка отчет»: у ньому бот НІЧОГО не пише, підтвердження — лише власнику в особисті
    bot_withLock(function () { bot_setSetting('PAY_CHAT_ID', chatId); bot_setSetting('PAY_THREAD_ID', thread); });
    bot_log('ІНФО', 'bind payments', 'chat ' + chatId + ' thread ' + thread);
    bot_sendToOwners('✅ Чат «' + bot_esc((msg.chat && msg.chat.title) || chatId) + '» підключено для оплат: повідомлення власника виду <code>+10 000</code>, <code>+15к</code> стануть оплатами. У тому чаті бот нічого не пише.');
    return;
  }
  if (what !== 'orders' && what !== 'report') {
    var r0 = bot_send(chatId, 'Напишіть <code>/bind orders</code> (гілка «Замовлення на клієнта»), <code>/bind registry</code> (гілка «Реєстри») або <code>/bind payments</code> (чат «Отправка отчет»).', opts);
    if (r0.ok) bot_scheduleDelete(chatId, r0.result.message_id, 15);
    return;
  }
  bot_withLock(function () {
    bot_setSetting('GROUP_CHAT_ID', chatId);
    bot_setSetting(what === 'orders' ? 'ORDERS_THREAD_ID' : 'REPORT_THREAD_ID', thread);
  });
  bot_log('ІНФО', 'bind ' + what, 'chat ' + chatId + ' thread ' + thread);
  var r = bot_send(chatId, '✅ Готово: ' + (what === 'orders' ? 'тут беру замовлення' : 'сюди надсилатиму реєстри й ранковий звіт') + '.', opts);
  if (r.ok) bot_scheduleDelete(chatId, r.result.message_id, 10);
}

/** Власник надіслав число після «✏️ Інша сума». */
function bot_onAwaitedInput(msg, awaiting) {
  if (awaiting.kind === 'paySum') return bot_paymentCustomSum(msg, awaiting);
  if (awaiting.kind === 'cancel') return;
}

// =====================================================================
// Кнопки
// =====================================================================

function bot_onCallback(cb) {
  var from = cb.from || {};
  if (!bot_isOwner(from.id)) {
    bot_answerCb(cb.id, 'Немає доступу', true);
    bot_log('УВАГА', 'чужий callback', from.id + ' ' + cb.data);
    return;
  }
  var data = String(cb.data || '');
  var parts = data.split('|');
  var ctx = { cb: cb, chatId: cb.message && cb.message.chat.id, msgId: cb.message && cb.message.message_id, userId: from.id,
    userName: [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || String(from.id) };
  try {
    switch (parts[0]) {
      case 'pay': case 'payy': case 'payn': case 'det': case 'cnc': case 'dsp': case 'rs': case 'rsy': case 'rsn':
      case 'sup': case 'opy': case 'opc': case 'opn': case 'undy': case 'undn':
        return bot_reconCallback(parts, ctx);
      case 'aly': case 'aln':
        return bot_allocCallback(parts, ctx);
      case 'regy': case 'regn': case 'regx':
        return bot_registryCallback(parts, ctx);
      case 'nptq': case 'nptn':
        return bot_npTestCallback(parts, ctx);
      case 'prcy': case 'prcn':
        return bot_priceCallback(parts, ctx);
      default:
        bot_answerCb(cb.id, 'Кнопка застаріла');
    }
  } catch (e) {
    bot_log('ПОМИЛКА', 'callback ' + data, e.message);
    bot_answerCb(cb.id, 'Помилка: ' + bot_scrub(e.message), true);
  }
}
