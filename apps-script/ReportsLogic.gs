/**
 * ReportsLogic.gs — чиста логіка звітів (розділи 6а, 6б, 7.7): ранковий звіт про невідправлені ТТН,
 * посилки на відділенні, місячний звіт, швидкість виробництва, топ принтів.
 * Без викликів Google — перевіряється в Node.
 */

// ---------- підписи речей ----------

var BOT_COLOR_ADJ_ = { 'Чорний': ['чорна', 'чорне'], 'Білий': ['біла', 'біле'], 'Сірий': ['сіра', 'сіре'] };

/** «Футболка чорна», «Худі чорне з флісом». */
function bot_itemLabel(type, color) {
  var adj = BOT_COLOR_ADJ_[color];
  if (type === 'Футболка') return 'Футболка' + (adj ? ' ' + adj[0] : '');
  if (type === 'Худі фліс') return 'Худі' + (adj ? ' ' + adj[1] : '') + ' з флісом';
  if (type === 'Худі не утеплене') return 'Худі' + (adj ? ' ' + adj[1] : '') + ' без флісу';
  return [type, color].filter(Boolean).join(' ');
}

function bot_plural(n, one, few, many) {
  var m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function bot_orderItemLine_(o) {
  return '№' + o.no + ' — ' + bot_esc(o.print) + ' · ' + bot_esc(bot_itemLabel(o.type, o.color)) + (o.size ? ' · ' + bot_esc(o.size) : '');
}

function bot_groupByTtn_(rows) {
  var map = {}, order = [];
  rows.forEach(function (o) {
    if (!map[o.ttn]) { map[o.ttn] = []; order.push(o.ttn); }
    map[o.ttn].push(o);
  });
  return order.map(function (t) { return { ttn: t, rows: map[t] }; });
}

// ---------- 6а. Ранковий звіт ----------

/** Ключ сортування: від старих до нових (дата створення ТТН → дата замовлення → № з чату). */
function bot_unsentSortKey_(g) {
  var created = null, ordered = null, no = Infinity;
  g.rows.forEach(function (r) {
    if (bot_isDate(r.ttnDate) && (!created || r.ttnDate < created)) created = r.ttnDate;
    if (bot_isDate(r.date) && (!ordered || r.date < ordered)) ordered = r.date;
    var n = Number(r.no); if (!isNaN(n) && n < no) no = n;
  });
  return { created: created, key: created ? created.getTime() : (ordered ? ordered.getTime() : Infinity), no: no };
}

/** @return масив повідомлень (кожне ≤ 4000 символів). */
function bot_buildMorningReport(orders, now, opts) {
  opts = opts || {};
  var warn = opts.warnDays === undefined ? 3 : opts.warnDays;
  var groups = bot_groupByTtn_(orders.filter(function (o) {
    return o.ttn && o.stage === 'Не передана' && o.status === 'В роботі';
  }));
  if (!groups.length) return ['✅ Усі ТТН передані до відправки'];
  groups.forEach(function (g) { g.sort = bot_unsentSortKey_(g); });
  groups.sort(function (a, b) { return (a.sort.key - b.sort.key) || (a.sort.no - b.sort.no); });

  var p = bot_kyivParts(now);
  var head = '📦 <b>Не передані до відправки — ' + groups.length + ' ТТН</b> · ' + BOT_WEEKDAYS_UA_FULL[p.dow] + ', ' + bot_pad2(p.d) + '.' + bot_pad2(p.m);
  var parts = [head];
  groups.forEach(function (g, i) {
    var line = (i + 1) + '. ' + bot_code(g.ttn);
    if (g.sort.created) {
      var days = bot_daysBetween(g.sort.created, now);
      line += ' · створена ' + bot_fmtDM(g.sort.created) + ' · ' + (days >= warn ? '❗️' : '') + (days <= 0 ? 'сьогодні' : days + ' дн.');
    }
    var items = g.rows.slice().sort(function (a, b) { return Number(a.no) - Number(b.no); }).map(bot_orderItemLine_);
    parts.push(line + '\n   ' + items.join('\n   '));
  });
  return bot_splitMessages(parts, 4000);
}

// ---------- 6а.5. Посилки, що застрягли на відділенні ----------

/**
 * @param infoMap {ttn: {arrived:Date|null, payedKeepingFrom:Date|null, name, phone}} — з відповіді API НП
 * @return масив повідомлень або [] якщо нічого показувати
 */
function bot_buildStorageReport(orders, infoMap, now, opts) {
  opts = opts || {};
  var warn = opts.warnDays === undefined ? 4 : opts.warnDays;
  infoMap = infoMap || {};
  var list = [];
  bot_groupByTtn_(orders.filter(function (o) { return o.ttn && o.stage === 'На відділенні' && o.status === 'В роботі'; })).forEach(function (g) {
    var info = infoMap[g.ttn] || {};
    var arrived = info.arrived || g.rows[0].arrived;
    if (!bot_isDate(arrived)) return;
    var days = bot_daysBetween(arrived, now);
    if (days < warn) return;
    list.push({ g: g, info: info, days: days });
  });
  if (!list.length) return [];
  list.sort(function (a, b) { return b.days - a.days; });        // довше чекає — раніше
  var parts = ['🏤 <b>Чекають на відділенні ' + warn + '+ ' + bot_plural(warn, 'день', 'дні', 'днів') + ' — ' + list.length + ' ' +
    bot_plural(list.length, 'посилка', 'посилки', 'посилок') + '</b>'];
  list.forEach(function (x, i) {
    var line = (i + 1) + '. ' + bot_code(x.g.ttn) + ' · на відділенні ' + x.days + ' дн.';
    if (bot_isDate(x.info.payedKeepingFrom)) line += ' · платне зберігання з ' + bot_fmtDM(x.info.payedKeepingFrom);
    var items = x.g.rows.slice().sort(function (a, b) { return Number(a.no) - Number(b.no); }).map(bot_orderItemLine_);
    var txt = line + '\n   ' + items.join('\n   ');
    if (x.info.name || x.info.phone) txt += '\n   ' + bot_esc([x.info.name, x.info.phone].filter(Boolean).join(' · '));
    parts.push(txt);
  });
  return bot_splitMessages(parts, 4000);
}

// ---------- 7.7. Швидкість виробництва ----------

/**
 * Термін по ТТН = день передачі НП − найстаріша дата замовлення в ТТН (календарні дні).
 * Враховуємо лише «В роботі», де є обидві дати. Період — за днем передачі: from ≤ день < to.
 */
function bot_computeSpeed(orders, from, to) {
  var res = { count: 0, avg: null, median: null, pct1: 0, pct2: 0, pct3: 0, longest: null, terms: [] };
  var fromN = from ? bot_dayNum(from) : -Infinity, toN = to ? bot_dayNum(to) : Infinity;
  bot_groupByTtn_(orders.filter(function (o) { return o.ttn && o.status === 'В роботі'; })).forEach(function (g) {
    var handoff = null, ordered = null, firstNo = null;
    g.rows.forEach(function (r) {
      if (bot_isDate(r.handoff) && !handoff) handoff = r.handoff;
      if (bot_isDate(r.date) && (!ordered || r.date < ordered)) { ordered = r.date; firstNo = r.no; }
    });
    if (!handoff || !ordered) return;
    var hn = bot_dayNum(handoff);
    if (hn < fromN || hn >= toN) return;
    var days = Math.max(0, bot_daysBetween(ordered, handoff));
    res.terms.push(days);
    if (!res.longest || days > res.longest.days) res.longest = { no: firstNo, days: days, ttn: g.ttn };
  });
  var n = res.terms.length;
  res.count = n;
  if (!n) return res;
  var sorted = res.terms.slice().sort(function (a, b) { return a - b; });
  var sum = 0; sorted.forEach(function (x) { sum += x; });
  res.avg = Math.round(sum / n * 10) / 10;
  res.median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  res.pct1 = Math.round(sorted.filter(function (d) { return d <= 1; }).length / n * 100);
  res.pct2 = Math.round(sorted.filter(function (d) { return d === 2; }).length / n * 100);
  res.pct3 = Math.round(sorted.filter(function (d) { return d >= 3; }).length / n * 100);
  return res;
}

function bot_fmtDec(n) { return String(Math.round(n * 10) / 10).replace('.', ','); }

// ---------- 6б. Місячний звіт ----------

function bot_parseYm(ym) {
  var m = String(ym || '').match(/^(\d{4})-(\d{1,2})$/);
  if (!m || +m[2] < 1 || +m[2] > 12) return null;
  return { y: +m[1], m: +m[2] };
}

function bot_prevYm(y, m) { return m === 1 ? { y: y - 1, m: 12 } : { y: y, m: m - 1 }; }

function bot_rowMonthDate_(o) { return bot_isDate(o.ttnDate) ? o.ttnDate : (bot_isDate(o.date) ? o.date : null); }

function bot_inMonth_(date, y, m) {
  if (!date) return false;
  var p = bot_kyivParts(date);
  return p.y === y && p.m === m;
}

/** «Принт нижче ДВА» → '' (загальна назва); «Принт Ferar1» → 'ferar1'. */
function bot_printDesign(name) {
  var s = bot_trim(name).toLowerCase().replace(/^принти?\s*[-—:]?\s*/, '');
  var paren = s.match(/\(([^)]+)\)/);
  var core = s.replace(/\(.*?\)/g, '').replace(/два\s+принта|два|принта|принти|принт/g, '').replace(/[^\wа-яіїєґ]+/g, ' ').trim();
  if (/^нижче$/.test(core) || core === '' || /^(як на візуалі|на візуалі|візуал)$/.test(core)) {
    return paren ? paren[1].trim() : '';
  }
  return s.replace(/\s+/g, ' ').trim();
}

