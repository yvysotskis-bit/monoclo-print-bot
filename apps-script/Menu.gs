/**
 * Menu.gs — меню «🤖 Бот» у таблиці: перше налаштування, токени, імпорт, увімкнення/вимкнення, перевірка.
 */

var BOT_COMMANDS_ = [
  { command: 'help', description: 'Що вміє бот' },
  { command: 'borg', description: 'Борг і неоплачені ТТН' },
  { command: 'find', description: 'Знайти за ТТН або №' },
  { command: 'cancel', description: 'Скасувати замовлення: /cancel 1538' },
  { command: 'history', description: 'Останні 10 звірок' },
  { command: 'undo', description: 'Відкликати звірку: /undo ID' },
  { command: 'disputes', description: 'Відкладені спірні ТТН' },
  { command: 'files', description: 'Папка з файлами виробництва' },
  { command: 'price', description: 'Чинні ціни / нова ціна' },
  { command: 'report', description: 'Ранковий звіт зараз' },
  { command: 'month', description: 'Місячний звіт' }
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🤖 Бот')
    .addItem('Перше налаштування', 'bot_menuSetup')
    .addItem('Ввести токен Telegram', 'bot_menuToken')
    .addItem('Ввести ключ Нової пошти', 'bot_menuNpKey')
    .addSeparator()
    .addItem('Імпорт з попередньої версії', 'bot_menuImport')
    .addSeparator()
    .addItem('Увімкнути бота', 'bot_menuEnable')
    .addItem('Вимкнути бота', 'bot_menuDisable')
    .addItem('Перевірити, що все працює', 'bot_menuHealth')
    .addItem('Відкрити лог', 'bot_menuLog')
    .addToUi();
}

function bot_ui_() { return SpreadsheetApp.getUi(); }

function bot_alert_(title, text) { bot_ui_().alert(title, text, bot_ui_().ButtonSet.OK); }

// ---------- тригер і вмикання ----------

function bot_removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'bot_poll') ScriptApp.deleteTrigger(t); });
}

function bot_installTrigger() {
  bot_removeTriggers();
  ScriptApp.newTrigger('bot_poll').timeBased().everyMinutes(1).create();
}

/** Вмикає бота: прибирає вебхук, реєструє команди, ставить тригер «щохвилини». Повертає @username. */
function bot_enableBot() {
  var me = bot_tg('getMe', {});
  bot_setProp(BOT_PROP.BOT_USERNAME, me.username || '');
  bot_tg('deleteWebhook', { drop_pending_updates: false });
  bot_tg('setMyCommands', { commands: BOT_COMMANDS_ });
  bot_installTrigger();
  bot_setProp(BOT_PROP.ENABLED, '1');
  bot_log('ІНФО', 'бота увімкнено', '@' + me.username);
  return me.username;
}

function bot_menuEnable() {
  try {
    var u = bot_enableBot();
    bot_alert_('Готово', 'Бот @' + u + ' увімкнений. Він перевіряє нові повідомлення щохвилини.');
  } catch (e) { bot_alert_('Не вийшло', e.message); }
}

function bot_menuDisable() {
  bot_removeTriggers();
  bot_setProp(BOT_PROP.ENABLED, '0');
  bot_log('ІНФО', 'бота вимкнено', '');
  bot_alert_('Готово', 'Бот вимкнений: нові повідомлення не обробляються. Щоб увімкнути знову — «Увімкнути бота».');
}

// ---------- токени ----------

