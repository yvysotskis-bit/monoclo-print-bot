/**
 * Registry.gs — Модуль D: щоденний реєстр (за замовчуванням о 10:00) і PDF маркування 100×100 у гілку «Реєстри».
 *
 * У реєстр потрапляють ЛИШЕ ТТН з аркуша «ТТН» (а він наповнюється тільки повідомленнями гілки «Замовлення на клієнта»),
 * і перед створенням кожна ТТН ще раз звіряється із замовленнями з гілки. ТТН інших друкарень сюди потрапити не можуть.
 * Усі попередження (хто не ввійшов і чому) — лише власнику в особисті, не в групу.
 */

// ---------- чиста логіка ----------

/** «15038-15088» (мінімальний-максимальний), одне замовлення → «15038». */
function bot_regRange(nos) {
  var a = nos.filter(function (n) { return n > 0; });
  if (!a.length) return '';
  var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a);
  return mn === mx ? String(mn) : mn + '-' + mx;
}
function bot_regFileName(nos) { return bot_regRange(nos) + '.pdf'; }

/**
 * Відбір ТТН у реєстр (розділ 7.1–7.2).
 * @param ttnRows рядки аркуша «ТТН»; orders — «Замовлення»; fromNo — поріг DESC_FROM_ORDER
 * @return {include:[рядки], excluded:[{ttn, orders, reason}], orderNos:[номери замовлень включених ТТН]}
 */
function bot_regSelect(ttnRows, orders, fromNo) {
  var include = [], excluded = [], nos = [];
  ttnRows.forEach(function (r) {
    if (r.registry) return;                                                  // уже в реєстрі
    var rowNos = bot_ttnOrderNos(r.orders);
    if (!rowNos.some(function (n) { return n > fromNo; })) return;           // старі — не наші
    var mine = orders.filter(function (o) { return o.ttn === r.ttn && o.msgId; });   // замовлення, прийняті з гілки
    var reason = '';
    if (r.status === 'Чекає рішення') reason = 'чекає вашого рішення щодо опису';
    else if (r.status === 'Помилка НП') reason = 'помилка НП: ' + (r.note || '');
    else if (r.status === 'Новий') reason = 'опис ще не записаний у НП';
    else if (r.status === 'Перевірка') reason = 'режим перевірки';
    else if (r.status !== 'Записано в НП') reason = 'статус «' + r.status + '»';
    else if (!mine.length) reason = 'немає повідомлення в гілці «Замовлення на клієнта» (відкинуто)';
    else if (mine.every(function (o) { return o.status === 'Скасовано'; })) reason = 'усі замовлення скасовані';
    if (reason) { excluded.push({ ttn: r.ttn, orders: r.orders, reason: reason, hard: r.status === 'Записано в НП' }); return; }
    include.push(r);
    mine.forEach(function (o) { if (o.status !== 'Скасовано') nos.push(Number(o.no)); });
  });
  return { include: include, excluded: excluded, orderNos: nos };
}

/** Посилання на друк маркування 100×100 (PDF). Ключ API — лише тут, на боці скрипта; у Telegram і логи не потрапляє. */
function bot_regPrintUrl(ttns, key) {
  return 'https://my.novaposhta.ua/orders/printMarking100x100/' + ttns.map(function (t) { return 'orders[]/' + t; }).join('/') + '/type/pdf/apiKey/' + key;
}

// ---------- аркуш «Реєстри» ----------

function bot_readRegistries() {
  var sh = bot_sheet(BOT_SHEETS.registries), map = bot_headerMap(sh, BOT_REG_COLS), last = sh.getLastRow();
  if (last < 2) return [];
  var out = [];
  sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues().forEach(function (r, i) {
    function g(k) { return r[map[k] - 1]; }
    if (g('date') === '' && g('no') === '') return;
    out.push({ _row: i + 2, date: bot_cellDate_(g('date')), no: bot_cellStr_(g('no')), ref: bot_cellStr_(g('ref')), range: bot_cellStr_(g('range')),
      count: Number(g('count')) || 0, fileId: bot_cellStr_(g('fileId')), status: bot_cellStr_(g('status')), ttns: bot_cellStr_(g('ttns')) });
  });
  return out;
}

