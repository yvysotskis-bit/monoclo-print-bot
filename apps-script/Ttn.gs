/**
 * Ttn.gs — Модуль A (друга частина): аркуш «ТТН». Одне повідомлення гілки «Замовлення на клієнта» = одна ТТН;
 * зберігаємо повний оригінал і будуємо скорочений опис (Shorten.gs). Запис в НП — NpDesc.gs, реєстр — Registry.gs.
 * Працює ЛИШЕ з повідомленнями гілки «Замовлення на клієнта»: інших ТТН у цьому аркуші просто не буває.
 */

function bot_descLimit() { var n = Number(bot_setting('DESC_LIMIT', '100')); return n > 0 ? n : 100; }
function bot_descFromOrder() { var n = Number(bot_setting('DESC_FROM_ORDER', '15088')); return isNaN(n) ? 0 : n; }

function bot_ttnSheet() { return bot_sheet(BOT_SHEETS.ttn); }
function bot_ttnMap(sh) { return bot_headerMap(sh || bot_ttnSheet(), BOT_TTN_COLS, ['npRef']); }

function bot_readTtnRows() {
  var sh = bot_ttnSheet(), map = bot_ttnMap(sh), last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues(), out = [];
  vals.forEach(function (r, i) {
    function g(k) { return map[k] ? r[map[k] - 1] : ''; }
    var ttn = bot_normTtn(g('ttn'));
    if (!ttn) return;
    out.push({
      _row: i + 2, ttn: ttn, orders: bot_cellStr_(g('orders')), original: String(g('original') || ''), desc: String(g('desc') || ''),
      len: Number(g('len')) || 0, status: bot_cellStr_(g('status')), written: bot_cellDate_(g('written')),
      registry: bot_cellStr_(g('registry')), note: bot_cellStr_(g('note')), msgId: bot_cellStr_(g('msgId')), npRef: bot_cellStr_(g('npRef'))
    });
  });
  return out;
}

function bot_ttnAppend(obj) {
  return bot_withLock(function () {
    var sh = bot_ttnSheet(), map = bot_ttnMap(sh), width = sh.getLastColumn();
    var row = Math.max(sh.getLastRow(), 1) + 1;
    var arr = []; for (var i = 0; i < width; i++) arr.push('');
    BOT_TTN_COLS.forEach(function (c) { if (map[c[0]] && obj[c[0]] !== undefined) arr[map[c[0]] - 1] = obj[c[0]]; });
    sh.getRange(row, 1, 1, width).setNumberFormat('@').setValues([arr]);
    if (map.written) sh.getRange(row, map.written).setNumberFormat('dd.mm.yyyy hh:mm');
    return row;
  });
}

/** patches = [{row, fields}] — один рядок читаємо/пишемо одним викликом (текстові клітинки лишаються текстом). */
function bot_ttnPatch(patches) {
  if (!patches.length) return;
  bot_withLock(function () {
    var sh = bot_ttnSheet(), map = bot_ttnMap(sh), width = sh.getLastColumn();
    patches.forEach(function (p) {
      var rng = sh.getRange(p.row, 1, 1, width), cur = rng.getValues()[0];
      Object.keys(p.fields).forEach(function (k) { if (map[k]) cur[map[k] - 1] = p.fields[k]; });
      rng.setValues([cur]);
    });
  });
}

/** Номери замовлень з рядка «15089, 15090». */
function bot_ttnOrderNos(s) {
  return String(s || '').split(/[,\s;]+/).map(Number).filter(function (n) { return n > 0; });
}

function bot_ttnLink_(msg) { return bot_msgLink(msg.chat, bot_threadOf(msg), msg.message_id); }

/**
 * Після обробки повідомлення гілки: створити / оновити рядок «ТТН» і опис.
 * Ідемпотентно: повторна обробка того самого повідомлення нічого не міняє.
 */
