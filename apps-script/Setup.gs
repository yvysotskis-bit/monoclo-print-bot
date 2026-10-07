/**
 * Setup.gs — «Перше налаштування»: створює всі аркуші, заголовки, списки, формати, умовне форматування.
 * Можна запускати повторно: наявні дані не чіпає, лише дописує відсутнє.
 */

var BOT_ORDERS_ROWS = 3000;

function bot_setupAll() {
  var ss = bot_ss();
  try { ss.setSpreadsheetTimeZone(BOT_TZ); } catch (e) { bot_log('УВАГА', 'часовий пояс', e.message); }
  try { ss.setSpreadsheetLocale('uk_UA'); } catch (e) { bot_log('УВАГА', 'мова таблиці', e.message); }

  var order = [BOT_SHEETS.summary, BOT_SHEETS.orders, BOT_SHEETS.payments, BOT_SHEETS.price, BOT_SHEETS.lists,
    BOT_SHEETS.recon, BOT_SHEETS.reconDetails, BOT_SHEETS.monthly, BOT_SHEETS.settings, BOT_SHEETS.log];
  var firstRun = !ss.getSheetByName(BOT_SHEETS.orders);
  order.forEach(function (name, i) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name, i);
  });
  // прибрати порожній стандартний аркуш
  ss.getSheets().forEach(function (sh) {
    if (/^(Лист|Аркуш|Sheet)\s?\d+$/i.test(sh.getName()) && sh.getLastRow() <= 1 && sh.getLastColumn() <= 1 && ss.getSheets().length > order.length) {
      try { ss.deleteSheet(sh); } catch (e) { /* ігноруємо */ }
    }
  });

  bot_setupLists_();
  bot_setupSettings_();
  bot_setupPrice_();
  bot_setupOrders_();
  bot_setupPayments_();
  bot_setupTable_(BOT_SHEETS.recon, BOT_RECON_COLS.map(function (c) { return c[1]; }), 16);
  bot_setupTable_(BOT_SHEETS.reconDetails, BOT_DETAIL_COLS.map(function (c) { return c[1]; }), 10);
  bot_setupTable_(BOT_SHEETS.monthly, BOT_MONTHLY_COLS, 13);
  bot_setupTable_(BOT_SHEETS.log, ['Час', 'Рівень', 'Подія', 'Деталі'], 4);
  var recon = bot_sheet(BOT_SHEETS.recon), rmap = bot_headerMap(recon, BOT_RECON_COLS);
  recon.getRange(2, rmap.date, recon.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  recon.getRange(2, rmap.confirmedAt, recon.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  recon.getRange(2, rmap.hash, recon.getMaxRows() - 1, 1).setNumberFormat('@');
  recon.hideColumns(rmap.fileData);
  var det = bot_sheet(BOT_SHEETS.reconDetails), dmap = bot_headerMap(det, BOT_DETAIL_COLS);
  det.getRange(2, dmap.ttn, det.getMaxRows() - 1, 1).setNumberFormat('@');
  bot_sheet(BOT_SHEETS.monthly).getRange(2, 1, 500, 1).setNumberFormat('@');
  bot_sheet(BOT_SHEETS.log).getRange(2, 1, 2200, 1).setNumberFormat('dd.mm.yyyy hh:mm:ss');

  bot_buildSummary();
  bot_ss().setActiveSheet(bot_sheet(BOT_SHEETS.orders));
  bot_log('ІНФО', 'Перше налаштування', firstRun ? 'таблицю створено' : 'оновлено');
}

// ---------- загальне оформлення ----------

function bot_styleHeader_(sh, width) {
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#1f3864').setFontColor('#ffffff')
    .setVerticalAlignment('middle').setWrap(true).setHorizontalAlignment('center');
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);
}

