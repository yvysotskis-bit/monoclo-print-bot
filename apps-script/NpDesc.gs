/**
 * NpDesc.gs — Модуль C: запис скороченого опису в «Додаткова інформація про відправлення» Нової пошти.
 *
 * Безпека (розділ 6 ТЗ):
 *  • InternetDocument.update міняє ЛИШЕ AdditionalInformation: усі інші поля беруться з самого документа й передаються як були;
 *  • якщо НП не повернула хоч одне обов'язкове поле — НЕ пишемо нічого, а показуємо, чого бракує;
 *  • після запису документ читається ще раз: AdditionalInformation має збігтись, решта полів — не змінитись;
 *  • до підтвердження власника на тестовій ТТН бот працює в «режимі перевірки» і в НП не пише (див. /nptest, /live).
 * Чисті функції (bot_npBuildPayload, bot_npDiffDocs) — без Google API.
 */

/** [поле update, [де шукати в документі], обов'язкове?] */
var BOT_NP_UPDATE_FIELDS_ = [
  ['Ref', ['Ref'], true],
  ['PayerType', ['PayerType'], true],
  ['PaymentMethod', ['PaymentMethod'], true],
  ['DateTime', ['DateTime'], true],
  ['CargoType', ['CargoType'], true],
  ['Weight', ['Weight', 'DocumentWeight'], true],
  ['ServiceType', ['ServiceType'], true],
  ['SeatsAmount', ['SeatsAmount'], true],
  ['Description', ['Description'], true],
  ['Cost', ['Cost'], true],
  ['CitySender', ['CitySender'], true],
  ['Sender', ['Sender', 'SenderRef', 'SenderCounterpartyRef'], true],
  ['SenderAddress', ['SenderAddress'], true],
  ['ContactSender', ['ContactSender', 'SenderContactRef', 'ContactSenderRef'], true],
  ['SendersPhone', ['SendersPhone', 'SenderPhone', 'SenderContactPhone'], true],
  ['CityRecipient', ['CityRecipient'], true],
  ['Recipient', ['Recipient', 'RecipientRef', 'RecipientCounterpartyRef'], true],
  ['RecipientAddress', ['RecipientAddress'], true],
  ['ContactRecipient', ['ContactRecipient', 'RecipientContactRef', 'ContactRecipientRef'], true],
  ['RecipientsPhone', ['RecipientsPhone', 'RecipientPhone', 'RecipientContactPhone'], true],
  // необов'язкові, але якщо є — передаємо без змін (наприклад, «контроль оплати» / накладений платіж)
  ['BackwardDeliveryData', ['BackwardDeliveryData'], false],
  ['OptionsSeat', ['OptionsSeat'], false],
  ['VolumeGeneral', ['VolumeGeneral'], false],
  ['SaturdayDelivery', ['SaturdayDelivery'], false],
  ['PreferredDeliveryDate', ['PreferredDeliveryDate'], false],
  ['AfterpaymentOnGoodsCost', ['AfterpaymentOnGoodsCost'], false]
];

/** Поля без персональних даних — їх значення /npdoc показує повністю (для діагностики). */
var BOT_NP_SAFE_VIEW_ = ['PayerType', 'PaymentMethod', 'CargoType', 'ServiceType', 'SeatsAmount', 'Weight', 'Cost', 'AfterpaymentOnGoodsCost', 'BackwardDeliveryData', 'OptionsSeat', 'VolumeGeneral', 'SaturdayDelivery', 'PreferredDeliveryDate'];

/** Лише для перевірки «після запису не змінилось» (не передаємо, а порівнюємо). */
var BOT_NP_WATCH_EXTRA_ = ['BackwardDeliveryCargoType', 'BackwardDeliverySum', 'BackwardDeliveryMoney', 'Redelivery', 'CostOnSite', 'AfterpaymentOnGoodsCost', 'RecipientFullName', 'RecipientDescription', 'PayerType', 'PaymentMethod'];

function bot_npHas_(v) { return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length); }

function bot_npIsZero_(v) { return typeof v !== 'object' && /^\s*0+([.,]0+)?\s*$/.test(String(v)); }

