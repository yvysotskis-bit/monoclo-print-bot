/**
 * Ttn.gs — Модуль A (друга частина): аркуш «ТТН». Одне повідомлення гілки «Замовлення на клієнта» = одна ТТН;
 * зберігаємо повний оригінал і будуємо скорочений опис (Shorten.gs). Запис в НП — NpDesc.gs, реєстр — Registry.gs.
 * Працює ЛИШЕ з повідомленнями гілки «Замовлення на клієнта»: інших ТТН у цьому аркуші просто не буває.
 */

function bot_descMode() { return String(bot_setting('DESC_MODE', 'повний')).toLowerCase().indexOf('драб') === 0 ? 'ladder' : 'full'; }
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

/** Ключ повідомлення без суфікса «#N» (для 2-го й далі замовлення в повідомленні). */
function bot_baseMsgKey_(k) { return String(k || '').split('#')[0].split('.')[0]; }

/**
 * Чи є докази, що ТТН з рядка «ТТН» справді з гілки «Замовлення на клієнта»: замовлення з msgId у «Замовлення» з цією ТТН,
 * або сам рядок створено з повідомлення гілки, де ця ТТН є. Знятий рядок доказів не має.
 */
function bot_ttnThreadEvidence_(r, orders) {
  if (r.status === 'Знято') return false;
  if (orders.some(function (o) { return o.ttn === r.ttn && o.msgId; })) return true;
  return !!r.msgId && String(r.original).replace(/[\s\u00a0]/g, '').indexOf(r.ttn) >= 0;      // ТТН у повідомленні могла бути записана з пробілами «2045 1556 …»
}

/** Опис, який бот побудував би з тексту повідомлення (поточним форматом): щоб не турбувати власника правками, що опис не міняють (адреса, зайве слово). */
function bot_ttnDescOfCaption_(original, ttn) {
  var g = bot_parseOrderMessage(String(original || '')).filter(function (p) { return p.ttn === ttn; });
  return g.length ? bot_buildDescription(g, bot_descLimit(), bot_descMode()).text : null;
}

/** Замовлення ТТН з таблиці «Замовлення» (нескасовані) у вигляді розібраних — для відновлення опису. */
function bot_ttnListFromOrders_(ttn, orders) {
  return orders.filter(function (o) { return o.ttn === ttn && o.status !== 'Скасовано' && Number(o.no) > 0; })
    .sort(function (a, b) { return a.no - b.no; }).map(bot_orderAsParsed_);
}

/**
 * Після обробки повідомлення гілки: створити / оновити рядок «ТТН» і опис.
 * Ідемпотентно: повторна обробка того самого повідомлення нічого не міняє.
 */