function bot_ttnSync(msg, caption, list, edited) {
  var groups = {};
  list.forEach(function (p) { if (p.ttn && bot_isTtn(p.ttn)) (groups[p.ttn] = groups[p.ttn] || []).push(p); });
  var fromNo = bot_descFromOrder(), limit = bot_descLimit(), mid = String(msg.message_id);
  var link = bot_ttnLink_(msg), linkTxt = link ? '\n<a href="' + link + '">Відкрити повідомлення</a>' : '';
  Object.keys(groups).forEach(function (ttn) {
    var g = groups[ttn];
    if (!g.some(function (p) { return p.no > fromNo; })) return;                     // старі замовлення бот не чіпає
    var d = bot_buildDescription(g, limit);
    var nos = g.map(function (p) { return p.no; }).join(', ');
    var rows = bot_readTtnRows(), ex = null;
    rows.forEach(function (r) { if (r.ttn === ttn) ex = r; });
    var status = d.overflow ? 'Чекає рішення' : 'Новий';
    var note = d.overflow ? '⚠ не влізло в ' + limit + ' символів навіть у номерах' : (d.level >= 7 ? 'ℹ скорочено до «номер + річ»' : '');
    if (!ex) {
      bot_ttnAppend({ ttn: ttn, orders: nos, original: caption, desc: d.text, len: d.len, status: status, note: note, msgId: mid });
      bot_log('ІНФО', 'ТТН ' + ttn, 'опис ' + d.len + ' симв., рівень ' + d.level);
      if (d.overflow) bot_sendToOwners('⚠️ ТТН ' + bot_code(ttn) + ' (№' + bot_esc(nos) + '): опис не влізає в ' + limit + ' символів. Надішліть свій текст: <code>/setdesc ' + ttn + ' текст</code>.' + linkTxt);
      return;
    }
    if (!edited || ex.msgId !== mid) return;                                        // повтор того самого або чужого повідомлення
    if (ex.registry) {
      if (ex.original !== caption) bot_sendToOwners('⚠️ ТТН ' + bot_code(ttn) + ' уже в реєстрі №' + bot_esc(ex.registry) + ' — зміни в повідомленні не застосовую (опис у НП лишається).' + linkTxt);
      return;
    }
    var manual = ex.note.indexOf('✏️') === 0;
    var fields = { orders: nos, original: caption };
    if (manual) {
      bot_sendToOwners('ℹ️ Повідомлення по ТТН ' + bot_code(ttn) + ' відредаговано, але там стоїть ваш власний текст — не змінюю. Якщо треба автоматичний — <code>/setdesc ' + ttn + ' -</code>.' + linkTxt);
    } else if (ex.desc !== d.text) {
      fields.desc = d.text; fields.len = d.len; fields.status = status; fields.note = note; fields.written = '';
    } else if (ex.status === 'Чекає рішення' && !d.overflow) { fields.status = 'Новий'; fields.note = note; }
    bot_ttnPatch([{ row: ex._row, fields: fields }]);
    if (fields.desc !== undefined && d.overflow) bot_sendToOwners('⚠️ ТТН ' + bot_code(ttn) + ': після редагування опис не влізає в ' + limit + '. <code>/setdesc ' + ttn + ' текст</code>.' + linkTxt);
  });
}

// ---------- команди ----------

function bot_findTtnRow_(arg) {
  var q = String(arg || '').trim();
  var ttn = bot_normTtn(q), rows = bot_readTtnRows();
  if (bot_isTtn(ttn)) return rows.filter(function (r) { return r.ttn === ttn; })[0] || null;
  var no = Number(q);
  if (no > 0) return rows.filter(function (r) { return bot_ttnOrderNos(r.orders).indexOf(no) >= 0; })[0] || null;
  return null;
}

function bot_cmdDesc(chatId, arg) {
  var r = bot_findTtnRow_(arg);
  if (!r) return bot_send(chatId, 'Формат: <code>/desc 20451556067718</code> (або номер замовлення). Такої ТТН у гілці «Замовлення на клієнта» не бачу.');
  bot_send(chatId, '📦 ТТН ' + bot_code(r.ttn) + ' · №' + bot_esc(r.orders) + '\nСтатус: <b>' + bot_esc(r.status) + '</b>' + (r.registry ? ' · реєстр №' + bot_esc(r.registry) : '') +
    '\nОпис (' + r.len + ' симв.): <i>' + bot_esc(r.desc) + '</i>' + (r.note ? '\n' + bot_esc(r.note) : ''));
}

function bot_cmdSetDesc(chatId, arg) {
  var firstTok = String(arg || '').trim().split(/\s+/)[0];
  var r = bot_findTtnRow_(firstTok);
  if (!r) return bot_send(chatId, 'Формат: <code>/setdesc 20451556067718 ваш текст</code> (до ' + bot_descLimit() + ' символів). ТТН має бути з гілки «Замовлення на клієнта».');
  var text = String(arg).trim().slice(firstTok.length).trim();
  if (!text) return bot_send(chatId, 'Після ТТН напишіть текст опису.');
  if (r.registry) return bot_send(chatId, '⛔ ТТН ' + bot_code(r.ttn) + ' уже в реєстрі №' + bot_esc(r.registry) + ' — опис не змінюю.');
  if (text === '-') {                                                    // повернутись до автоматичного
    var g = bot_parseOrderMessage(r.original).filter(function (p) { return p.ttn === r.ttn; });
    var d = bot_buildDescription(g, bot_descLimit());
    bot_ttnPatch([{ row: r._row, fields: { desc: d.text, len: d.len, status: d.overflow ? 'Чекає рішення' : 'Новий', note: '', written: '' } }]);
    return bot_send(chatId, '↩️ Повернув автоматичний опис: <i>' + bot_esc(d.text) + '</i> (' + d.len + ' симв.)');
  }
  var n = bot_len(text);
  if (n > bot_descLimit()) return bot_send(chatId, '⛔ ' + n + ' символів — максимум ' + bot_descLimit() + '. Скоротіть, будь ласка.');
  bot_ttnPatch([{ row: r._row, fields: { desc: text, len: n, status: 'Новий', note: '✏️ свій текст', written: '' } }]);
  bot_send(chatId, '✏️ Записав у таблицю: <i>' + bot_esc(text) + '</i> (' + n + ' симв.). ' + (bot_npLive() ? 'Запишу в НП за хвилину.' : 'Режим перевірки — покажу в підсумку.'));
}

