/**
 * Allocate.gs — розподіл оплат на ТТН. Виробництво не присилає платежі «за ТТН»: власник вносить суми, які вважає потрібними.
 * Бот пропонує, які ТТН ці суми покривають (за чергою: від старіших до новіших), і ставить «Оплачено» ЛИШЕ після натискання кнопки.
 * Чиста логіка (bot_planAllocation) — без Google API.
 */

/**
 * Черга: ТТН за датою замовлення, потім за номером. Кожна ТТН покрита, коли накопичена собівартість черги ≤ усіх оплат.
 * Береться лише те, що ПІСЛЯ зрізу початкового залишку (замовлення > OPENING_ORDERS_AFTER; оплати > OPENING_ORDERS_AFTER),
 * тобто так само, як «Покриття собівартості» на «Підсумках».
 * @return {pool, totalCost, covered:[{ttn, rowNums:[], cost, paidDate}], coveredCost, alreadyPaid, leftover, nextTtn, nextNeed}
 */
function bot_planAllocation(orders, payments, opening) {
  var cut = opening ? opening.ordersAfter : null;
  var pays = payments.filter(function (p) { return bot_afterCut_(p.date, cut) && Number(p.sum) > 0; })
    .sort(function (a, b) { return (a.date ? a.date.getTime() : 0) - (b.date ? b.date.getTime() : 0); });
  var pool = bot_sumBy_(pays, function (p) { return Number(p.sum) || 0; });
  var groups = {}, list = [];
  orders.forEach(function (o) {
    if (o.status !== 'В роботі' || !o.ttn || !(Number(o.cost) > 0) || !bot_afterCut_(o.date, cut)) return;
    var g = groups[o.ttn];
    if (!g) { g = groups[o.ttn] = { ttn: o.ttn, rows: [], cost: 0, minDate: o.date ? o.date.getTime() : 0, minNo: Number(o.no) || 0 }; list.push(g); }
    g.rows.push(o); g.cost += Number(o.cost) || 0;
    if (o.date && o.date.getTime() < g.minDate) g.minDate = o.date.getTime();
    if ((Number(o.no) || 0) < g.minNo) g.minNo = Number(o.no) || 0;
  });
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
  return plan;
}

function bot_allocText(plan, done) {
  var L = [done ? '✅ Позначено оплаченими' : '💳 <b>Розподіл оплат на ТТН</b> (від старіших до новіших)'];
  L.push('Оплат з вересня: <b>' + bot_fmtMoney(plan.pool) + '</b> · собівартість ТТН з вересня: ' + bot_fmtMoney(plan.totalCost));
  var sum = plan.covered.reduce(function (a, c) { return a + c.cost; }, 0);
  L.push((done ? 'Позначено' : 'Буде позначено') + ' «Оплачено»: <b>' + plan.covered.length + '</b> ТТН на ' + bot_fmtMoney(sum) + (plan.alreadyPaid ? ' (ще ' + plan.alreadyPaid + ' ТТН вже були оплачені)' : ''));
  if (plan.covered.length) L.push('Від №' + plan.covered[0].no + ' до №' + plan.covered[plan.covered.length - 1].no);
  L.push('Залишок оплат, що не покрив наступну ТТН: ' + bot_fmtMoney(plan.leftover) + (plan.nextTtn ? ' (до наступної ТТН ' + plan.nextTtn + ' бракує ' + bot_fmtMoney(plan.nextNeed) + ')' : ''));
  return L.join('\n');
}

function bot_allocApply(rowNums, paidByRow, id) {
  bot_withLock(function () {
    var cur = {}; bot_readOrders().forEach(function (o) { cur[o._row] = o; });
    var patches = [];
    rowNums.forEach(function (r) {
      if (!cur[r] || cur[r].paid !== 'Не оплачено') return;            // змінилось, поки чекали кнопку — не чіпаємо
      patches.push({ row: r, fields: { paid: 'Оплачено', paidDate: paidByRow[r] ? new Date(paidByRow[r]) : bot_today(), recon: id } });
    });
    bot_patchOrders(patches);
    bot_log('ІНФО', 'розподіл оплат ' + id, 'рядків: ' + patches.length);
  });
}

/** /allocate — показати, що покривають внесені суми; «Оплачено» — лише після кнопки. */
function bot_cmdAllocate(chatId) {
  var plan = bot_planAllocation(bot_readOrders(), bot_readPayments(), bot_openingFromSettings());
  if (!plan.covered.length) return bot_send(chatId, bot_allocText(plan, false) + '\n\nНових ТТН для позначки немає.');
  var rows = [], dates = {};
  plan.covered.forEach(function (c) { c.rowNums.forEach(function (r) { rows.push(r); dates[r] = c.paidDate ? c.paidDate.getTime() : 0; }); });
  var token = bot_pendingPut({ kind: 'alloc', rows: rows, dates: dates });
  bot_send(chatId, bot_allocText(plan, false), { keyboard: { inline_keyboard: [[{ text: '✅ Позначити оплаченими', callback_data: 'aly|' + token }, { text: 'Ні', callback_data: 'aln|' + token }]] } });
}

function bot_allocCallback(parts, ctx) {
  var p = bot_pendingGet(parts[1]);
  if (!p) { bot_answerCb(ctx.cb.id, 'Кнопка застаріла'); return; }
  bot_pendingDrop(parts[1]);
  if (parts[0] === 'aln') { bot_edit(ctx.chatId, ctx.msgId, 'Скасовано, нічого не змінено.'); return bot_answerCb(ctx.cb.id, 'Скасовано'); }
  var kp = bot_kyivParts(new Date());
  var id = 'Розподіл-' + kp.y + bot_pad2(kp.m) + bot_pad2(kp.d) + '-' + bot_pad2(kp.h) + bot_pad2(kp.mi);
  bot_allocApply(p.rows, p.dates, id);
  var plan = bot_planAllocation(bot_readOrders(), bot_readPayments(), bot_openingFromSettings());
  bot_edit(ctx.chatId, ctx.msgId, '✅ Позначено оплаченими рядків: ' + p.rows.length + '. Позначка в колонці «Звірка»: <code>' + id + '</code>. Скасувати: <code>/undoalloc ' + id + '</code>\n\nЗалишок оплат: ' + bot_fmtMoney(plan.leftover));
  bot_answerCb(ctx.cb.id, 'Готово');
}

function bot_cmdUndoAlloc(chatId, arg) {
  var id = String(arg || '').trim();
  if (!/^Розподіл-/.test(id)) return bot_send(chatId, 'Формат: <code>/undoalloc Розподіл-20261016-1030</code> (ID з повідомлення про розподіл).');
  var rows = bot_withLock(function () {
    var list = bot_readOrders().filter(function (o) { return o.recon === id && o.paid === 'Оплачено'; });
    bot_patchOrders(list.map(function (o) { return { row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } }; }));
    return list.length;
  });
  bot_send(chatId, rows ? '↩️ Знято «Оплачено» з ' + rows + ' рядків (' + bot_esc(id) + ').' : 'Рядків з такою позначкою не знайшов.');
}
