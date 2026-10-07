/**
 * ReconcileLogic.gs — чиста логіка звірки (розділи 5 і 6 ТЗ): категорії ТТН, різниці, підказки,
 * тексти повідомлень, розрахунок «До оплати». Жодних викликів Google — перевіряється в Node.
 *
 * Категорії (details[i].category):
 *   OK       ✅ збігається      PAID     🔁 вже оплачено     PARTIAL  ⚠️ частково оплачено
 *   MISMATCH ⚠️ сума різна      MISSING  ❌ немає в таблиці   DUP      ❌ дубль у файлі
 */

var BOT_CAT_LABEL = {
  OK: '✅ Збігається', PAID: '🔁 Вже оплачено', PARTIAL: '⚠️ Частково оплачено',
  MISMATCH: '⚠️ Сума не збігається', MISSING: '❌ Немає в таблиці', DUP: '❌ Дубль у файлі'
};

function bot_sumBy_(arr, fn) { var s = 0; arr.forEach(function (x) { s += fn(x); }); return bot_round2(s); }

/**
 * @param fileRows [{ttn, price, status, note, refusal, chatNo}]  (ТТН вже нормалізовані)
 * @param orders   рядки «Замовлення»: {_row, no, print, type, ttn, cost, status, paid, paidDate, recon, note}
 * @param opts     {priceRows, today}
 */
function bot_reconcileCompute(fileRows, orders, opts) {
  opts = opts || {};
  var byTtn = {}, byNo = {};
  orders.forEach(function (o) {
    if (o.ttn) (byTtn[o.ttn] = byTtn[o.ttn] || []).push(o);
    if (o.no !== '' && o.no !== null && o.no !== undefined) (byNo[o.no] = byNo[o.no] || []).push(o);
  });
  var seen = {};
  return fileRows.map(function (fr) {
    var d = {
      ttn: fr.ttn, fileSum: bot_round2(fr.price), fileStatus: fr.status || '', fileNote: fr.note || '',
      refusal: !!fr.refusal, chatNo: fr.chatNo || null, category: '', tableSum: 0, diff: 0,
      orders: [], rowsCount: 0, paidRecon: '', paidDate: '', hint: '', deferred: '', decision: ''
    };
    if (seen[fr.ttn]) {
      d.category = 'DUP'; d.diff = d.fileSum;
      return d;
    }
    seen[fr.ttn] = true;
    var rows = byTtn[fr.ttn];
    if (!rows || !rows.length) {
      d.category = 'MISSING'; d.diff = d.fileSum;
      if (fr.chatNo && byNo[fr.chatNo]) {
        var o = byNo[fr.chatNo][0];
        d.hint = 'ймовірно: у таблиці №' + o.no + ' має іншу ТТН ' + (o.ttn || '(порожньо)');
      }
      return d;
    }
    d.rowsCount = rows.length;
    d.tableSum = bot_sumBy_(rows, function (r) { return Number(r.cost) || 0; });
    d.orders = rows.map(function (r) { return { no: r.no, print: r.print, type: r.type, cost: Number(r.cost) || 0, row: r._row }; });
    var paid = rows.filter(function (r) { return r.paid === 'Оплачено'; });
    var firstPaid = paid[0];
    var spornaRows = rows.filter(function (r) { return r.paid === 'Спірна'; });
    if (spornaRows.length) {
      var m = String(spornaRows[0].note || '').match(/Спірна,\s*(З-[\d-]+)/);
      d.deferred = m ? m[1] : 'раніше';
    }
    if (paid.length === rows.length) {
      d.category = 'PAID'; d.diff = d.fileSum;
      d.paidRecon = firstPaid.recon || ''; d.paidDate = firstPaid.paidDate || '';
    } else if (paid.length > 0) {
      d.category = 'PARTIAL'; d.diff = bot_round2(d.fileSum - d.tableSum);
      d.paidRecon = firstPaid.recon || ''; d.paidDate = firstPaid.paidDate || '';
    } else if (Math.abs(d.fileSum - d.tableSum) > 0.005) {
      d.category = 'MISMATCH'; d.diff = bot_round2(d.fileSum - d.tableSum);
      d.hint = bot_diffHint(d.diff, d.orders, opts.priceRows || [], opts.today || new Date());
    } else {
      d.category = 'OK';
    }
    return d;
  });
}

