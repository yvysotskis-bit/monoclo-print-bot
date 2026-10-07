/**
 * Import.gs — одноразовий імпорт зі старої таблиці «Звітність Монокло — Кузнець 2026» (розділ 7.5).
 * Стару таблицю лише ЧИТАЄМО, нічого в ній не змінюємо.
 */

var BOT_OLD_ORDER_COLS_ = {
  no: ['№ з чату'], print: ['Назва принта / позиції', 'Назва принта', 'Назва'], color: ['Колір'], size: ['Розмір'],
  placement: ['Розміщення принту', 'Розміщення'], ttn: ['ТТН (Штрих-код)', 'ТТН'], cost: ['Собівартість (грн)', 'Собівартість'],
  npStatus: ['Статус доставки'], paid: ['Оплата']
};

function bot_oldFind_(headers, names) {
  var h = headers.map(function (x) { return String(x).trim().toLowerCase(); });
  for (var i = 0; i < names.length; i++) { var j = h.indexOf(names[i].toLowerCase()); if (j >= 0) return j; }
  for (var k = 0; k < names.length; k++) {
    for (var m = 0; m < h.length; m++) if (h[m].indexOf(names[k].toLowerCase()) === 0) return m;
  }
  return -1;
}

/** Читає стару таблицю (лише читання) і повертає {orders:[...], payments:[...]} у сирому вигляді. */
function bot_readOldWorkbook(url) {
  var old = SpreadsheetApp.openByUrl(url);
  var shO = old.getSheetByName('Замовлення') || old.getSheets()[0];
  var shP = old.getSheetByName('Оплати');
  var vals = shO.getDataRange().getValues();
  var hdr = vals[0];
  var ix = {};
  Object.keys(BOT_OLD_ORDER_COLS_).forEach(function (k) {
    ix[k] = bot_oldFind_(hdr, BOT_OLD_ORDER_COLS_[k]);
    if (ix[k] < 0) throw new Error('У старій таблиці не знайшов колонку «' + BOT_OLD_ORDER_COLS_[k][0] + '».');
  });
  var orders = [];
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i];
    var o = { _line: i + 1 };
    Object.keys(ix).forEach(function (k) { o[k] = r[ix[k]]; });
    if ((o.no === '' || o.no === null) && !bot_trim(o.print) && !bot_normTtn(o.ttn)) continue;   // порожній рядок або рядок підсумків
    orders.push(o);
  }
  var payments = [];
  if (shP) {
    var pv = shP.getDataRange().getValues();
    var ph = pv[0];
    var pi = { no: bot_oldFind_(ph, ['№ оплати']), date: bot_oldFind_(ph, ['Дата оплати']), sum: bot_oldFind_(ph, ['Сума оплати']),
      bank: bot_oldFind_(ph, ['Спосіб / банк']), receipt: bot_oldFind_(ph, ['№ квитанції']) };
    for (var j = 1; j < pv.length; j++) {
      var sum = bot_toNumber(pv[j][pi.sum]);
      if (sum === null) continue;
      payments.push({ no: pv[j][pi.no], date: pv[j][pi.date], sum: sum, bank: pi.bank >= 0 ? pv[j][pi.bank] : '', receipt: pi.receipt >= 0 ? pv[j][pi.receipt] : '' });
    }
  }
  return { orders: orders, payments: payments };
}

/** Чи можна імпортувати: нова таблиця має бути порожньою (інакше з'являться дублі). */
function bot_importTargetIsEmpty() {
  return bot_readOrders().length === 0 && bot_readPayments().length === 0;
}