/** Порівняння тексту без різниці в пробілах і регістрі (НП сама робить першу літеру великою: «тест» → «Тест»). */
function bot_npSameText_(a, b) {
  var n = function (x) { return String(x === undefined || x === null ? '' : x).replace(/\s+/g, ' ').trim().toLowerCase(); };
  return n(a) === n(b);
}

function bot_npDateOnly_(s) {
  var m = String(s || '').match(/^\d{2}\.\d{2}\.\d{4}/);
  return m ? m[0] : String(s || '');
}

/**
 * Документ НП + новий текст → тіло для InternetDocument.update.
 * @return {payload, missing:[обов'язкові поля, яких НП не повернула]}
 */
function bot_npBuildPayload(doc, text) {
  var payload = {}, missing = [];
  BOT_NP_UPDATE_FIELDS_.forEach(function (f) {
    var val;
    for (var i = 0; i < f[1].length && !bot_npHas_(val); i++) val = doc[f[1][i]];
    if (!f[2] && (bot_npIsZero_(val) || /^0001-01-01/.test(String(val)))) return;   // «порожня» дата НП: 0001-01-01 — теж не передаємо
    if (!f[2] && bot_npIsZero_(val)) return;                        // необов'язкове поле зі значенням 0 / «0.00» НП не приймає назад («is invalid») — не передаємо
    if (!bot_npHas_(val)) { if (f[2]) missing.push(f[0]); return; }
    payload[f[0]] = f[0] === 'DateTime' ? bot_npDateOnly_(val) : val;
  });
  // Накладений платіж: НП віддає його як BackwardDeliveryCargoType + BackwardDeliverySum/Money, а приймає як BackwardDeliveryData
  if (!payload.BackwardDeliveryData) {
    var bType = doc.BackwardDeliveryCargoType, bSum = bot_npHas_(doc.BackwardDeliverySum) && !bot_npIsZero_(doc.BackwardDeliverySum) ? doc.BackwardDeliverySum : (bot_npHas_(doc.BackwardDeliveryMoney) && !bot_npIsZero_(doc.BackwardDeliveryMoney) ? doc.BackwardDeliveryMoney : '');
    if (bot_npHas_(bType) && bSum !== '') payload.BackwardDeliveryData = [{ PayerType: doc.BackwardDeliveryPayerType || 'Recipient', CargoType: bType, RedeliveryString: String(bSum) }];
  }
  payload.AdditionalInformation = String(text);
  return { payload: payload, missing: missing };
}

function bot_npNorm_(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') { try { return JSON.stringify(v); } catch (e) { return String(v); } }
  var s = String(v).trim();
  return /^-?\d+(\.\d+)?$/.test(s) ? String(Number(s)) : s;          // «1.00» і «1» — те саме
}

/** Які з полів змінились між документами (крім AdditionalInformation). */
function bot_npDiffDocs(before, after) {
  var changed = [];
  BOT_NP_UPDATE_FIELDS_.forEach(function (f) {
    var b, a;
    f[1].forEach(function (k) { if (b === undefined && before[k] !== undefined) b = before[k]; if (a === undefined && after[k] !== undefined) a = after[k]; });
    if (f[0] === 'DateTime') { b = bot_npDateOnly_(b); a = bot_npDateOnly_(a); }
    if (!f[2]) { if (b === undefined || bot_npIsZero_(b) || !bot_npHas_(b)) b = ''; if (a === undefined || bot_npIsZero_(a) || !bot_npHas_(a)) a = ''; }   // «немає» = «0»
    if (bot_npNorm_(b) !== bot_npNorm_(a)) changed.push(f[0]);
  });
  // службові поля накладеного платежу / контролю оплати: після запису мають лишитись як були
  BOT_NP_WATCH_EXTRA_.forEach(function (k) {
    var b = before[k], a = after[k];
    var nb = (b === undefined || bot_npIsZero_(b) || !bot_npHas_(b)) ? '' : bot_npNorm_(b), na = (a === undefined || bot_npIsZero_(a) || !bot_npHas_(a)) ? '' : bot_npNorm_(a);
    if (nb !== na) changed.push(k);
  });
  return changed;
}

