/**
 * TgImport.gs — разовий імпорт замовлень з експорту історії чату Telegram Desktop (messages.html).
 * Потрібно, бо боти не бачать старих повідомлень групи. Розбір — чиста логіка (перевіряється в Node),
 * далі — читання файлу з Google Диска і запис у «Замовлення».
 *
 * Ті самі правила, що й для живих замовлень: bot_parseOrderMessage (кілька замовлень в одному
 * повідомленні, спільна ТТН, номер без крапки, «ТЕРМІНОВО»). Ключ msg_id рядка = id повідомлення Telegram
 * (для 2-го і далі замовлень у повідомленні — «id.1», «id.2»), тож згодом редагування в групі оновлюють той самий рядок.
 */

var BOT_UA_MONTHS_GEN_ = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

function bot_decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCodePoint(parseInt(d, 10)); })
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** «3 жовтня 2026, 13:19:40» → Date (за Києвом). */
function bot_parseUaDate(str) {
  var m = String(str || '').match(/(\d{1,2})\s+([а-яіїєґ]+)\s+(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i);
  if (!m) return null;
  var mon = BOT_UA_MONTHS_GEN_.indexOf(m[2].toLowerCase());
  if (mon < 0) return null;
  var base = bot_makeDate(+m[3], mon + 1, +m[1]);
  return new Date(base.getTime() + (((+m[4] || 0) * 60 + (+m[5] || 0)) * 60 + (+m[6] || 0)) * 1000);
}

function bot_htmlToText_(h) {
  return bot_decodeEntities(String(h).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
}

/** messages.html → [{id, service, text, date, replyTo, from, edited}] */
function bot_parseTelegramExport(html) {
  var blocks = String(html).split('<div class="message ').slice(1);
  var out = [];
  blocks.forEach(function (b) {
    var idm = b.match(/id="message(-?\d+)"/);
    if (!idm) return;
    var isService = /^service/.test(b);
    var msg = { id: parseInt(idm[1], 10), service: '', text: '', date: null, replyTo: null, from: '', edited: false };
    if (isService) {
      var sm = b.match(/<div class="body details">\s*([\s\S]*?)\s*<\/div>/);
      msg.service = sm ? bot_htmlToText_(sm[1]).replace(/\s+/g, ' ').trim() : '';
    } else {
      var tm = b.match(/<div class="text">\s*([\s\S]*?)\s*<\/div>/);
      msg.text = tm ? bot_htmlToText_(tm[1]) : '';
      var fm = b.match(/<div class="from_name">\s*([\s\S]*?)\s*<\/div>/);
      msg.from = fm ? bot_htmlToText_(fm[1]).trim() : '';
      var rm = b.match(/GoToMessage\((\d+)\)/);
      msg.replyTo = rm ? parseInt(rm[1], 10) : null;
      var dm = b.match(/class="pull_right date details" title="([^"]+)"([^>]*)>([^<]*)/);
      if (dm) { msg.date = bot_parseUaDate(dm[1]); msg.edited = /edited|змінено|ред/i.test(dm[3]); }
    }
    out.push(msg);
  });
  return out;
}

/**
 * Бере з експорту замовлення, яких ще немає в таблиці.
 * @param opts {afterNo — пропускаємо № ≤ цього, existingNos — масив № що вже є, priceRows, threadName}
 */
function bot_planTelegramImport(messages, opts) {
  opts = opts || {};
  var threadName = opts.threadName || 'Замовлення на клієнта';
  var existing = {}; (opts.existingNos || []).forEach(function (n) { existing[n] = true; });
  var afterNo = opts.afterNo || 0;
  var byId = {}; messages.forEach(function (m) { byId[m.id] = m; });
  var rootId = null;
  messages.forEach(function (m) {
    if (rootId === null && m.service && /Створено гілку/.test(m.service) && m.service.indexOf(threadName) >= 0) rootId = m.id;
  });
  function inThread(m) {
    if (rootId === null) return true;
    var cur = m, hops = 0;
    while (cur && hops++ < 30) {
      if (cur.replyTo === rootId) return true;
      cur = cur.replyTo !== null ? byId[cur.replyTo] : null;
    }
    return false;
  }

  var plan = { rootFound: rootId !== null, rows: [], skippedOld: 0, skippedExisting: 0, repeats: 0, sharedTtn: 0, problems: [], gaps: [], firstNo: null, lastNo: null };
  var seen = {};
  messages.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    if (m.service || !m.text || !inThread(m)) return;
    var list = bot_parseOrderMessage(m.text);
    list.forEach(function (p, idx) {
      if (seen[p.no]) { plan.repeats++; return; }               // повторна публікація (напр. «ТЕРМІНОВО») — лишаємо першу
      seen[p.no] = true;
      if (p.no <= afterNo) { plan.skippedOld++; return; }
      if (existing[p.no]) { plan.skippedExisting++; return; }
      var d = m.date || new Date();
      var kp = bot_kyivParts(d);
      var orderDate = bot_makeDate(kp.y, kp.m, kp.d);
      var b = bot_buildOrderFields_(p, orderDate, opts.priceRows || [], 'В роботі');
      var row = b.fields;
      row.stage = p.ttn ? '' : 'Немає ТТН';
      row.status = 'В роботі'; row.paid = 'Не оплачено'; row.msgId = bot_msgKey(m.id, idx);
      row.note = b.issues.length ? BOT_NOTE_PREFIX_ + b.issues.join(', ') : '';
      if (p.ttnShared) plan.sharedTtn++;
      plan.rows.push({ obj: row, yellow: b.yellow, issues: b.issues, no: p.no, tgId: m.id, hasTtn: !!p.ttn });
      if (b.issues.length) plan.problems.push('№' + p.no + ': ' + b.issues.join(', '));
    });
  });
  var nos = plan.rows.map(function (r) { return r.no; });
  if (nos.length) {
    plan.firstNo = Math.min.apply(null, nos); plan.lastNo = Math.max.apply(null, nos);
    var have = {}; nos.forEach(function (n) { have[n] = true; });
    for (var n = Math.max(plan.firstNo, afterNo + 1); n <= plan.lastNo; n++) if (!have[n] && !existing[n] && !seen[n]) plan.gaps.push(n);
  }
  return plan;
}

