/**
 * Orders.gs — Модуль 1: замовлення з групи → аркуш «Замовлення» (розділ 4 ТЗ),
 * а також команди /cancel, /find, /borg, /price.
 */

var BOT_NEW_TTN_ROWS_ = [];   // рядки, додані за цей запуск, для яких треба одразу запитати статус НП

/** Посилання на повідомлення в групі (для особистих повідомлень власнику). */
function bot_msgLink(chat, thread, messageId) {
  if (chat.username) return 'https://t.me/' + chat.username + '/' + messageId;
  var id = String(chat.id);
  if (id.indexOf('-100') === 0) {
    var internal = id.slice(4);
    return 'https://t.me/c/' + internal + '/' + (thread && thread !== '0' ? thread + '/' : '') + messageId;
  }
  return '';
}

function bot_orderDateOf_(msg) {
  var p = bot_kyivParts(new Date(msg.date * 1000));
  return bot_makeDate(p.y, p.m, p.d);
}

var BOT_NOTE_PREFIX_ = '⚠ ';

function bot_mergeNote_(oldNote, issues) {
  var keep = String(oldNote || '').split('; ').filter(function (s) { return s && s.indexOf(BOT_NOTE_PREFIX_) !== 0; });
  if (issues.length) keep.push(BOT_NOTE_PREFIX_ + issues.join(', '));
  return keep.join('; ');
}

/** Рядок замовлення з розібраного підпису (без запису). */
function bot_buildOrderFields_(p, orderDate, priceRows, status) {
  var issues = p.issues.map(function (i) { return i.text; });
  var yellow = p.issues.map(function (i) { return i.field; });
  var cost = '';
  if (status !== 'В роботі') cost = 0;
  else if (p.type) {
    var price = bot_priceFor(priceRows, p.type, orderDate, new Date());
    if (price === null) { issues.push('«' + p.type + '» немає в прайсі'); yellow.push('cost'); }
    else cost = price;
  } else {
    yellow.push('cost');
  }
  return {
    fields: {
      no: p.no, date: orderDate, print: p.print, type: p.type, color: p.color, size: p.size, placement: p.placement,
      prints: p.prints, ttn: p.ttn, cost: cost
    },
    issues: issues, yellow: yellow
  };
}

/** Ключ рядка в колонці msg_id: перше замовлення повідомлення — його message_id, наступні — «id.1», «id.2». */
function bot_msgKey(mid, idx) { return idx === 0 ? String(mid) : mid + '.' + idx; }

