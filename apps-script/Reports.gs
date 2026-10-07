/**
 * Reports.gs — планувальник (викликається з щохвилинного bot_poll) і звіти:
 * ранковий про невідправлені ТТН (6а), посилки на відділенні (6а.5), місячний (6б), команди /report і /month.
 */

function bot_parseTimeSetting_(s, defMin) {
  var m = String(s || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : defMin;
}

function bot_reportDays_() {
  var raw = String(bot_setting('REPORT_DAYS', 'Пн,Вт,Ср,Чт,Пт,Сб')).split(/[,\s;]+/).filter(Boolean);
  var idx = [];
  raw.forEach(function (d) {
    var i = BOT_DAYS_UA.indexOf(d.charAt(0).toUpperCase() + d.slice(1, 2).toLowerCase());
    if (i >= 0) idx.push(i);
  });
  return idx;
}

/** Викликається щохвилини з bot_poll. */
function bot_tickScheduled(startedMs) {
  var now = new Date();
  var p = bot_kyivParts(now);
  var today = bot_dayKey(now);
  var minutes = p.h * 60 + p.mi;
  var hasNp = !!bot_prop(BOT_PROP.NP_KEY);
  var reportMin = bot_parseTimeSetting_(bot_setting('REPORT_TIME', '09:00'), 540);
  var dayOk = bot_reportDays_().indexOf(p.dow) >= 0;

  // 1) нові замовлення з ТТН — одразу запитати статус
  if (hasNp && BOT_NEW_TTN_ROWS_.length) {
    var rows = BOT_NEW_TTN_ROWS_.slice(); BOT_NEW_TTN_ROWS_.length = 0;
    try { bot_npUpdate({ rows: rows }); } catch (e) { bot_log('ПОМИЛКА', 'НП (нові ТТН)', e.message); }
  }

  // 2) регулярне оновлення статусів НП — кожні 30 хв
  if (hasNp && Date.now() - Number(bot_prop(BOT_PROP.LAST_NP_TS) || 0) >= 29 * 60000) {
    var r = bot_npUpdate({});
    if (r.error) bot_log('ПОМИЛКА', 'оновлення НП', r.error);
    else bot_log('ІНФО', 'оновлення НП', 'перевірено ' + r.checked + ', змінено ' + r.updated);
    try { bot_refreshSpeedSummary(); } catch (e) { bot_log('ПОМИЛКА', 'підсумки: швидкість', e.message); }
  }

  // 3) о 08:50 — свіжі статуси для «Не передана»
  if (hasNp && dayOk && minutes >= reportMin - 10 && bot_prop(BOT_PROP.LAST_PRE_REFRESH) !== today) {
    bot_setProp(BOT_PROP.LAST_PRE_REFRESH, today);
    var r2 = bot_npUpdate({ onlyUnsent: true });
    bot_log('ІНФО', 'ранкове оновлення НП', r2.error ? r2.error : 'перевірено ' + r2.checked);
  }

  // 4) ранковий звіт
  if (dayOk && minutes >= reportMin && bot_prop(BOT_PROP.LAST_REPORT_DATE) !== today) {
    var done = bot_sendMorningReport();
    if (done) bot_setProp(BOT_PROP.LAST_REPORT_DATE, today);
    if (done) {
      try { bot_sendStorageReportToOwners_(); } catch (e) { bot_log('ПОМИЛКА', 'звіт про відділення', e.message); }
    }
  }

  // 5) місячний звіт 1-го числа
  if (p.d === 1 && minutes >= 540 && String(bot_setting('MONTHLY_REPORT', 'так')).toLowerCase() !== 'ні' &&
      bot_prop(BOT_PROP.LAST_MONTH_REPORT) !== bot_monthKey(now)) {
    var prev = bot_prevYm(p.y, p.m);
    bot_setProp(BOT_PROP.LAST_MONTH_REPORT, bot_monthKey(now));
    bot_ownerIds().forEach(function (id) { bot_sendMonthly_(id, prev.y, prev.m, true); });
  }
}

// ---------- ранковий звіт ----------

function bot_morningParts_() {
  var warn = Number(bot_setting('REPORT_WARN_DAYS', '3'));
  return bot_buildMorningReport(bot_readOrders(), new Date(), { warnDays: isNaN(warn) ? 3 : warn });
}

/** @return true — звіт доставлено (або не може бути доставлений і власника попереджено). */
function bot_sendMorningReport() {
  var chat = bot_setting('GROUP_CHAT_ID'), thread = bot_setting('REPORT_THREAD_ID');
  if (!chat || thread === '') {
    bot_sendToOwners('⚠️ Ранковий звіт не надіслано: не задано гілку «Реєстри». Напишіть <code>/bind report</code> у цій гілці групи.');
    return true;
  }
  var parts = bot_morningParts_();
  var opts = thread !== '0' ? { thread: thread } : {};
  for (var i = 0; i < parts.length; i++) {
    var r = bot_send(chat, parts[i], opts);
    if (!r.ok) {
      if (/thread not found/i.test(r.description || '')) {
        bot_sendToOwners('⚠️ Ранковий звіт не надіслано: гілку «Реєстри» не знайдено (message thread not found). Перенастройте: у гілці групи напишіть <code>/bind report</code>. Звіт нижче.');
        bot_sendMany(bot_ownerIds()[0], parts);
        return true;
      }
      throw new Error('Не вдалося надіслати ранковий звіт: ' + r.description);
    }
  }
  bot_log('ІНФО', 'ранковий звіт', 'частин: ' + parts.length);
  return true;
}

function bot_cmdReport(chatId) {
  if (bot_prop(BOT_PROP.NP_KEY)) { try { bot_npUpdate({ onlyUnsent: true }); } catch (e) { bot_log('ПОМИЛКА', '/report НП', e.message); } }
  bot_sendMany(chatId, bot_morningParts_());
}

// ---------- посилки на відділенні (лише власнику) ----------

function bot_sendStorageReportToOwners_() {
  if (!bot_prop(BOT_PROP.NP_KEY)) return;
  var warn = Number(bot_setting('STORAGE_WARN_DAYS', '4'));
  var orders = bot_readOrders().filter(function (o) { return o.stage === 'На відділенні' && o.ttn && o.status === 'В роботі'; });
  if (!orders.length) return;
  var ttns = [];
  orders.forEach(function (o) { if (ttns.indexOf(o.ttn) < 0) ttns.push(o.ttn); });
  var items = bot_npFetch(ttns, bot_setting('NP_SENDER_PHONE'));
  var info = {};
  Object.keys(items).forEach(function (t) {
    var it = items[t];
    info[t] = { arrived: it.actualDelivery || it.firstStorageDay || null, payedKeepingFrom: it.payedKeepingFrom, name: it.name, phone: it.phone };
  });
  var parts = bot_buildStorageReport(orders, info, new Date(), { warnDays: isNaN(warn) ? 4 : warn });
  if (!parts.length) return;
  bot_ownerIds().forEach(function (id) { bot_sendMany(id, parts); });
}

// ---------- місячний звіт ----------

function bot_sendMonthly_(chatId, y, m, silentOnEmpty) {
  var orders = bot_readOrders(), pays = bot_readPayments();
  var cur = bot_monthMetrics(orders, pays, y, m);
  var pv = bot_prevYm(y, m);
  var prev = bot_monthMetrics(orders, pays, pv.y, pv.m);
  bot_sendMany(chatId, bot_splitText(bot_buildMonthReport(cur, prev), 3900));
  bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.monthly);
    var row = bot_monthlyRow(cur);
    var last = sh.getLastRow();
    var keys = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
    var target = last + 1;
    for (var i = 0; i < keys.length; i++) if (String(keys[i][0]) === row[0]) { target = i + 2; break; }
    sh.getRange(target, 1).setNumberFormat('@');
    sh.getRange(target, 1, 1, row.length).setValues([row]);
  });
}

function bot_cmdMonth(chatId, arg) {
  var y, m;
  if (arg) {
    var ym = bot_parseYm(arg);
    if (!ym) return bot_send(chatId, 'Формат: <code>/month 2026-08</code> (або просто /month — за минулий місяць).');
    y = ym.y; m = ym.m;
  } else {
    var p = bot_kyivParts(new Date());
    var pv = bot_prevYm(p.y, p.m); y = pv.y; m = pv.m;
  }
  bot_sendMonthly_(chatId, y, m, false);
}