function bot_tgImportReportText(plan, forTelegram, done) {
  var L = [];
  L.push(done ? '📥 Імпорт замовлень з Telegram завершено' : 'Знайдено в експорті');
  L.push((done ? 'Додано' : 'Буде додано') + ' замовлень: ' + plan.rows.length + (plan.rows.length ? ' (№' + plan.firstNo + '–№' + plan.lastNo + ')' : ''));
  if (plan.sharedTtn) L.push('З них зі спільною ТТН на кілька замовлень: ' + plan.sharedTtn);
  L.push('Пропущено: уже в таблиці ' + plan.skippedExisting + ', старіші за останній № ' + plan.skippedOld + ', повторні публікації ' + plan.repeats);
  if (!plan.rootFound) L.push('⚠️ Не знайшов у файлі гілку «Замовлення на клієнта» — взяв усі повідомлення.');
  if (plan.gaps.length) L.push('Номери, яких немає в чаті: ' + plan.gaps.join(', '));
  L.push(plan.problems.length ? 'Рядки з проблемами (' + plan.problems.length + ', клітинки жовті, див. «Примітка»):' : 'Проблем у рядках немає.');
  plan.problems.slice(0, 25).forEach(function (p) { L.push('• ' + p); });
  if (plan.problems.length > 25) L.push('… і ще ' + (plan.problems.length - 25));
  return forTelegram ? L.map(function (l) { return bot_esc(l); }).join('\n') : L.join('\n');
}

// =====================================================================
// Google: читання файлів з Диска і запис
// =====================================================================

function bot_driveIdFromUrl(url) {
  var m = String(url).match(/\/d\/([-\w]{15,})/) || String(url).match(/[?&]id=([-\w]{15,})/) || String(url).match(/^([-\w]{25,})$/);
  return m ? m[1] : '';
}