// ---------- підказки «ймовірно: …» ----------

function bot_typeLabel_(type) { return String(type || '').split(' ')[0].toLowerCase(); }
function bot_typeGen_(type) { var l = bot_typeLabel_(type); return l === 'футболка' ? 'футболки' : l; }

/** diff = файл − таблиця; items [{type, cost}] — рядки таблиці. */
function bot_diffHint(diff, items, priceRows, today) {
  if (!diff) return '';
  var abs = Math.abs(diff);
  var current = bot_currentPrices(priceRows, today);
  var typesInItems = {};
  items.forEach(function (i) { typesInItems[i.type] = (typesInItems[i.type] || 0) + 1; });

  // 1) нова ціна з певної дати
  var types = Object.keys(typesInItems);
  for (var t = 0; t < types.length; t++) {
    var type = types[t];
    var cur = bot_priceFor(priceRows, type, today, today);
    var hist = priceRows.filter(function (r) { return r.type === type && r.from; });
    for (var h = 0; h < hist.length; h++) {
      var old = Number(hist[h].price);
      if (old === cur) continue;
      for (var k = 1; k <= typesInItems[type]; k++) {
        if (Math.abs((cur - old) * k - diff) < 0.005 && items.some(function (i) { return i.type === type && i.cost === old; })) {
          var newer = priceRows.filter(function (r) { return r.type === type && Number(r.price) === cur && r.from; })[0];
          return 'ймовірно: нова ціна' + (newer ? ' з ' + bot_fmtDate(newer.from) : '') + ' (' + type + ' ' + bot_fmtNum(old) + ' → ' + bot_fmtNum(cur) + ')';
        }
      }
    }
  }
  // 2) один тип замість іншого
  for (var a = 0; a < current.length; a++) {
    for (var b = 0; b < current.length; b++) {
      var lo = current[a], hi = current[b];
      if (hi.price - lo.price !== abs || bot_typeLabel_(lo.type) === bot_typeLabel_(hi.type)) continue;
      if (diff > 0 && items.some(function (i) { return i.type === lo.type; })) {
        return 'ймовірно: в файлі ' + bot_typeLabel_(hi.type) + ' замість ' + bot_typeGen_(lo.type) + ' (' + bot_fmtNum(hi.price) + ' − ' + bot_fmtNum(lo.price) + ')';
      }
      if (diff < 0 && items.some(function (i) { return i.type === hi.type; })) {
        return 'ймовірно: в файлі ' + bot_typeLabel_(lo.type) + ' замість ' + bot_typeGen_(hi.type) + ' (' + bot_fmtNum(hi.price) + ' − ' + bot_fmtNum(lo.price) + ')';
      }
    }
  }
  // 3) зайвий / відсутній виріб
  for (var c = 0; c < current.length; c++) {
    if (current[c].price === abs) {
      return diff > 0 ? 'ймовірно: у файлі зайвий виріб (' + bot_typeLabel_(current[c].type) + ' ' + bot_fmtNum(abs) + ')'
                      : 'ймовірно: у файлі не вистачає виробу (' + bot_typeLabel_(current[c].type) + ' ' + bot_fmtNum(abs) + ')';
    }
  }
  return '';
}

// ---------- підсумки ----------

/** Чи ТТН входить у «До оплати» з урахуванням рішень по спірних. */
function bot_payAmount(d) {
  if (d.category === 'OK') return d.tableSum;
  if (d.category === 'MISMATCH' && d.decision === 'table') return d.tableSum;
  if (d.category === 'MISMATCH' && d.decision === 'file') return d.fileSum;
  return null;
}

function bot_reconSummary(details) {
  var S = {
    ttnCount: details.length, fileTotal: bot_sumBy_(details, function (d) { return d.fileSum; }),
    pay: { count: 0, sum: 0, rows: 0 }, refusals: { count: 0, sum: 0 },
    cats: { OK: [], PAID: [], PARTIAL: [], MISMATCH: [], MISSING: [], DUP: [] },
    diffTotal: 0, problemCount: 0, deferredReminders: []
  };
  details.forEach(function (d) {
    S.cats[d.category].push(d);
    var amount = bot_payAmount(d);
    if (amount !== null) {
      S.pay.count++; S.pay.sum = bot_round2(S.pay.sum + amount); S.pay.rows += d.rowsCount;
      if (d.refusal) { S.refusals.count++; S.refusals.sum = bot_round2(S.refusals.sum + amount); }
    }
    if (d.category !== 'OK') { S.problemCount++; S.diffTotal = bot_round2(S.diffTotal + d.diff); }
    if (d.deferred) S.deferredReminders.push(d);
  });
  return S;
}

