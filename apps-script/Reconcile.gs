/**
 * Reconcile.gs — Модулі 2–3: звірка файлу виробництва, підтвердження оплати, відкат, запис в «Оплати»,
 * архів файлів. Чиста логіка — в ReconcileLogic.gs; тут усе, що торкається Telegram / Google.
 */

var BOT_DECISION_TEXT_ = { table: 'за таблицею', file: 'за файлом', defer: 'відкладено' };
var BOT_DECISION_CODE_ = { 'за таблицею': 'table', 'за файлом': 'file', 'відкладено': 'defer' };
var BOT_ARCHIVE_FOLDER_NAME = 'Монокло — файли виробництва';

// =====================================================================
// Читання файлу
// =====================================================================

function bot_hex_(bytes) {
  return bytes.map(function (b) { return ((b < 0 ? b + 256 : b).toString(16)).replace(/^(.)$/, '0$1'); }).join('');
}

function bot_blobToValues_(blob, name) {
  if (/\.csv$/i.test(name)) {
    var text = blob.getDataAsString('UTF-8');
    var delim = (text.split('\n')[0].indexOf(';') >= 0 && text.split('\n')[0].indexOf(',') < 0) ? ';' : ',';
    return Utilities.parseCsv(text, delim);
  }
  var mime = /\.xls$/i.test(name) ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  var src = blob.copyBlob().setContentType(mime);
  var tmp = Drive.Files.insert({ title: 'tmp-reconcile-' + Date.now(), mimeType: MimeType.GOOGLE_SHEETS }, src, { convert: true });
  try {
    var sheets = SpreadsheetApp.openById(tmp.id).getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getLastRow() > 0) return sheets[i].getDataRange().getValues();
    }
    return [];
  } finally {
    try { Drive.Files.remove(tmp.id); } catch (e) { bot_log('УВАГА', 'не видалився тимчасовий файл', e.message); }
  }
}

// =====================================================================
// Архів файлів (5.5)
// =====================================================================

function bot_archiveFolder_() {
  var id = bot_setting('ARCHIVE_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* створимо нову */ } }
  var parents = DriveApp.getFileById(bot_ss().getId()).getParents();
  var parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var existing = parent.getFoldersByName(BOT_ARCHIVE_FOLDER_NAME);
  var folder = existing.hasNext() ? existing.next() : parent.createFolder(BOT_ARCHIVE_FOLDER_NAME);
  bot_setSetting('ARCHIVE_FOLDER_ID', folder.getId());
  return folder;
}

function bot_archiveFile(blob, reconId, name) {
  var folder = bot_archiveFolder_();
  var safe = String(name).replace(/[\\\/:*?"<>|]/g, '_');
  var file = folder.createFile(blob.copyBlob().setName(bot_dayKey(new Date()) + '_' + reconId + '_' + safe));
  return file.getUrl();
}

// =====================================================================
// Аркуші «Звірки» і «Звірки_деталі»
// =====================================================================

function bot_reconSheet_() { return bot_sheet(BOT_SHEETS.recon); }

function bot_reconList() {
  var sh = bot_reconSheet_();
  var map = bot_headerMap(sh, BOT_RECON_COLS);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  return vals.map(function (r, i) {
    var o = { _row: i + 2 };
    BOT_RECON_COLS.forEach(function (c) { o[c[0]] = r[map[c[0]] - 1]; });
    o.id = String(o.id);
    return o;
  }).filter(function (o) { return o.id; });
}

function bot_reconGet(id) {
  var list = bot_reconList();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function bot_reconPatch(id, fields) {
  var sh = bot_reconSheet_();
  var map = bot_headerMap(sh, BOT_RECON_COLS);
  var rec = bot_reconGet(id);
  if (!rec) throw new Error('Звірку ' + id + ' не знайдено');
  Object.keys(fields).forEach(function (k) { if (map[k]) sh.getRange(rec._row, map[k]).setValue(fields[k]); });
}

function bot_detailRows_(id) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var out = [];
  vals.forEach(function (r, i) {
    if (String(r[map.recon - 1]) !== id) return;
    out.push({ _row: i + 2, ttn: bot_normTtn(r[map.ttn - 1]), decision: BOT_DECISION_CODE_[r[map.decision - 1]] || '', category: r[map.category - 1] });
  });
  return out;
}

function bot_writeDetails_(id, details) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  var width = sh.getLastColumn();
  var start = sh.getLastRow() + 1;
  var rows = details.map(function (d) {
    var arr = []; for (var i = 0; i < width; i++) arr.push('');
    var set = function (k, v) { arr[map[k] - 1] = v; };
    set('recon', id); set('ttn', d.ttn);
    set('orders', d.orders.map(function (o) { return o.no; }).join(', '));
    set('items', d.orders.map(function (o) { return (o.type || 'виріб') + ' ' + o.cost; }).join('; '));
    set('fileSum', d.fileSum); set('tableSum', d.tableSum); set('diff', d.diff); set('fileStatus', d.fileStatus);
    set('category', BOT_CAT_LABEL[d.category]); set('decision', BOT_DECISION_TEXT_[d.decision] || '');
    return arr;
  });
  if (!rows.length) return;
  if (start + rows.length - 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), start + rows.length - sh.getMaxRows() + 100);
  sh.getRange(start, map.ttn, rows.length, 1).setNumberFormat('@');
  sh.getRange(start, 1, rows.length, width).setValues(rows);
}

function bot_setDetailDecision_(id, ttn, decision) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  bot_detailRows_(id).forEach(function (r) {
    if (r.ttn === ttn) sh.getRange(r._row, map.decision).setValue(BOT_DECISION_TEXT_[decision] || '');
  });
}