// ---------- API ----------

function bot_npDocWindow_() {
  var now = new Date();
  // НП: різниця DateTimeFrom–DateTimeTo не більше трьох місяців → беремо 80 днів назад + завтра (ТТН з гілки свіжі)
  return { from: bot_fmtDate(new Date(now.getTime() - 80 * 86400000)), to: bot_fmtDate(new Date(now.getTime() + 86400000)) };
}

/** Документ за номером ТТН (InternetDocument.getDocumentList) або null. */
function bot_npGetDoc(ttn) {
  var w = bot_npDocWindow_();
  var list = bot_npCall_('InternetDocument', 'getDocumentList', { IntDocNumber: ttn, DateTimeFrom: w.from, DateTimeTo: w.to, GetFullList: '1', Page: '1', Limit: '10' });
  for (var i = 0; i < list.length; i++) if (bot_normTtn(list[i].IntDocNumber) === ttn) return list[i];
  return null;
}

/**
 * Записати опис у НП і перевірити.
 * @return {state:'written'|'same'|'error'|'transient', error?, ref?, changed?:[поля], docKeys?}
 *   error — НП відмовила (текст відповіді, без повторів); transient — збій зв'язку (спробуємо пізніше).
 */
function bot_npWriteDesc(ttn, text) {
  try {
    var doc = bot_npGetDoc(ttn);
    if (!doc) return { state: 'error', error: 'НП не знайшла ТТН ' + ttn + ' у вашому кабінеті' };
    var ref = doc.Ref;
    if (bot_npSameText_(doc.AdditionalInformation, text)) return { state: 'same', ref: ref };      // ідемпотентність
    var b = bot_npBuildPayload(doc, text);
    if (b.missing.length) {
      return { state: 'error', ref: ref, error: 'НП не повернула поля: ' + b.missing.join(', ') + ' — нічого не записано (запустіть /npdoc ' + ttn + ')', docKeys: Object.keys(doc) };
    }
    var upd = bot_npCall_('InternetDocument', 'update', b.payload);
    var updInfo = (upd && upd[0]) ? upd[0] : {};
    // НП інколи віддає старе значення одразу після запису — читаємо до 4 разів із паузою
    var after = null;
    for (var attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0 && typeof Utilities !== 'undefined' && Utilities.sleep) Utilities.sleep(2000);
      after = bot_npGetDoc(ttn);
      if (after && bot_npSameText_(after.AdditionalInformation, text)) break;
    }
    if (!after) return { state: 'error', ref: ref, error: 'Після запису НП не повернула документ — перевірте ТТН у кабінеті' };
    var changed = bot_npDiffDocs(doc, after);
    if (!bot_npSameText_(after.AdditionalInformation, text)) {
      var newNo = updInfo.IntDocNumber && bot_normTtn(updInfo.IntDocNumber) !== ttn ? ' ⚠ НП повернула ІНШИЙ номер ТТН: ' + updInfo.IntDocNumber + ' (Ref ' + (updInfo.Ref || '') + ')' + '.' : '';
      return { state: 'error', ref: ref, changed: changed, error: 'НП прийняла запит (відповідь: ' + Object.keys(updInfo).join(', ') + '), але «Додаткова інформація» після запису: «' + String(after.AdditionalInformation || '(порожньо)') + '», а надсилали «' + text + '».' + newNo };
    }
    if (changed.length) {
      return { state: 'error', ref: ref, changed: changed, error: 'Після запису змінились інші поля: ' + changed.join(', ') + ' — перевірте ТТН у кабінеті НП!' };
    }
    return { state: 'written', ref: ref };
  } catch (e) {
    if (e.npLogical) return { state: 'error', error: bot_scrub(e.message) };
    return { state: 'transient', error: bot_scrub(e.message) };
  }
}

// ---------- режим ----------

function bot_npLive() { return String(bot_setting('NP_MODE', 'перевірка')).toLowerCase().indexOf('бойов') === 0; }

// ---------- обробка черги описів (щохвилини) ----------