function bot_ttnSync(msg, caption, list, edited) {
  var groups = {};
  list.forEach(function (p) { if (p.ttn && bot_isTtn(p.ttn)) (groups[p.ttn] = groups[p.ttn] || []).push(p); });
  var fromNo = bot_descFromOrder(), limit = bot_descLimit(), mid = String(msg.message_id);
  var link = bot_ttnLink_(msg), linkTxt = link ? '\n<a href="' + link + '">Відкрити повідомлення</a>' : '';

  // ТТН, яку з повідомлення прибрали або замінили редагуванням: її рядок «знімаємо» (інакше вона піде в НП і в реєстр).
  // Але якщо цю ТТН ще несуть замовлення з ІНШИХ повідомлень — рядок не знімаємо, а перераховуємо з них.
  if (edited) {
    var ordersT = bot_readOrders();
    bot_readTtnRows().forEach(function (r) {
      if (groups[r.ttn] || r.status === 'Знято') return;
      var own = bot_baseMsgKey_(r.msgId) === mid, rowNos = bot_ttnOrderNos(r.orders);
      if (!own && !list.some(function (p) { return rowNos.indexOf(p.no) >= 0 && p.ttn !== r.ttn; })) return;
      if (r.registry) { if (own) bot_log('ІНФО', 'ТТН ' + r.ttn, 'прибрано з повідомлення, але вже в реєстрі ' + r.registry + ' — не чіпаю'); return; }
      var others = ordersT.filter(function (o) { return o.ttn === r.ttn && o.status !== 'Скасовано' && Number(o.no) > 0 && bot_baseMsgKey_(o.msgId) !== mid; });
      if (others.length) {
        var left = others.sort(function (a, b) { return a.no - b.no; }).map(bot_orderAsParsed_);
        var firstWithMsg = others.filter(function (o) { return o.msgId; })[0];
        bot_ttnRebuild_(r, left, 'ℹ змінено повідомлення', linkTxt, own && firstWithMsg ? { msgId: bot_baseMsgKey_(firstWithMsg.msgId) } : null);
        return;
      }
      if (!own) return;
      bot_ttnPatch([{ row: r._row, fields: { status: 'Знято', note: 'ТТН прибрано/замінено в повідомленні' } }]);
      bot_sendToOwners('ℹ️ ТТН ' + bot_code(r.ttn) + ' більше немає в повідомленні (змінена чи прибрана) — знято з черги опису й реєстру.' +
        (r.status === 'Записано в НП' ? '\n⚠️ Опис у НП для неї вже було записано — за потреби поправте в кабінеті НП.' : '') + linkTxt);
    });
  }

  Object.keys(groups).forEach(function (ttn) {
    var g = groups[ttn];
    if (!g.some(function (p) { return p.no > fromNo; })) return;                     // старі замовлення бот не чіпає
    var d = bot_buildDescription(g, limit, bot_descMode());
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
    var sameMsg = bot_baseMsgKey_(ex.msgId) === mid;
    if (!sameMsg) {                                                                  // ТТН уже є з ІНШОГО повідомлення (нове, повтор або редагування)
      if (ex.registry) { if (edited) bot_log('ІНФО', 'ТТН ' + ttn, 'повідомлення змінено, але ТТН уже в реєстрі ' + ex.registry + ' — не чіпаю'); return; }
      var tbl = bot_readOrders(), live = g.filter(function (p) {
        return !tbl.some(function (o) { return o.no === p.no && o.status === 'Скасовано'; });
      });
      if (!live.length) return;
      var known = bot_ttnOrderNos(ex.orders), fresh = live.filter(function (p) { return known.indexOf(p.no) < 0; });
      if (!edited && !fresh.length && ex.status !== 'Знято') return;                 // повтор без нових замовлень
      var nosLive = live.map(function (p) { return p.no; });
      var all = bot_ttnListFromOrders_(ttn, tbl).filter(function (x) { return nosLive.indexOf(x.no) < 0; }).concat(live);
      all.sort(function (a, b) { return a.no - b.no; });
      var rev = ex.status === 'Знято' ? { msgId: mid, original: caption } : null;
      bot_ttnRebuild_(ex, all, rev ? 'ℹ відновлено новим повідомленням' : 'ℹ об\'єднано з кількох повідомлень', linkTxt, rev, fresh.map(function (p) { return p.no; }));
      return;
    }
    if (!edited) return;                                                              // повтор того самого повідомлення
    if (ex.registry) {                                                                // ТТН уже в реєстрі — опис у НП остаточний; власника не турбуємо, лише журнал
      if (ex.original !== caption) bot_log('ІНФО', 'ТТН ' + ttn, 'повідомлення змінено, але ТТН уже в реєстрі ' + ex.registry + ' — не чіпаю');
      return;
    }
    var manual = ex.note.indexOf('✏️') === 0;
    var fields = { orders: nos, original: caption };
    if (ex.status === 'Знято') { fields.status = status; fields.note = note; fields.desc = d.text; fields.len = d.len; fields.written = ''; }   // ТТН повернули в повідомлення
    else if (manual) {
      bot_sendToOwners('ℹ️ Повідомлення по ТТН ' + bot_code(ttn) + ' відредаговано, але там стоїть ваш власний текст — не змінюю. Якщо треба автоматичний — <code>/setdesc ' + ttn + ' -</code>.' + linkTxt);
    } else if (ex.desc !== d.text) {
      fields.desc = d.text; fields.len = d.len; fields.status = status; fields.note = note; fields.written = '';
    } else if (ex.status === 'Чекає рішення' && !d.overflow) { fields.status = 'Новий'; fields.note = note; }
    bot_ttnPatch([{ row: ex._row, fields: fields }]);
    if (fields.desc !== undefined && d.overflow) bot_sendToOwners('⚠️ ТТН ' + bot_code(ttn) + ': після редагування опис не влізає в ' + limit + '. <code>/setdesc ' + ttn + ' текст</code>.' + linkTxt);
  });
}