/** Попередня підтверджена звірка з тим самим хешем або тим самим набором ТТН. */
function bot_findPreviousRecon(history, hash, ttns) {
  var key = ttns.slice().sort().join(',');
  for (var i = 0; i < history.length; i++) {
    var h = history[i];
    if (h.status !== 'Підтверджено') continue;
    if ((hash && h.hash === hash) || (h.ttns && h.ttns.slice().sort().join(',') === key)) return h;
  }
  return null;
}

function bot_nextReconId(existingIds, date) {
  var prefix = 'З-' + bot_dayKey(date) + '-';
  var max = 0;
  existingIds.forEach(function (id) {
    if (String(id).indexOf(prefix) === 0) max = Math.max(max, parseInt(String(id).slice(prefix.length), 10) || 0);
  });
  return prefix + (max + 1);
}

// ---------- тексти ----------

function bot_orderLine_(o) { return '№' + o.no + ' ' + (o.type || 'виріб') + ' ' + bot_fmtNum(o.cost); }

/** Розбиває довгий текст по рядках на частини ≤ limit. */
function bot_splitText(text, limit) {
  limit = limit || 4000;
  var out = [], cur = '';
  String(text).split('\n').forEach(function (line) {
    if (cur && cur.length + 1 + line.length > limit) { out.push(cur); cur = line; }
    else cur = cur ? cur + '\n' + line : line;
  });
  if (cur) out.push(cur);
  return out;
}

function bot_splitMessages(parts, limit) {
  limit = limit || 4000;
  var out = [], cur = '';
  parts.forEach(function (p) {
    if (cur && (cur.length + 2 + p.length) > limit) { out.push(cur); cur = p; }
    else cur = cur ? cur + '\n\n' + p : p;
  });
  if (cur) out.push(cur);
  return out;
}

/** Зведення (5.3). meta: {id, fileName, warning}. */
function bot_buildReconSummary(meta, details) {
  var S = bot_reconSummary(details);
  var L = [];
  if (meta.warning) L.push('🔴 <b>' + bot_esc(meta.warning) + '</b>\n');
  L.push('📄 <b>Звірка ' + bot_esc(meta.id) + '</b> · ' + bot_esc(meta.fileName));
  L.push('ТТН у файлі: ' + S.ttnCount + ' · сума файлу: ' + bot_fmtMoney(S.fileTotal));
  L.push('');
  L.push('✅ До оплати: ' + S.pay.count + ' ТТН — ' + bot_fmtMoney(S.pay.sum));
  if (S.refusals.count) L.push('   з них відмов: ' + S.refusals.count + ' — ' + bot_fmtMoney(S.refusals.sum));
  var c = S.cats;
  if (c.PAID.length) L.push('🔁 Вже оплачено: ' + c.PAID.length + ' ТТН — ' + bot_fmtMoney(bot_sumBy_(c.PAID, function (d) { return d.fileSum; })));
  if (c.PARTIAL.length) L.push('⚠️ Частково оплачено: ' + c.PARTIAL.length + ' ТТН — ' + bot_fmtMoney(bot_sumBy_(c.PARTIAL, function (d) { return d.fileSum; })));
  if (c.MISMATCH.length) {
    var undecided = c.MISMATCH.filter(function (d) { return !d.decision; }).length;
    L.push('⚠️ Сума не збігається: ' + c.MISMATCH.length + ' ТТН — файл ' + bot_fmtNum(bot_sumBy_(c.MISMATCH, function (d) { return d.fileSum; })) +
      ' / таблиця ' + bot_fmtNum(bot_sumBy_(c.MISMATCH, function (d) { return d.tableSum; })) +
      (undecided < c.MISMATCH.length ? ' (вирішено: ' + (c.MISMATCH.length - undecided) + ')' : ''));
  }
  if (c.MISSING.length) L.push('❌ Немає в таблиці: ' + c.MISSING.length + ' ТТН — ' + bot_fmtMoney(bot_sumBy_(c.MISSING, function (d) { return d.fileSum; })));
  if (c.DUP.length) L.push('❌ Дубль у файлі: ' + c.DUP.length + ' ТТН — ' + bot_fmtMoney(bot_sumBy_(c.DUP, function (d) { return d.fileSum; })));

  if (!S.problemCount) {
    L.push('\n✅ Розбіжностей немає');
  } else {
    L.push('\n<b>Проблемні ТТН</b> (' + S.problemCount + '):');
    var probs = details.filter(function (d) { return d.category !== 'OK'; });
    probs.slice(0, 30).forEach(function (d) {
      var nos = d.orders.length ? d.orders.map(function (o) { return '№' + o.no; }).join(', ') + ' · ' + bot_esc(d.orders[0].print || '') : 'немає в таблиці';
      var sums = d.category === 'MISMATCH' || d.category === 'PARTIAL'
        ? 'файл ' + bot_fmtNum(d.fileSum) + ' / таблиця ' + bot_fmtNum(d.tableSum) : bot_fmtMoney(d.fileSum);
      L.push(bot_catIcon_(d.category) + ' ' + bot_code(d.ttn) + ' · ' + nos + ' · ' + sums + (d.decision ? ' · рішення: ' + bot_decisionLabel_(d.decision) : ''));
    });
    if (probs.length > 30) L.push('… ще ' + (probs.length - 30) + '. Повний список — аркуш «Звірки_деталі», фільтр за ID ' + bot_esc(meta.id));
  }
  S.deferredReminders.filter(function (d) { return d.deferred !== meta.id; }).forEach(function (d) {
    L.push('🔔 ' + bot_code(d.ttn) + ' — раніше відкладено у ' + bot_esc(d.deferred));
  });
  return L.join('\n');
}