/** Оновити категорії/суми в «Звірки_деталі» для звірки id (після підтвердження). */
function bot_refreshDetails_(id, details) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  var rows = bot_detailRows_(id);
  var byTtn = {}; details.forEach(function (d) { byTtn[d.ttn] = d; });
  rows.forEach(function (r) {
    var d = byTtn[r.ttn]; if (!d) return;
    sh.getRange(r._row, map.tableSum).setValue(d.tableSum);
    sh.getRange(r._row, map.diff).setValue(d.diff);
    sh.getRange(r._row, map.category).setValue(BOT_CAT_LABEL[d.category]);
  });
}

// =====================================================================
// Побудова / оновлення зведення з поточного стану таблиці
// =====================================================================

function bot_fileRowsFromJson_(json) {
  return JSON.parse(json).map(function (a) {
    return { ttn: a[0], price: a[1], refusal: !!a[2], chatNo: a[3] || null, status: a[4] || '', note: '' };
  });
}

function bot_fileRowsToJson_(rows) {
  return JSON.stringify(rows.map(function (r) { return [r.ttn, r.price, r.refusal ? 1 : 0, r.chatNo || 0, String(r.status || '').slice(0, 24)]; }));
}

/** Перерахувати details для звірки з поточним станом таблиці + збережені рішення. */
function bot_reconDetailsNow_(rec) {
  var fileRows = bot_fileRowsFromJson_(rec.fileData);
  var details = bot_reconcileCompute(fileRows, bot_readOrders(), { priceRows: bot_readPriceRows(), today: new Date() });
  var decisions = {};
  bot_detailRows_(rec.id).forEach(function (r) { if (r.decision) decisions[r.ttn] = r.decision; });
  details.forEach(function (d) { if (decisions[d.ttn] && d.category !== 'DUP' && d.category !== 'MISSING' && d.category !== 'PAID') d.decision = decisions[d.ttn]; });
  return details;
}

function bot_reconMeta_(rec, warning) { return { id: rec.id, fileName: rec.fileName, warning: warning || '' }; }

function bot_refMsg_(rec) {
  var m = String(rec.summaryMsg || '').split(':');
  return m.length === 2 ? { chatId: m[0], msgId: Number(m[1]) } : null;
}

/** Оновити текст і кнопки зведення в Telegram і суму «До оплати» в «Звірках». */
function bot_reconRerender_(rec, details) {
  var S = bot_reconSummary(details);
  bot_reconPatch(rec.id, { toPay: S.pay.sum, diff: S.diffTotal });
  var ref = bot_refMsg_(rec);
  if (ref) bot_edit(ref.chatId, ref.msgId, bot_buildReconSummary(bot_reconMeta_(rec), details), bot_reconKeyboard(bot_reconMeta_(rec), details));
}

// =====================================================================
// Звірка: прийом файлу
// =====================================================================

function bot_onDocument(msg) {
  var chatId = msg.chat.id, doc = msg.document;
  var name = doc.file_name || 'file.xlsx';
  if (!/\.(xlsx|xls|csv)$/i.test(name)) {
    return bot_send(chatId, 'Для звірки надішліть файл Excel (.xlsx, .xls) або .csv. Файл «' + bot_esc(name) + '» не підходить.');
  }
  if (doc.file_size && doc.file_size > 19 * 1024 * 1024) return bot_send(chatId, 'Файл завеликий (понад 20 МБ).');
  bot_send(chatId, '⏳ Отримав «' + bot_esc(name) + '», рахую звірку…');
  var blob = bot_downloadFile(doc.file_id, name);
  bot_reconcileFile(chatId, blob, name);
}

