/**
 * PayImport.gs — оплати з повідомлень чату «Отправка отчет» («+15к», «+ 21 401», «+14300») і ручна команда /addpay.
 * Розбір — чиста логіка. Запис — через bot_addPaymentRow_ (ідемпотентно за ключем «tg-<id повідомлення>»).
 * Це лише рядки в аркуші «Оплати» (борг падає); статус «Оплачено» у замовленнях бот так не ставить — лише кнопкою зі звірки.
 */

/** Найбільша сума одного платежу, яку приймаємо без підтвердження (захист від номера телефону, дати тощо). */
var BOT_PAY_MAX_ = 10000000;

/**
 * «+15к» → 15000, «+ 21 401» → 21401, «+14,5к» → 14500, «+10 000 грн» → 10000, «+1 500,50» → 1500.5.
 * Не оплата → null: порожнє, 0, > 10 млн (напр. номер телефону), неоднозначні числа («+1.234,56», «+1.5.5»), схожі на дату («+10.09»).
 */
function bot_parsePayText(text) {
  var m = String(text || '').replace(/[\u00a0\u202f]/g, ' ').trim().match(/^\+\s*(\d[\d\s.,]*?)\s*(к|k|тис\.?)?\s*(грн|₴)?\.?$/i);
  if (!m) return null;
  var raw = m[1].trim(), thousands = !!m[2], v;
  if (thousands) {
    if (!/^\d{1,6}(?:[.,]\d{1,3})?$/.test(raw)) return null;                    // «15», «14,5», «1.250»
    v = parseFloat(raw.replace(',', '.')) * 1000;
  } else if (/^\d{1,3}(?:[ ]\d{3})+(?:[.,]\d{1,2})?$/.test(raw)) {              // «21 401», «1 500,50»
    v = parseFloat(raw.replace(/ /g, '').replace(',', '.'));
  } else if (/^[1-9]\d{0,2}(?:\.\d{3})+$/.test(raw)) {                                // «25.000» — крапка як роздільник тисяч
    v = Number(raw.replace(/\./g, ''));
  } else if (/^\d+(?:[.,]\d{1,2})?$/.test(raw)) {                                // «14300», «1,5», «1500.50»
    if (/^\d{1,2}[.,]\d{2}$/.test(raw)) return null;                           // «+10.09» схоже на дату — не вгадуємо (для малих сум є /addpay)
    v = parseFloat(raw.replace(',', '.'));
  } else return null;
  v = bot_round2(v);
  if (!isFinite(v) || v <= 0 || v > BOT_PAY_MAX_) return null;
  return v;
}

/**
 * messages — з bot_parseTelegramExport. opts: {after: Date|null — беремо лише оплати з датою ПІСЛЯ цієї, existingIds:[ключі, що вже є]}.
 * @return {rows:[{key, id, date, sum, text}], skippedOld, skippedExisting, unclear:[текст], total}
 */
function bot_planPayImport(messages, opts) {
  opts = opts || {};
  var have = {}; (opts.existingIds || []).forEach(function (k) { have[k] = true; });
  var plan = { rows: [], skippedOld: 0, skippedExisting: 0, unclear: [], total: 0, senders: {}, skippedSender: 0 };
  var only = String(opts.onlyFrom || '').split(/[,;]+/).map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
  messages.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    if (m.service || !m.text) return;
    var t = m.text.trim();
    if (t.charAt(0) !== '+') return;                                     // «Пораховано+» тощо — не оплата
    var sum = bot_parsePayText(t);
    if (sum === null) { plan.unclear.push(t.slice(0, 60)); return; }
    var d = m.date || new Date();
    var who = m.from || '(невідомо)';
    if (only.length && only.indexOf(String(m.from || '').toLowerCase()) < 0) { plan.skippedSender++; return; }     // PAY_EXPORT_FROM: лише повідомлення цих відправників
    if (!bot_afterCut_(d, opts.after)) { plan.skippedOld++; return; }
    var key = 'tg-' + m.id;
    if (have[key]) { plan.skippedExisting++; return; }
    plan.senders[who] = (plan.senders[who] || 0) + 1;
    plan.rows.push({ key: key, id: m.id, date: d, sum: sum, text: t, from: who });
    plan.total += sum;
  });
  return plan;
}