/** urls — рядок з одним або кількома посиланнями (messages.html, messages2.html …). */
/** startAfter — імпортувати замовлення з № більшим за це (за замовчуванням — останній № у таблиці). */
function bot_tgImportPlan(urls, startAfter) {
  var ids = String(urls).split(/[\s,;]+/).filter(Boolean).map(bot_driveIdFromUrl);
  if (!ids.length || ids.some(function (x) { return !x; })) throw new Error('Не схоже на посилання на файл Google Диска. Завантажте messages.html на Диск → ПКМ → «Надати доступ / Копіювати посилання».');
  var messages = [];
  ids.forEach(function (id) {
    var html = DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8');
    if (html.indexOf('class="message ') < 0) throw new Error('У файлі немає повідомлень Telegram. Потрібен messages.html з експорту історії чату (формат HTML).');
    messages = messages.concat(bot_parseTelegramExport(html));
  });
  var orders = bot_readOrders();
  var nos = orders.map(function (o) { return o.no; }).filter(function (n) { return n !== ''; });
  var maxNo = nos.reduce(function (a, n) { return Math.max(a, Number(n) || 0); }, 0);
  var after = (startAfter === undefined || startAfter === null || startAfter === '' || isNaN(Number(startAfter))) ? maxNo : Number(startAfter);
  var plan = bot_planTelegramImport(messages, { afterNo: after, existingNos: nos, priceRows: bot_readPriceRows() });
  plan.afterNo = after; plan.maxNoInTable = maxNo;
  return plan;
}

function bot_tgImportApply(plan) {
  var rowNums = bot_withLock(function () {
    var nos = {}; bot_readOrders().forEach(function (o) { nos[o.no] = true; });       // перевірка ще раз під блокуванням
    var items = plan.rows.filter(function (r) { return !nos[r.no]; });
    var rows = bot_appendOrderRows(items);
    bot_log('ІНФО', 'імпорт з Telegram', 'додано ' + items.length + ' замовлень');
    return rows;
  });
  if (rowNums.length && bot_prop(BOT_PROP.NP_KEY)) {
    try { bot_npUpdate({ rows: rowNums, maxTtn: 3000 }); } catch (e) { bot_log('ПОМИЛКА', 'НП після імпорту з Telegram', e.message); }
  }
  return { added: rowNums.length, rows: rowNums };
}

// =====================================================================
// «Виварене»: виправити тип і собівартість уже доданих замовлень за експортом Telegram
// =====================================================================

/**
 * Чиста логіка. Для замовлень, де в тексті є «виварене», порівнює тип/собівартість у таблиці з тим, що має бути.
 * Уже ОПЛАЧЕНІ рядки не змінює — лише повідомляє. @return {changes, paidSkipped, missing, unchanged, delta}
 */
function bot_planWashedFix(messages, orders, priceRows) {
  var byNo = {}; orders.forEach(function (o) { if (o.no !== '' && !byNo[o.no]) byNo[o.no] = o; });
  var plan = { changes: [], paidSkipped: [], missing: [], unchanged: 0, delta: 0, checked: 0 };
  var seen = {};
  messages.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    if (m.service || !m.text || !/виварен/i.test(m.text)) return;
    bot_parseOrderMessage(m.text).forEach(function (p) {
      if (seen[p.no]) return; seen[p.no] = true;
      if (BOT_WASHED_TYPES.indexOf(p.type) < 0) return;
      plan.checked++;
      var row = byNo[p.no];
      if (!row) { plan.missing.push(p.no); return; }
      if (row.status !== 'В роботі') return;
      var b = bot_buildOrderFields_(p, row.date || new Date(), priceRows, 'В роботі');
      var newCost = Number(b.fields.cost) || 0;
      if (row.type === p.type && row.cost === newCost) { plan.unchanged++; return; }
      var ch = { row: row._row, no: p.no, fromType: row.type, toType: p.type, oldCost: row.cost, newCost: newCost,
        fields: { type: p.type, color: p.color, colorCode: p.colorCode || '', cost: newCost }, issues: b.issues, yellow: b.yellow, oldNote: row.note };
      if (row.paid === 'Оплачено') { plan.paidSkipped.push(ch); return; }
      plan.changes.push(ch); plan.delta += newCost - row.cost;
    });
  });
  return plan;
}