function bot_regWrite_(row, fields) {
  bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.registries), map = bot_headerMap(sh, BOT_REG_COLS), width = sh.getLastColumn();
    if (!row) row = Math.max(sh.getLastRow(), 1) + 1;
    var rng = sh.getRange(row, 1, 1, width), cur = rng.getValues()[0];
    Object.keys(fields).forEach(function (k) { if (map[k]) cur[map[k] - 1] = fields[k]; });
    rng.setNumberFormat('@'); if (map.date) sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy hh:mm');
    rng.setValues([cur]);
  });
  return row;
}

// ---------- Telegram: PDF ----------

function bot_sendDocument(chatId, thread, doc, caption) {
  var p = { chat_id: String(chatId), caption: caption, document: doc };
  if (thread && thread !== '0') p.message_thread_id = String(thread);
  var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + bot_token() + '/sendDocument', { method: 'post', payload: p, muteHttpExceptions: true });
  var body;
  try { body = JSON.parse(resp.getContentText()); } catch (e) { body = { ok: false, description: 'HTTP ' + resp.getResponseCode() }; }
  return body;
}

// ---------- НП: створення реєстру і друк ----------

function bot_npCreateScanSheet_(refs) {
  var data = bot_npCall_('ScanSheet', 'insertDocuments', { DocumentRefs: refs });
  var d = data[0] || {};
  var okList = (d.Data && d.Data.Success) || d.Success || [];
  var errList = (d.Data && d.Data.Errors) || d.Errors || [];
  return { ref: d.Ref || d.ScanSheetRef || '', no: d.Number || '', ok: okList, errors: errList, raw: d };
}