function bot_reconcileFile(chatId, blob, name) {
  var values = bot_blobToValues_(blob, name);
  var parsed = bot_parseProductionFile(values);
  if (parsed.error) return bot_send(chatId, '⚠️ ' + bot_esc(parsed.error));
  if (!parsed.rows.length) return bot_send(chatId, '⚠️ У файлі «' + bot_esc(name) + '» немає жодної ТТН із сумою.');
  var hash = bot_hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, blob.getBytes()));

  var created = bot_withLock(function () {
    var now = new Date();
    var recons = bot_reconList();
    var id = bot_nextReconId(recons.map(function (r) { return r.id; }), now);
    var orders = bot_readOrders();
    var details = bot_reconcileCompute(parsed.rows, orders, { priceRows: bot_readPriceRows(), today: now });
    var S = bot_reconSummary(details);

    // чи не оплачували цей файл / цей набір ТТН раніше
    var confirmed = recons.filter(function (r) { return r.status === 'Підтверджено'; });
    var history = confirmed.map(function (r) { return { id: r.id, date: r.date, hash: String(r.hash), status: r.status, ttns: [] }; });
    if (history.length) {
      var wanted = {}; confirmed.forEach(function (r) { wanted[r.id] = []; });
      var dsh = bot_sheet(BOT_SHEETS.reconDetails); var dmap = bot_headerMap(dsh, BOT_DETAIL_COLS);
      if (dsh.getLastRow() >= 2) {
        dsh.getRange(2, 1, dsh.getLastRow() - 1, dsh.getLastColumn()).getValues().forEach(function (r) {
          var rid = String(r[dmap.recon - 1]); if (wanted[rid]) wanted[rid].push(bot_normTtn(r[dmap.ttn - 1]));
        });
      }
      history.forEach(function (h) { h.ttns = wanted[h.id]; });
    }
    var prev = bot_findPreviousRecon(history, hash, parsed.rows.map(function (r) { return r.ttn; }));
    var warning = prev ? 'Цей файл уже оплачено звіркою ' + prev.id + (prev.date ? ' від ' + bot_fmtDate(new Date(prev.date)) : '') : '';

    var fileUrl = '';
    try { fileUrl = bot_archiveFile(blob, id, name); } catch (e) { bot_log('ПОМИЛКА', 'архів файлу', e.message); }

    var sh = bot_reconSheet_(); var map = bot_headerMap(sh, BOT_RECON_COLS);
    var arr = []; for (var i = 0; i < sh.getLastColumn(); i++) arr.push('');
    var set = function (k, v) { arr[map[k] - 1] = v; };
    set('id', id); set('date', now); set('fileLink', fileUrl); set('hash', hash); set('ttnCount', S.ttnCount);
    set('fileSum', S.fileTotal); set('toPay', S.pay.sum); set('diff', S.diffTotal); set('status', 'Чернетка');
    set('fileName', name); set('fileData', bot_fileRowsToJson_(parsed.rows));
    var row = sh.getLastRow() + 1;
    sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy hh:mm');
    sh.getRange(row, map.hash).setNumberFormat('@');
    sh.getRange(row, 1, 1, arr.length).setValues([arr]);
    bot_writeDetails_(id, details);
    bot_log('ІНФО', 'звірка ' + id, name + ' · ТТН ' + S.ttnCount + ' · до оплати ' + S.pay.sum);
    return { id: id, details: details, warning: warning, fileUrl: fileUrl };
  });

  var meta = { id: created.id, fileName: name, warning: created.warning };
  var res = bot_send(chatId, bot_buildReconSummary(meta, created.details), { keyboard: bot_reconKeyboard(meta, created.details) });
  if (res.ok) bot_reconPatch(created.id, { summaryMsg: chatId + ':' + res.result.message_id });
  if (parsed.skipped.length) {
    bot_send(chatId, '⚠️ Пропущено рядків файлу: ' + parsed.skipped.length + '\n' + parsed.skipped.slice(0, 10).map(function (s) { return 'рядок ' + s.line + ': ' + bot_esc(s.reason); }).join('\n'));
  }
  var diffText = bot_buildDiffMessage(meta, created.details);
  if (diffText) {
    var diffParts = bot_splitText(diffText, 3900);
    diffParts.forEach(function (part, i) {
      bot_send(chatId, part, i === diffParts.length - 1 ? { keyboard: bot_diffKeyboard(meta, created.details, created.fileUrl) } : {});
    });
  }
}