/** Заголовки: порожній аркуш — пише всі, інакше дописує відсутні в кінець. */
function bot_ensureHeaders_(sh, headers) {
  var existing = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); }) : [];
  var empty = existing.every(function (h) { return !h; });
  if (empty) { sh.getRange(1, 1, 1, headers.length).setValues([headers]); return; }
  headers.forEach(function (h) {
    if (existing.indexOf(h) < 0) { sh.getRange(1, sh.getLastColumn() + 1).setValue(h); existing.push(h); }
  });
}

function bot_setupTable_(name, headers, width) {
  var sh = bot_sheet(name);
  bot_ensureHeaders_(sh, headers);
  bot_styleHeader_(sh, sh.getLastColumn());
  if (!sh.getFilter() && sh.getMaxRows() > 1) {
    try { sh.getRange(1, 1, sh.getMaxRows(), sh.getLastColumn()).createFilter(); } catch (e) { /* фільтр не критичний */ }
  }
}

// ---------- довідники ----------

function bot_setupLists_() {
  var sh = bot_sheet(BOT_SHEETS.lists);
  var headers = ['Тип речі', 'Колір', 'Розмір', 'Розміщення', 'Етап', 'Статус замовлення', 'Оплата'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  bot_styleHeader_(sh, headers.length);
  var lists = [null, BOT_COLORS, BOT_SIZES, BOT_PLACEMENTS, BOT_STAGES, BOT_ORDER_STATUSES, BOT_PAID_VALUES];
  // «Тип речі» — з аркуша «Прайс» (новий тип з'являється в списку сам)
  sh.getRange('A2').setFormula("=IFERROR(UNIQUE(FILTER('" + BOT_SHEETS.price + "'!A2:A,'" + BOT_SHEETS.price + "'!A2:A<>\"\")),\"\")");
  lists.forEach(function (arr, i) {
    if (!arr) return;
    sh.getRange(2, i + 1, arr.length, 1).setValues(arr.map(function (v) { return [v]; }));
  });
  sh.setColumnWidths(1, headers.length, 150);
}

// ---------- налаштування ----------

function bot_setupSettings_() {
  var sh = bot_sheet(BOT_SHEETS.settings);
  bot_ensureHeaders_(sh, ['Параметр', 'Значення', 'Пояснення']);
  bot_styleHeader_(sh, 3);
  var last = sh.getLastRow();
  var have = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  var rows = BOT_DEFAULT_SETTINGS.filter(function (s) { return have.indexOf(s[0]) < 0; });
  if (rows.length) {
    var start = Math.max(last, 1) + 1;
    sh.getRange(start, 1, rows.length, 3).setNumberFormat('@').setValues(rows);
  }
  sh.getRange(2, 2, 40, 1).setNumberFormat('@');
  sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 520);
  delete BOT_CACHE_.settings;
}

// ---------- прайс ----------

function bot_setupPrice_() {
  var sh = bot_sheet(BOT_SHEETS.price);
  bot_ensureHeaders_(sh, BOT_PRICE_COLS);
  bot_styleHeader_(sh, 4);
  if (sh.getLastRow() < 2) {
    var rows = BOT_DEFAULT_PRICES.map(function (r) { return [r[0], r[1], bot_parseDate(r[2]), r[3]]; });
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
  }
  sh.getRange(2, 2, 200, 1).setNumberFormat('#,##0" грн"');
  sh.getRange(2, 3, 200, 1).setNumberFormat('dd.mm.yyyy');
  sh.setColumnWidths(1, 4, 170);
  sh.getRange('F1').setValue('Нова ціна = новий рядок з датою «Діє з». Старі рядки не видаляйте.').setFontColor('#777777');
}

// ---------- «Замовлення» ----------

