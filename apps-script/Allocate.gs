/**
 * Allocate.gs — розподіл оплат на ТТН. Виробництво не присилає платежі «за ТТН», власник вносить суми, які вважає потрібними.
 * Бот пропонує, які ТТН ці суми покривають (за чергою: від старіших до новіших), і ставить «Оплачено» ЛИШЕ після натискання кнопки.
 * Кнопка перераховує розподіл заново (дані могли змінитись) і застосовує його, лише якщо він збігається з тим, що власник бачив.
 * Чиста логіка (bot_planAllocation) — без Google API.
 */

/**
 * Черга: ТТН за датою замовлення, потім за номером. Кожна ТТН покрита, коли накопичена собівартість черги ≤ усіх оплат.
 * Береться те, що ПІСЛЯ зрізу початкового залишку: замовлення > OPENING_ORDERS_AFTER, оплати > OPENING_PAYS_AFTER
 * (раніші оплати вже зменшили початковий залишок — вдруге на ТТН їх не витрачаємо, як і в розрахунку боргу).
 * ТТН зі «Спірною» оплатою пропускається (не покривається і не «з'їдає» гроші).
 * @return {pool, totalCost, covered:[{ttn, rowNums:[], cost, paidDate, no}], coveredCost, alreadyPaid, leftover, nextTtn, nextNeed, sig}
 */
function bot_planAllocation(orders, payments, opening) {
  var cut = opening ? opening.ordersAfter : null, payCut = opening ? (opening.paysAfter || opening.ordersAfter) : null;
  var pays = payments.filter(function (p) { return bot_afterCut_(p.date, payCut) && Number(p.sum) > 0; })
    .sort(function (a, b) { return (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0); });
  var pool = bot_round2(bot_sumBy_(pays, function (p) { return Number(p.sum) || 0; }));
  var groups = {}, list = [];
  orders.forEach(function (o) {
    if (o.status !== 'В роботі' || !o.ttn || !(Number(o.cost) > 0) || !bot_afterCut_(o.date, cut)) return;
    var g = groups[o.ttn];
    if (!g) { g = groups[o.ttn] = { ttn: o.ttn, rows: [], cost: 0, minDate: o.date ? o.date.getTime() : 0, minNo: Number(o.no) || 0 }; list.push(g); }
    g.rows.push(o); g.cost += Number(o.cost) || 0;
    if (o.date && o.date.getTime() < g.minDate) g.minDate = o.date.getTime();
    if ((Number(o.no) || 0) < g.minNo) g.minNo = Number(o.no) || 0;
  });
  list = list.filter(function (g) { return !g.rows.some(function (o) { return o.paid === 'Спірна'; }); });
  list.sort(function (a, b) { return a.minDate - b.minDate || a.minNo - b.minNo; });
  var cum = 0, plan = { pool: pool, totalCost: 0, covered: [], coveredCost: 0, alreadyPaid: 0, leftover: 0, nextTtn: '', nextNeed: 0 };
  var stop = false;
  list.forEach(function (g) {
    plan.totalCost += g.cost;
    if (stop) return;
    cum = bot_round2(cum + g.cost);
    if (cum <= pool + 0.005) {
      plan.coveredCost = cum;
      var pending = g.rows.filter(function (o) { return o.paid === 'Не оплачено'; });
      if (!pending.length) { plan.alreadyPaid++; return; }
      var acc = 0, paidDate = null;                                   // дата платежу, що «закрив» цю ТТН
      for (var i = 0; i < pays.length; i++) { acc += Number(pays[i].sum); if (acc + 0.005 >= cum) { paidDate = pays[i].date; break; } }
      plan.covered.push({ ttn: g.ttn, rowNums: pending.map(function (o) { return o._row; }), cost: g.cost, paidDate: paidDate, no: g.minNo });
    } else { stop = true; plan.nextTtn = g.ttn; plan.nextNeed = bot_round2(cum - pool); }
  });
  plan.leftover = bot_round2(pool - plan.coveredCost);
  plan.sig = bot_allocSig_(plan);
  return plan;
}

/** Підпис розподілу: за ним кнопка перевіряє, що власник підтверджує саме те, що бачив (дані за цей час не змінились). */
function bot_allocSig_(plan) {
  var s = plan.pool + '|' + plan.covered.length + '|' + plan.coveredCost + '|' + plan.covered.map(function (c) { return c.ttn; }).join(',');
  var h = 0;
  for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h) + '.' + plan.covered.length;
}