// =====================================================================
// Кнопки звірки
// =====================================================================

function bot_reconCallback(parts, ctx) {
  var act = parts[0], id = parts[1];
  var cbId = ctx.cb.id;
  var rec = bot_reconGet(id);
  if (!rec) return bot_answerCb(cbId, 'Звірку ' + id + ' не знайдено', true);
  var isDraft = rec.status === 'Чернетка';

  switch (act) {
    case 'det': {
      bot_answerCb(cbId);
      var d = bot_reconDetailsNow_(rec);
      return bot_sendMany(ctx.chatId, bot_buildDetailsMessages(bot_reconMeta_(rec), d).concat(rec.fileLink ? ['📁 <a href="' + rec.fileLink + '">Файл у архіві</a> · аркуш «Звірки_деталі», фільтр за ID ' + bot_esc(id)] : []));
    }
    case 'sup': {
      bot_answerCb(cbId);
      return bot_send(ctx.chatId, bot_buildSupplierText(bot_reconMeta_(rec), bot_reconDetailsNow_(rec)));
    }
    case 'cnc': {
      if (!isDraft) return bot_answerCb(cbId, 'Вже ' + String(rec.status).toLowerCase() + ' — скасувати не можна', true);
      bot_withLock(function () { bot_reconPatch(id, { status: 'Скасовано' }); });
      bot_answerCb(cbId, 'Скасовано');
      return bot_edit(ctx.chatId, ctx.msgId, bot_buildReconSummary(bot_reconMeta_(rec), bot_reconDetailsNow_(rec)) + '\n\n✖️ <b>Скасовано</b> — таблиця не змінювалась.');
    }
    case 'dsp': return bot_decisionList_(rec, ctx);
    case 'rs': return bot_decisionTap_(rec, parts, ctx);
    case 'rsy': return bot_decisionApplyFile_(rec, Number(parts[2]), ctx);
    case 'rsn': return bot_decisionShowButtons_(rec, Number(parts[2]), ctx, bot_reconDetailsNow_(rec));
    case 'pay': return bot_payAsk_(rec, ctx);
    case 'payn': bot_answerCb(cbId, 'Ок'); return bot_tgRaw('deleteMessage', { chat_id: ctx.chatId, message_id: ctx.msgId });
    case 'payy': return bot_payConfirm_(rec, ctx);
    case 'opy': return bot_paymentRecord_(rec, Number(parts[2]), ctx);
    case 'opc':
      bot_answerCb(cbId);
      bot_awaitPut(ctx.userId, { kind: 'paySum', id: id });
      return bot_send(ctx.chatId, '✏️ Напишіть суму оплати числом (наприклад, <code>25000</code>).');
    case 'opn': bot_answerCb(cbId, 'Ок'); return bot_edit(ctx.chatId, ctx.msgId, 'Добре, оплату в аркуші «Оплати» внесіть самі.');
    case 'undy': return bot_undoDo_(rec, ctx);
    case 'undn': bot_answerCb(cbId, 'Ок'); return bot_edit(ctx.chatId, ctx.msgId, 'Відкат не виконано.');
  }
}

// ---------- спірні ТТН ----------

function bot_decisionKeyboard_(id, idx, d) {
  return { inline_keyboard: [[
    { text: 'За таблицею ' + bot_fmtNum(d.tableSum), callback_data: 'rs|' + id + '|' + idx + '|t' },
    { text: 'За файлом ' + bot_fmtNum(d.fileSum), callback_data: 'rs|' + id + '|' + idx + '|f' },
    { text: 'Відкласти', callback_data: 'rs|' + id + '|' + idx + '|d' }]] };
}

function bot_decisionText_(d) {
  return '⚖️ ' + bot_code(d.ttn) + '\nфайл ' + bot_fmtNum(d.fileSum) + ' / таблиця ' + bot_fmtNum(d.tableSum) + ' → ' + bot_fmtSigned(d.diff) + '\n' +
    d.orders.map(bot_orderLine_).map(bot_esc).join(' · ') + (d.hint ? '\n' + bot_esc(d.hint) : '') +
    (d.decision ? '\n<b>Рішення: ' + bot_decisionLabel_(d.decision) + '</b>' : '');
}