function bot_npDownloadMarking_(ttns) {
  var key = bot_prop(BOT_PROP.NP_KEY);
  var resp = UrlFetchApp.fetch(bot_regPrintUrl(ttns, key), { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error('НП не віддала PDF маркування (HTTP ' + resp.getResponseCode() + ')');
  var blob = resp.getBlob();
  var head = String.fromCharCode.apply(null, blob.getBytes().slice(0, 4).map(function (b) { return b & 255; }));
  if (head !== '%PDF') throw new Error('НП віддала не PDF (імовірно, помилка ключа або ТТН)');
  return blob;
}

// ---------- запуск ----------

function bot_regCaption_(reg, now) {
  return 'Реєстр №' + reg.no + ' · ' + reg.count + ' ТТН · ' + bot_fmtDM(now);
}

function bot_regThread_() {
  return { chat: bot_setting('GROUP_CHAT_ID'), thread: bot_setting('REPORT_THREAD_ID') };
}

function bot_regSend_(reg, ttns, nos, now) {
  var dest = bot_regThread_();
  if (!dest.chat || dest.thread === '') throw new Error('не задано гілку «Реєстри» (/bind registry)');
  var name = bot_regFileName(nos), res;
  if (reg.fileId) res = bot_sendDocument(dest.chat, dest.thread, reg.fileId, bot_regCaption_(reg, now));
  else {
    var blob = bot_npDownloadMarking_(ttns).setName(name);
    res = bot_sendDocument(dest.chat, dest.thread, blob, bot_regCaption_(reg, now));
  }
  if (!res.ok) throw new Error('Telegram: ' + res.description);
  var fid = res.result && res.result.document && res.result.document.file_id;
  bot_regWrite_(reg._row, { status: 'Надіслано', fileId: fid || reg.fileId || '' });
  return fid;
}

/** Номери замовлень (для назви файлу) за списком ТТН: усі нескасовані замовлення цих ТТН. */
function bot_regOrderNos_(ttns) {
  var set = {}; ttns.forEach(function (t) { set[t] = true; });
  var nos = [];
  bot_readOrders().forEach(function (o) { if (set[o.ttn] && o.status !== 'Скасовано' && o.no) nos.push(Number(o.no)); });
  return nos;
}

/**
 * Основний запуск. opts: {manual:true — запит власника}.
 * @return {done:boolean, text?:повідомлення для власника (ручний запуск)}; scheduled → тиша, якщо немає ТТН.
 */
function bot_registryRun(opts) {
  opts = opts || {};
  var now = new Date(), today = bot_dayKey(now);
  if (!bot_npLive()) return { done: true, text: 'Режим перевірки: реєстр не створюю (це запис у НП). Після <code>/live</code> — працюватиму.' };
  var regs = bot_readRegistries();
  var todays = regs.filter(function (r) { return r.date && bot_dayKey(r.date) === today && r.status !== 'Помилка'; })[0];
  var pending = regs.filter(function (r) { return r.status === 'Створено'; })[0];       // створено в НП, але PDF ще не надіслано
  if (todays && todays.status === 'Надіслано') {
    if (!opts.manual) return { done: true };
    var tt = todays.ttns.split(/[,\s]+/).filter(Boolean);
    bot_regSend_(todays, tt, bot_regOrderNos_(tt), now);
    return { done: true, text: '🔁 Реєстр №' + bot_esc(todays.no) + ' сьогодні вже є — перевідправив той самий PDF.' };
  }
  var reg = pending, ttns, nos;
  var sel = null;
  if (!reg) {
    sel = bot_withLock(function () { return bot_regSelect(bot_readTtnRows(), bot_readOrders(), bot_descFromOrder()); });
    if (sel.excluded.length) {
      var lines = sel.excluded.map(function (x) { return bot_code(x.ttn) + ' (№' + bot_esc(x.orders) + ') — ' + bot_esc(x.reason); });
      bot_sendToOwners('⚠️ До реєстру не ввійшли (перейдуть у наступний, коли вирішите):\n' + lines.join('\n'));
    }
    if (!sel.include.length) return { done: true, text: opts.manual ? 'Немає ТТН для реєстру.' : '' };
    var refs = [], ref2ttn = {};
    for (var i = 0; i < sel.include.length; i++) {
      var r = sel.include[i], ref = r.npRef;
      if (!ref) { var doc = bot_npGetDoc(r.ttn); ref = doc && doc.Ref; }
      if (!ref) { sel.excluded.push({ ttn: r.ttn, orders: r.orders, reason: 'НП не знайшла ТТН' }); continue; }
      refs.push(ref); ref2ttn[ref] = r;
    }
    if (!refs.length) return { done: true, text: opts.manual ? 'НП не знайшла жодної ТТН.' : '' };
    var created = bot_npCreateScanSheet_(refs);
    var okRefs = created.ok.map(function (x) { return x.Ref || x; });
    var failed = created.errors.map(function (x) { return (x.Number || x.Ref || '') + ' ' + (x.Error || x.Message || JSON.stringify(x)); });
    if (!okRefs.length && !created.ref) throw new Error('НП не створила реєстр: ' + (failed.join('; ') || JSON.stringify(created.raw).slice(0, 300)));
    var used = (okRefs.length ? okRefs : refs).map(function (rf) { return ref2ttn[rf]; }).filter(Boolean);
    ttns = used.map(function (u) { return u.ttn; });
    nos = bot_regOrderNos_(ttns);
    if (failed.length) bot_sendToOwners('⚠️ НП не додала в реєстр: ' + bot_esc(failed.join('; ')) + ' — ці ТТН залишились на наступний раз.');
    reg = { date: now, no: created.no, ref: created.ref, range: bot_regRange(nos), count: ttns.length, status: 'Створено', ttns: ttns.join(', ') };
    reg._row = bot_regWrite_(null, reg);
    bot_ttnPatch(used.map(function (u) { return { row: u._row, fields: { registry: created.no } }; }));
  } else {
    ttns = reg.ttns.split(/[,\s]+/).filter(Boolean);
    nos = bot_regOrderNos_(ttns);
  }
  bot_regSend_(reg, ttns, nos, now);
  bot_log('ІНФО', 'реєстр', '№' + reg.no + ' · ' + reg.count + ' ТТН · ' + bot_regRange(nos));
  return { done: true, text: opts.manual ? '✅ Реєстр №' + bot_esc(reg.no) + ' (' + reg.count + ' ТТН) надіслано в гілку «Реєстри».' : '' };
}

/** /registry preview — що ввійде, нічого не створюючи. */
function bot_registryPreview(chatId) {
  var sel = bot_regSelect(bot_readTtnRows(), bot_readOrders(), bot_descFromOrder());
  var nos = sel.orderNos;
  var t = '📋 <b>Реєстр (попередній перегляд)</b> — нічого не створюю.\nУвійде: <b>' + sel.include.length + '</b> ТТН' + (nos.length ? ' · файл <code>' + bot_regFileName(nos) + '</code>' : '') + '\n' +
    sel.include.map(function (r) { return bot_code(r.ttn) + ' №' + bot_esc(r.orders); }).join('\n');
  if (sel.excluded.length) t += '\n\nНе ввійде:\n' + sel.excluded.map(function (x) { return bot_code(x.ttn) + ' — ' + bot_esc(x.reason); }).join('\n');
  bot_send(chatId, t);
}

function bot_cmdRegistry(chatId, arg) {
  if (String(arg || '').trim().toLowerCase() === 'preview') return bot_registryPreview(chatId);
  bot_send(chatId, 'Сформувати реєстр у НП зараз і надіслати PDF у гілку «Реєстри»? Якщо сьогодні реєстр уже є — лише перевідправлю його.',
    { keyboard: { inline_keyboard: [[{ text: '✅ Так', callback_data: 'regy' }, { text: 'Ні', callback_data: 'regn' }]] } });
}

function bot_registryCallback(parts, ctx) {
  if (parts[0] === 'regn') { bot_edit(ctx.chatId, ctx.msgId, 'Скасовано.'); return bot_answerCb(ctx.cb.id, 'Скасовано'); }
  bot_answerCb(ctx.cb.id, 'Працюю…');
  var r;
  try { r = bot_registryRun({ manual: true }); } catch (e) { r = { text: '❌ ' + bot_esc(bot_scrub(e.message)) }; }
  bot_edit(ctx.chatId, ctx.msgId, r.text || 'Готово.');
}

// ---------- планувальник: 9:45 нагадування, 10:00 реєстр ----------

function bot_registryTick(now, minutes, today) {
  var remindMin = bot_parseTimeSetting_(bot_setting('REMIND_TIME', '09:45'), 585);
  var regMin = bot_parseTimeSetting_(bot_setting('REGISTRY_TIME', '10:00'), 600);
  if (minutes >= remindMin && bot_prop(BOT_PROP.LAST_REMIND_DATE) !== today) {
    bot_setProp(BOT_PROP.LAST_REMIND_DATE, today);
    var bad = bot_readTtnRows().filter(function (r) {
      return !r.registry && (r.status === 'Чекає рішення' || r.status === 'Помилка НП') && bot_ttnOrderNos(r.orders).some(function (n) { return n > bot_descFromOrder(); });
    });
    if (bad.length) {
      bot_sendToOwners('⏰ Через ' + Math.max(regMin - minutes, 0) + ' хв реєстр. Ці ТТН НЕ ввійдуть, доки не вирішите:\n' +
        bad.map(function (r) { return bot_code(r.ttn) + ' №' + bot_esc(r.orders) + ' — ' + bot_esc(r.status) + (r.note ? ': ' + bot_esc(r.note) : ''); }).join('\n') +
        '\n\nСвій текст опису: <code>/setdesc ТТН текст</code>.');
    }
  }
  if (minutes >= regMin && bot_prop(BOT_PROP.LAST_REGISTRY_DATE) !== today) {
    var prog = {};
    try { prog = JSON.parse(bot_prop('REGISTRY_PROGRESS') || '{}'); } catch (e) { prog = {}; }
    if (prog.day !== today) prog = { day: today, fails: 0 };
    try {
      var r = bot_registryRun({});
      if (r.done) bot_setProp(BOT_PROP.LAST_REGISTRY_DATE, today);
    } catch (e) {
      prog.fails++;
      bot_setProp('REGISTRY_PROGRESS', JSON.stringify(prog));
      bot_log('ПОМИЛКА', 'реєстр', 'спроба ' + prog.fails + ': ' + e.message);
      if (prog.fails >= 3) {
        bot_setProp(BOT_PROP.LAST_REGISTRY_DATE, today);
        bot_sendToOwners('❌ Реєстр не вдалося сформувати/надіслати: ' + bot_esc(bot_scrub(e.message)) + '\nПісля виправлення — <code>/registry</code>.');
      }
    }
  }
}