function bot_menuToken() {
  var ui = bot_ui_();
  var r = ui.prompt('Токен Telegram', 'Вставте токен, який дав @BotFather (виглядає як 123456789:AAE…). Він збережеться приховано, не в таблиці.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return false;
  var token = r.getResponseText().trim();
  if (!/^\d+:[\w-]{20,}$/.test(token)) { bot_alert_('Токен не схожий на справжній', 'Скопіюйте його повністю з повідомлення @BotFather.'); return false; }
  bot_setProp(BOT_PROP.TG_TOKEN, token);
  try {
    var me = bot_tg('getMe', {});
    bot_setProp(BOT_PROP.BOT_USERNAME, me.username || '');
    bot_alert_('Токен прийнято', 'Бот: @' + me.username);
    return true;
  } catch (e) {
    bot_delProp(BOT_PROP.TG_TOKEN);
    bot_alert_('Telegram не прийняв токен', e.message);
    return false;
  }
}

function bot_menuNpKey() {
  var ui = bot_ui_();
  var r = ui.prompt('Ключ API Нової пошти', 'Вставте API-ключ (кабінет Нової пошти → Налаштування → Безпека → API ключі). Порожнє поле — видалити ключ.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var key = r.getResponseText().trim();
  if (!key) { bot_delProp(BOT_PROP.NP_KEY); bot_alert_('Готово', 'Ключ Нової пошти видалено.'); return; }
  bot_setProp(BOT_PROP.NP_KEY, key);
  try { bot_npPing(); bot_alert_('Ключ прийнято', 'Нова пошта відповідає. Статуси оновлюватимуться кожні 30 хвилин.'); }
  catch (e) { bot_alert_('Ключ збережено, але є помилка', e.message); }
}

// ---------- перше налаштування ----------

function bot_menuSetup() {
  var ui = bot_ui_();
  var go = ui.alert('Перше налаштування', 'Зараз я створю в цій таблиці всі потрібні аркуші, списки та «Підсумки», а потім попрошу токен Telegram. Це безпечно: готові дані не видаляються. Продовжити?', ui.ButtonSet.OK_CANCEL);
  if (go !== ui.Button.OK) return;
  bot_withLock(function () { bot_setupAll(); });
  if (!bot_prop(BOT_PROP.TG_TOKEN)) { if (!bot_menuToken()) { bot_alert_('Майже готово', 'Аркуші створено. Токен можна ввести пізніше: 🤖 Бот → Ввести токен Telegram.'); return; } }
  try {
    var u = bot_enableBot();
    bot_alert_('Готово!', 'Аркуші створено, бот @' + u + ' увімкнений.\n\nДалі:\n1) напишіть боту в особисті /start — ви станете власником;\n2) у гілці «Замовлення на клієнта» напишіть /bind orders;\n3) у гілці «Реєстри» напишіть /bind report;\n4) 🤖 Бот → Імпорт з попередньої версії.');
  } catch (e) { bot_alert_('Не вдалося увімкнути бота', e.message); }
}

// ---------- імпорт ----------

function bot_menuImport() {
  var ui = bot_ui_();
  if (!bot_importTargetIsEmpty()) {
    bot_alert_('Імпорт неможливий', 'У цій таблиці вже є замовлення або оплати. Імпорт робиться один раз у порожню таблицю — щоб не було дублів.');
    return;
  }
  var r = ui.prompt('Імпорт з попередньої версії', 'Вставте посилання на СТАРУ таблицю «Звітність Монокло — Кузнець 2026». Вона лише читається, нічого в ній не зміниться.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var url = r.getResponseText().trim();
  if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) { bot_alert_('Це не схоже на посилання', 'Скопіюйте адресу таблиці з рядка браузера.'); return; }
  try {
    bot_ss().toast('Імпортую… це може зайняти 1–2 хвилини', '🤖 Бот', 120);
    var rep = bot_importFromUrl(url);
    bot_alert_('Імпорт завершено', bot_importReportText(rep, false));
    if (bot_ownerIds().length && bot_prop(BOT_PROP.TG_TOKEN)) bot_sendToOwners(bot_importReportText(rep, true));
  } catch (e) { bot_alert_('Імпорт не вдався', e.message); }
}

// ---------- перевірка ----------

function bot_healthChecks() {
  var out = [];
  function add(ok, text) { out.push((ok ? '🟢 ' : '🔴 ') + text); }
  var token = bot_prop(BOT_PROP.TG_TOKEN);
  add(!!token, token ? 'Токен Telegram введено' : 'Токен Telegram не введено');
  if (token) {
    try { var me = bot_tg('getMe', {}); add(true, 'Telegram відповідає: @' + me.username); } catch (e) { add(false, 'Telegram: ' + e.message); }
    try { var wh = bot_tg('getWebhookInfo', {}); add(!wh.url, wh.url ? 'Увімкнено вебхук — натисніть «Увімкнути бота»' : 'Вебхука немає (правильно)'); } catch (e) { add(false, 'getWebhookInfo: ' + e.message); }
  }
  var triggers = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'bot_poll'; });
  add(triggers.length === 1, triggers.length === 1 ? 'Тригер «щохвилини» працює' : (triggers.length ? 'Тригерів забагато: ' + triggers.length : 'Тригера немає — «Увімкнути бота»'));
  var last = Number(bot_prop(BOT_PROP.LAST_POLL_TS) || 0);
  var age = last ? Math.round((Date.now() - last) / 60000) : null;
  add(age !== null && age <= 3, age === null ? 'Бот ще не опитував Telegram' : 'Останнє опитування: ' + age + ' хв тому');
  add(bot_ownerIds().length > 0, bot_ownerIds().length ? 'Власник: ' + bot_ownerIds().join(', ') : 'Власника немає — напишіть боту /start');
  add(!!bot_setting('GROUP_CHAT_ID') && bot_setting('ORDERS_THREAD_ID') !== '', 'Гілка замовлень (/bind orders): ' + (bot_setting('ORDERS_THREAD_ID') !== '' ? 'задано' : 'не задано'));
  add(!!bot_setting('GROUP_CHAT_ID') && bot_setting('REPORT_THREAD_ID') !== '', 'Гілка звіту (/bind report): ' + (bot_setting('REPORT_THREAD_ID') !== '' ? 'задано' : 'не задано'));
  var np = !!bot_prop(BOT_PROP.NP_KEY);
  add(np, np ? 'Ключ Нової пошти введено' : 'Ключ Нової пошти не введено (статуси ТТН не оновлюватимуться)');
  if (np) { try { bot_npPing(); add(true, 'Нова пошта відповідає'); } catch (e) { add(false, 'Нова пошта: ' + e.message); } }
  var missing = Object.keys(BOT_SHEETS).filter(function (k) { return !bot_ss().getSheetByName(BOT_SHEETS[k]); });
  add(!missing.length, missing.length ? 'Немає аркушів: ' + missing.map(function (k) { return BOT_SHEETS[k]; }).join(', ') + ' — «Перше налаштування»' : 'Усі аркуші на місці');
  var st = bot_selfTest();
  add(st.failed === 0, 'Самоперевірка розбору замовлень: ' + st.passed + '/' + st.total);
  return out;
}

function bot_menuHealth() {
  try { bot_alert_('Перевірка', bot_healthChecks().join('\n')); } catch (e) { bot_alert_('Помилка перевірки', e.message); }
}

function bot_menuLog() {
  var sh = bot_ss().getSheetByName(BOT_SHEETS.log);
  if (!sh) { bot_alert_('Лог', 'Аркуша «Лог» ще немає — запустіть «Перше налаштування».'); return; }
  bot_ss().setActiveSheet(sh);
  sh.getRange(Math.max(sh.getLastRow(), 1), 1).activate();
}