/** Обробка повідомлення з гілки «Замовлення на клієнта» (може містити кілька замовлень). */
function bot_handleOrderMessage(msg, caption, edited) {
  var list = bot_parseOrderMessage(caption);
  if (!list.length) return;                                       // не замовлення — мовчки ігноруємо
  var chat = msg.chat, mid = String(msg.message_id), thread = bot_threadOf(msg);
  var link = bot_msgLink(chat, thread, msg.message_id);
  var linkTxt = link ? '\n<a href="' + link + '">Відкрити повідомлення</a>' : '';

  bot_withLock(function () {
    var orders = bot_readOrders();
    var priceRows = bot_readPriceRows();
    var react = null;                                              // реакція на повідомлення: 👌 або ✍ (одна на все повідомлення)

    list.forEach(function (p, idx) {
      var key = bot_msgKey(mid, idx);
      var existing = null;
      orders.forEach(function (o) { if (o.msgId === key) existing = o; });
      var orderDate = existing && existing.date ? existing.date : bot_orderDateOf_(msg);

      // ---- повторна обробка того самого повідомлення ----
      if (existing && !edited) return;

      // ---- редагування ----
      if (existing && edited) {
        if (existing.paid === 'Оплачено') {
          bot_sendToOwners('⚠️ Замовлення №' + existing.no + ' вже оплачено — редагування в групі я не застосовую. Змініть таблицю вручну, якщо треба.' + linkTxt);
          return;
        }
        var clash = orders.filter(function (o) { return o.no === p.no && o._row !== existing._row; });
        if (clash.length) {
          bot_sendToOwners('⚠️ Після редагування номер №' + p.no + ' збігається з іншим рядком таблиці. Не змінюю.' + linkTxt);
          return;
        }
        var built = bot_buildOrderFields_(p, orderDate, priceRows, existing.status);
        var f = built.fields;
        if (existing.status !== 'В роботі') delete f.cost;
        f.note = bot_mergeNote_(existing.note, built.issues);
        if (existing.ttn !== p.ttn) {                               // ТТН змінилась — старі дані НП недійсні
          f.stage = p.ttn ? '' : 'Немає ТТН'; f.npStatus = ''; f.ttnDate = ''; f.handoff = ''; f.arrived = '';
          if (p.ttn) BOT_NEW_TTN_ROWS_.push(existing._row);
        }
        bot_patchOrders([{ row: existing._row, fields: f }]);
        bot_clearYellow(existing._row, ['type', 'color', 'size', 'ttn', 'cost']);
        var sh = bot_ordersSheet(), map = bot_ordersMap(sh);
        bot_markYellow_(sh, map, existing._row, built.yellow);
        if (react !== '✍') react = built.issues.length ? '✍' : '👌';
        if (built.issues.length) bot_sendToOwners('✍️ №' + p.no + ' оновлено, але ще не вистачає: ' + bot_esc(built.issues.join(', ')) + '.' + linkTxt);
        return;
      }

      // ---- нове замовлення ----
      var dup = orders.filter(function (o) { return o.no === p.no; });
      if (dup.length) {
        bot_sendToOwners('⚠️ Дубль: замовлення №' + p.no + ' уже є в таблиці (рядок ' + dup[0]._row + '). Новий рядок не додаю.' + linkTxt);
        return;
      }
      var b = bot_buildOrderFields_(p, orderDate, priceRows, 'В роботі');
      var row = b.fields;
      row.stage = p.ttn ? '' : 'Немає ТТН';
      row.status = 'В роботі'; row.paid = 'Не оплачено'; row.msgId = key;
      row.note = b.issues.length ? BOT_NOTE_PREFIX_ + b.issues.join(', ') : '';
      var rowNum = bot_appendOrderRow(row, b.yellow);
      orders.push({ _row: rowNum, no: p.no, msgId: key });
      if (p.ttn) BOT_NEW_TTN_ROWS_.push(rowNum);
      bot_log('ІНФО', 'замовлення №' + p.no, 'рядок ' + rowNum + (b.issues.length ? ' · ' + b.issues.join(', ') : ''));
      if (react !== '✍') react = b.issues.length ? '✍' : '👌';
      if (b.issues.length) bot_sendToOwners('✍️ Замовлення №' + p.no + ' додано, але: ' + bot_esc(b.issues.join(', ')) + '. Клітинки в таблиці підсвічені жовтим.' + linkTxt);
    });

    if (react) bot_react(chat.id, msg.message_id, react);
  });
}

// =====================================================================
// Команди
// =====================================================================

function bot_orderBrief_(o) {
  return '№' + o.no + ' · ' + bot_esc(o.print) + '\n   ' + bot_esc(bot_itemLabel(o.type, o.color)) + (o.size ? ' · ' + o.size : '') +
    ' · ' + bot_fmtMoney(o.cost) +
    '\n   ТТН ' + (o.ttn ? bot_code(o.ttn) : '—') + ' · ' + bot_esc(o.stage || '—') +
    '\n   ' + bot_esc(o.status) + ' · ' + (o.paid === 'Оплачено' ? '✅ Оплачено' + (o.paidDate ? ' ' + bot_fmtDate(o.paidDate) : '') + (o.recon ? ' (' + bot_esc(o.recon) + ')' : '') : '⏳ ' + bot_esc(o.paid)) +
    (o.note ? '\n   📝 ' + bot_esc(o.note) : '');
}

function bot_cmdFind(chatId, arg) {
  if (!arg) return bot_send(chatId, 'Напишіть: <code>/find 20451553931463</code> або <code>/find 1538</code>');
  var ttn = bot_normTtn(arg);
  var orders = bot_readOrders();
  var found;
  if (bot_isTtn(ttn)) found = orders.filter(function (o) { return o.ttn === ttn; });
  else found = orders.filter(function (o) { return String(o.no) === String(parseInt(arg, 10)); });
  if (!found.length) return bot_send(chatId, 'Нічого не знайшов за «' + bot_esc(arg) + '».');
  var lines = found.slice(0, 10).map(bot_orderBrief_);
  if (found.length > 10) lines.push('… і ще ' + (found.length - 10));
  var recons = {};
  found.forEach(function (o) { if (o.recon) recons[o.recon] = true; });
  bot_send(chatId, '🔎 <b>Знайдено рядків: ' + found.length + '</b>\n\n' + lines.join('\n\n') +
    (Object.keys(recons).length ? '\n\nЗвірки: ' + Object.keys(recons).map(bot_esc).join(', ') : ''));
}

