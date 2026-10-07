/**
 * Sheets.gs — робота з таблицею: налаштування, лог, читання/запис таблиць за назвами заголовків,
 * блокування. Усі записи в таблицю — під LockService, пакетні setValues.
 */

var BOT_CACHE_ = {};   // кеш в межах одного запуску

function bot_ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function bot_sheet(name, create) {
  var ss = bot_ss();
  var sh = ss.getSheetByName(name);
  if (!sh && create) sh = ss.insertSheet(name);
  if (!sh) throw new Error('Немає аркуша «' + name + '». Запустіть меню 🤖 Бот → Перше налаштування.');
  return sh;
}

// ---------- Script Properties (токени, службовий стан) ----------

function bot_prop(key) { return PropertiesService.getScriptProperties().getProperty(key) || ''; }
function bot_setProp(key, val) { PropertiesService.getScriptProperties().setProperty(key, String(val)); }
function bot_delProp(key) { PropertiesService.getScriptProperties().deleteProperty(key); }

// ---------- блокування (повторне входження дозволене) ----------

var BOT_LOCK_DEPTH_ = 0;

function bot_withLock(fn, waitMs) {
  if (BOT_LOCK_DEPTH_ > 0) return fn();
  var lock = LockService.getScriptLock();
  lock.waitLock(waitMs || 30000);
  BOT_LOCK_DEPTH_++;
  try { return fn(); } finally { BOT_LOCK_DEPTH_--; SpreadsheetApp.flush(); lock.releaseLock(); }
}

// ---------- налаштування (аркуш «Налаштування») ----------

function bot_settingsMap() {
  if (BOT_CACHE_.settings) return BOT_CACHE_.settings;
  var map = {};
  var sh = bot_ss().getSheetByName(BOT_SHEETS.settings);
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = r[1]; });
  }
  BOT_CACHE_.settings = map;
  return map;
}

function bot_setting(key, def) {
  var v = bot_settingsMap()[key];
  if (v === undefined || v === null || v === '') return def === undefined ? '' : def;
  if (bot_isDate(v) && /TIME/.test(key)) {                 // власник міг ввести час як «час», а не текст
    try { return Utilities.formatDate(v, BOT_TZ, 'HH:mm'); } catch (e) { return bot_pad2(bot_kyivParts(v).h) + ':' + bot_pad2(bot_kyivParts(v).mi); }
  }
  return String(v).trim();
}

function bot_setSetting(key, value) {
  var sh = bot_sheet(BOT_SHEETS.settings);
  var last = sh.getLastRow();
  var keys = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  var row = -1;
  for (var i = 0; i < keys.length; i++) if (String(keys[i][0]).trim() === key) { row = i + 2; break; }
  if (row < 0) { row = last + 1; sh.getRange(row, 1).setValue(key); }
  sh.getRange(row, 2).setNumberFormat('@').setValue(String(value));
  delete BOT_CACHE_.settings;
}

function bot_ownerIds() {
  return String(bot_setting('OWNER_IDS')).split(/[,\s;]+/).filter(Boolean);
}

function bot_isOwner(userId) { return bot_ownerIds().indexOf(String(userId)) >= 0; }

// ---------- лог ----------

function bot_log(level, event, details) {
  try {
    var sh = bot_ss().getSheetByName(BOT_SHEETS.log);
    if (!sh) return;
    sh.appendRow([new Date(), level, event, String(details === undefined ? '' : details).slice(0, 2000)]);
    if (sh.getLastRow() > 2200) sh.deleteRows(2, 200);
  } catch (e) { /* лог не повинен ламати роботу */ }
}

// ---------- таблиці за заголовками ----------

/** cols: [[key, header, ...aliases]] → {key: індекс колонки (1-based)} */
function bot_headerMap(sheet, cols, optional) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var map = {};
  cols.forEach(function (c) {
    var names = [c[1]].concat(c.slice(2));
    var idx = -1;
    for (var n = 0; n < names.length && idx < 0; n++) idx = headers.indexOf(names[n]);
    if (idx < 0) {
      if (optional && optional.indexOf(c[0]) >= 0) return;
      throw new Error('В аркуші «' + sheet.getName() + '» немає колонки «' + c[1] + '».');
    }
    map[c[0]] = idx + 1;
  });
  return map;
}