function bot_decisionList_(rec, ctx) {
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Звірка вже ' + String(rec.status).toLowerCase(), true);
  var details = bot_reconDetailsNow_(rec);
  var list = [];
  details.forEach(function (d, i) { if (d.category === 'MISMATCH' || (d.decision && d.category === 'OK')) list.push({ d: d, i: i }); });
  var mism = list.filter(function (x) { return x.d.category === 'MISMATCH'; });
  if (!mism.length) return bot_answerCb(ctx.cb.id, 'Спірних ТТН немає', true);
  bot_answerCb(ctx.cb.id);
  mism.slice(0, 20).forEach(function (x) {
    bot_send(ctx.chatId, bot_decisionText_(x.d), { keyboard: bot_decisionKeyboard_(rec.id, x.i, x.d) });
  });
  if (mism.length > 20) bot_send(ctx.chatId, 'Показано перші 20 із ' + mism.length + ' спірних ТТН.');
}

function bot_decisionShowButtons_(rec, idx, ctx, details) {
  var d = details[idx];
  bot_answerCb(ctx.cb.id);
  bot_edit(ctx.chatId, ctx.msgId, bot_decisionText_(d), bot_decisionKeyboard_(rec.id, idx, d));
}

function bot_decisionTap_(rec, parts, ctx) {
  var idx = Number(parts[2]), code = parts[3];
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Звірка вже ' + String(rec.status).toLowerCase(), true);
  var details = bot_reconDetailsNow_(rec);
  var d = details[idx];
  if (!d) return bot_answerCb(ctx.cb.id, 'ТТН не знайдено', true);
  if (code === 'f') {
    bot_answerCb(ctx.cb.id);
    return bot_edit(ctx.chatId, ctx.msgId, bot_decisionText_(d) + '\n\nОновити собівартість ТТН з <b>' + bot_fmtNum(d.tableSum) + '</b> на <b>' + bot_fmtNum(d.fileSum) +
      '</b> грн? Стару суму запишу в «Примітку».', { inline_keyboard: [[{ text: '✅ Так, за файлом', callback_data: 'rsy|' + rec.id + '|' + idx }, { text: 'Ні', callback_data: 'rsn|' + rec.id + '|' + idx }]] });
  }
  var dec = code === 't' ? 'table' : 'defer';
  bot_withLock(function () {
    bot_applyDecisionMarks_(rec.id, d, dec);
    bot_setDetailDecision_(rec.id, d.ttn, dec);
  });
  d.decision = dec;
  bot_answerCb(ctx.cb.id, bot_decisionLabel_(dec));
  bot_edit(ctx.chatId, ctx.msgId, bot_decisionText_(d), bot_decisionKeyboard_(rec.id, idx, d));
  bot_reconRerender_(rec, bot_reconDetailsNow_(rec));
}

/** «Відкласти» ставить «Спірна» + примітку; інший вибір знімає цю позначку. */
function bot_applyDecisionMarks_(reconId, d, decision) {
  var tag = 'Спірна, ' + reconId;
  var patches = [];
  var current = bot_readOrders().filter(function (o) { return o.ttn === d.ttn; });
  current.forEach(function (o) {
    var notes = o.note.split('; ').filter(function (s) { return s && s.indexOf('Спірна, ') !== 0; });
    var fields;
    if (decision === 'defer') { notes.push(tag); fields = { paid: 'Спірна', note: notes.join('; ') }; }
    else if (o.paid === 'Спірна') { fields = { paid: 'Не оплачено', note: notes.join('; ') }; }
    if (fields) patches.push({ row: o._row, fields: fields });
  });
  bot_patchOrders(patches);
}

function bot_decisionApplyFile_(rec, idx, ctx) {
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Звірка вже ' + String(rec.status).toLowerCase(), true);
  var details = bot_reconDetailsNow_(rec);
  var d = details[idx];
  bot_withLock(function () {
    var orders = bot_readOrders().filter(function (o) { return o.ttn === d.ttn; });
    if (orders.some(function (o) { return o.paid === 'Оплачено'; })) throw new Error('ТТН уже оплачена — змінювати не можна');
    var plan = bot_planCostUpdate(orders, d.fileSum, rec.id);
    if (Math.abs(plan.oldSum - plan.newSum) > 0.005) {
      bot_patchOrders([{ row: plan.row, fields: { cost: plan.cost, note: plan.note } }].concat(
        orders.filter(function (o) { return o.paid === 'Спірна'; }).map(function (o) { return { row: o._row, fields: { paid: 'Не оплачено' } }; })));
    }
    bot_setDetailDecision_(rec.id, d.ttn, 'file');
  });
  bot_answerCb(ctx.cb.id, 'Собівартість оновлено');
  var fresh = bot_reconDetailsNow_(rec);
  var nd = fresh[idx]; nd.decision = 'file';
  bot_edit(ctx.chatId, ctx.msgId, '⚖️ ' + bot_code(d.ttn) + '\n✅ Рішення: за файлом — собівартість ТТН тепер ' + bot_fmtNum(d.fileSum) + ' грн.');
  bot_reconRerender_(rec, fresh);
}

