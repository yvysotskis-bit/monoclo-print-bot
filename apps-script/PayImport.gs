/**
 * PayImport.gs — оплати з повідомлень чату «Отправка отчет» («+15к», «+ 21 401», «+14300») і ручна команда /addpay.
 * Розбір — чиста логіка. Запис — через bot_addPaymentRow_ (ідемпотентно за ключем «tg-<id повідомлення>»).
 * Це лише рядки в аркуші «Оплати» (борг падає); статус «Оплачено» у замовленнях бот так не ставить — лише кнопкою зі звірки.
 */

/** «+15к» → 15000, «+ 21 401» → 21401, «+14,5к» → 14500, «+10 000 грн» → 10000. Не оплата → null. */
function bot_parsePayText(text) {
  var m = String(text || '').replace(/[  ]/g, ' ').trim().match(/^\+\s*(\d[\d\s.,]*?)\s*(к|k|тис\.?)?\s*(грн|₴)?\.?$/i);
  if (!m) return null;
  var num = m[1].replace(/\s+/g, ''), thousands = !!m[2], v;
  if (/[.,]/.test(num)) {
    if (!thousands && /^\d{1,3}([.,]\d{3})+$/.test(num)) v = Number(num.replace(/[.,]/g, ''));
    else v = parseFloat(num.replace(',', '.'));
  } else v = Number(num);
  if (!isFinite(v) || v <= 0) return null;
  if (thousands) v *= 1000;
  return bot_round2(v);
}

/**
 * messages — з bot_parseTelegramExport. opts: {after: Date|null — беремо лише оплати з датою ПІСЛЯ цієї, existingIds:[ключі, що вже є]}.
 * @return {rows:[{key, id, date, sum, text}], skippedOld, skippedExisting, unclear:[текст], total}
 */
function bot_planPayImport(messages, opts) {
  opts = opts || {};
  var have = {}; (opts.existingIds || []).forEach(function (k) { have[k] = true; });
  var plan = { rows: [], skippedOld: 0, skippedExisting: 0, unclear: [], total: 0 };
  messages.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    if (m.service || !m.text) return;
    var t = m.text.trim();
    if (t.charAt(0) !== '+') return;                                     // «Пораховано+» тощо — не оплата
    var sum = bot_parsePayText(t);
    if (sum === null) { plan.unclear.push(t.slice(0, 60)); return; }
    var d = m.date || new Date();
    if (!bot_afterCut_(d, opts.after)) { plan.skippedOld++; return; }
    var key = 'tg-' + m.id;
    if (have[key]) { plan.skippedExisting++; return; }
    plan.rows.push({ key: key, id: m.id, date: d, sum: sum, text: t });
    plan.total += sum;
  });
  return plan;
}

function bot_payPlanText(plan, done) {
  var L = [done ? '✅ Оплати додано' : 'Знайдено в експорті'];
  L.push((done ? 'Додано' : 'Буде додано') + ' оплат: ' + plan.rows.length + ' на ' + bot_fmtMoney(plan.total) + ' (оплати до 08.09 йдуть лише в покриття місяця, у борг не рахуються). Пропущено: до вересня ' + plan.skippedOld + ', уже є в таблиці ' + plan.skippedExisting + '.');
  plan.rows.slice(0, 30).forEach(function (r) { L.push('• ' + bot_fmtDate(r.date) + ' — ' + bot_fmtMoney(r.sum) + '  («' + r.text + '»)'); });
  if (plan.unclear.length) L.push('⚠️ Не зрозумів суму: ' + plan.unclear.join(' | '));
  return L.join('\n');
}

function bot_payImportApply(plan) {
  var added = 0;
  plan.rows.forEach(function (r) { var res = bot_addPaymentRow_(r.key, r.sum, bot_makeDateFrom_(r.date)); if (!res.duplicate) added++; });
  bot_log('ІНФО', 'імпорт оплат', 'додано ' + added);
  return added;
}

/** Дата (без часу) за Києвом. */
function bot_makeDateFrom_(d) { var p = bot_kyivParts(d); return bot_makeDate(p.y, p.m, p.d); }

function bot_existingPayKeys_() {
  var sh = bot_sheet(BOT_SHEETS.payments), map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
  if (!map.recon || sh.getLastRow() < 2) return [];
  return sh.getRange(2, map.recon, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); }).filter(Boolean);
}

function bot_menuPayImport() {
  var ui = bot_ui_();
  var r = ui.prompt('Імпорт оплат з експорту Telegram', 'Вставте посилання на messages.html з чату «Отправка отчет» (завантажений на ваш Google Диск). Беру повідомлення виду «+15к», «+ 21 401», «+14300» починаючи з вересня (для покриття собівартості по місяцях). У борг рахуються лише оплати після ' + bot_setting('OPENING_PAYS_AFTER', '08.09.2026') + ' — раніші вже в початковому залишку. Спершу покажу список.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  try {
    var op = bot_openingFromSettings();
    var plan = bot_planPayImport(bot_tgReadMessages_(r.getResponseText()), { after: op ? op.ordersAfter : null, existingIds: bot_existingPayKeys_() });
    if (!plan.rows.length) { bot_alert_('Нових оплат немає', bot_payPlanText(plan, false)); return; }
    if (ui.alert('Додати оплати?', bot_payPlanText(plan, false) + '\n\nДодати їх в аркуш «Оплати»?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    var n = bot_payImportApply(plan);
    bot_alert_('Готово', 'Додано оплат: ' + n);
    try { bot_buildSummary(); } catch (e) { bot_log('УВАГА', 'підсумки після оплат', e.message); }
  } catch (e) { bot_alert_('Не вдалося', e.message); }
}

/** /addpay <сума> [дата] — одна оплата вручну. Дата за замовчуванням — сьогодні. */
function bot_cmdAddPay(chatId, arg) {
  var m = String(arg || '').trim().match(/^(\S+)(?:\s+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4}))?$/);
  var sum = m ? bot_parsePayText('+' + m[1]) : null;
  if (sum === null) return bot_send(chatId, 'Формат: <code>/addpay 21401 12.09.2026</code> (дата необов\'язкова; «15к» = 15000).');
  var date = m[2] ? bot_parseDate(m[2]) : null;
  if (m[2] && !date) return bot_send(chatId, 'Не розумію дату. Приклад: 12.09.2026');
  var res = bot_addPaymentRow_('manual-' + Utilities.getUuid().slice(0, 8), sum, date || undefined);
  bot_send(chatId, '✅ Оплату ' + bot_fmtMoney(sum) + ' від ' + bot_fmtDate(date || bot_today()) + ' додано (№' + res.no + ').' + (typeof res.balance === 'number' ? '\n💰 Борг: <b>' + bot_fmtMoney(res.balance) + '</b>' : ''));
}
