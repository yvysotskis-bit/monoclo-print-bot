/**
 * Reports.gs — планувальник (викликається з щохвилинного bot_poll) і звіти:
 * ранковий про невідправлені ТТН (6а), посилки на відділенні (6а.5), місячний (6б), команди /report і /month.
 */

function bot_parseTimeSetting_(s, defMin) {
  var m = String(s || '').match(/^(\d{1,2})[:.](\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : defMin;
}

/** Дні тижня звіту: «Пн,Вт,Ср», діапазон «Пн-Сб», у будь-якому регістрі. Нерозпізнане → Пн–Сб. */
function bot_reportDays_() {
  var order = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  var dowOf = { 'Пн': 1, 'Вт': 2, 'Ср': 3, 'Чт': 4, 'Пт': 5, 'Сб': 6, 'Нд': 0 };
  var norm = function (t) { t = String(t).replace(/\./g, ''); return t.charAt(0).toUpperCase() + t.slice(1, 2).toLowerCase(); };
  var days = {};
  String(bot_setting('REPORT_DAYS', 'Пн,Вт,Ср,Чт,Пт,Сб')).split(/[,\s;]+/).filter(Boolean).forEach(function (tok) {
    var parts = tok.split(/[-–—]/);
    if (parts.length === 2) {
      var a = order.indexOf(norm(parts[0])), b = order.indexOf(norm(parts[1]));
      if (a >= 0 && b >= 0) { for (var k = a; ; k = (k + 1) % 7) { days[dowOf[order[k]]] = true; if (k === b) break; } return; }
    }
    var i = order.indexOf(norm(tok));
    if (i >= 0) days[dowOf[order[i]]] = true;
  });
  var list = Object.keys(days).map(Number);
  return list.length ? list : [1, 2, 3, 4, 5, 6];
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

  // 2) регулярне оновлення статусів НП — кожні 30 хв (час спроби фіксуємо ДО запиту: помилка НП не повторюється щохвилини)
  if (hasNp && Date.now() - Number(bot_prop(BOT_PROP.LAST_NP_TS) || 0) >= 29 * 60000) {
    bot_setProp(BOT_PROP.LAST_NP_TS, Date.now());
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

  // 3б) описи ТТН: перевірка / запис у НП (щохвилини), реєстр о REGISTRY_TIME (щодня)
  try { bot_ttnProcess(); } catch (e) { bot_log('ПОМИЛКА', 'описи ТТН', e.message); }
  if (hasNp) { try { bot_registryTick(now, minutes, today); } catch (e) { bot_log('ПОМИЛКА', 'реєстр (планувальник)', e.message); } }

  // 4) ранковий звіт
  if (dayOk && minutes >= reportMin && bot_prop(BOT_PROP.LAST_REPORT_DATE) !== today) {
    var done = bot_sendMorningReport();
    if (done) bot_setProp(BOT_PROP.LAST_REPORT_DATE, today);
    if (done) {
      try { bot_sendStorageReportToOwners_(); } catch (e) { bot_log('ПОМИЛКА', 'звіт про відділення', e.message); }
    }
  }

  // 5) місячний звіт 1-го числа (мітку «надіслано» ставимо лише після успіху — інакше збій = звіт втрачено)
  if (p.d === 1 && minutes >= 540 && String(bot_setting('MONTHLY_REPORT', 'так')).toLowerCase() !== 'ні' &&
      bot_prop(BOT_PROP.LAST_MONTH_REPORT) !== bot_monthKey(now)) {
    var prev = bot_prevYm(p.y, p.m);
    var allOk = true;
    bot_ownerIds().forEach(function (id) {
      try { bot_sendMonthly_(id, prev.y, prev.m, true); } catch (e) { allOk = false; bot_log('ПОМИЛКА', 'місячний звіт', e.message); }
    });
    if (allOk) bot_setProp(BOT_PROP.LAST_MONTH_REPORT, bot_monthKey(now));
  }
}

// ---------- ранковий звіт ----------

function bot_morningParts_() {
  var warn = Number(bot_setting('REPORT_WARN_DAYS', '3'));
  return bot_buildMorningReport(bot_readOrders(), new Date(), { warnDays: isNaN(warn) ? 3 : warn });
}

/**
 * @return true — звіт доставлено повністю (або не може бути доставлений і власника попереджено);
 *         false — спробуємо ще раз за хвилину, продовживши з тієї частини, на якій зупинились (без дублів).
 */
function bot_sendMorningReport() {
  var today = bot_dayKey(new Date());
  var chat = bot_setting('GROUP_CHAT_ID'), thread = bot_setting('REPORT_THREAD_ID');
  if (!chat || thread === '') {
    bot_sendToOwners('⚠️ Ранковий звіт не надіслано: не задано гілку «Реєстри». Напишіть <code>/bind report</code> у цій гілці групи.');
    return true;
  }
  var parts = bot_morningParts_();
  var opts = thread !== '0' ? { thread: thread } : {};
  var prog = {};
  try { prog = JSON.parse(bot_prop('REPORT_PROGRESS') || '{}'); } catch (e) { prog = {}; }
  if (prog.day !== today) prog = { day: today, sent: 0, fails: 0 };
  for (var i = prog.sent; i < parts.length; i++) {
    var r;
    try { r = bot_send(chat, parts[i], opts); } catch (e) { r = { ok: false, description: bot_scrub(e.message) }; }
    if (r.ok) { prog.sent = i + 1; bot_setProp('REPORT_PROGRESS', JSON.stringify(prog)); continue; }
    if (/thread not found/i.test(r.description || '')) {
      bot_sendToOwners('⚠️ Ранковий звіт не надіслано: гілку «Реєстри» не знайдено (message thread not found). Перенастройте: у гілці групи напишіть <code>/bind report</code>. Звіт нижче.');
      bot_sendMany(bot_ownerIds()[0], parts.slice(prog.sent));
      return true;
    }
    prog.fails = (prog.fails || 0) + 1;
    bot_setProp('REPORT_PROGRESS', JSON.stringify(prog));
    bot_log('ПОМИЛКА', 'ранковий звіт', 'спроба ' + prog.fails + ': ' + r.description);
    if (prog.fails >= 3) {
      bot_sendToOwners('⚠️ Ранковий звіт не надіслано: ' + bot_esc(bot_scrub(r.description)) + '. Перевірте, що бот ще в групі й може писати в гілку «Реєстри» (за потреби — <code>/bind report</code>). Звіт нижче.');
      bot_sendMany(bot_ownerIds()[0], parts.slice(prog.sent));
      return true;                                           // сьогодні більше не повторюємо
    }
    return false;
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
  var op = bot_openingFromSettings();
  var cur = bot_monthMetrics(orders, pays, y, m, op);
  var pv = bot_prevYm(y, m);
  var prev = bot_monthMetrics(orders, pays, pv.y, pv.m, op);
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