function bot_importFromUrl(url) {
  if (!bot_importTargetIsEmpty()) throw new Error('У новій таблиці вже є замовлення або оплати. Імпорт можливий лише в порожню таблицю — щоб не було дублів.');
  var data = bot_readOldWorkbook(url);
  var mapped = data.orders.map(function (o) { var m = bot_mapOldOrderRow(o); m._line = o._line; return m; });
  var rows = mapped.map(function (m) { return m.row; });
  var prop = bot_importPropagatePaid(rows);

  var unrecognized = [];
  mapped.forEach(function (m) {
    if (m.unrecognized.length) {
      unrecognized.push('рядок ' + m._line + ': ' + m.unrecognized.join(', '));
      m.row.note = (m.row.note ? m.row.note + '; ' : '') + BOT_NOTE_PREFIX_ + 'не розпізнано: ' + m.unrecognized.join(', ');
    }
  });

  bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var width = sh.getLastColumn();
    if (rows.length + 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 200 - sh.getMaxRows());
    var arr = rows.map(function (r) {
      var line = []; for (var i = 0; i < width; i++) line.push('');
      BOT_ORDER_COLS.forEach(function (c) {
        var v = r[c[0]];
        if (map[c[0]] && v !== null && v !== undefined) line[map[c[0]] - 1] = v;
      });
      return line;
    });
    sh.getRange(2, map.ttn, rows.length, 1).setNumberFormat('@');
    if (arr.length) sh.getRange(2, 1, arr.length, width).setValues(arr);

    // оплати: переносимо як є, формули — нові
    var ps = bot_sheet(BOT_SHEETS.payments);
    var pm = bot_headerMap(ps, bot_payColsAlias_());
    var pwidth = ps.getLastColumn();
    if (data.payments.length + 1 > ps.getMaxRows()) ps.insertRowsAfter(ps.getMaxRows(), data.payments.length + 50);
    var sumL = bot_colLetter(pm.sum), accL = bot_colLetter(pm.accum), costL = bot_colLetter(pm.cost);
    var parr = data.payments.map(function (p, i) {
      var r = i + 2, line = []; for (var k = 0; k < pwidth; k++) line.push('');
      line[pm.no - 1] = p.no; line[pm.date - 1] = p.date; line[pm.sum - 1] = p.sum; line[pm.bank - 1] = p.bank; line[pm.receipt - 1] = p.receipt;
      line[pm.accum - 1] = '=SUM($' + sumL + '$2:' + sumL + r + ')';
      line[pm.cost - 1] = "='" + BOT_SHEETS.summary + "'!$A$5";
      line[pm.balance - 1] = '=' + costL + r + '-' + accL + r;
      return line;
    });
    if (parr.length) ps.getRange(2, 1, parr.length, pwidth).setValues(parr);
    SpreadsheetApp.flush();
  });

  var cost = bot_sumBy_(rows, function (r) { return r.cost; });
  var paid = bot_sumBy_(data.payments, function (p) { return p.sum; });
  var sum = bot_ss().getSheetByName(BOT_SHEETS.summary);
  var fromSummary = { cost: sum.getRange('A5').getValue(), paid: sum.getRange('B5').getValue(), debt: sum.getRange('C5').getValue() };

  var np = { skipped: 'ключ НП не введено — дати створення ТТН і статуси підтягнуться пізніше самі, коли введете ключ (меню 🤖 Бот → Ввести ключ Нової пошти)' };
  if (bot_prop(BOT_PROP.NP_KEY)) {
    np = bot_npUpdate({ maxTtn: 3000 });
  }
  var rep = {
    rows: rows.length, cost: cost, payments: data.payments.length, paid: paid, debt: bot_round2(cost - paid), summary: fromSummary,
    propagated: prop.propagated, paidRows: rows.filter(function (r) { return r.paid === 'Оплачено'; }).length,
    unrecognized: unrecognized, np: np
  };
  bot_log('ІНФО', 'імпорт', rep.rows + ' рядків · собівартість ' + rep.cost + ' · оплат ' + rep.paid);
  return rep;
}

function bot_importReportText(rep, forTelegram) {
  var L = [];
  L.push((forTelegram ? '📥 <b>Імпорт завершено</b>' : 'Імпорт завершено'));
  L.push('Рядків замовлень: ' + rep.rows);
  L.push('Собівартість: ' + bot_fmtMoney(rep.cost) + (rep.summary ? ' (у «Підсумках»: ' + bot_fmtMoney(rep.summary.cost) + ')' : ''));
  L.push('Оплат: ' + rep.payments + ' на ' + bot_fmtMoney(rep.paid) + (rep.summary ? ' (у «Підсумках»: ' + bot_fmtMoney(rep.summary.paid) + ')' : ''));
  L.push('Борг: ' + bot_fmtMoney(rep.debt) + (rep.summary ? ' (у «Підсумках»: ' + bot_fmtMoney(rep.summary.debt) + ')' : ''));
  L.push('Рядків «Оплачено»: ' + rep.paidRows + ' (з них дооплачено за правилом «усі рядки ТТН»: ' + rep.propagated + ')');
  if (rep.np && rep.np.skipped) L.push('Нова пошта: ' + rep.np.skipped);
  else if (rep.np && rep.np.error) L.push('Нова пошта: помилка — ' + rep.np.error);
  else if (rep.np) L.push('Нова пошта: перевірено ТТН ' + rep.np.checked + ', оновлено рядків ' + rep.np.updated);
  L.push(rep.unrecognized.length ? 'Не вдалося розпізнати рядків: ' + rep.unrecognized.length : 'Усі рядки розпізнано.');
  if (rep.unrecognized.length) L = L.concat(rep.unrecognized.slice(0, 20));
  if (rep.unrecognized.length > 20) L.push('… і ще ' + (rep.unrecognized.length - 20));
  if (forTelegram) return L.map(function (l, i) { return i === 0 ? l : bot_esc(l); }).join('\n');
  return L.join('\n');
}