function bot_colLetter(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Колонки «Оплат» (стара назва «С-вартість» теж підходить). Функція, а не змінна — щоб не залежати від порядку файлів. */
function bot_payColsAlias_() { return BOT_PAY_COLS.map(function (c) { return c[0] === 'cost' ? [c[0], c[1], 'С-вартість'] : c; }); }

function bot_cellStr_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function bot_cellDate_(v) { return bot_isDate(v) ? v : null; }

// ---------- «Замовлення» ----------

function bot_ordersSheet() { return bot_sheet(BOT_SHEETS.orders); }

function bot_ordersMap(sheet) {
  return bot_headerMap(sheet || bot_ordersSheet(), BOT_ORDER_COLS, ['arrived']);
}

function bot_orderFromRow_(r, map, rowNum) {
  function g(k) { return map[k] ? r[map[k] - 1] : ''; }
  var no = g('no');
  return {
    _row: rowNum,
    no: (no === '' || no === null) ? '' : (isNaN(Number(no)) ? bot_cellStr_(no) : Number(no)),
    date: bot_cellDate_(g('date')), print: bot_cellStr_(g('print')), type: bot_cellStr_(g('type')),
    color: bot_cellStr_(g('color')), size: bot_cellStr_(g('size')), placement: bot_cellStr_(g('placement')),
    prints: Number(g('prints')) || 1, ttn: bot_normTtn(g('ttn')), ttnDate: bot_cellDate_(g('ttnDate')),
    stage: bot_cellStr_(g('stage')), npStatus: bot_cellStr_(g('npStatus')),
    cost: Number(g('cost')) || 0, status: bot_cellStr_(g('status')) || 'В роботі',
    paid: bot_cellStr_(g('paid')) || 'Не оплачено', paidDate: bot_cellDate_(g('paidDate')) || '',
    recon: bot_cellStr_(g('recon')), note: bot_cellStr_(g('note')), msgId: bot_cellStr_(g('msgId')),
    handoff: bot_cellDate_(g('handoff')), arrived: bot_cellDate_(g('arrived'))
  };
}

/** Усі непорожні рядки «Замовлення» як об'єкти. */
function bot_readOrders() {
  var sh = bot_ordersSheet();
  var map = bot_ordersMap(sh);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var o = bot_orderFromRow_(vals[i], map, i + 2);
    if (o.no === '' && !o.ttn && !o.print) continue;
    out.push(o);
  }
  return out;
}

/** Остання заповнена в колонці A (№ замовлення) + 1. */
function bot_nextOrderRow_(sh, map) {
  var maxRows = sh.getMaxRows();
  if (maxRows < 2) return 2;
  var col = sh.getRange(1, map.no, maxRows, 1).getValues();
  var last = 1;
  for (var i = col.length - 1; i >= 1; i--) { if (col[i][0] !== '' && col[i][0] !== null) { last = i + 1; break; } }
  return last + 1;
}

/** Забезпечити, що рядок rowNum існує і має форматування попереднього. */
function bot_ensureRow_(sh, rowNum) {
  if (rowNum > sh.getMaxRows()) {
    var from = sh.getMaxRows();
    sh.insertRowsAfter(from, Math.max(200, rowNum - from));
    var width = sh.getLastColumn();
    sh.getRange(from, 1, 1, width).copyTo(sh.getRange(from + 1, 1, sh.getMaxRows() - from, width), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    sh.getRange(from, 1, 1, width).copyTo(sh.getRange(from + 1, 1, sh.getMaxRows() - from, width), SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
  }
}

/** Додає рядок (під блокуванням). obj — поля за внутрішніми ключами. Повертає номер рядка. */
function bot_appendOrderRow(obj, yellowKeys) {
  return bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var rowNum = bot_nextOrderRow_(sh, map);
    bot_ensureRow_(sh, rowNum);
    var width = sh.getLastColumn();
    var arr = [];
    for (var i = 0; i < width; i++) arr.push('');
    BOT_ORDER_COLS.forEach(function (c) {
      if (map[c[0]] && obj[c[0]] !== undefined && obj[c[0]] !== null) arr[map[c[0]] - 1] = obj[c[0]];
    });
    if (map.ttn) sh.getRange(rowNum, map.ttn).setNumberFormat('@');
    sh.getRange(rowNum, 1, 1, width).setBackground(null).setValues([arr]);
    bot_markYellow_(sh, map, rowNum, yellowKeys || []);
    return rowNum;
  });
}