/**
 * «Новий» → перевірка: надсилаємо власнику «ТТН → опис», статус «Перевірка»; бойовий: пишемо в НП.
 * Збій зв'язку лишає «Новий» (повтор через кілька хвилин), відмова НП → «Помилка НП» без повторів.
 */
function bot_ttnProcess() {
  var rows = bot_readTtnRows().filter(function (r) { return r.status === 'Новий' && r.desc; });
  if (!rows.length) return;
  if (!bot_npLive()) {
    var lines = rows.map(function (r) { return bot_code(r.ttn) + ' → ' + bot_esc(r.desc) + ' <i>(' + r.len + ' симв.)</i>' + (r.orders ? '\n   №' + bot_esc(r.orders) : ''); });
    bot_sendToOwners('👀 <b>Режим перевірки</b> — в НП нічого не записую. Ось що записав би:\n\n' + lines.join('\n\n') +
      '\n\nЯкщо все гаразд — <code>/live</code> (бойовий режим). Свій текст для ТТН: <code>/setdesc ТТН текст</code>.');
    bot_ttnPatch(rows.map(function (r) { return { row: r._row, fields: { status: 'Перевірка' } }; }));
    return;
  }
  var now = new Date(), patches = [], errs = [];
  rows.slice(0, 15).forEach(function (r) {
    if (r.note && r.note.indexOf('⏳') === 0 && now.getMinutes() % 5 !== 0) return;          // після збою зв'язку — не частіше ніж раз на 5 хв
    var res = bot_npWriteDesc(r.ttn, r.desc);
    if (res.state === 'written' || res.state === 'same') {
      patches.push({ row: r._row, fields: { status: 'Записано в НП', written: now, note: '', npRef: res.ref || '' } });
    } else if (res.state === 'transient') {
      patches.push({ row: r._row, fields: { note: '⏳ ' + res.error } });
      bot_log('УВАГА', 'НП: тимчасовий збій', r.ttn + ' · ' + res.error);
    } else {
      patches.push({ row: r._row, fields: { status: 'Помилка НП', note: res.error, npRef: res.ref || '' } });
      errs.push(bot_code(r.ttn) + ': ' + bot_esc(res.error));
    }
  });
  bot_ttnPatch(patches);
  if (errs.length) bot_sendToOwners('❌ <b>Помилка НП</b> — опис не записано (повторів не буде, ТТН не піде в реєстр, доки ви не вирішите):\n\n' + errs.join('\n') + '\n\nСвій текст: <code>/setdesc ТТН текст</code>.');
}

// ---------- команди власника ----------

function bot_cmdNpDoc(chatId, arg) {
  var ttn = bot_normTtn(arg);
  if (!bot_isTtn(ttn)) return bot_send(chatId, 'Формат: <code>/npdoc 20451556067718</code> — покажу, які поля віддає НП (нічого не змінюю).');
  try {
    var doc = bot_npGetDoc(ttn);
    if (!doc) return bot_send(chatId, 'НП не знайшла цю ТТН у вашому кабінеті.');
    var b = bot_npBuildPayload(doc, '');
    bot_send(chatId, '🔎 <b>ТТН ' + ttn + '</b> (лише читання)\nПоля, які НП повернула: ' + bot_esc(Object.keys(doc).join(', ')) +
      '\n\nДля запису потрібні: ' + (b.missing.length ? '❌ <b>бракує:</b> ' + bot_esc(b.missing.join(', ')) : '✅ усі обов\'язкові поля є') +
      '\n\nЗначення службових полів (без персональних даних): ' + bot_esc(BOT_NP_SAFE_VIEW_.map(function (k) { var v = doc[k]; return k + '=' + (v === undefined ? '—' : (typeof v === 'object' ? JSON.stringify(v) : (v === '' ? '(порожньо)' : v))); }).join('; ')) +
      '\nПоточна «Додаткова інформація»: <i>' + bot_esc(doc.AdditionalInformation || '(порожньо)') + '</i>');
  } catch (e) { bot_send(chatId, '❌ ' + bot_esc(bot_scrub(e.message))); }
}