function bot_catIcon_(cat) {
  return { OK: '✅', PAID: '🔁', PARTIAL: '⚠️', MISMATCH: '⚠️', MISSING: '❌', DUP: '❌' }[cat];
}

function bot_decisionLabel_(dec) {
  return { table: 'за таблицею', file: 'за файлом', defer: 'відкладено' }[dec] || '';
}

function bot_reconKeyboard(meta, details) {
  var S = bot_reconSummary(details);
  var rows = [];
  var first = [];
  if (S.pay.sum > 0) first.push({ text: '✅ Оплатити ' + bot_fmtMoney(S.pay.sum), callback_data: 'pay|' + meta.id });
  rows.push(first.length ? first : []);
  var second = [{ text: '📋 Деталі', callback_data: 'det|' + meta.id }, { text: '✖️ Скасувати', callback_data: 'cnc|' + meta.id }];
  rows.push(second);
  if (S.cats.MISMATCH.length) rows.push([{ text: '➕ Врахувати спірні', callback_data: 'dsp|' + meta.id }]);
  return { inline_keyboard: rows.filter(function (r) { return r.length; }) };
}

/** Друге повідомлення — лише розбіжності (5.4). null, якщо розбіжностей немає. */
function bot_buildDiffMessage(meta, details) {
  var S = bot_reconSummary(details);
  var c = S.cats;
  if (!(c.MISMATCH.length || c.PARTIAL.length || c.MISSING.length || c.PAID.length || c.DUP.length)) return null;
  var L = ['⚠️ <b>Розбіжності · ' + bot_esc(meta.id) + ' · ' + bot_esc(meta.fileName) + '</b>'];
  var total = S.diffTotal;
  L.push(total >= 0 ? 'Виробництво виставило на ' + bot_fmtMoney(total) + ' більше, ніж по таблиці'
                    : 'Виробництво виставило на ' + bot_fmtMoney(-total) + ' менше, ніж по таблиці');
  if (c.MISMATCH.length) {
    L.push('\n<b>Сума не збігається (' + c.MISMATCH.length + '):</b>');
    c.MISMATCH.forEach(function (d) {
      L.push('• ' + bot_code(d.ttn) + ' — файл ' + bot_fmtNum(d.fileSum) + ' / таблиця ' + bot_fmtNum(d.tableSum) + ' → ' + bot_fmtSigned(d.diff));
      L.push('  ' + d.orders.map(bot_orderLine_).map(bot_esc).join(' · '));
      if (d.hint) L.push('  ' + bot_esc(d.hint));
    });
  }
  if (c.PARTIAL.length) {
    L.push('\n<b>Частково оплачено (' + c.PARTIAL.length + '):</b>');
    c.PARTIAL.forEach(function (d) {
      L.push('• ' + bot_code(d.ttn) + ' — файл ' + bot_fmtNum(d.fileSum) + ' / таблиця ' + bot_fmtNum(d.tableSum) + ' → ' + bot_fmtSigned(d.diff));
      L.push('  ' + d.orders.map(bot_orderLine_).map(bot_esc).join(' · '));
      L.push('  частину рядків уже оплачено' + (d.paidRecon ? ' (' + bot_esc(d.paidRecon) + ')' : '') + ' — виправте в таблиці вручну і надішліть файл знову');
    });
  }
  if (c.PAID.length) {
    L.push('\n<b>Вже оплачено раніше (' + c.PAID.length + '):</b>');
    c.PAID.forEach(function (d) {
      L.push('• ' + bot_code(d.ttn) + ' — ' + bot_fmtMoney(d.fileSum) + ' · оплачено ' + bot_esc(d.paidRecon || 'раніше') + ' → ' + bot_fmtSigned(d.diff));
    });
  }
  if (c.MISSING.length) {
    L.push('\n<b>Немає в таблиці (' + c.MISSING.length + '):</b>');
    c.MISSING.forEach(function (d) {
      L.push('• ' + bot_code(d.ttn) + ' — ' + bot_fmtMoney(d.fileSum) + ' → ' + bot_fmtSigned(d.diff) + (d.hint ? '\n  ' + bot_esc(d.hint) : ''));
    });
  }
  if (c.DUP.length) {
    L.push('\n<b>Дубль у файлі (' + c.DUP.length + '):</b>');
    c.DUP.forEach(function (d) { L.push('• ' + bot_code(d.ttn) + ' — ' + bot_fmtMoney(d.fileSum) + ' → ' + bot_fmtSigned(d.diff)); });
  }
  L.push('\n<b>Разом різниця: ' + bot_fmtSigned(total) + '</b>');
  return L.join('\n');
}