function bot_topPrints(rows, n) {
  var cnt = {};
  rows.forEach(function (o) {
    var d = bot_printDesign(o.print);
    if (d) cnt[d] = (cnt[d] || 0) + 1;
  });
  return Object.keys(cnt).map(function (k) { return { name: k, count: cnt[k] }; })
    .sort(function (a, b) { return b.count - a.count || (a.name < b.name ? -1 : 1); }).slice(0, n || 10);
}

/** Цифри за календарний місяць (y, m). payments: [{date, sum}] */
function bot_monthMetrics(orders, payments, y, m) {
  var monthStartN = Math.round(Date.UTC(y, m - 1, 1) / 86400000);
  var nextStartN = Math.round(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1) / 86400000);
  var rows = orders.filter(function (o) { return o.status === 'В роботі' && bot_inMonth_(bot_rowMonthDate_(o), y, m); });
  var byType = { 'Футболка': 0, 'Худі фліс': 0, 'Худі не утеплене': 0 };
  rows.forEach(function (o) { if (byType[o.type] !== undefined) byType[o.type]++; });
  var cost = bot_sumBy_(rows, function (o) { return Number(o.cost) || 0; });
  var paid = bot_sumBy_(payments.filter(function (p) { return bot_inMonth_(p.date, y, m); }), function (p) { return Number(p.sum) || 0; });
  var costToEnd = bot_sumBy_(orders, function (o) {
    var d = bot_rowMonthDate_(o);
    return (!d || bot_dayNum(d) < nextStartN) ? (Number(o.cost) || 0) : 0;
  });
  var paidToEnd = bot_sumBy_(payments, function (p) { return (bot_isDate(p.date) && bot_dayNum(p.date) >= nextStartN) ? 0 : (Number(p.sum) || 0); });
  var refusals = rows.filter(function (o) { return o.stage === 'Відмова'; });
  var finals = rows.filter(function (o) { return o.stage === 'Відмова' || o.stage === 'Отримано'; });
  var speed = bot_computeSpeed(orders, new Date(monthStartN * 86400000 + 12 * 3600000), new Date(nextStartN * 86400000 + 12 * 3600000));
  return {
    y: y, m: m, items: rows.length, byType: byType, cost: cost, paid: paid,
    debtEnd: bot_round2(costToEnd - paidToEnd),
    refusals: refusals.length, refusalsSum: bot_sumBy_(refusals, function (o) { return Number(o.cost) || 0; }),
    refusalPct: finals.length ? Math.round(refusals.length / finals.length * 1000) / 10 : 0,
    top: bot_topPrints(rows, 10), speed: speed
  };
}