function bot_cmdCancel(chatId, arg) {
  var no = parseInt(arg, 10);
  if (!no) return bot_send(chatId, 'Напишіть: <code>/cancel 1538</code>');
  bot_withLock(function () {
    var rows = bot_readOrders().filter(function (o) { return o.no === no; });
    if (!rows.length) return bot_send(chatId, 'Замовлення №' + no + ' у таблиці немає.');
    if (rows.some(function (o) { return o.paid === 'Оплачено'; })) {
      return bot_send(chatId, '⚠️ Замовлення №' + no + ' уже оплачено — скасувати командою не можу. Якщо треба, змініть таблицю вручну.');
    }
    var patches = rows.map(function (o) {
      return { row: o._row, fields: { status: 'Скасовано', cost: 0, note: (o.note ? o.note + '; ' : '') + 'Скасовано /cancel, було ' + bot_fmtNum(o.cost) + ' грн' } };
    });
    bot_patchOrders(patches);
    bot_log('ІНФО', 'cancel №' + no, rows.length + ' рядків');
    bot_send(chatId, '✅ Замовлення №' + no + ' скасовано (рядків: ' + rows.length + '), собівартість 0.');
  });
}

function bot_cmdBorg(chatId) {
  var orders = bot_readOrders(), pays = bot_readPayments();
  var d = bot_computeDebt(orders, pays);
  bot_send(chatId, '💰 <b>Борг: ' + bot_fmtMoney(d.debt) + '</b>\n' +
    'Собівартість усього: ' + bot_fmtMoney(d.cost) + '\n' +
    'Оплачено: ' + bot_fmtMoney(d.paid) + ' (оплат: ' + pays.length + ')\n\n' +
    'Отримані/відмовлені, але ще не оплачені ТТН: <b>' + d.unpaidDelivered.count + '</b> — ' + bot_fmtMoney(d.unpaidDelivered.sum));
}

function bot_cmdPrice(chatId, arg) {
  var rows = bot_readPriceRows();
  var today = new Date();
  if (!arg) {
    var cur = bot_currentPrices(rows, today);
    return bot_send(chatId, '💲 <b>Чинні ціни</b>\n' + cur.map(function (c) {
      return '• ' + bot_esc(c.type) + ' — ' + bot_fmtMoney(c.price) + (c.from ? ' (з ' + bot_fmtDate(c.from) + ')' : '');
    }).join('\n') + '\n\nНова ціна: <code>/price Худі фліс 780 15.11.2026</code>');
  }
  var known = bot_currentPrices(rows, today).map(function (c) { return c.type; });
  var cmd = bot_parsePriceCommand(arg, known, today);
  if (cmd.error) return bot_send(chatId, '⚠️ ' + bot_esc(cmd.error));
  var token = bot_pendingPut({ kind: 'price', type: cmd.type, price: cmd.price, from: cmd.from.getTime() });
  bot_send(chatId, 'Додати нову ціну?\n<b>' + bot_esc(cmd.type) + '</b> — ' + bot_fmtMoney(cmd.price) + ' з ' + bot_fmtDate(cmd.from) +
    (cmd.isNew ? '\n🆕 Це новий тип речі — він з\'явиться у списку «Тип речі».' : '') + '\nСтарі рядки таблиці не змінюються.',
    { keyboard: { inline_keyboard: [[{ text: '✅ Так', callback_data: 'prcy|' + token }, { text: 'Ні', callback_data: 'prcn|' + token }]] } });
}

function bot_priceCallback(parts, ctx) {
  var p = bot_pendingGet(parts[1]);
  if (!p) { bot_answerCb(ctx.cb.id, 'Кнопка застаріла'); return bot_edit(ctx.chatId, ctx.msgId, 'Запит застарів — надішліть /price ще раз.'); }
  if (parts[0] === 'prcn') {
    bot_pendingDrop(parts[1]); bot_answerCb(ctx.cb.id, 'Скасовано');
    return bot_edit(ctx.chatId, ctx.msgId, 'Скасовано.');
  }
  bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.price);
    var row = sh.getLastRow() + 1;
    sh.getRange(row, 1, 1, 4).setValues([[p.type, p.price, new Date(p.from), 'додано з Telegram']]);
    sh.getRange(row, 3).setNumberFormat('dd.mm.yyyy');
  });
  bot_pendingDrop(parts[1]);
  bot_answerCb(ctx.cb.id, 'Додано');
  bot_edit(ctx.chatId, ctx.msgId, '✅ Додано: <b>' + bot_esc(p.type) + '</b> — ' + bot_fmtMoney(p.price) + ' з ' + bot_fmtDate(new Date(p.from)));
}