/**
 * Перерахувати рядок «ТТН» зі списку замовлень `left` (усі, що несуть цю ТТН). Поважає: реєстр (не чіпає), свій текст власника (міняє лише номери),
 * заблокований ⛔ (не чіпає — потрібен /retry … force), уже записане в НП (попереджає). Знятий рядок оживляє.
 */
function bot_ttnRebuild_(r, left, why, linkTxt, extra, freshNos) {
  if (r.registry) return;
  var limit = bot_descLimit(), d = bot_buildDescription(left, limit, bot_descMode());
  var orders = left.map(function (p) { return p.no; }).join(', '), revived = r.status === 'Знято';
  var fields = { orders: orders };
  Object.keys(extra || {}).forEach(function (k) { fields[k] = extra[k]; });
  var tag = freshNos && freshNos.length ? ' (додано №' + freshNos.join(', ') + ')' : '';
  if (!revived && r.status === 'Помилка НП' && String(r.note).indexOf('⛔') === 0) {
    bot_ttnPatch([{ row: r._row, fields: fields }]);
    bot_sendToOwners('⚠️ ТТН ' + bot_code(r.ttn) + ': замовлення змінились' + tag + ', але ТТН заблокована (⛔) — опис не чіпаю. Після перевірки: <code>/retry ' + r.ttn + ' force</code>.' + (linkTxt || ''));
    return;
  }
  var manual = !revived && String(r.note).indexOf('✏️') === 0;
  if (!manual && (revived || d.text !== r.desc || orders !== r.orders)) {
    fields.desc = d.text; fields.len = d.len; fields.written = '';
    fields.status = d.overflow ? 'Чекає рішення' : 'Новий';
    fields.note = d.overflow ? '⚠ не влізло в ' + limit + ' символів навіть у номерах' : why;
  }
  if (!revived && orders === r.orders && fields.desc === undefined && Object.keys(fields).length === 1) return;     // нічого не змінилось
  bot_ttnPatch([{ row: r._row, fields: fields }]);
  bot_sendToOwners((revived ? '♻️ ТТН ' + bot_code(r.ttn) + ' знову з\'явилась у повідомленні' : 'ℹ️ ТТН ' + bot_code(r.ttn) + ': склад замовлень змінився') + tag + ' — ' +
    (manual ? 'у вас свій текст, його не міняю (<code>/setdesc ' + r.ttn + ' -</code> — перерахувати)' : 'опис оновлено: <i>' + bot_esc(d.text) + '</i>') +
    (!revived && r.status === 'Записано в НП' && !manual ? '\n⚠️ Попередній опис уже було записано в НП — він буде переписаний.' : '') + (linkTxt || ''));
  if (d.overflow && !manual) bot_sendToOwners('⚠️ ТТН ' + bot_code(r.ttn) + ': опис не влізає в ' + limit + '. <code>/setdesc ' + r.ttn + ' текст</code>.' + (linkTxt || ''));
}