// ---------- підтвердження оплати ----------

function bot_payAsk_(rec, ctx) {
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Вже ' + String(rec.status).toLowerCase() + (rec.confirmedAt ? ' ' + bot_fmtDateTime(new Date(rec.confirmedAt)) : ''), true);
  var d = bot_reconDetailsNow_(rec);
  var plan = bot_planPayment(d);
  if (!plan.rows.length) return bot_answerCb(ctx.cb.id, 'Нічого оплачувати', true);
  bot_answerCb(ctx.cb.id);
  bot_send(ctx.chatId, '❓ <b>Точно?</b> Буде позначено <b>' + plan.rows.length + '</b> ' + bot_plural(plan.rows.length, 'рядок', 'рядки', 'рядків') + ' на <b>' + bot_fmtMoney(plan.sum) + '</b> (ТТН: ' + plan.ttns.length + ').',
    { keyboard: { inline_keyboard: [[{ text: 'Так, оплатити', callback_data: 'payy|' + rec.id }, { text: 'Ні', callback_data: 'payn|' + rec.id }]] } });
}

function bot_payConfirm_(rec0, ctx) {
  var out = bot_withLock(function () {
    var rec = bot_reconGet(rec0.id);                                  // свіжий стан під блокуванням
    if (rec.status !== 'Чернетка') return { error: 'Вже ' + String(rec.status).toLowerCase() + (rec.confirmedAt ? ' ' + bot_fmtDateTime(new Date(rec.confirmedAt)) : '') };
    if (rec.date && Date.now() - new Date(rec.date).getTime() > 48 * 3600000) return { error: 'Чернетка старша за 48 годин — надішліть файл знову.' };
    var details = bot_reconDetailsNow_(rec);
    var changed = bot_recheckPayable(details, bot_readOrders());
    var plan = bot_planPayment(details);
    if (changed.length || Math.abs(plan.sum - Number(rec.toPay)) > 0.005) {
      return { stale: true, rec: rec, details: details };
    }
    if (!plan.rows.length) return { error: 'Нічого оплачувати' };
    var today = bot_today();
    var patches = plan.rows.map(function (r) { return { row: r, fields: { paid: 'Оплачено', paidDate: today, recon: rec.id } }; });
    bot_patchOrders(patches);
    var now = new Date();
    bot_reconPatch(rec.id, { status: 'Підтверджено', confirmedSum: plan.sum, rowsCount: plan.rows.length, confirmedAt: now, confirmedBy: ctx.userName });
    bot_refreshDetails_(rec.id, details);
    bot_log('ІНФО', 'оплата ' + rec.id, plan.rows.length + ' рядків · ' + plan.sum);
    return { ok: true, rec: rec, plan: plan, now: now, details: details };
  });

  if (out.error) { bot_answerCb(ctx.cb.id, out.error, true); return bot_edit(ctx.chatId, ctx.msgId, '⚠️ ' + bot_esc(out.error)); }
  if (out.stale) {
    bot_answerCb(ctx.cb.id, 'Таблиця змінилась з моменту звірки', true);
    bot_edit(ctx.chatId, ctx.msgId, '⚠️ Таблиця змінилась з моменту звірки — нічого не оплачено. Нижче нове зведення.');
    bot_reconRerender_(out.rec, out.details);
    return;
  }
  bot_answerCb(ctx.cb.id, 'Підтверджено');
  var stamp = '✅ <b>Підтверджено ' + bot_fmtDateTime(out.now) + ' · ' + out.plan.rows.length + ' ' + bot_plural(out.plan.rows.length, 'рядок', 'рядки', 'рядків') + ' · ' + bot_fmtMoney(out.plan.sum) + '</b>';
  var ref = bot_refMsg_(out.rec);
  if (ref) bot_edit(ref.chatId, ref.msgId, bot_buildReconSummary(bot_reconMeta_(out.rec), out.details) + '\n\n' + stamp);
  bot_edit(ctx.chatId, ctx.msgId, stamp);
  bot_send(ctx.chatId, 'Додати оплату <b>' + bot_fmtMoney(out.plan.sum) + '</b> у аркуш «Оплати»?',
    { keyboard: { inline_keyboard: [[
      { text: '✅ Так, ' + bot_fmtMoney(out.plan.sum), callback_data: 'opy|' + out.rec.id + '|' + out.plan.sum },
      { text: '✏️ Інша сума', callback_data: 'opc|' + out.rec.id },
      { text: 'Ні, внесу сам', callback_data: 'opn|' + out.rec.id }]] } });
}