function bot_washedFixApply(plan) {
  bot_withLock(function () {
    bot_patchOrders(plan.changes.map(function (c) {
      var f = {}; Object.keys(c.fields).forEach(function (k) { f[k] = c.fields[k]; });
      f.note = bot_mergeNote_(c.oldNote, c.issues);
      return { row: c.row, fields: f };
    }));
    var sh = bot_ordersSheet(), map = bot_ordersMap(sh);
    plan.changes.forEach(function (c) { bot_clearYellow(c.row, ['type', 'color', 'size', 'cost']); bot_markYellow_(sh, map, c.row, c.yellow); });
    bot_log('ІНФО', 'виварене', 'виправлено ' + plan.changes.length + ' рядків, різниця ' + plan.delta + ' грн');
  });
}

function bot_washedFixText(plan, done) {
  var L = [done ? '✅ «Виварене» виправлено' : 'Знайдено в експорті'];
  L.push('Замовлень з «виварене»: ' + plan.checked + '. ' + (done ? 'Виправлено' : 'Буде виправлено') + ' рядків: ' + plan.changes.length + ', уже правильних: ' + plan.unchanged + '.');
  L.push('Зміна собівартості: ' + (plan.delta >= 0 ? '+' : '') + bot_fmtNum(plan.delta) + ' грн.');
  if (plan.paidSkipped.length) L.push('⚠️ Уже ОПЛАЧЕНІ (не змінюю, перевірте вручну): ' + plan.paidSkipped.map(function (c) { return '№' + c.no + ' (' + bot_fmtNum(c.oldCost) + '→' + bot_fmtNum(c.newCost) + ')'; }).join(', '));
  if (plan.missing.length) L.push('Немає в таблиці (додайте імпортом): ' + plan.missing.join(', '));
  plan.changes.slice(0, 12).forEach(function (c) { L.push('• №' + c.no + ': ' + (c.fromType || '—') + ' → ' + c.toType + ', ' + bot_fmtNum(c.oldCost) + ' → ' + bot_fmtNum(c.newCost) + ' грн'); });
  if (plan.changes.length > 12) L.push('… і ще ' + (plan.changes.length - 12));
  return L.join('\n');
}

function bot_tgReadMessages_(urls) {
  var ids = String(urls).split(/[\s,;]+/).filter(Boolean).map(bot_driveIdFromUrl);
  if (!ids.length || ids.some(function (x) { return !x; })) throw new Error('Не схоже на посилання на файл Google Диска.');
  var messages = [];
  ids.forEach(function (id) {
    var html = DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8');
    if (html.indexOf('class="message ') < 0) throw new Error('У файлі немає повідомлень Telegram (потрібен messages.html).');
    messages = messages.concat(bot_parseTelegramExport(html));
  });
  return messages;
}

function bot_menuWashedFix() {
  var ui = bot_ui_();
  var r = ui.prompt('«Виварене»: виправити тип і собівартість', 'Вставте посилання на messages.html з вашого Google Диска (той самий файл, що й для імпорту). Бот знайде замовлення з «виварене» і виправить їм тип та собівартість за «Прайсом» (1490 грн). Оплачені рядки не чіпаю.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  try {
    var plan = bot_planWashedFix(bot_tgReadMessages_(r.getResponseText()), bot_readOrders(), bot_readPriceRows());
    if (!plan.changes.length) { bot_alert_('Нічого виправляти', bot_washedFixText(plan, false)); return; }
    var go = ui.alert('Виправити?', bot_washedFixText(plan, false) + '\n\nВиправити ці рядки?', ui.ButtonSet.YES_NO);
    if (go !== ui.Button.YES) return;
    bot_washedFixApply(plan);
    bot_alert_('Готово', bot_washedFixText(plan, true));
    try { bot_buildSummary(); } catch (e) { bot_log('УВАГА', 'підсумки після «виварене»', e.message); }
  } catch (e) { bot_alert_('Не вдалося', e.message); }
}