function bot_setupOrders_() {
  var sh = bot_sheet(BOT_SHEETS.orders);
  bot_ensureHeaders_(sh, BOT_ORDER_COLS.map(function (c) { return c[1]; }));
  var width = sh.getLastColumn();
  bot_styleHeader_(sh, width);
  if (sh.getMaxRows() < BOT_ORDERS_ROWS) sh.insertRowsAfter(sh.getMaxRows(), BOT_ORDERS_ROWS - sh.getMaxRows());
  var map = bot_ordersMap(sh);
  var n = sh.getMaxRows() - 1;
  function col(k) { return sh.getRange(2, map[k], n, 1); }

  col('date').setNumberFormat('dd.mm.yyyy');
  col('ttnDate').setNumberFormat('dd.mm.yyyy hh:mm');
  col('paidDate').setNumberFormat('dd.mm.yyyy');
  col('handoff').setNumberFormat('dd.mm.yyyy hh:mm');
  if (map.arrived) col('arrived').setNumberFormat('dd.mm.yyyy hh:mm');
  col('ttn').setNumberFormat('@');                               // ТТН — завжди текст
  col('cost').setNumberFormat('#,##0" грн"');
  col('no').setNumberFormat('0');

  // списки з аркуша «Довідники»
  var lists = bot_sheet(BOT_SHEETS.lists);
  var listCols = { type: 'A', color: 'B', size: 'C', placement: 'D', stage: 'E', status: 'F', paid: 'G' };
  Object.keys(listCols).forEach(function (k) {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(lists.getRange(listCols[k] + '2:' + listCols[k] + '40'), true).setAllowInvalid(false).build();
    col(k).setDataValidation(rule);
  });
  col('prints').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['1', '2'], true).setAllowInvalid(true).build());

  // колір для «Етапу» і «Оплати»
  var rules = [];
  function addRule(k, text, bg, fg) {
    var b = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(bg);
    if (fg) b.setFontColor(fg);
    rules.push(b.setRanges([col(k)]).build());
  }
  addRule('stage', 'Відмова', '#f4cccc', '#990000');
  addRule('stage', 'Отримано', '#d9ead3', '#274e13');
  addRule('stage', 'Не передана', '#fce5cd', '#b45f06');
  addRule('stage', 'В дорозі', '#cfe2f3');
  addRule('stage', 'На відділенні', '#d9d2e9');
  addRule('stage', 'Повернення', '#eeeeee');
  addRule('paid', 'Оплачено', '#d9ead3', '#274e13');
  addRule('paid', 'Спірна', '#fce5cd', '#b45f06');
  addRule('paid', 'Не оплачено', '#f4cccc', '#990000');
  sh.setConditionalFormatRules(rules);

  [map.msgId, map.arrived].forEach(function (c) { if (c) sh.hideColumns(c); });
  sh.setFrozenColumns(1);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), width).createFilter();
  if (!sh.getBandings().length) {
    try { sh.getRange(1, 1, sh.getMaxRows(), width).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false); } catch (e) { /* не критично */ }
  }
  var widths = { no: 90, date: 100, print: 260, type: 130, color: 90, size: 70, placement: 150, prints: 70, ttn: 140, ttnDate: 130,
    stage: 120, npStatus: 300, cost: 110, status: 120, paid: 110, paidDate: 100, recon: 130, note: 280, handoff: 130 };
  Object.keys(widths).forEach(function (k) { if (map[k]) sh.setColumnWidth(map[k], widths[k]); });
}

// ---------- «Оплати» ----------

function bot_setupPayments_() {
  var sh = bot_sheet(BOT_SHEETS.payments);
  bot_ensureHeaders_(sh, BOT_PAY_COLS.map(function (c) { return c[1]; }));
  bot_styleHeader_(sh, sh.getLastColumn());
  var map = bot_headerMap(sh, bot_payColsAlias_());
  var n = Math.max(sh.getMaxRows() - 1, 100);
  if (sh.getMaxRows() < 101) sh.insertRowsAfter(sh.getMaxRows(), 101 - sh.getMaxRows());
  sh.getRange(2, map.date, n, 1).setNumberFormat('dd.mm.yyyy');
  [map.sum, map.accum, map.cost, map.balance].forEach(function (c) { sh.getRange(2, c, n, 1).setNumberFormat('#,##0" грн"'); });
  sh.setColumnWidths(1, sh.getLastColumn(), 140);
}