// ---------- запис в «Оплати» (6.4) ----------

function bot_addPaymentRow_(reconId, sum) {
  return bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.payments);
    var map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
    if (!map.recon) {                                              // стара структура без колонки «Звірка»
      var c = sh.getLastColumn() + 1;
      sh.getRange(1, c).setValue('Звірка'); map.recon = c;
    }
    var last = sh.getLastRow();
    var existing = last >= 2 ? sh.getRange(2, map.recon, last - 1, 1).getValues() : [];
    for (var i = 0; i < existing.length; i++) if (String(existing[i][0]) === reconId) return { duplicate: true, row: i + 2 };
    var nos = last >= 2 ? sh.getRange(2, map.no, last - 1, 1).getValues() : [];
    var lastNo = 0, lastRow = 1;
    nos.forEach(function (r, i) { var n = Number(r[0]); if (r[0] !== '' && !isNaN(n)) { lastNo = Math.max(lastNo, n); lastRow = i + 2; } });
    var row = lastRow + 1;
    var width = sh.getLastColumn();
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 50);
    var arr = []; for (var k = 0; k < width; k++) arr.push('');
    arr[map.no - 1] = lastNo + 1; arr[map.date - 1] = bot_today(); arr[map.sum - 1] = sum; arr[map.recon - 1] = reconId;
    sh.getRange(row, 1, 1, width).setValues([arr]);
    sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy');
    if (map.accum) sh.getRange(row, map.accum).setFormula('=SUM($' + bot_colLetter(map.sum) + '$2:' + bot_colLetter(map.sum) + row + ')');
    if (map.cost) sh.getRange(row, map.cost).setFormula("='" + BOT_SHEETS.summary + "'!$A$5");
    if (map.balance && map.cost && map.accum) sh.getRange(row, map.balance).setFormula('=' + bot_colLetter(map.cost) + row + '-' + bot_colLetter(map.accum) + row);
    SpreadsheetApp.flush();
    var balance = map.balance ? sh.getRange(row, map.balance).getValue() : null;
    return { row: row, no: lastNo + 1, balance: balance };
  });
}

function bot_paymentRecord_(rec, sum, ctx) {
  var res = bot_addPaymentRow_(rec.id, sum);
  if (res.duplicate) {
    bot_answerCb(ctx.cb.id, 'Оплату для цієї звірки вже додано', true);
    return bot_edit(ctx.chatId, ctx.msgId, 'ℹ️ Оплату для звірки ' + bot_esc(rec.id) + ' уже додано (рядок ' + res.row + ').');
  }
  bot_answerCb(ctx.cb.id, 'Додано');
  bot_edit(ctx.chatId, ctx.msgId, '✅ Оплату <b>' + bot_fmtMoney(sum) + '</b> додано в «Оплати» (№' + res.no + '). Банк і квитанцію допишіть самі.' +
    (typeof res.balance === 'number' ? '\n💰 Новий борг: <b>' + bot_fmtMoney(res.balance) + '</b>' : ''));
}

function bot_paymentCustomSum(msg, awaiting) {
  var sum = bot_toNumber(msg.text);
  if (sum === null || sum <= 0) {
    bot_awaitPut(msg.from.id, awaiting);
    return bot_send(msg.chat.id, 'Не зрозумів суму. Напишіть число, наприклад <code>25000</code>.');
  }
  var rec = bot_reconGet(awaiting.id);
  if (!rec) return bot_send(msg.chat.id, 'Звірку не знайдено.');
  var res = bot_addPaymentRow_(rec.id, sum);
  if (res.duplicate) return bot_send(msg.chat.id, 'ℹ️ Оплату для звірки ' + bot_esc(rec.id) + ' уже додано (рядок ' + res.row + ').');
  bot_send(msg.chat.id, '✅ Оплату <b>' + bot_fmtMoney(sum) + '</b> додано в «Оплати» (№' + res.no + ').' +
    (typeof res.balance === 'number' ? '\n💰 Новий борг: <b>' + bot_fmtMoney(res.balance) + '</b>' : ''));
}

// =====================================================================
// Команди: /history /undo /disputes /files
// =====================================================================