/** Після /cancel: ТТН, де всі замовлення скасовані, знімаємо; де лишились інші — перераховуємо опис (не для «свого тексту» і не для тих, що в реєстрі). */
function bot_ttnAfterCancel(ttns) {
  var orders = bot_readOrders(), rows = bot_readTtnRows(), limit = bot_descLimit();
  ttns.forEach(function (ttn) {
    var r = rows.filter(function (x) { return x.ttn === ttn; })[0];
    if (!r || r.status === 'Знято') return;
    if (r.registry) { bot_sendToOwners('⚠️ Скасоване замовлення з ТТН ' + bot_code(ttn) + ', яка вже в реєстрі №' + bot_esc(r.registry) + ' — опис у НП лишається, перевірте вручну.'); return; }
    var left = bot_ttnListFromOrders_(ttn, orders);
    if (!left.length) { bot_ttnPatch([{ row: r._row, fields: { status: 'Знято', note: 'усі замовлення скасовані' } }]); return; }
    bot_ttnRebuild_(r, left, 'ℹ після скасування замовлення', '');
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


/** Автоматичний опис рядка «ТТН» поточним форматом: з тексту повідомлення + замовлень з таблиці (для ТТН з кількох повідомлень). */
function bot_ttnAutoDesc_(r, orders) {
  var g = bot_parseOrderMessage(r.original).filter(function (p) { return p.ttn === r.ttn; });
  var nos = g.map(function (p) { return p.no; });
  var all = g.concat(bot_ttnListFromOrders_(r.ttn, orders).filter(function (x) { return nos.indexOf(x.no) < 0; }));
  if (!all.length) return null;
  all.sort(function (a, b) { return a.no - b.no; });
  return { list: all, d: bot_buildDescription(all, bot_descLimit(), bot_descMode()) };
}

/**
 * /redesc — перерахувати автоматичні описи ТТН, що ще НЕ в реєстрі, за поточним форматом (напр. після зміни формату).
 *   /redesc          — лише показати, що зміниться (нічого не пише)
 *   /redesc now      — застосувати до всіх таких ТТН (у НП запишу за кілька хвилин, ≤ 6 ТТН за хвилину)
 *   /redesc <ТТН>    — одна ТТН, одразу
 * Не чіпає: ТТН у реєстрі, «Знято», ваш власний текст (✏️), заблоковані ⛔ (для них /retry ТТН force).
 */
function bot_cmdRedesc(chatId, arg) {
  var a = String(arg || '').trim(), now = /^now$/i.test(a), one = a && !now ? bot_normTtn(a) : '';
  if (a && !now && !bot_isTtn(one)) return bot_send(chatId, 'Формат: <code>/redesc</code> (показати), <code>/redesc now</code> (застосувати до всіх), <code>/redesc 20451556067718</code> (одна ТТН).');
  var orders = bot_readOrders(), rows = bot_readTtnRows(), todo = [], skipped = { registry: 0, manual: 0, blocked: 0, same: 0, none: 0 };
  rows.forEach(function (r) {
    if (one && r.ttn !== one) return;
    if (r.status === 'Знято') return;
    if (r.registry) { skipped.registry++; return; }
    if (String(r.note).indexOf('✏️') === 0) { skipped.manual++; return; }
    if (r.status === 'Помилка НП' && String(r.note).indexOf('⛔') === 0) { skipped.blocked++; return; }
    var x = bot_ttnAutoDesc_(r, orders);
    if (!x) { skipped.none++; return; }
    if (x.d.text === r.desc && r.status !== 'Чекає рішення') { skipped.same++; return; }
    todo.push({ r: r, x: x });
  });
  if (one && !rows.some(function (r) { return r.ttn === one; })) return bot_send(chatId, 'Такої ТТН у гілці «Замовлення на клієнта» не бачу.');
  var tail = '\nПропущено: ' + skipped.registry + ' у реєстрі, ' + skipped.manual + ' зі своїм текстом, ' + skipped.blocked + ' заблокованих ⛔, ' + skipped.same + ' уже з потрібним описом' + (skipped.none ? ', ' + skipped.none + ' без даних' : '') + '.';
  if (!todo.length) return bot_send(chatId, 'Нічого оновлювати.' + tail);
  if (!now && !one) {
    var ex = todo.slice(0, 4).map(function (t) { return '• ' + bot_code(t.r.ttn) + '\n  було: <i>' + bot_esc(t.r.desc) + '</i>\n  буде: <i>' + bot_esc(t.x.d.text) + '</i>'; }).join('\n');
    return bot_send(chatId, '🔎 Оновлю опис у <b>' + todo.length + '</b> ТТН (ще не в реєстрі).\n' + ex + (todo.length > 4 ? '\n… і ще ' + (todo.length - 4) : '') + tail + '\n\nЩоб застосувати: <code>/redesc now</code>');
  }
  bot_ttnPatch(todo.map(function (t) {
    return { row: t.r._row, fields: { orders: t.x.list.map(function (p) { return p.no; }).join(', '), desc: t.x.d.text, len: t.x.d.len, status: t.x.d.overflow ? 'Чекає рішення' : 'Новий', note: t.x.d.overflow ? '⚠ не влізло в ' + bot_descLimit() + ' символів навіть у номерах' : '', written: '' } };
  }));
  bot_log('ІНФО', '/redesc', 'оновлено описів: ' + todo.length);
  bot_send(chatId, '✅ Оновив опис у ' + todo.length + ' ТТН.' + (bot_npLive() ? ' У НП запишу за кілька хвилин (не більше 6 ТТН за хвилину; перезапис — лише для ТТН з вашої гілки).' : ' Режим перевірки — в НП нічого не пишу.') + tail);
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
    if (!g.length) g = bot_ttnListFromOrders_(r.ttn, bot_readOrders());          // рядок відновлено з таблиці (оригіналу повідомлення немає)
    if (!g.length) return bot_send(chatId, '⛔ Не можу відновити автоматичний опис: у таблиці «Замовлення» немає замовлень з цією ТТН. Старий текст не змінюю.');
    var d = bot_buildDescription(g, bot_descLimit(), bot_descMode());
    bot_ttnPatch([{ row: r._row, fields: { desc: d.text, len: d.len, status: d.overflow ? 'Чекає рішення' : 'Новий', note: '', written: '' } }]);
    return bot_send(chatId, '↩️ Повернув автоматичний опис: <i>' + bot_esc(d.text) + '</i> (' + d.len + ' симв.)');
  }
  var n = bot_len(text);
  if (n > bot_descLimit()) return bot_send(chatId, '⛔ ' + n + ' символів — максимум ' + bot_descLimit() + '. Скоротіть, будь ласка.');
  bot_ttnPatch([{ row: r._row, fields: { desc: text, len: n, status: 'Новий', note: '✏️ свій текст', written: '' } }]);
  bot_send(chatId, '✏️ Записав у таблицю: <i>' + bot_esc(text) + '</i> (' + n + ' симв.). ' + (bot_npLive() ? 'Запишу в НП за хвилину.' : 'Режим перевірки — покажу в підсумку.'));
}

// ---------- /backfill: ТТН для замовлень, які вже є в таблиці (імпорт з експорту Telegram) ----------

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
    var groups = {}, order = [], noMsg = {};
    bot_readOrders().forEach(function (o) {
      if (!o.ttn || !bot_isTtn(o.ttn) || o.status === 'Скасовано' || !(Number(o.no) > 0)) return;
      if (have[o.ttn]) return;
      if (!o.msgId) { noMsg[o.ttn] = true; return; }                          // не з гілки (внесено вручну) — опис і реєстр для таких не робимо
      if (!groups[o.ttn]) { groups[o.ttn] = []; order.push(o.ttn); }
      groups[o.ttn].push(o);
    });
    var added = [], overflow = [];
    order.forEach(function (ttn) {
      var g = groups[ttn].sort(function (a, b) { return a.no - b.no; });
      if (!g.some(function (o) { return o.no > fromNo; })) return;
      var parsed = g.map(bot_orderAsParsed_);
      var d = bot_buildDescription(parsed, limit, bot_descMode());
      var nos = g.map(function (o) { return o.no; }).join(', ');
      var first = g.filter(function (o) { return o.msgId; })[0];
      bot_ttnAppend({ ttn: ttn, orders: nos, original: '(відновлено з таблиці «Замовлення» — оригінального тексту повідомлення немає)', desc: d.text, len: d.len,
        status: d.overflow ? 'Чекає рішення' : 'Новий', note: (d.overflow ? '⚠ не влізло в ' + limit + ' символів; ' : '') + 'ℹ з таблиці (імпорт)', msgId: first ? first.msgId : '' });
      added.push(ttn);
      if (d.overflow) overflow.push(ttn);
    });
    return { added: added.length, ttns: added, overflow: overflow, skippedNoMsg: Object.keys(noMsg).filter(function (t) { return !groups[t]; }).length };
  });
}

function bot_cmdBackfill(chatId) {
  var r = bot_ttnBackfill();
  if (!r.added) return bot_send(chatId, 'Нових ТТН для опису немає: усі замовлення з номером більше ' + bot_descFromOrder() + ' уже в аркуші «ТТН».');
  bot_send(chatId, '📥 Додав у аркуш «ТТН» <b>' + r.added + '</b> ТТН із замовлень №' + bot_descFromOrder() + '+ (з таблиці). ' +
    (bot_npLive() ? 'Бойовий режим: опис запишу в НП за хвилину.' : 'Режим перевірки: за хвилину надішлю список «ТТН → опис» на перегляд.') +
    (r.skippedNoMsg ? '\nℹ️ Пропущено ТТН без повідомлення в гілці (внесені вручну): ' + r.skippedNoMsg + '.' : '') +
    (r.overflow.length ? '\n⚠️ Не влізли в ' + bot_descLimit() + ' символів: ' + r.overflow.length + ' (потрібен /setdesc).' : ''));
}