// ---------- /backfill: ТТН для замовлень, які вже є в таблиці (імпорт з експорту Telegram) ----------

var BOT_CODE_OF_COLOR_ = { 'Чорний': 1, 'Білий': 2, 'Графітовий': 3, 'Сірий': 4 };

/** Рядок «Замовлення» → вигляд розібраного замовлення для Shorten.gs (оригінального тексту повідомлення в таблиці немає). */
function bot_orderAsParsed_(o) {
  var code = o.colorCode || 0;
  if (!code && (o.type === 'Худі фліс' || o.type === 'Худі не утеплене')) code = BOT_CODE_OF_COLOR_[o.color] || 0;   // колір худі = код хN
  return { no: o.no, print: o.print, type: o.type, typeAmbiguous: false, color: o.color, size: o.size, placement: o.placement, prints: o.prints || 1, colorCode: code, urgent: false, ttn: o.ttn };
}

/**
 * Для замовлень з номером > DESC_FROM_ORDER, у яких є ТТН, а рядка в «ТТН» ще немає — створює рядки з описом (статус «Новий»).
 * Далі діє звичайний потік: режим перевірки → ви затверджуєте → запис у НП → реєстр. Ідемпотентно.
 * @return {added, ttns:[…], overflow:[…]}
 */
function bot_ttnBackfill() {
  return bot_withLock(function () {
    var fromNo = bot_descFromOrder(), limit = bot_descLimit();
    var have = {}; bot_readTtnRows().forEach(function (r) { have[r.ttn] = true; });
    var groups = {}, order = [];
    bot_readOrders().forEach(function (o) {
      if (!o.ttn || !bot_isTtn(o.ttn) || o.status === 'Скасовано' || !(Number(o.no) > 0)) return;
      if (have[o.ttn]) return;
      if (!groups[o.ttn]) { groups[o.ttn] = []; order.push(o.ttn); }
      groups[o.ttn].push(o);
    });
    var added = [], overflow = [];
    order.forEach(function (ttn) {
      var g = groups[ttn].sort(function (a, b) { return a.no - b.no; });
      if (!g.some(function (o) { return o.no > fromNo; })) return;
      var parsed = g.map(bot_orderAsParsed_);
      var d = bot_buildDescription(parsed, limit);
      var nos = g.map(function (o) { return o.no; }).join(', ');
      var first = g.filter(function (o) { return o.msgId; })[0];
      bot_ttnAppend({ ttn: ttn, orders: nos, original: '(відновлено з таблиці «Замовлення» — оригінального тексту повідомлення немає)', desc: d.text, len: d.len,
        status: d.overflow ? 'Чекає рішення' : 'Новий', note: (d.overflow ? '⚠ не влізло в ' + limit + ' символів; ' : '') + 'ℹ з таблиці (імпорт)', msgId: first ? first.msgId : '' });
      added.push(ttn);
      if (d.overflow) overflow.push(ttn);
    });
    return { added: added.length, ttns: added, overflow: overflow };
  });
}

function bot_cmdBackfill(chatId) {
  var r = bot_ttnBackfill();
  if (!r.added) return bot_send(chatId, 'Нових ТТН для опису немає: усі замовлення з номером більше ' + bot_descFromOrder() + ' уже в аркуші «ТТН».');
  bot_send(chatId, '📥 Додав у аркуш «ТТН» <b>' + r.added + '</b> ТТН із замовлень №' + bot_descFromOrder() + '+ (з таблиці). ' +
    (bot_npLive() ? 'Бойовий режим: опис запишу в НП за хвилину.' : 'Режим перевірки: за хвилину надішлю список «ТТН → опис» на перегляд.') +
    (r.overflow.length ? '\n⚠️ Не влізли в ' + bot_descLimit() + ' символів: ' + r.overflow.length + ' (потрібен /setdesc).' : ''));
}