function bot_cmdHistory(chatId) {
  var list = bot_reconList().slice(-10).reverse();
  if (!list.length) return bot_send(chatId, 'Звірок ще не було.');
  bot_send(chatId, '🗂 <b>Останні звірки</b>\n' + list.map(function (r) {
    return '• <code>' + bot_esc(r.id) + '</code> · ' + bot_esc(r.fileName) + ' · ' + bot_esc(r.status) + ' · ' +
      bot_fmtMoney(r.status === 'Підтверджено' ? Number(r.confirmedSum) : Number(r.toPay));
  }).join('\n'));
}

function bot_cmdUndo(chatId, arg) {
  var id = String(arg || '').trim();
  if (!id) return bot_send(chatId, 'Напишіть: <code>/undo З-2026-10-07-1</code> (ID дивіться в /history).');
  var rec = bot_reconGet(id);
  if (!rec) return bot_send(chatId, 'Звірки «' + bot_esc(id) + '» немає. Перевірте /history.');
  if (rec.status !== 'Підтверджено') return bot_send(chatId, 'Відкликати можна лише підтверджену звірку (ця: ' + bot_esc(rec.status).toLowerCase() + ').');
  var n = bot_readOrders().filter(function (o) { return o.recon === id; }).length;
  bot_send(chatId, '↩️ Відкликати звірку <b>' + bot_esc(id) + '</b>? З ' + n + ' рядків буде прибрано «Оплачено», дату і ID.',
    { keyboard: { inline_keyboard: [[{ text: 'Так, відкликати', callback_data: 'undy|' + id }, { text: 'Ні', callback_data: 'undn|' + id }]] } });
}

function bot_undoDo_(rec, ctx) {
  var res = bot_withLock(function () {
    var fresh = bot_reconGet(rec.id);
    if (fresh.status !== 'Підтверджено') return { error: 'Звірка вже ' + String(fresh.status).toLowerCase() };
    var rows = bot_readOrders().filter(function (o) { return o.recon === rec.id; });
    bot_patchOrders(rows.map(function (o) { return { row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } }; }));
    bot_reconPatch(rec.id, { status: 'Відкликано' });
    var pay = bot_readPayments().filter(function (p) { return p.recon === rec.id; })[0];
    bot_log('ІНФО', 'undo ' + rec.id, rows.length + ' рядків');
    return { n: rows.length, pay: pay };
  });
  if (res.error) { bot_answerCb(ctx.cb.id, res.error, true); return bot_edit(ctx.chatId, ctx.msgId, '⚠️ ' + bot_esc(res.error)); }
  bot_answerCb(ctx.cb.id, 'Відкликано');
  bot_edit(ctx.chatId, ctx.msgId, '↩️ Звірку <b>' + bot_esc(rec.id) + '</b> відкликано: знято «Оплачено» з ' + res.n + ' рядків.' +
    (res.pay ? '\n⚠️ Рядок оплати №' + res.pay.no + ' (' + bot_fmtMoney(res.pay.sum) + ') в аркуші «Оплати» я не видаляю — гроші вже переказані. Перевірте його.' : ''));
}

function bot_cmdDisputes(chatId) {
  var rows = bot_readOrders().filter(function (o) { return o.paid === 'Спірна'; });
  if (!rows.length) return bot_send(chatId, '✅ Відкладених спірних ТТН немає.');
  var groups = bot_groupByTtn_(rows);
  var total = 0;
  var lines = groups.map(function (g) {
    var sum = bot_sumBy_(g.rows, function (o) { return o.cost; }); total += sum;
    var tag = (g.rows[0].note.match(/Спірна,\s*(З-[\d-]+)/) || [])[1] || '';
    return '• ' + bot_code(g.ttn) + ' · ' + g.rows.map(function (o) { return '№' + o.no; }).join(', ') + ' · ' + bot_fmtMoney(sum) + (tag ? ' · ' + bot_esc(tag) : '');
  });
  bot_sendMany(chatId, bot_splitMessages(['⏸ <b>Відкладені ТТН: ' + groups.length + ' на ' + bot_fmtMoney(total) + '</b>'].concat(lines), 4000));
}

function bot_cmdFiles(chatId) {
  var id = bot_setting('ARCHIVE_FOLDER_ID');
  if (!id) return bot_send(chatId, 'Папка з\'явиться після першої звірки.');
  bot_send(chatId, '📁 <a href="https://drive.google.com/drive/folders/' + id + '">Папка «' + BOT_ARCHIVE_FOLDER_NAME + '»</a> (доступ — лише власнику таблиці).');
}