function bot_allocText(plan, done) {
  var L = [done ? '✅ Позначено оплаченими' : '💳 <b>Розподіл оплат на ТТН</b> (від старіших до новіших)'];
  L.push('Оплат після ' + bot_setting('OPENING_PAYS_AFTER', 'початку') + ': <b>' + bot_fmtMoney(plan.pool) + '</b> · собівартість ТТН з вересня: ' + bot_fmtMoney(plan.totalCost));
  var sum = plan.covered.reduce(function (a, c) { return a + c.cost; }, 0);
  L.push((done ? 'Позначено' : 'Буде позначено') + ' «Оплачено»: <b>' + plan.covered.length + '</b> ТТН на ' + bot_fmtMoney(sum) + (plan.alreadyPaid ? ' (ще ' + plan.alreadyPaid + ' ТТН вже були оплачені)' : ''));
  if (plan.covered.length) {
    var nos = plan.covered.map(function (c) { return c.no; });
    L.push('№ від ' + Math.min.apply(null, nos) + ' до ' + Math.max.apply(null, nos));
  }
  L.push('Залишок оплат, що не покрив наступну ТТН: ' + bot_fmtMoney(plan.leftover) + (plan.nextTtn ? ' (до наступної ТТН ' + plan.nextTtn + ' бракує ' + bot_fmtMoney(plan.nextNeed) + ')' : ''));
  return L.join('\n');
}

/** Застосувати розподіл. @return кількість змінених рядків */
function bot_allocApply(plan, id) {
  return bot_withLock(function () {
    var cur = {}; bot_readOrders().forEach(function (o) { cur[o._row] = o; });
    var patches = [];
    plan.covered.forEach(function (c) {
      c.rowNums.forEach(function (r) {
        if (!cur[r] || cur[r].paid !== 'Не оплачено' || cur[r].status !== 'В роботі') return;       // змінилось, поки чекали кнопку — не чіпаємо
        patches.push({ row: r, fields: { paid: 'Оплачено', paidDate: c.paidDate ? new Date(c.paidDate) : bot_today(), recon: id } });
      });
    });
    bot_patchOrders(patches);
    bot_log('ІНФО', 'розподіл оплат ' + id, 'рядків: ' + patches.length);
    return patches.length;
  });
}

/** /allocate — показати, що покривають внесені суми; «Оплачено» — лише після кнопки. У кнопці — лише підпис (а не всі рядки). */
function bot_cmdAllocate(chatId) {
  var plan = bot_planAllocation(bot_readOrders(), bot_readPayments(), bot_openingFromSettings());
  if (!plan.covered.length) return bot_send(chatId, bot_allocText(plan, false) + '\n\nНових ТТН для позначки немає.');
  var token = bot_pendingPut({ kind: 'alloc', sig: plan.sig });
  bot_send(chatId, bot_allocText(plan, false), { keyboard: { inline_keyboard: [[{ text: '✅ Позначити оплаченими', callback_data: 'aly|' + token }, { text: 'Ні', callback_data: 'aln|' + token }]] } });
}

function bot_allocCallback(parts, ctx) {
  var p = bot_pendingGet(parts[1]);
  if (!p) { bot_answerCb(ctx.cb.id, 'Кнопка застаріла'); return; }
  bot_pendingDrop(parts[1]);
  if (parts[0] === 'aln') { bot_edit(ctx.chatId, ctx.msgId, 'Скасовано, нічого не змінено.'); return bot_answerCb(ctx.cb.id, 'Скасовано'); }
  var res = bot_withLock(function () {                                      // розподіл рахуємо заново під блокуванням і порівнюємо з тим, що бачив власник
    var plan = bot_planAllocation(bot_readOrders(), bot_readPayments(), bot_openingFromSettings());
    if (plan.sig !== p.sig) return { changed: true };
    var kp = bot_kyivParts(new Date());
    var id = 'Розподіл-' + kp.y + bot_pad2(kp.m) + bot_pad2(kp.d) + '-' + bot_pad2(kp.h) + bot_pad2(kp.mi) + bot_pad2(kp.s || 0) + '-' + Utilities.getUuid().slice(0, 3);
    return { n: bot_allocApply(plan, id), id: id, plan: plan };
  });
  if (res.changed) {
    bot_edit(ctx.chatId, ctx.msgId, '⚠️ Дані змінились, поки ви чекали (нова оплата, скасування, зміна суми). Нічого не позначено — напишіть /allocate ще раз.');
    return bot_answerCb(ctx.cb.id, 'Дані змінились');
  }
  bot_edit(ctx.chatId, ctx.msgId, '✅ Позначено оплаченими рядків: ' + res.n + '. Позначка в колонці «Звірка»: <code>' + res.id + '</code>. Скасувати: <code>/undoalloc ' + res.id + '</code>\n\nЗалишок оплат: ' + bot_fmtMoney(res.plan.leftover));
  bot_answerCb(ctx.cb.id, 'Готово');
}

function bot_cmdUndoAlloc(chatId, arg) {
  var id = String(arg || '').trim();
  if (!/^Розподіл-/.test(id)) return bot_send(chatId, 'Формат: <code>/undoalloc Розподіл-20261016-103015-a1b</code> (ID з повідомлення про розподіл).');
  var rows = bot_withLock(function () {
    var list = bot_readOrders().filter(function (o) { return o.recon === id && o.paid === 'Оплачено'; });
    bot_patchOrders(list.map(function (o) { return { row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } }; }));
    return list.length;
  });
  bot_send(chatId, rows ? '↩️ Знято «Оплачено» з ' + rows + ' рядків (' + bot_esc(id) + ').' : 'Рядків з такою позначкою не знайшов.');
}