function bot_fmtDelta(cur, prev) {
  if (prev === null || prev === undefined) return '';
  if (!prev) return cur ? ' ▲ нове' : '';
  var pct = Math.round((cur - prev) / Math.abs(prev) * 100);
  if (pct === 0) return ' ▬ 0%';
  return ' ' + (pct > 0 ? '▲ +' : '▼ −') + Math.abs(pct) + '%';
}

function bot_buildMonthReport(cur, prev) {
  var L = ['📊 <b>Місячний звіт · ' + BOT_MONTHS_UA[cur.m - 1] + ' ' + cur.y + '</b>', ''];
  L.push('Замовлено виробів: <b>' + cur.items + '</b>' + bot_fmtDelta(cur.items, prev && prev.items));
  L.push('   футболок ' + cur.byType['Футболка'] + ' · худі фліс ' + cur.byType['Худі фліс'] + ' · худі не утеплене ' + cur.byType['Худі не утеплене']);
  L.push('Собівартість: <b>' + bot_fmtMoney(cur.cost) + '</b>' + bot_fmtDelta(cur.cost, prev && prev.cost));
  L.push('Оплачено: <b>' + bot_fmtMoney(cur.paid) + '</b>' + bot_fmtDelta(cur.paid, prev && prev.paid));
  L.push('Борг на кінець місяця: <b>' + bot_fmtMoney(cur.debtEnd) + '</b>' + bot_fmtDelta(cur.debtEnd, prev && prev.debtEnd));
  L.push('Відмови: ' + cur.refusals + ' шт · ' + bot_fmtMoney(cur.refusalsSum) + ' · ' + bot_fmtDec(cur.refusalPct) + '% від посилок з кінцевим статусом' + bot_fmtDelta(cur.refusalPct, prev && prev.refusalPct));
  var s = cur.speed;
  if (s.count) {
    var ps = prev && prev.speed && prev.speed.count ? prev.speed : null;
    var d = ps ? ' (' + (s.avg > ps.avg ? '▲ +' : s.avg < ps.avg ? '▼ −' : '▬ ') + bot_fmtDec(Math.abs(s.avg - ps.avg)) + ')' : '';
    L.push('⚡ Швидкість виробництва: середній термін ' + bot_fmtDec(s.avg) + ' дн' + d + ', медіана ' + bot_fmtDec(s.median) + ' дн');
    L.push('   ≤1 дн: ' + s.pct1 + '% · 2 дні: ' + s.pct2 + '% · 3+ дні: ' + s.pct3 + '% · найдовша: №' + s.longest.no + ' — ' + s.longest.days + ' дн.');
  } else {
    L.push('⚡ Швидкість виробництва: ще немає даних (рахується від замовлень, прийнятих ботом)');
  }
  if (cur.top.length) {
    L.push('\n🏆 <b>Топ-10 принтів</b>');
    cur.top.forEach(function (t, i) { L.push((i + 1) + '. ' + bot_esc(t.name) + ' — ' + t.count); });
  }
  return L.join('\n');
}

/** Рядок для аркуша «Місячні звіти» (порядок = BOT_MONTHLY_COLS). */
function bot_monthlyRow(cur) {
  var s = cur.speed;
  return [cur.y + '-' + bot_pad2(cur.m), cur.items, cur.byType['Футболка'], cur.byType['Худі фліс'], cur.byType['Худі не утеплене'],
    cur.cost, cur.paid, cur.debtEnd, cur.refusals, cur.refusalsSum, cur.refusalPct, s.count ? s.avg : '', s.count ? s.pct1 : ''];
}

/** Блок «Швидкість» для «Підсумків»: поточний місяць і останні 7 днів. */
function bot_speedSummaryBlock(orders, now) {
  var p = bot_kyivParts(now);
  var monthStart = bot_makeDate(p.y, p.m, 1);
  var tomorrow = new Date(bot_makeDate(p.y, p.m, p.d).getTime() + 36 * 3600000);
  var weekStart = new Date(now.getTime() - 6 * 86400000);
  return { month: bot_computeSpeed(orders, monthStart, tomorrow), week: bot_computeSpeed(orders, weekStart, tomorrow) };
}