function bot_diffKeyboard(meta, details, fileUrl) {
  var S = bot_reconSummary(details);
  var rows = [[{ text: '📤 Текст для виробництва', callback_data: 'sup|' + meta.id }]];
  if (S.cats.MISMATCH.length) rows[0].push({ text: '⚖️ Вирішити по кожній ТТН', callback_data: 'dsp|' + meta.id });
  if (fileUrl) rows.push([{ text: '📁 Файл', url: fileUrl }]);
  return { inline_keyboard: rows };
}

/** Нейтральний текст для пересилання виробництву (без ID звірок і підказок). */
function bot_buildSupplierText(meta, details) {
  var S = bot_reconSummary(details);
  var c = S.cats;
  var L = ['У файлі ' + meta.fileName + ' не сходяться:'];
  c.MISMATCH.forEach(function (d) {
    L.push('• ' + bot_code(d.ttn) + ' — у вас ' + bot_fmtNum(d.fileSum) + ', у нас ' + bot_fmtNum(d.tableSum) +
      ' (' + d.orders.map(function (o) { return '№' + o.no; }).join(', ') + ')');
  });
  c.PARTIAL.forEach(function (d) {
    L.push('• ' + bot_code(d.ttn) + ' — у вас ' + bot_fmtNum(d.fileSum) + ', у нас ' + bot_fmtNum(d.tableSum) + ', частину вже оплачено');
  });
  c.PAID.forEach(function (d) { L.push('• ' + bot_code(d.ttn) + ' — ' + bot_fmtNum(d.fileSum) + ', вже оплачено раніше'); });
  c.MISSING.forEach(function (d) { L.push('• ' + bot_code(d.ttn) + ' — ' + bot_fmtNum(d.fileSum) + ', у нас такої ТТН немає'); });
  c.DUP.forEach(function (d) { L.push('• ' + bot_code(d.ttn) + ' — вказана у файлі двічі'); });
  L.push('Перевірте, будь ласка.');
  return L.join('\n');
}