/** /nptest <ТТН> <текст> → кнопка підтвердження → запис і звіт «що змінилось». */
function bot_cmdNpTest(chatId, arg) {
  var m = String(arg || '').match(/^(\d[\d\s]{12,}\d)\s+([\s\S]+)$/);
  var ttn = m ? bot_normTtn(m[1]) : '';
  if (!m || !bot_isTtn(ttn)) return bot_send(chatId, 'Формат: <code>/nptest 20451556067718 тест 123</code> — запишу цей текст у «Додаткова інформація» ТТН і покажу, чи не змінилось щось інше. Беріть ТІЛЬКИ тестову ТТН.');
  var text = m[2].trim();
  if (bot_len(text) > bot_descLimit()) return bot_send(chatId, 'Текст довший за ' + bot_descLimit() + ' символів.');
  var token = bot_pendingPut({ kind: 'nptest', ttn: ttn, text: text });
  bot_send(chatId, '⚠️ Це <b>запис у Нову пошту</b>. Змінюю лише «Додаткова інформація» ТТН ' + bot_code(ttn) + ' на:\n<i>' + bot_esc(text) + '</i>\n\nПереконайтесь, що це ТЕСТОВА ТТН. Записати?',
    { keyboard: { inline_keyboard: [[{ text: '✅ Записати на тестову ТТН', callback_data: 'nptq|' + token }, { text: 'Ні', callback_data: 'nptn|' + token }]] } });
}

function bot_npTestCallback(parts, ctx) {
  var p = bot_pendingGet(parts[1]);
  if (!p) { bot_answerCb(ctx.cb.id, 'Кнопка застаріла'); return; }
  bot_pendingDrop(parts[1]);
  if (parts[0] === 'nptn') { bot_edit(ctx.chatId, ctx.msgId, 'Скасовано.'); return bot_answerCb(ctx.cb.id, 'Скасовано'); }
  bot_answerCb(ctx.cb.id, 'Пишу в НП…');
  var res = bot_npWriteDesc(p.ttn, p.text);
  var txt;
  if (res.state === 'written') {
    bot_setProp(BOT_PROP.NP_TEST_OK, '1');
    txt = '✅ <b>Тест пройдено.</b> У ТТН ' + bot_code(p.ttn) + ' змінилось лише «Додаткова інформація»; після запису НП повернула той самий текст, інші поля (отримувач, вартість, накладений платіж, вага, адреси) — без змін.\nТепер можна <code>/live</code>.';
  } else if (res.state === 'same') {
    txt = 'ℹ️ У цій ТТН уже стоїть саме цей текст — нічого не змінював. Візьміть інший текст для тесту.';
  } else {
    txt = '❌ <b>Тест не пройдено:</b> ' + bot_esc(res.error) + (res.docKeys ? '\nПоля від НП: ' + bot_esc(res.docKeys.join(', ')) : '') + '\nБойовий режим не вмикаю.';
  }
  bot_edit(ctx.chatId, ctx.msgId, txt);
}

/** /live — «затверджую»: бойовий режим (лише після успішного /nptest). */
function bot_cmdLive(chatId) {
  if (bot_npLive()) return bot_send(chatId, 'Уже бойовий режим.');
  if (bot_prop(BOT_PROP.NP_TEST_OK) !== '1') {
    return bot_send(chatId, '⛔ Спершу перевірка на тестовій ТТН: <code>/nptest ТТН текст</code>. Лише коли побачу, що змінилось тільки «Додаткова інформація», дозволю бойовий режим.');
  }
  bot_withLock(function () {
    bot_setSetting('NP_MODE', 'бойовий');
    var rows = bot_readTtnRows().filter(function (r) { return r.status === 'Перевірка'; });
    bot_ttnPatch(rows.map(function (r) { return { row: r._row, fields: { status: 'Новий' } }; }));
  });
  bot_send(chatId, '✅ Бойовий режим увімкнено. Записую описи в НП; реєстр — щодня о ' + bot_setting('REGISTRY_TIME', '10:00') + '. Повернутись: <code>/preview</code>.');
}

function bot_cmdPreviewMode(chatId) {
  bot_setSetting('NP_MODE', 'перевірка');
  bot_send(chatId, '👀 Режим перевірки: нічого не пишу в НП і не створюю реєстр.');
}