/** Пакетне додавання рядків (імпорт): items = [{obj, yellow:[ключі]}]. Повертає номери рядків. */
function bot_appendOrderRows(items) {
  if (!items.length) return [];
  return bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var start = bot_nextOrderRow_(sh, map);
    var width = sh.getLastColumn();
    bot_ensureRow_(sh, start + items.length);
    var arr = items.map(function (it) {
      var line = []; for (var i = 0; i < width; i++) line.push('');
      BOT_ORDER_COLS.forEach(function (c) {
        if (map[c[0]] && it.obj[c[0]] !== undefined && it.obj[c[0]] !== null) line[map[c[0]] - 1] = it.obj[c[0]];
      });
      return line;
    });
    if (map.ttn) sh.getRange(start, map.ttn, items.length, 1).setNumberFormat('@');
    sh.getRange(start, 1, items.length, width).setBackground(null).setValues(arr);
    items.forEach(function (it, i) { if (it.yellow && it.yellow.length) bot_markYellow_(sh, map, start + i, it.yellow); });
    return items.map(function (it, i) { return start + i; });
  });
}

function bot_markYellow_(sh, map, rowNum, keys) {
  keys.forEach(function (k) { if (map[k]) sh.getRange(rowNum, map[k]).setBackground(BOT_COLOR_YELLOW); });
}

/**
 * Пакетна зміна полів у рядках: patches = [{row, fields:{key:value}}].
 * Для кожної колонки — одне читання і один setValues.
 */
function bot_patchOrders(patches) {
  if (!patches.length) return;
  bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var byKey = {};
    patches.forEach(function (p) {
      Object.keys(p.fields).forEach(function (k) {
        if (!map[k]) return;
        (byKey[k] = byKey[k] || []).push({ row: p.row, value: p.fields[k] });
      });
    });
    var last = sh.getLastRow();
    Object.keys(byKey).forEach(function (k) {
      var range = sh.getRange(2, map[k], last - 1, 1);
      var col = range.getValues();
      byKey[k].forEach(function (u) { if (u.row >= 2 && u.row <= last) col[u.row - 2][0] = (u.value === null || u.value === undefined) ? '' : u.value; });
      if (k === 'ttn') range.setNumberFormat('@');
      range.setValues(col);
    });
  });
}

function bot_clearYellow(rowNum, keys) {
  var sh = bot_ordersSheet(); var map = bot_ordersMap(sh);
  keys.forEach(function (k) { if (map[k]) sh.getRange(rowNum, map[k]).setBackground(null); });
}

// ---------- «Оплати» ----------

function bot_readPayments() {
  var sh = bot_sheet(BOT_SHEETS.payments);
  var map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var out = [];
  vals.forEach(function (r, i) {
    var sum = bot_toNumber(r[map.sum - 1]);
    if (sum === null) return;
    out.push({
      _row: i + 2, no: r[map.no - 1], date: bot_cellDate_(r[map.date - 1]), sum: sum,
      recon: map.recon ? bot_cellStr_(r[map.recon - 1]) : '', balance: map.balance ? r[map.balance - 1] : ''
    });
  });
  return out;
}

// ---------- «Прайс» ----------

function bot_readPriceRows() {
  var sh = bot_sheet(BOT_SHEETS.price);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 4).getValues().filter(function (r) { return r[0] !== '' && r[1] !== ''; }).map(function (r) {
    return { type: bot_cellStr_(r[0]), price: Number(r[1]), from: bot_parseDate(r[2]), note: bot_cellStr_(r[3]) };
  });
}

// ---------- час ----------

function bot_now() { return new Date(); }

/** Сьогоднішня дата (північ за Києвом) як Date — для запису в клітинки «дата». */
function bot_today() {
  var p = bot_kyivParts(new Date());
  return bot_makeDate(p.y, p.m, p.d);
}