/** «Деталі»: список проблемних ТТН (без обмеження 30), розбитий на повідомлення. */
function bot_buildDetailsMessages(meta, details) {
  var probs = details.filter(function (d) { return d.category !== 'OK'; });
  if (!probs.length) return ['✅ Усі ТТН збігаються, розбіжностей немає.'];
  var parts = ['📋 <b>Деталі · ' + bot_esc(meta.id) + '</b> · проблемних ТТН: ' + probs.length];
  probs.forEach(function (d) {
    var s = bot_catIcon_(d.category) + ' ' + bot_code(d.ttn) + ' — ' + BOT_CAT_LABEL[d.category].replace(/^\S+\s/, '') + '\n   файл ' + bot_fmtNum(d.fileSum) + ' / таблиця ' + bot_fmtNum(d.tableSum) + ' → ' + bot_fmtSigned(d.diff);
    if (d.orders.length) s += '\n   ' + d.orders.map(bot_orderLine_).map(bot_esc).join(' · ');
    if (d.hint) s += '\n   ' + bot_esc(d.hint);
    parts.push(s);
  });
  return bot_splitMessages(parts, 3900);
}

// ---------- оплата ----------

/** Що саме буде позначено «Оплачено». */
function bot_planPayment(details) {
  var ttns = [], rows = [], sum = 0;
  details.forEach(function (d) {
    var amount = bot_payAmount(d);
    if (amount === null) return;
    ttns.push(d.ttn); sum = bot_round2(sum + amount);
    d.orders.forEach(function (o) { rows.push(o.row); });
  });
  return { ttns: ttns, rows: rows, sum: sum };
}

/**
 * Перевірка перед підтвердженням (6.2.3): жодна з ТТН не стала «Оплачено» і сума не змінилась.
 * @return список ТТН, що змінилися (порожній — усе гаразд)
 */
function bot_recheckPayable(details, freshOrders) {
  var byTtn = {};
  freshOrders.forEach(function (o) { if (o.ttn) (byTtn[o.ttn] = byTtn[o.ttn] || []).push(o); });
  var changed = [];
  details.forEach(function (d) {
    if (bot_payAmount(d) === null) return;
    var rows = byTtn[d.ttn] || [];
    var sum = bot_sumBy_(rows, function (r) { return Number(r.cost) || 0; });
    var anyPaid = rows.some(function (r) { return r.paid === 'Оплачено'; });
    var expected = d.decision === 'file' ? d.fileSum : d.tableSum;
    if (anyPaid || rows.length !== d.rowsCount || Math.abs(sum - expected) > 0.005) changed.push(d.ttn);
  });
  return changed;
}

/** Зміна собівартості «за файлом»: різницю кладемо на перший рядок з ціною, стару суму — у примітку. */
function bot_planCostUpdate(orders, fileSum, reconId) {
  var tableSum = bot_sumBy_(orders, function (o) { return Number(o.cost) || 0; });
  var diff = bot_round2(fileSum - tableSum);
  var target = null;
  orders.forEach(function (o) { if (!target && (Number(o.cost) || 0) > 0) target = o; });
  if (!target) target = orders[0];
  var newCost = bot_round2((Number(target.cost) || 0) + diff);
  if (newCost < 0) newCost = 0;
  var tag = 'Собівартість ТТН змінено за файлом ' + reconId + ': було ' + bot_fmtNum(tableSum) + ' → стало ' + bot_fmtNum(fileSum);
  return { row: target._row, cost: newCost, note: (target.note ? target.note + '; ' : '') + tag, oldSum: tableSum, newSum: fileSum };
}

/** Підсумок боргу: собівартість усього − оплати; неоплачені, але вже доставлені ТТН. */
function bot_computeDebt(orders, payments) {
  var cost = bot_sumBy_(orders, function (o) { return Number(o.cost) || 0; });
  var paid = bot_sumBy_(payments, function (p) { return Number(p.sum) || 0; });
  var groups = {};
  orders.forEach(function (o) {
    if (!o.ttn || o.paid === 'Оплачено' || o.status !== 'В роботі') return;
    if (o.stage !== 'Отримано' && o.stage !== 'Відмова') return;
    (groups[o.ttn] = groups[o.ttn] || []).push(o);
  });
  var keys = Object.keys(groups);
  return {
    cost: cost, paid: paid, debt: bot_round2(cost - paid),
    unpaidDelivered: { count: keys.length, sum: bot_sumBy_(keys, function (k) { return bot_sumBy_(groups[k], function (o) { return Number(o.cost) || 0; }); }) }
  };
}