function bot_payPlanText(plan, done) {
  var L = [done ? '✅ Оплати додано' : 'Знайдено в експорті'];
  L.push((done ? 'Додано' : 'Буде додано') + ' оплат: ' + plan.rows.length + ' на ' + bot_fmtMoney(plan.total) + ' (оплати до 08.09 йдуть лише в покриття місяця, у борг не рахуються). Пропущено: до вересня ' + plan.skippedOld + ', уже є в таблиці ' + plan.skippedExisting + '.');
  plan.rows.slice(0, 30).forEach(function (r) { L.push('• ' + bot_fmtDate(r.date) + ' — ' + bot_fmtMoney(r.sum) + '  («' + r.text + '»)'); });
  var sn = Object.keys(plan.senders || {});
  if (sn.length) L.push('Відправники: ' + sn.map(function (k) { return k + ' — ' + plan.senders[k]; }).join('; ') + (sn.length > 1 ? '  ⚠️ ЯКЩО Є ЧУЖІ — скасуйте й задайте в «Налаштуваннях» PAY_EXPORT_FROM (імена відправників через кому).' : ''));
  if (plan.skippedSender) L.push('Пропущено за відправником: ' + plan.skippedSender);
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
    var plan = bot_planPayImport(bot_tgReadMessages_(r.getResponseText()), { after: op ? op.ordersAfter : null, existingIds: bot_existingPayKeys_(), onlyFrom: bot_setting('PAY_EXPORT_FROM', '') });
    if (!plan.rows.length) { bot_alert_('Нових оплат немає', bot_payPlanText(plan, false)); return; }
    if (ui.alert('Додати оплати?', bot_payPlanText(plan, false) + '\n\nДодати їх в аркуш «Оплати»?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    var n = bot_payImportApply(plan);
    bot_alert_('Готово', 'Додано оплат: ' + n + '. Щоб позначити ТТН оплаченими — у боті команда /allocate.');
    try { if (bot_ownerIds().length && bot_prop(BOT_PROP.TG_TOKEN)) bot_cmdAllocate(bot_ownerIds()[0]); } catch (e) { bot_log('УВАГА', 'розподіл після імпорту оплат', e.message); }
    try { bot_buildSummary(); } catch (e) { bot_log('УВАГА', 'підсумки після оплат', e.message); }
  } catch (e) { bot_alert_('Не вдалося', e.message); }
}

/** Змінює суму вже доданої оплати за ключем (редагування повідомлення в чаті). @return {changed, old} */
function bot_updatePaymentSum_(key, sum) {
  return bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.payments), map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
    if (!map.recon || sh.getLastRow() < 2) return { changed: false };
    var keys = sh.getRange(2, map.recon, sh.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]) !== key) continue;
      var cell = sh.getRange(i + 2, map.sum), old = Number(cell.getValue()) || 0;
      if (old === sum) return { changed: false, old: old };
      cell.setValue(sum);
      return { changed: true, old: old };
    }
    return { changed: false };
  });
}

/**
 * Повідомлення в чаті «Отправка отчет»: лише від ВЛАСНИКА і лише виду «+10 000» / «+15к» → оплата в «Оплатах» (ключ tg-<id повідомлення>).
 * У цьому чаті бот нічого не пише; повідомлення — власнику в особисті, з пропозицією розподілу оплат на ТТН.
 */
function bot_handlePayMessage(msg, edited) {
  var from = msg.from || {};
  if (!bot_isOwner(from.id)) return;                                      // чужі «+5000» ігноруємо
  var pt = bot_setting('PAY_THREAD_ID');
  if (pt !== '' && pt !== '0' && bot_threadOf(msg) !== String(pt)) return;
  var sum = bot_parsePayText(msg.text || msg.caption || '');
  if (sum === null) return;
  var date = bot_makeDateFrom_(new Date(msg.date * 1000)), op = bot_openingFromSettings();
  if (op && !bot_afterCut_(date, op.ordersAfter)) return;                  // до вересня — вже в початковому залишку
  var key = 'tg-' + msg.message_id;
  var res = bot_addPaymentRow_(key, sum, date);
  var head = '';
  if (res.duplicate) {
    if (!edited) return;                                                  // повтор того самого повідомлення
    var u = bot_updatePaymentSum_(key, sum);
    if (!u.changed) return;
    head = '✏️ Оплату з чату виправлено: ' + bot_fmtMoney(u.old) + ' → <b>' + bot_fmtMoney(sum) + '</b>';
  } else {
    head = '💰 Оплату з чату «Отправка отчет» внесено: <b>' + bot_fmtMoney(sum) + '</b> від ' + bot_fmtDate(date) + (typeof res.balance === 'number' ? '\nБорг: <b>' + bot_fmtMoney(res.balance) + '</b>' : '');
  }
  try { bot_sendToOwners(head); } catch (e) { bot_log('УВАГА', 'сповіщення про оплату з чату', e.message); }
  bot_ownerIds().forEach(function (id) { try { bot_cmdAllocate(id); } catch (e) { bot_log('УВАГА', 'розподіл після оплати з чату', e.message); } });
}

/** /addpay <сума> [дата] — одна оплата вручну. Дата за замовчуванням — сьогодні. */
function bot_cmdAddPay(chatId, arg, msg) {
  var m = String(arg || '').trim().match(/^(\S+)(?:\s+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4}))?$/);
  var sum = m ? bot_parsePayText('+' + m[1]) : null;
  if (sum === null) return bot_send(chatId, 'Формат: <code>/addpay 21401 12.09.2026</code> (дата необов\'язкова; «15к» = 15000).');
  var date = m[2] ? bot_parseDate(m[2]) : null;
  if (m[2] && !date) return bot_send(chatId, 'Не розумію дату. Приклад: 12.09.2026');
  var key = 'manual-' + (msg && msg.message_id ? msg.message_id : Utilities.getUuid().slice(0, 8));      // ключ з id повідомлення: повтор того самого оновлення не додасть другу оплату
  var res = bot_addPaymentRow_(key, sum, date || undefined);
  if (res.duplicate) return bot_send(chatId, 'ℹ️ Ця оплата вже внесена (повтор команди).');
  bot_send(chatId, '✅ Оплату ' + bot_fmtMoney(sum) + ' від ' + bot_fmtDate(date || bot_today()) + ' додано (№' + res.no + ').' + (typeof res.balance === 'number' ? '\n💰 Борг: <b>' + bot_fmtMoney(res.balance) + '</b>' : ''));
  try { bot_cmdAllocate(chatId); } catch (e) { bot_log('УВАГА', 'розподіл після /addpay', e.message); }      // пропозиція розподілу — best-effort, оплата вже внесена
}
