/* ALL_IN_ONE.gs — згенеровано командою `node build.js` з окремих файлів. Не редагуйте вручну. */

// ======================= Config.gs =======================
/**
 * Config.gs — константи, назви аркушів і колонок, налаштування за замовчуванням.
 * Тут НЕМАЄ викликів Google (щоб файл можна було перевірити в Node).
 * Токени (Telegram, Нова пошта) тут і в таблиці НЕ зберігаються — лише в Script Properties.
 */

var BOT_TZ = 'Europe/Kyiv';

// ---- Назви аркушів ----
var BOT_SHEETS = {
  summary: 'Підсумки',
  orders: 'Замовлення',
  payments: 'Оплати',
  price: 'Прайс',
  lists: 'Довідники',
  recon: 'Звірки',
  reconDetails: 'Звірки_деталі',
  monthly: 'Місячні звіти',
  settings: 'Налаштування',
  ttn: 'ТТН',
  registries: 'Реєстри',
  log: 'Лог'
};

// ---- Аркуш «Замовлення»: внутрішній ключ → заголовок (колонки шукаємо за заголовком) ----
var BOT_ORDER_COLS = [
  ['no', '№ замовлення'],
  ['date', 'Дата замовлення'],
  ['print', 'Принт'],
  ['type', 'Тип речі'],
  ['color', 'Колір'],
  ['size', 'Розмір'],
  ['placement', 'Розміщення принту'],
  ['prints', 'Принтів'],
  ['colorCode', 'Код кольору (хN)'],
  ['ttn', 'ТТН'],
  ['ttnDate', 'Дата створення ТТН'],
  ['stage', 'Етап доставки'],
  ['npStatus', 'Статус НП'],
  ['cost', 'Собівартість, грн'],
  ['status', 'Статус замовлення'],
  ['paid', 'Оплата'],
  ['paidDate', 'Дата оплати'],
  ['recon', 'Звірка'],
  ['note', 'Примітка'],
  ['msgId', 'msg_id'],
  ['handoff', 'Дата передачі НП'],
  ['arrived', 'Прибуло у відділення']   // службова (прихована): коли посилка вперше з'явилась «На відділенні»
];

var BOT_PAY_COLS = [
  ['no', '№ оплати'],
  ['date', 'Дата оплати'],
  ['sum', 'Сума оплати'],
  ['bank', 'Спосіб / банк'],
  ['receipt', '№ квитанції'],
  ['accum', 'Накопичено оплат'],
  ['cost', 'Собівартість'],
  ['balance', 'Залишок боргу'],
  ['recon', 'Звірка']
];

var BOT_RECON_COLS = [
  ['id', 'ID'],
  ['date', 'Дата'],
  ['fileLink', 'Файл'],
  ['hash', 'Хеш'],
  ['ttnCount', 'ТТН у файлі'],
  ['fileSum', 'Сума файлу'],
  ['toPay', 'До оплати'],
  ['diff', 'Різниця, грн'],
  ['confirmedSum', 'Підтверджена сума'],
  ['status', 'Статус'],
  ['confirmedAt', 'Час підтвердження'],
  ['rowsCount', 'Рядків'],
  ['confirmedBy', 'Хто підтвердив'],
  ['fileName', 'Назва файлу'],
  ['summaryMsg', 'Повідомлення зведення'],
  ['fileData', 'Дані файлу']
];

var BOT_DETAIL_COLS = [
  ['recon', 'ID звірки'],
  ['ttn', 'ТТН'],
  ['orders', '№ замовлень'],
  ['items', 'Речі'],
  ['fileSum', 'Сума файлу'],
  ['tableSum', 'Сума таблиці'],
  ['diff', 'Різниця'],
  ['fileStatus', 'Статус з файлу'],
  ['category', 'Категорія'],
  ['decision', 'Рішення']
];

var BOT_MONTHLY_COLS = [
  'Місяць', 'Речей', 'Футболок', 'Худі фліс', 'Худі не утеплене', 'Собівартість', 'Оплачено',
  'Борг на кінець', 'Відмов', 'Відмов, грн', '% відмов', 'Середній термін, дн', '% за ≤1 день'
];

// ---- Аркуш «ТТН»: один рядок = одна ТТН (описи для Нової пошти) ----
var BOT_TTN_COLS = [
  ['ttn', 'ТТН'],
  ['orders', 'Номери замовлень'],
  ['original', 'Оригінал'],
  ['desc', 'Опис'],
  ['len', 'Символів'],
  ['status', 'Статус опису'],
  ['written', 'Записано'],
  ['registry', 'Реєстр'],
  ['note', 'Примітка'],
  ['msgId', 'msg_id'],
  ['npRef', 'NP Ref']        // службова (прихована): Ref документа в Новій пошті
];
var BOT_TTN_STATUSES = ['Новий', 'Чекає рішення', 'Записано в НП', 'Помилка НП', 'Перевірка', 'Знято'];   // «Знято» — ТТН прибрано/замінено в повідомленні або всі замовлення скасовано: не пишемо в НП, не йде в реєстр

// ---- Аркуш «Реєстри» ----
var BOT_REG_COLS = [
  ['date', 'Дата'],
  ['no', '№ реєстру НП'],
  ['ref', 'Ref реєстру'],
  ['range', 'Діапазон'],
  ['count', 'Кількість ТТН'],
  ['fileId', 'file_id PDF'],
  ['status', 'Статус'],
  ['ttns', 'ТТН']
];

var BOT_PRICE_COLS = ['Тип речі', 'Собівартість, грн', 'Діє з', 'Примітка'];

// ---- Довідники (значення списків) ----
var BOT_TYPES = ['Футболка', 'Худі фліс', 'Худі не утеплене'];   // «Стікерпак» і «Кепка» додаються з Прайсу
var BOT_COLORS = ['Чорний', 'Білий', 'Сірий', 'Графітовий'];
// Код кольору в повідомленні («x1», «х3»…): на цьому друці це колір худі.
var BOT_COLOR_CODES = { 1: 'Чорний', 2: 'Білий', 3: 'Графітовий', 4: 'Сірий' };
var BOT_CODE_OF_COLOR_ = { 'Чорний': 1, 'Білий': 2, 'Графітовий': 3, 'Сірий': 4 };
var BOT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
var BOT_PLACEMENTS = ['Позаду', 'Спереду', 'Спереду і позаду', 'Як на візуалі'];
var BOT_STAGES = ['Немає ТТН', 'Не передана', 'В дорозі', 'На відділенні', 'Отримано', 'Відмова', 'Повернення'];
var BOT_ORDER_STATUSES = ['В роботі', 'Скасовано', 'Переробка', 'Брак'];
var BOT_PAID_VALUES = ['Не оплачено', 'Оплачено', 'Спірна'];

// Кінцеві етапи: такі рядки НП більше не оновлює
var BOT_FINAL_STAGES = ['Отримано', 'Повернення'];

// ---- Початковий прайс ----
var BOT_DEFAULT_PRICES = [
  ['Футболка', 420, '01.01.2026', ''],
  ['Худі фліс', 740, '01.01.2026', ''],
  ['Худі не утеплене', 740, '01.01.2026', ''],
  ['Стікерпак', 0, '01.01.2026', 'свій товар: постачаємо виробництву самі'],
  ['Кепка', 0, '01.01.2026', 'ЗАПОВНІТЬ ціну кепки'],
  ['Худі виварене', 1490, '01.01.2026', 'будь-яке виварене — 1490'],
  ['Футболка виварена', 1490, '01.01.2026', 'будь-яке виварене — 1490'],
  ['Кепка виварена', 1490, '01.01.2026', 'будь-яке виварене — 1490'],
  ['Виварене', 1490, '01.01.2026', 'виварене, вид речі не розпізнано — 1490']
];

// Типи без розміру й кольору (їх відсутність не вважається проблемою замовлення)
var BOT_NO_SIZE_COLOR_TYPES = ['Стікерпак', 'Кепка', 'Кепка виварена'];
// «Виварене»: будь-яка виварена річ (худі, футболка, кепка) — окремий тип з ціною 1490 грн
var BOT_WASHED_TYPES = ['Худі виварене', 'Футболка виварена', 'Кепка виварена', 'Виварене'];

// ---- Налаштування (аркуш «Налаштування»): [параметр, значення за замовчуванням, пояснення] ----
var BOT_DEFAULT_SETTINGS = [
  ['OWNER_IDS', '', 'ID власників у Telegram (через кому). Заповнюється, коли власник напише боту /start'],
  ['GROUP_CHAT_ID', '', 'ID групи з виробництвом (ставиться командою /bind)'],
  ['ORDERS_THREAD_ID', '', 'ID гілки «Замовлення на клієнта» (/bind orders)'],
  ['REPORT_THREAD_ID', '', 'ID гілки «Реєстри» (/bind registry)'],
  ['REPORT_TIME', '09:00', 'Час ранкового звіту (за Києвом)'],
  ['REPORT_DAYS', 'Пн,Вт,Ср,Чт,Пт,Сб', 'Дні тижня ранкового звіту'],
  ['REPORT_WARN_DAYS', '3', 'У ранковий звіт потрапляють лише ТТН, не передані ця кількість днів і більше'],
  ['STORAGE_WARN_DAYS', '4', 'Скільки днів посилка чекає на відділенні, щоб потрапити у звіт власнику'],
  ['NP_SENDER_PHONE', '', 'Телефон відправника (необов\'язково): тоді НП повертає ім\'я і телефон отримувача'],
  ['MONTHLY_REPORT', 'так', 'Місячний звіт 1-го числа: так / ні'],
  ['REACTIONS', 'так', 'Ставити реакцію 👌 на прийняте замовлення: так / ні'],
  ['OPENING_DEBT', '2227020', 'Початковий залишок боргу, грн (борг станом на 31.08.2026 з урахуванням оплат по 08.09.2026 включно). Порожньо — не враховувати'],
  ['OPENING_ORDERS_AFTER', '31.08.2026', 'У собівартість беруться замовлення з датою ПІСЛЯ цієї (раніші вже в початковому залишку)'],
  ['OPENING_PAYS_AFTER', '08.09.2026', 'В оплати беруться платежі з датою ПІСЛЯ цієї (до неї включно — вже в початковому залишку)'],
  ['PAY_RED_PERCENT', '10', 'Покриття місяця: оплачено менше собівартості, але не більше ніж на цей % — «жовтий» (недоплата); більше — «червоний» (велика різниця); не менше собівартості — «зелений»'],
  ['DESC_MODE', 'повний', 'Формат опису: «повний» — повний опис кожного замовлення, а якщо не вміщається — лише номери замовлень; «драбина» — з проміжними скороченнями (чор, Всі позаду, без пробілів у назвах, без (W)/(B))'],
  ['PAY_CHAT_ID', '', 'ID чату «Отправка отчет» (ставиться командою /bind payments у тому чаті): повідомлення власника «+10 000» стають оплатами'],
  ['PAY_THREAD_ID', '', 'ID гілки чату оплат (якщо чат з гілками)'],
  ['REGISTRY_USERS', '5411130511, 5814974771, 1143277277, 632064984, 1225142225, 307680605', 'Telegram ID людей з виробництва (через кому), яким дозволено викликати /registry у гілці «Реєстри» (створити реєстр у будь-який час). ID людина дізнається командою /id'],
  ['PAY_EXPORT_FROM', '', 'Імпорт оплат з експорту чату: брати лише повідомлення цих відправників (імена з експорту через кому). Порожньо — усі (бот покаже перелік відправників)'],
  ['DESC_LIMIT', '100', 'Максимум символів в описі ТТН (Додаткова інформація в Новій пошті)'],
  ['DESC_FROM_ORDER', '15088', 'Описи й реєстр — лише для ТТН, де є замовлення з номером БІЛЬШЕ за це (старіші бот не чіпає)'],
  ['NP_MODE', 'перевірка', 'Режим запису в Нову пошту: «перевірка» (нічого не пишемо, лише надсилаємо власнику) або «бойовий»'],
  ['REMIND_TIME', '09:45', 'Час нагадування про ТТН з проблемами і повтору запису в НП (за Києвом)'],
  ['REGISTRY_TIME', '10:00', 'Час щоденного реєстру (за Києвом); реєстр робиться щодня, без ТТН — мовчимо'],
  ['ARCHIVE_FOLDER_ID', '', 'ID папки Google Диска з файлами виробництва (створюється автоматично)']
];

// ---- Ключі Script Properties ----
var BOT_PROP = {
  TG_TOKEN: 'TG_TOKEN',
  NP_KEY: 'NP_API_KEY',
  OFFSET: 'UPDATE_OFFSET',
  LAST_REPORT_DATE: 'LAST_REPORT_DATE',
  LAST_PRE_REFRESH: 'LAST_PRE_REFRESH_DATE',
  LAST_MONTH_REPORT: 'LAST_MONTH_REPORT',
  LAST_POLL_TS: 'LAST_POLL_TS',
  POLL_LOCK_TS: 'POLL_LOCK_TS',
  LAST_NP_TS: 'LAST_NP_UPDATE_TS',
  LAST_NP_FULL: 'LAST_NP_FULL_TS',
  PENDING_DELETE: 'PENDING_DELETE',
  PENDING_INPUT: 'PENDING_INPUT',
  ENABLED: 'BOT_ENABLED',
  BOT_USERNAME: 'BOT_USERNAME',
  IMPORT_NP_QUEUE: 'IMPORT_NP_QUEUE',
  LAST_REGISTRY_DATE: 'LAST_REGISTRY_DATE',
  LAST_REMIND_DATE: 'LAST_REMIND_DATE',
  NP_TEST_OK: 'NP_TEST_OK'
};

var BOT_ALLOWED_UPDATES = ['message', 'edited_message', 'callback_query', 'my_chat_member'];

var BOT_COLOR_YELLOW = '#fff2cc';

var BOT_DAYS_UA = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
var BOT_WEEKDAYS_UA_FULL = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'];
var BOT_MONTHS_UA = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];


// ======================= Core.gs =======================
/**
 * Core.gs — чиста логіка БЕЗ викликів Google API (її перевіряють тести в Node, див. tests/).
 * Дати, форматування, нормалізація ТТН / розмірів / типу / кольору, розбір підпису замовлення,
 * прайс, розбір файлу виробництва, правила імпорту.
 */

// =====================================================================
// Дати (Київ). Рахуємо вручну, без Intl і без залежності від поясу сервера.
// =====================================================================

function bot_lastSundayUtcMs_(year, month0) {
  var last = new Date(Date.UTC(year, month0 + 1, 0, 1, 0, 0));
  return last.getTime() - last.getUTCDay() * 86400000;
}

/** Зсув Києва відносно UTC, хвилини: 180 влітку (EEST), 120 взимку (EET). */
function bot_kyivOffsetMin(date) {
  var t = date.getTime();
  var y = new Date(t).getUTCFullYear();
  return (t >= bot_lastSundayUtcMs_(y, 2) && t < bot_lastSundayUtcMs_(y, 9)) ? 180 : 120;
}

function bot_kyivParts(date) {
  var d = new Date(date.getTime() + bot_kyivOffsetMin(date) * 60000);
  return {
    y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
    h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(), dow: d.getUTCDay()
  };
}

function bot_pad2(n) { return (n < 10 ? '0' : '') + n; }

function bot_dayKey(date) {
  var p = bot_kyivParts(date);
  return p.y + '-' + bot_pad2(p.m) + '-' + bot_pad2(p.d);
}

function bot_monthKey(date) {
  var p = bot_kyivParts(date);
  return p.y + '-' + bot_pad2(p.m);
}

/** Номер дня (Київ) — для різниці в календарних днях. */
function bot_dayNum(date) {
  var p = bot_kyivParts(date);
  return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 86400000);
}

function bot_daysBetween(from, to) { return bot_dayNum(to) - bot_dayNum(from); }

/** Дата «північ за Києвом» незалежно від поясу сервера. */
function bot_makeDate(y, m, d) {
  var t0 = Date.UTC(y, m - 1, d);
  var off = bot_kyivOffsetMin(new Date(t0 - 3 * 3600000));
  return new Date(t0 - off * 60000);
}

function bot_fmtDate(date) {
  if (!bot_isDate(date)) return '';
  var p = bot_kyivParts(date);
  return bot_pad2(p.d) + '.' + bot_pad2(p.m) + '.' + p.y;
}

function bot_fmtDM(date) {
  if (!bot_isDate(date)) return '';
  var p = bot_kyivParts(date);
  return bot_pad2(p.d) + '.' + bot_pad2(p.m);
}

function bot_fmtTime(date) {
  var p = bot_kyivParts(date);
  return bot_pad2(p.h) + ':' + bot_pad2(p.mi);
}

function bot_fmtDateTime(date) {
  if (!bot_isDate(date)) return '';
  return bot_fmtDM(date) + ' ' + bot_fmtTime(date);
}

function bot_isDate(v) {
  return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
}

/** Приймає Date, «ДД.ММ.РРРР», «РРРР-ММ-ДД», «ДД-ММ-РРРР [гг:хх:сс]». Повертає Date або null. */
function bot_parseDate(v) {
  if (bot_isDate(v)) return v;
  if (v === null || v === undefined || v === '') return null;
  var s = String(v).trim();
  var m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  var y, mo, d, h = 0, mi = 0, sec = 0;
  if (m) { d = +m[1]; mo = +m[2]; y = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); sec = +(m[6] || 0); }
  else {
    m = s.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) return null;
    y = +m[1]; mo = +m[2]; d = +m[3]; h = +(m[4] || 0); mi = +(m[5] || 0); sec = +(m[6] || 0);
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  if (new Date(Date.UTC(y, mo - 1, d)).getUTCDate() !== d) return null;             // 31.02 тощо — не існує
  var base = bot_makeDate(y, mo, d);
  return new Date(base.getTime() + ((h * 60 + mi) * 60 + sec) * 1000);
}

// =====================================================================
// Числа, гроші, текст
// =====================================================================

function bot_toNumber(v) {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (v === null || v === undefined) return null;
  var s = String(v).replace(/[\s ]/g, '').replace(/грн\.?/i, '').replace(',', '.');
  if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return null;
  return parseFloat(s);
}

function bot_round2(n) { return Math.round(n * 100) / 100; }

/** 43240 → «43 240»; 1160.5 → «1 160,50». */
function bot_fmtNum(n) {
  n = bot_round2(n);
  var neg = n < 0;
  var s = Math.abs(n).toFixed(Number.isInteger(n) ? 0 : 2).split('.');
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + s.join(',');
}

function bot_fmtMoney(n) { return bot_fmtNum(n) + ' грн'; }

/** +320 грн / −420 грн / 0 грн */
function bot_fmtSigned(n) {
  n = bot_round2(n);
  if (n === 0) return '0 грн';
  return (n > 0 ? '+' : '−') + bot_fmtNum(Math.abs(n)) + ' грн';
}

function bot_esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bot_code(s) { return '<code>' + bot_esc(s) + '</code>'; }

function bot_trim(s) { return String(s === null || s === undefined ? '' : s).replace(/[ ​]/g, ' ').trim(); }

// =====================================================================
// Нормалізація
// =====================================================================

/** ТТН у рядок цифр: число, текст, «2045 1482 …», «20451482476846.0», «2.0451482476846e13», апостроф. */
function bot_normTtn(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {
    if (!isFinite(v)) return '';
    var r = Math.round(v);
    return (r >= 0 && r < 1e21) ? String(r) : '';                  // звичайне перетворення числа: не залежимо від локалізованого форматування в Apps Script
  }
  var s = String(v).replace(/[\s '’`]/g, '');
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, '');
  else if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) {
    return bot_normTtn(Number(s));
  }
  return s.replace(/\D/g, '');
}

function bot_isTtn(s) { return /^\d{14}$/.test(s); }

var BOT_CYR_TO_LAT_SIZE_ = { 'М': 'M', 'м': 'M', 'С': 'S', 'с': 'S', 'Х': 'X', 'х': 'X', 'Л': 'L', 'л': 'L' };

/** Розмір → XS S M L XL XXL XXXL. Порожній рядок, якщо не розпізнано. */
function bot_normSize(v) {
  var s = bot_trim(v).replace(/^розмір\s*[:\-]?\s*/i, '').replace(/\s+/g, '');
  if (!s) return '';
  s = s.replace(/[МмСсХхЛл]/g, function (c) { return BOT_CYR_TO_LAT_SIZE_[c]; }).toUpperCase();
  if (s === '2XL') s = 'XXL';
  if (s === '3XL') s = 'XXXL';
  return BOT_SIZES.indexOf(s) >= 0 ? s : '';
}

/** Латинські літери-двійники → кириличні (менеджери іноді пишуть «cіра» з латинською c). */
function bot_deLatin_(s) {
  var map = { a: 'а', c: 'с', e: 'е', i: 'і', k: 'к', m: 'м', o: 'о', p: 'р', x: 'х', y: 'у', h: 'н', t: 'т', b: 'в' };
  return String(s).replace(/[acekimopxyhtb]/g, function (ch) { return map[ch]; });
}

function bot_normColor(text) {
  var t = bot_deLatin_(bot_trim(text).toLowerCase());
  if (/чорн/.test(t)) return 'Чорний';
  if (/біл/.test(t)) return 'Білий';
  if (/графіт/.test(t)) return 'Графітовий';
  if (/сір/.test(t)) return 'Сірий';
  return '';
}

/**
 * Тип і колір з рядка на кшталт «Худі чорне без флісу» / «Футболка біла».
 * Повертає {type, color, ambiguous}. ambiguous=true — це худі без уточнення (є/нема фліс).
 */
function bot_parseTypeColor(text) {
  var t = bot_trim(text).toLowerCase();
  if (/[а-яіїєґ]/.test(t)) t = bot_deLatin_(t);            // змішані латиниця + кирилиця → кирилиця
  var res = { type: '', color: bot_normColor(t), ambiguous: false, found: false };
  if (/стік[еи]р\s*-?\s*пак/.test(t)) { res.type = 'Стікерпак'; res.found = true; res.color = ''; return res; }
  if (/^кепк/.test(t)) { res.type = 'Кепка'; res.found = true; res.color = ''; return res; }
  if (/футболк/.test(t)) { res.type = 'Футболка'; res.found = true; return res; }
  if (/худі|худи/.test(t)) {
    res.found = true;
    if (/без\s+фліс|не\s*утепл|без\s+утепл/.test(t)) res.type = 'Худі не утеплене';
    else if (/фліс|утепл/.test(t)) res.type = 'Худі фліс';
    else res.ambiguous = true;
  }
  return res;
}

/** Розміщення принту → одне з 4 значень або ''. */
function bot_normPlacement(v) {
  var t = bot_trim(v).toLowerCase();
  if (!t) return '';
  if (/візуал/.test(t)) return 'Як на візуалі';
  var front = /спереду|попереду|перед/.test(t);
  var back = /позаду|ззаду|зад|спин/.test(t);
  if (front && back) return 'Спереду і позаду';
  if (back) return 'Позаду';
  if (front) return 'Спереду';
  return '';
}

/** «ДВА» в назві принта → 2 принти. */
function bot_countPrints(printText) {
  return /(^|[^а-яіїєґ])два(?![а-яіїєґ])/i.test(String(printText || '')) ? 2 : 1;
}

// =====================================================================
// Розбір підпису замовлення з групи (розділ 4.2)
// =====================================================================

/** Код кольору: «x3» / «х3» / «×3» окремим словом (не «XL», не «2XL»). */
var BOT_QTY_RE_ = /(^|\s)[xXхХ×]\s*(\d{1,2})(?=\s|$|[^\dA-Za-zА-Яа-яІіЇїЄєҐґ])/;

var BOT_PREFIX_RE_ = /^[\s❗‼⚠️!]*(терміново[\s:!—\-]*)?/i;

/** Рядок початку замовлення: «1538. Принт …», «1542 Принт …», «❗️ТЕРМІНОВО 1520. Принт …». → {no, rest} | null */
function bot_orderStart_(line) {
  var s = bot_trim(line).replace(BOT_PREFIX_RE_, '');
  // «1538. Принт …» / «1538) …» — будь-який номер; без крапки — лише 3+ цифри і слово «Принт» далі
  // (щоб «2 принти на завтра» з розмови не вважалось замовленням №2)
  var m = s.match(/^(?:(\d{1,6})[.)]\s*|(\d{3,6})\s+(?=принт))(.+)$/i);
  return m ? { no: parseInt(m[1] || m[2], 10), rest: m[3].trim() } : null;
}

/** Непорожні рядки; рядки-«префікси» на кшталт «❗️ТЕРМІНОВО» прибираємо. */
function bot_cleanLines_(text) {
  return String(text || '').split(/\r?\n/).map(bot_trim).filter(function (l) {
    return l !== '' && l.replace(BOT_PREFIX_RE_, '') !== '';
  });
}

function bot_parseOrderSegment_(lines) {
  var st = bot_orderStart_(lines[0]);
  // Усе в одному рядку: «15037. Принт no-risk (W) Худі x3 ❗️БЕЗ ФЛІСУ S» → назва принта + окремий рядок «Худі x3 ❗️БЕЗ ФЛІСУ S»
  var inl = st.rest.match(/^(.+?)\s+((?:футболк\S*|худі|худи)(?:\s.*)?)$/i);
  if (inl && !/^(стік|кепк)/i.test(st.rest) && !lines.slice(1).some(function (l) { return bot_parseTypeColor(l).found; })) {
    st = { no: st.no, rest: inl[1].trim() };
    lines = [lines[0], inl[2].trim()].concat(lines.slice(1));
  }
  var res = {
    ok: true, no: st.no, print: st.rest, prints: bot_countPrints(st.rest), type: '', typeAmbiguous: false, color: '',
    size: '', placement: '', ttn: '', issues: [], ttnShared: false, colorCode: 0, urgent: false
  };
  var badTtn = '', extras = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var qm = line.match(BOT_QTY_RE_);                    // «x3», «х3» (латиниця й кирилиця) — КОД КОЛЬОРУ речі (не кількість!)
    if (qm) { res.colorCode = parseInt(qm[2], 10); line = bot_trim(line.replace(BOT_QTY_RE_, '$1')); if (!line) continue; }
    if (/(^|[^а-яіїєґ])два\s+принт/i.test(line)) { res.prints = 2; continue; }   // окремий рядок «ДВА ПРИНТА»
    var digits = line.replace(/[\s ]/g, '').replace(/^(ттн|тт|№)[:\-]?/i, '');

    if (/^\d{8,}$/.test(digits)) {                      // рядок із самих цифр — це ТТН
      if (bot_isTtn(digits)) { if (!res.ttn) res.ttn = digits; } else { badTtn = digits; }
      continue;
    }
    var sz = bot_normSize(line);
    if (sz && !res.size && line.length <= 14) { res.size = sz; continue; }

    var tc = bot_parseTypeColor(line);
    if (tc.found && !res.size) { var lastTok = line.split(/\s+/).pop(); if (line.split(/\s+/).length > 1) { var szT = bot_normSize(lastTok); if (szT) res.size = szT; } }   // розмір в кінці того ж рядка: «Худі x3 БЕЗ ФЛІСУ S»
    if (tc.found && !res.type && !res.typeAmbiguous) {
      if (tc.ambiguous) res.typeAmbiguous = true; else res.type = tc.type;
      if (tc.color) res.color = tc.color;
      continue;
    }
    var pl = bot_normPlacement(line);
    var strong = /принт|візуал/i.test(line) || /^\s*(спереду|позаду|попереду|ззаду)\s*$/i.test(line);
    if (pl && strong) { if (!res.placement) res.placement = pl; continue; }
    if (!res.color) { var c = bot_normColor(line); if (c && line.length <= 20) { res.color = c; continue; } }
    extras.push(line);                                  // напр. «FC BARCA (PERED) W - ПЕРЕД» — опис принта
  }
  if (!res.type && /стік[еи]р\s*-?\s*пак/i.test(bot_deLatin_(res.print.toLowerCase()))) res.type = 'Стікерпак';   // «1500. Стікерпак Ландо Норріс»
  if (!res.type && /^кепк/i.test(bot_deLatin_(res.print.toLowerCase()))) res.type = 'Кепка';                          // «15100. Кепка Ferrari - 0132»
  if (/^принти?\s*$/i.test(res.print) && extras.length) res.print = res.print + ' ' + extras.join(' / ');

  // «виварене» (будь-яка річ) — окремий тип з власною ціною: Худі виварене / Футболка виварена / Кепка виварена / Виварене
  var washedTxt = (res.print + ' ' + lines.join(' ')).toLowerCase();
  if (/виварен/.test(washedTxt) && res.type !== 'Стікерпак') {
    if (res.type === 'Кепка') res.type = 'Кепка виварена';
    else if (res.type === 'Футболка') res.type = 'Футболка виварена';
    else if (res.type === 'Худі фліс' || res.type === 'Худі не утеплене' || res.typeAmbiguous) { res.type = 'Худі виварене'; res.typeAmbiguous = false; }
    else if (!res.type) res.type = 'Виварене';
  }
  if (!res.type) {
    res.issues.push({ field: 'type', text: res.typeAmbiguous ? 'Худі: не вказано «з флісом» чи «без флісу»' : 'не вказано вид речі (футболка / худі)' });
  }
  var noSz = BOT_NO_SIZE_COLOR_TYPES.indexOf(res.type) >= 0;
  if (!res.color && res.colorCode && BOT_COLOR_CODES[res.colorCode]) res.color = BOT_COLOR_CODES[res.colorCode];   // х1 чорний, х3 графітовий, х4 сірий
  // колір обов'язковий лише для футболки: у повідомленнях склад не пише колір худі
  if (!res.color && !noSz && res.type !== 'Худі фліс' && res.type !== 'Худі не утеплене' && res.type !== 'Худі виварене' && !res.typeAmbiguous) res.issues.push({ field: 'color', text: 'не вказано колір' });
  if (!res.size && !noSz) res.issues.push({ field: 'size', text: 'не вказано розмір' });
  if (!res.ttn) {
    res.issues.push({ field: 'ttn', text: badTtn ? 'ТТН «' + badTtn + '» — не 14 цифр' : 'немає ТТН' });
  }
  return res;
}

/**
 * Розбір повідомлення з групи → МАСИВ замовлень (одне повідомлення може містити кілька замовлень
 * з однією спільною ТТН внизу). Порожній масив — це не замовлення (мовчки ігноруємо).
 */
function bot_parseOrderMessage(text) {
  var lines = bot_cleanLines_(text);
  if (!lines.length || !bot_orderStart_(lines[0])) return [];
  var segs = [], cur = null;
  lines.forEach(function (l) {
    if (bot_orderStart_(l)) { cur = [l]; segs.push(cur); } else if (cur) cur.push(l);
  });
  var out = segs.map(bot_parseOrderSegment_);
  if (/терміново/i.test(String(text))) out.forEach(function (o) { o.urgent = true; });   // «ТЕРМІНОВО» де завгодно в повідомленні
  for (var i = out.length - 2; i >= 0; i--) {           // спільна ТТН внизу діє на всі замовлення вище
    if (!out[i].ttn && out[i + 1].ttn) {
      out[i].ttn = out[i + 1].ttn; out[i].ttnShared = true;
      out[i].issues = out[i].issues.filter(function (x) { return x.field !== 'ttn'; });
    }
  }
  return out;
}

/** Перше замовлення з повідомлення (сумісність). */
function bot_parseOrderCaption(text) {
  var list = bot_parseOrderMessage(text);
  if (list.length) return list[0];
  return { ok: false, no: null, print: '', prints: 1, type: '', typeAmbiguous: false, color: '', size: '', placement: '', ttn: '', issues: [] };
}

// =====================================================================
// Прайс (історія цін)
// =====================================================================

/**
 * priceRows: [{type, price, from:Date|null}] ; повертає ціну, що діяла на дату date (або null).
 * Якщо date нема — остання чинна на сьогодні (today).
 */
function bot_priceFor(priceRows, type, date, today) {
  var ref = bot_isDate(date) ? date : (today || new Date());
  var best = null;
  priceRows.forEach(function (r) {
    if (r.type !== type) return;
    var from = r.from;
    if (from && from.getTime() > ref.getTime() + 86399999) return;
    if (!best || ((from ? from.getTime() : 0) >= (best.from ? best.from.getTime() : 0))) best = r;
  });
  return best ? Number(best.price) : null;
}

/** Чинні ціни на сьогодні: [{type, price, from}] */
function bot_currentPrices(priceRows, today) {
  var types = [];
  priceRows.forEach(function (r) { if (types.indexOf(r.type) < 0) types.push(r.type); });
  return types.map(function (t) {
    var best = null;
    priceRows.forEach(function (r) {
      if (r.type !== t) return;
      if (r.from && r.from.getTime() > (today || new Date()).getTime() + 86399999) return;
      if (!best || ((r.from ? r.from.getTime() : 0) >= (best.from ? best.from.getTime() : 0))) best = r;
    });
    return best ? { type: t, price: Number(best.price), from: best.from } : null;
  }).filter(Boolean);
}

/** «/price Худі фліс 780 15.11.2026» → {type, price, from} або {error}. */
function bot_parsePriceCommand(arg, knownTypes, today) {
  var m = String(arg || '').trim().match(/^(.+?)\s+(\d+(?:[.,]\d+)?)(?:\s+(\d{1,2}[.\-\/]\d{1,2}[.\-\/]\d{4}))?$/);
  if (!m) return { error: 'Формат: /price Худі фліс 780 15.11.2026 (дата — необов\'язково)' };
  var typeIn = m[1].trim().toLowerCase();
  var type = '';
  var all = knownTypes.slice();
  all.forEach(function (t) { if (t.toLowerCase() === typeIn) type = t; });
  if (!type) type = m[1].trim().replace(/^./, function (c) { return c.toUpperCase(); });
  var from = m[3] ? bot_parseDate(m[3]) : bot_makeDate(bot_kyivParts(today).y, bot_kyivParts(today).m, bot_kyivParts(today).d);
  if (!from) return { error: 'Не розумію дату «' + m[3] + '». Формат: ДД.ММ.РРРР' };
  return { type: type, price: parseFloat(m[2].replace(',', '.')), from: from, isNew: knownTypes.indexOf(type) < 0 };
}

// =====================================================================
// Файл виробництва (розділ 5.1)
// =====================================================================

var BOT_FILE_ALIASES_ = {
  ttn: ['ттн', 'накладна', 'штрих'],
  sum: ['дроп', 'ціна', 'цена', 'сума', 'сумма'],
  status: ['статус'],
  note: ['примітка', 'примечан', 'коментар'],
  chatNo: ['№ з чату', '№ чату', 'номер замовлення']
};

/** Заголовок підходить, якщо містить псевдонім (і в «як є», і з латинськими двійниками, напр. «TTH» → «ттн»). */
function bot_headerHas_(h, alias) {
  return h.indexOf(alias) >= 0 || bot_deLatin_(h).indexOf(alias) >= 0;
}

function bot_findHeader_(headers, aliases) {
  for (var a = 0; a < aliases.length; a++) {
    for (var i = 0; i < headers.length; i++) {
      if (bot_headerHas_(headers[i], aliases[a])) return i;
    }
  }
  return -1;
}

/**
 * values — двовимірний масив з аркуша файлу.
 * @return {error} або {rows:[{ttn, price, status, note, refusal, chatNo, line}], skipped:[...]}
 */
function bot_parseProductionFile(values) {
  var headerIdx = -1, cols = null, headersRaw = [];
  for (var r = 0; r < Math.min(values.length, 15); r++) {
    var hdr = (values[r] || []).map(function (c) { return bot_trim(c).toLowerCase(); });
    if (bot_findHeader_(hdr, BOT_FILE_ALIASES_.ttn) >= 0 && bot_findHeader_(hdr, BOT_FILE_ALIASES_.sum) >= 0) {
      headerIdx = r; headersRaw = (values[r] || []).map(bot_trim);
      cols = {};
      Object.keys(BOT_FILE_ALIASES_).forEach(function (k) { cols[k] = bot_findHeader_(hdr, BOT_FILE_ALIASES_[k]); });
      break;
    }
  }
  if (headerIdx < 0) {
    var first = (values[0] || []).map(bot_trim).filter(Boolean).join(' | ');
    var h0 = (values[0] || []).map(function (c) { return bot_trim(c).toLowerCase(); });
    var what = bot_findHeader_(h0, BOT_FILE_ALIASES_.ttn) < 0 ? 'ТТН' : 'суму (ціну)';
    return { error: 'Не знайшов колонку ' + what + '. Заголовки файлу: ' + (first || '(порожньо)') };
  }
  var warnings = [];
  var sumCandidates = [];
  headersRaw.forEach(function (h, idx) {
    var low = bot_trim(h).toLowerCase();
    if (BOT_FILE_ALIASES_.sum.some(function (al) { return bot_headerHas_(low, al); })) sumCandidates.push(idx);
  });
  if (sumCandidates.length > 1) {
    warnings.push('У файлі кілька колонок із сумою/ціною (' + sumCandidates.map(function (i) { return '«' + headersRaw[i] + '»'; }).join(', ') +
      '). Використано «' + headersRaw[cols.sum] + '» — перевірте, що це ціна виробництва.');
  }
  var rows = [], skipped = [];
  for (var i = headerIdx + 1; i < values.length; i++) {
    var row = values[i] || [];
    var rawT = row[cols.ttn];
    var ttn = bot_normTtn(rawT);
    var price = bot_toNumber(row[cols.sum]);
    if (!ttn && price === null) continue;                 // порожній рядок або рядок підсумку без ТТН
    if (!ttn) { if (bot_trim(rawT)) skipped.push({ line: i + 1, reason: 'ТТН «' + bot_trim(rawT) + '» не схожа на номер' }); continue; }
    if (price === null) { skipped.push({ line: i + 1, ttn: ttn, reason: 'немає суми' }); continue; }
    var status = cols.status >= 0 ? bot_trim(row[cols.status]) : '';
    rows.push({
      ttn: ttn, price: price, status: status,
      note: cols.note >= 0 ? bot_trim(row[cols.note]) : '',
      refusal: /отказ|відмов/i.test(status),
      chatNo: cols.chatNo >= 0 ? (bot_toNumber(row[cols.chatNo]) || null) : null,
      line: i + 1
    });
  }
  return { rows: rows, skipped: skipped, headers: headersRaw, warnings: warnings };
}

// =====================================================================
// Статуси НП: текст → етап (використовується при імпорті, поки API не оновив)
// =====================================================================

function bot_stageFromText(text) {
  var s = bot_trim(text).toLowerCase();
  if (!s || /^немає\s+ттн/.test(s)) return 'Немає ТТН';
  if (/самостійно створив/.test(s)) return 'Не передана';
  if (/зворотн|повернен|одержано і створено/.test(s)) return 'Повернення';
  if (/відмов/.test(s)) return 'Відмова';
  if (/відправлення отримано|^отримано/.test(s)) return 'Отримано';
  if (/прибув/.test(s)) return 'На відділенні';
  if (/припинено зберігання/.test(s)) return 'Повернення';
  if (/прямує|в місті|у місті|змінено адресу|на шляху|комплектує|невдала|перенесено|передано/.test(s)) return 'В дорозі';
  return '';
}

// =====================================================================
// Правила імпорту зі старої таблиці (розділ 7.5)
// =====================================================================

/**
 * Один рядок старого аркуша «Замовлення» → рядок нової моделі.
 * old: {no, print, color, size, placement, ttn, cost, npStatus, paid}
 * @return {row, notes:[], unrecognized:[]}
 */
function bot_mapOldOrderRow(old) {
  var notes = [], unrec = [];
  var colorText = bot_trim(old.color);
  var tc = bot_parseTypeColor(colorText);
  var type = '', color = tc.color;
  if (tc.found) {
    type = tc.type;
    if (tc.ambiguous) { unrec.push('худі без уточнення «' + colorText + '»'); }
  } else if (color) {
    type = 'Футболка';                       // «Чорна» / «Біла» / «Сіра» → Футболка
  } else if (colorText) {
    unrec.push('колір «' + colorText + '»');
  }

  var sizeRaw = bot_trim(old.size);
  var size = bot_normSize(sizeRaw);
  if (sizeRaw && !size) unrec.push('розмір «' + sizeRaw + '»');

  var plRaw = bot_trim(old.placement);
  var placement = bot_normPlacement(plRaw);
  if (!placement && plRaw) notes.push('Розміщення було: ' + plRaw);

  var printText = bot_trim(old.print);
  var cost = bot_toNumber(old.cost);
  if (cost === null) cost = 0;

  var status = 'В роботі';
  if (cost === 0) {
    var lower = printText.toLowerCase();
    if (/переробк/.test(lower)) status = 'Переробка';
    else if (/брак/.test(lower)) status = 'Брак';
    else if (/скасов|відмін/.test(lower)) status = 'Скасовано';
  }

  var ttn = bot_normTtn(old.ttn);
  var npStatus = bot_trim(old.npStatus);
  var stage = bot_stageFromText(npStatus);
  if (!ttn && !stage) stage = 'Немає ТТН';
  if (npStatus && !stage) unrec.push('статус доставки «' + npStatus + '»');

  var paidRaw = bot_trim(old.paid).toLowerCase();
  return {
    row: {
      no: old.no === null || old.no === undefined || old.no === '' ? '' : old.no,
      date: null,
      print: printText,
      type: type, color: color, size: size, placement: placement,
      prints: bot_countPrints(printText),
      ttn: ttn, ttnDate: null,
      stage: stage, npStatus: npStatus,
      cost: cost, status: status,
      paid: paidRaw === 'оплачено' ? 'Оплачено' : 'Не оплачено',
      paidDate: null, recon: '',
      note: notes.join('; '), msgId: '', handoff: null, arrived: null
    },
    notes: notes, unrecognized: unrec
  };
}

/**
 * Рішення 07.10: якщо хоч один рядок ТТН «Оплачено» — усі рядки цієї ТТН «Оплачено», Звірка = «Імпорт».
 * Змінює rows на місці, повертає {propagated} — скільки рядків «дооплачено».
 */
function bot_importPropagatePaid(rows) {
  var paidTtn = {};
  rows.forEach(function (r) { if (r.ttn && r.paid === 'Оплачено') paidTtn[r.ttn] = true; });
  var propagated = 0;
  rows.forEach(function (r) {
    if (r.paid === 'Оплачено') { r.recon = 'Імпорт'; return; }
    if (r.ttn && paidTtn[r.ttn]) { r.paid = 'Оплачено'; r.recon = 'Імпорт'; propagated++; }
  });
  return { propagated: propagated };
}


// ======================= Sheets.gs =======================
/**
 * Sheets.gs — робота з таблицею: налаштування, лог, читання/запис таблиць за назвами заголовків,
 * блокування. Усі записи в таблицю — під LockService, пакетні setValues.
 */

var BOT_CACHE_ = {};   // кеш в межах одного запуску

function bot_ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function bot_sheet(name, create) {
  var ss = bot_ss();
  var sh = ss.getSheetByName(name);
  if (!sh && create) sh = ss.insertSheet(name);
  if (!sh) throw new Error('Немає аркуша «' + name + '». Запустіть меню 🤖 Бот → Перше налаштування.');
  return sh;
}

// ---------- Script Properties (токени, службовий стан) ----------

function bot_prop(key) { return PropertiesService.getScriptProperties().getProperty(key) || ''; }
function bot_setProp(key, val) { PropertiesService.getScriptProperties().setProperty(key, String(val)); }
function bot_delProp(key) { PropertiesService.getScriptProperties().deleteProperty(key); }

// ---------- блокування (повторне входження дозволене) ----------

var BOT_LOCK_DEPTH_ = 0;

function bot_withLock(fn, waitMs) {
  if (BOT_LOCK_DEPTH_ > 0) return fn();
  var lock = LockService.getScriptLock();
  lock.waitLock(waitMs || 30000);
  BOT_LOCK_DEPTH_++;
  try { return fn(); } finally { BOT_LOCK_DEPTH_--; SpreadsheetApp.flush(); lock.releaseLock(); }
}

// ---------- налаштування (аркуш «Налаштування») ----------

function bot_settingsMap() {
  if (BOT_CACHE_.settings) return BOT_CACHE_.settings;
  var map = {};
  var sh = bot_ss().getSheetByName(BOT_SHEETS.settings);
  if (sh && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0]) map[String(r[0]).trim()] = r[1]; });
  }
  BOT_CACHE_.settings = map;
  return map;
}

function bot_setting(key, def) {
  var v = bot_settingsMap()[key];
  if (v === undefined || v === null || v === '') return def === undefined ? '' : def;
  if (bot_isDate(v) && /TIME/.test(key)) {                 // власник міг ввести час як «час», а не текст
    try { return Utilities.formatDate(v, BOT_TZ, 'HH:mm'); } catch (e) { return bot_pad2(bot_kyivParts(v).h) + ':' + bot_pad2(bot_kyivParts(v).mi); }
  }
  return String(v).trim();
}

function bot_setSetting(key, value) {
  var sh = bot_sheet(BOT_SHEETS.settings);
  var last = sh.getLastRow();
  var keys = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
  var row = -1;
  for (var i = 0; i < keys.length; i++) if (String(keys[i][0]).trim() === key) { row = i + 2; break; }
  if (row < 0) { row = last + 1; sh.getRange(row, 1).setValue(key); }
  sh.getRange(row, 2).setNumberFormat('@').setValue(String(value));
  delete BOT_CACHE_.settings;
}

function bot_ownerIds() {
  return String(bot_setting('OWNER_IDS')).split(/[,\s;]+/).filter(Boolean);
}

function bot_isOwner(userId) { return bot_ownerIds().indexOf(String(userId)) >= 0; }

// ---------- лог ----------

/** Прибирає з тексту токен Telegram і ключ НП (помилки UrlFetch містять URL із токеном). */
function bot_scrub(s) {
  var t = String(s === undefined || s === null ? '' : s);
  [BOT_PROP.TG_TOKEN, BOT_PROP.NP_KEY].forEach(function (k) {
    var secret = '';
    try { secret = bot_prop(k); } catch (e) { secret = ''; }
    if (secret && secret.length >= 8) t = t.split(secret).join('***');
  });
  return t.replace(/bot\d{5,}:[A-Za-z0-9_-]{20,}/g, 'bot***').replace(/\d{8,}:[A-Za-z0-9_-]{30,}/g, '***');
}

function bot_log(level, event, details) {
  try {
    var sh = bot_ss().getSheetByName(BOT_SHEETS.log);
    if (!sh) return;
    sh.appendRow([new Date(), level, bot_scrub(event), bot_scrub(details === undefined ? '' : details).slice(0, 2000)]);
    if (sh.getLastRow() > 2200) sh.deleteRows(2, 200);
  } catch (e) { /* лог не повинен ламати роботу */ }
}

// ---------- таблиці за заголовками ----------

/** cols: [[key, header, ...aliases]] → {key: індекс колонки (1-based)} */
function bot_headerMap(sheet, cols, optional) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  var map = {};
  cols.forEach(function (c) {
    var names = [c[1]].concat(c.slice(2));
    var idx = -1;
    for (var n = 0; n < names.length && idx < 0; n++) idx = headers.indexOf(names[n]);
    if (idx < 0) {
      if (optional && optional.indexOf(c[0]) >= 0) return;
      throw new Error('В аркуші «' + sheet.getName() + '» немає колонки «' + c[1] + '».');
    }
    map[c[0]] = idx + 1;
  });
  return map;
}

function bot_colLetter(n) {
  var s = '';
  while (n > 0) { var r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/** Колонки «Оплат» (стара назва «С-вартість» теж підходить). Функція, а не змінна — щоб не залежати від порядку файлів. */
function bot_payColsAlias_() { return BOT_PAY_COLS.map(function (c) { return c[0] === 'cost' ? [c[0], c[1], 'С-вартість'] : c; }); }

function bot_cellStr_(v) { return v === null || v === undefined ? '' : String(v).trim(); }
function bot_cellDate_(v) { return bot_isDate(v) ? v : null; }

// ---------- «Замовлення» ----------

function bot_ordersSheet() { return bot_sheet(BOT_SHEETS.orders); }

function bot_ordersMap(sheet) {
  return bot_headerMap(sheet || bot_ordersSheet(), BOT_ORDER_COLS, ['arrived', 'colorCode']);
}

function bot_orderFromRow_(r, map, rowNum) {
  function g(k) { return map[k] ? r[map[k] - 1] : ''; }
  var no = g('no');
  return {
    _row: rowNum,
    no: (no === '' || no === null) ? '' : (isNaN(Number(no)) ? bot_cellStr_(no) : Number(no)),
    date: bot_cellDate_(g('date')), print: bot_cellStr_(g('print')), type: bot_cellStr_(g('type')),
    color: bot_cellStr_(g('color')), size: bot_cellStr_(g('size')), placement: bot_cellStr_(g('placement')),
    prints: Number(g('prints')) || 1, colorCode: Number(g('colorCode')) || 0, ttn: bot_normTtn(g('ttn')), ttnDate: bot_cellDate_(g('ttnDate')),
    stage: bot_cellStr_(g('stage')), npStatus: bot_cellStr_(g('npStatus')),
    cost: Number(g('cost')) || 0, status: bot_cellStr_(g('status')) || 'В роботі',
    paid: bot_cellStr_(g('paid')) || 'Не оплачено', paidDate: bot_cellDate_(g('paidDate')) || '',
    recon: bot_cellStr_(g('recon')), note: bot_cellStr_(g('note')), msgId: bot_cellStr_(g('msgId')),
    handoff: bot_cellDate_(g('handoff')), arrived: bot_cellDate_(g('arrived'))
  };
}

/** Усі непорожні рядки «Замовлення» як об'єкти. */
function bot_readOrders() {
  var sh = bot_ordersSheet();
  var map = bot_ordersMap(sh);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var o = bot_orderFromRow_(vals[i], map, i + 2);
    if (o.no === '' && !o.ttn && !o.print) continue;
    out.push(o);
  }
  return out;
}

/** Перший вільний рядок: після останнього, де заповнено «№», «Принт» або «ТТН» (рядок без № не затирається). */
function bot_nextOrderRow_(sh, map) {
  var maxRows = sh.getMaxRows();
  if (maxRows < 2) return 2;
  var last = 1;
  [map.no, map.print, map.ttn].forEach(function (c) {
    if (!c) return;
    var col = sh.getRange(1, c, maxRows, 1).getValues();
    for (var i = col.length - 1; i >= last; i--) {
      if (col[i][0] !== '' && col[i][0] !== null) { last = Math.max(last, i + 1); break; }
    }
  });
  return last + 1;
}

/** Забезпечити, що рядок rowNum існує і має форматування попереднього. */
function bot_ensureRow_(sh, rowNum) {
  if (rowNum > sh.getMaxRows()) {
    var from = sh.getMaxRows();
    sh.insertRowsAfter(from, Math.max(200, rowNum - from));
    var width = sh.getLastColumn();
    sh.getRange(from, 1, 1, width).copyTo(sh.getRange(from + 1, 1, sh.getMaxRows() - from, width), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    sh.getRange(from, 1, 1, width).copyTo(sh.getRange(from + 1, 1, sh.getMaxRows() - from, width), SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
  }
}

/** Додає рядок (під блокуванням). obj — поля за внутрішніми ключами. Повертає номер рядка. */
function bot_appendOrderRow(obj, yellowKeys) {
  return bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var rowNum = bot_nextOrderRow_(sh, map);
    bot_ensureRow_(sh, rowNum);
    var width = sh.getLastColumn();
    var arr = [];
    for (var i = 0; i < width; i++) arr.push('');
    BOT_ORDER_COLS.forEach(function (c) {
      if (map[c[0]] && obj[c[0]] !== undefined && obj[c[0]] !== null) arr[map[c[0]] - 1] = obj[c[0]];
    });
    if (map.ttn) sh.getRange(rowNum, map.ttn).setNumberFormat('@');
    sh.getRange(rowNum, 1, 1, width).setBackground(null).setValues([arr]);
    bot_markYellow_(sh, map, rowNum, yellowKeys || []);
    return rowNum;
  });
}

/** Пакетне додавання рядків (імпорт): items = [{obj, yellow:[ключі]}]. Повертає номери рядків. */
function bot_appendOrderRows(items) {
  if (!items.length) return [];
  return bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var start = bot_nextOrderRow_(sh, map);
    var width = sh.getLastColumn();
    bot_ensureRow_(sh, start + items.length);
    var arr = items.map(function (it) {
      var line = []; for (var i = 0; i < width; i++) line.push('');
      BOT_ORDER_COLS.forEach(function (c) {
        if (map[c[0]] && it.obj[c[0]] !== undefined && it.obj[c[0]] !== null) line[map[c[0]] - 1] = it.obj[c[0]];
      });
      return line;
    });
    if (map.ttn) sh.getRange(start, map.ttn, items.length, 1).setNumberFormat('@');
    sh.getRange(start, 1, items.length, width).setBackground(null).setValues(arr);
    items.forEach(function (it, i) { if (it.yellow && it.yellow.length) bot_markYellow_(sh, map, start + i, it.yellow); });
    return items.map(function (it, i) { return start + i; });
  });
}

function bot_markYellow_(sh, map, rowNum, keys) {
  keys.forEach(function (k) { if (map[k]) sh.getRange(rowNum, map[k]).setBackground(BOT_COLOR_YELLOW); });
}

/**
 * Пакетна зміна полів: patches = [{row, fields:{key:value}}].
 * Пишемо ЛИШЕ змінені клітинки (ніколи не перезаписуємо цілу колонку — Google заново «розпізнав» би текст
 * інших клітинок: «10.10» → дата, «=…» → формула — і затер би ручні правки):
 *  • однакові значення (напр. «Оплачено» для 92 рядків) — одним викликом через RangeList;
 *  • різні — суцільними відрізками рядків.
 */
function bot_patchOrders(patches) {
  if (!patches.length) return;
  bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var last = sh.getLastRow();
    var byKey = {};
    patches.forEach(function (p) {
      if (p.row < 2 || p.row > last) return;
      Object.keys(p.fields).forEach(function (k) {
        if (!map[k]) return;
        var v = p.fields[k];
        (byKey[k] = byKey[k] || {})[p.row] = (v === null || v === undefined) ? '' : v;      // для одного рядка перемагає останнє значення
      });
    });
    Object.keys(byKey).forEach(function (k) {
      var letter = bot_colLetter(map[k]);
      var rows = Object.keys(byKey[k]).map(Number).sort(function (a, b) { return a - b; });
      var groups = {};
      rows.forEach(function (r) {
        var v = byKey[k][r];
        var gk = bot_isDate(v) ? 'd' + v.getTime() : typeof v + ':' + v;
        (groups[gk] = groups[gk] || { value: v, rows: [] }).rows.push(r);
      });
      var distinct = Object.keys(groups);
      if (distinct.length <= 4 && distinct.length < rows.length) {                        // кілька різних значень на багато рядків
        distinct.forEach(function (gk) {
          var g = groups[gk];
          var list = sh.getRangeList(g.rows.map(function (r) { return letter + r; }));
          if (k === 'ttn') list.setNumberFormat('@');
          list.setValue(g.value);
        });
        return;
      }
      var i = 0;                                                                         // різні значення — суцільні відрізки
      while (i < rows.length) {
        var j = i;
        while (j + 1 < rows.length && rows[j + 1] === rows[j] + 1) j++;
        var vals = [];
        for (var t = i; t <= j; t++) vals.push([byKey[k][rows[t]]]);
        var range = sh.getRange(rows[i], map[k], vals.length, 1);
        if (k === 'ttn') range.setNumberFormat('@');
        range.setValues(vals);
        i = j + 1;
      }
    });
  });
}

function bot_clearYellow(rowNum, keys) {
  var sh = bot_ordersSheet(); var map = bot_ordersMap(sh);
  keys.forEach(function (k) { if (map[k]) sh.getRange(rowNum, map[k]).setBackground(null); });
}

// ---------- «Оплати» ----------

function bot_readPayments() {
  var sh = bot_sheet(BOT_SHEETS.payments);
  var map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var out = [];
  vals.forEach(function (r, i) {
    var sum = bot_toNumber(r[map.sum - 1]);
    if (sum === null) return;
    out.push({
      _row: i + 2, no: r[map.no - 1], date: bot_cellDate_(r[map.date - 1]), sum: sum,
      recon: map.recon ? bot_cellStr_(r[map.recon - 1]) : '', balance: map.balance ? r[map.balance - 1] : ''
    });
  });
  return out;
}

// ---------- «Прайс» ----------

function bot_readPriceRows() {
  var sh = bot_sheet(BOT_SHEETS.price);
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 4).getValues().filter(function (r) { return r[0] !== '' && r[1] !== ''; }).map(function (r) {
    return { type: bot_cellStr_(r[0]), price: Number(r[1]), from: bot_parseDate(r[2]), note: bot_cellStr_(r[3]) };
  });
}

// ---------- час ----------

function bot_now() { return new Date(); }

/** Сьогоднішня дата (північ за Києвом) як Date — для запису в клітинки «дата». */
function bot_today() {
  var p = bot_kyivParts(new Date());
  return bot_makeDate(p.y, p.m, p.d);
}

// ---------- формули: роздільник аргументів залежить від мови таблиці ----------

/**
 * У таблицях з українською (та іншими «комовими») мовами Google читає формулу з «;» між аргументами,
 * в англомовних — з «,». Визначаємо пробною формулою один раз за запуск; якщо визначити не вдалось — «,».
 */
function bot_formulaSep_(sheet) {
  if (BOT_CACHE_.sep) return BOT_CACHE_.sep;
  var sep = ',';
  try {
    var cell = sheet.getRange('Z1');
    cell.setFormula('=MAX(1,2)'); SpreadsheetApp.flush();
    if (cell.getValue() === 2) sep = ',';
    else {
      cell.setFormula('=MAX(1;2)'); SpreadsheetApp.flush();
      if (cell.getValue() === 2) sep = ';';
    }
    cell.clear();
  } catch (e) { bot_log('УВАГА', 'роздільник формул', e.message); return ','; }     // не кешуємо невдале визначення: наступного разу спробуємо ще раз
  BOT_CACHE_.sep = sep;
  return sep;
}

/** Перетворює «англійську» формулу (з комами) під мову таблиці. Коми всередині "рядків" не чіпає. */
function bot_fx(formula) {
  if (!BOT_CACHE_.sep) {                                     // роздільник ще не визначали (напр. запис з імпорту) — визначаємо на службовому аркуші «Лог»
    try { bot_formulaSep_(bot_ss().getSheetByName(BOT_SHEETS.log) || bot_ss().getSheets()[0]); } catch (e) { BOT_CACHE_.sep = ','; }
  }
  if ((BOT_CACHE_.sep || ',') === ',') return formula;
  var out = '', inStr = false;
  for (var i = 0; i < formula.length; i++) {
    var ch = formula.charAt(i);
    if (ch === '"') inStr = !inStr;
    out += (!inStr && ch === ',') ? ';' : ch;
  }
  return out;
}


// ======================= Telegram.gs =======================
/**
 * Telegram.gs — Telegram Bot API через UrlFetchApp, опитування getUpdates з тригера щохвилини,
 * маршрутизація оновлень і команд. Вебхук (doPost) НЕ використовується (302-редирект → дублі).
 */

// =====================================================================
// API
// =====================================================================

function bot_token() {
  var t = bot_prop(BOT_PROP.TG_TOKEN);
  if (!t) throw new Error('Не введено токен Telegram. Меню 🤖 Бот → Ввести токен Telegram.');
  return t;
}

/** Сирий виклик: повертає розібрану відповідь Telegram ({ok, result, description, ...}). */
function bot_tgRaw(method, payload) {
  var url = 'https://api.telegram.org/bot' + bot_token() + '/' + method;
  var opts = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload || {}), muteHttpExceptions: true };
  for (var attempt = 0; attempt < 3; attempt++) {
    var resp = UrlFetchApp.fetch(url, opts);
    var body;
    try { body = JSON.parse(resp.getContentText()); } catch (e) { body = { ok: false, description: 'HTTP ' + resp.getResponseCode() }; }
    if (!body.ok && body.error_code === 429 && body.parameters && body.parameters.retry_after && body.parameters.retry_after <= 10) {
      Utilities.sleep((body.parameters.retry_after + 1) * 1000);
      continue;
    }
    return body;
  }
  return { ok: false, description: 'Забагато запитів до Telegram' };
}

function bot_tg(method, payload) {
  var r = bot_tgRaw(method, payload);
  if (!r.ok) throw new Error('Telegram ' + method + ': ' + r.description);
  return r.result;
}

/** Довжина тексту так, як її рахує Telegram: без HTML-тегів, сутності — по 1 символу (ліміт 4096). */
function bot_visibleLen_(t) {
  return String(t).replace(/<[^>]+>/g, '').replace(/&(lt|gt|amp|quot);/g, 'x').length;
}

var BOT_TG_LIMIT_ = 3900;

/** Ділить довгий текст по рядках на частини, що вміщаються в повідомлення. */
function bot_chunkText_(text, limit) {
  limit = limit || BOT_TG_LIMIT_;
  var out = [], cur = '';
  String(text).split('\n').forEach(function (line) {
    while (bot_visibleLen_(line) > limit) {                 // один надто довгий рядок — ріжемо жорстко
      if (cur) { out.push(cur); cur = ''; }
      out.push(line.slice(0, limit)); line = line.slice(limit);
    }
    if (cur && bot_visibleLen_(cur) + 1 + bot_visibleLen_(line) > limit) { out.push(cur); cur = line; }
    else cur = cur ? cur + '\n' + line : line;
  });
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

/** Надіслати повідомлення (довгі діляться на кілька). opts: {thread, keyboard, silent} */
function bot_send(chatId, text, opts) {
  opts = opts || {};
  var chunks = bot_visibleLen_(text) > BOT_TG_LIMIT_ ? bot_chunkText_(text) : [String(text)];
  var r = null;
  for (var i = 0; i < chunks.length; i++) {
    var p = { chat_id: chatId, text: chunks[i], parse_mode: 'HTML', disable_web_page_preview: true };
    if (opts.thread) p.message_thread_id = Number(opts.thread);
    if (opts.keyboard && i === chunks.length - 1) p.reply_markup = opts.keyboard;
    if (opts.silent) p.disable_notification = true;
    r = bot_tgRaw('sendMessage', p);
    if (!r.ok) { bot_log('ПОМИЛКА', 'sendMessage', r.description + ' · chat ' + chatId); return r; }
  }
  return r;
}

function bot_edit(chatId, messageId, text, keyboard) {
  if (bot_visibleLen_(text) > BOT_TG_LIMIT_) text = bot_chunkText_(text)[0] + '\n…';
  var p = { chat_id: chatId, message_id: messageId, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  p.reply_markup = keyboard || { inline_keyboard: [] };
  var r = bot_tgRaw('editMessageText', p);
  if (!r.ok && !/not modified/i.test(r.description || '')) bot_log('ПОМИЛКА', 'editMessageText', r.description);
  return r;
}

function bot_answerCb(id, text, alert) {
  bot_tgRaw('answerCallbackQuery', { callback_query_id: id, text: String(text || '').slice(0, 190), show_alert: !!alert });
}

function bot_react(chatId, messageId, emoji) {
  if (String(bot_setting('REACTIONS', 'так')).toLowerCase() === 'ні') return;
  var r = bot_tgRaw('setMessageReaction', { chat_id: chatId, message_id: messageId, reaction: [{ type: 'emoji', emoji: emoji }] });
  if (!r.ok) bot_log('УВАГА', 'setMessageReaction', r.description);
}

function bot_sendToOwners(text, opts) {
  bot_ownerIds().forEach(function (id) { bot_send(id, text, opts); });
}

/** Звичайні повідомлення, довші за ліміт, надсилаємо кількома. */
function bot_sendMany(chatId, parts, opts) {
  var ok = true;
  parts.forEach(function (p) { var r = bot_send(chatId, p, opts); if (r && !r.ok) ok = false; });
  return ok;
}

/** Скачати файл з Telegram як Blob. */
function bot_downloadFile(fileId, name) {
  var info = bot_tg('getFile', { file_id: fileId });
  var url = 'https://api.telegram.org/file/bot' + bot_token() + '/' + info.file_path;
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error('Не вдалося завантажити файл (' + resp.getResponseCode() + ')');
  return resp.getBlob().setName(name || 'file');
}

// ---------- відкладене видалення службових відповідей ----------

function bot_scheduleDelete(chatId, messageId, afterSec) {
  var list = [];
  try { list = JSON.parse(bot_prop(BOT_PROP.PENDING_DELETE) || '[]'); } catch (e) { list = []; }
  list.push({ c: chatId, m: messageId, t: Date.now() + afterSec * 1000 });
  bot_setProp(BOT_PROP.PENDING_DELETE, JSON.stringify(list.slice(-50)));
}

function bot_flushDeletes() {
  var list = [];
  try { list = JSON.parse(bot_prop(BOT_PROP.PENDING_DELETE) || '[]'); } catch (e) { list = []; }
  if (!list.length) return;
  var now = Date.now(), rest = [];
  list.forEach(function (x) {
    if (x.t <= now) bot_tgRaw('deleteMessage', { chat_id: x.c, message_id: x.m });
    else rest.push(x);
  });
  bot_setProp(BOT_PROP.PENDING_DELETE, JSON.stringify(rest));
}

// ---------- тимчасові дані для кнопок (callback_data ≤ 64 байти) ----------

function bot_pendingPut(payload) {
  var map = {};
  try { map = JSON.parse(bot_prop(BOT_PROP.PENDING_INPUT) || '{}'); } catch (e) { map = {}; }
  var now = Date.now();
  Object.keys(map).forEach(function (k) { if (now - map[k].t > 3 * 86400000) delete map[k]; });
  var token = Utilities.getUuid().slice(0, 8);
  map[token] = { t: now, p: payload };
  bot_setProp(BOT_PROP.PENDING_INPUT, JSON.stringify(map));
  return token;
}

function bot_pendingGet(token) {
  try { var m = JSON.parse(bot_prop(BOT_PROP.PENDING_INPUT) || '{}'); return m[token] ? m[token].p : null; } catch (e) { return null; }
}

function bot_pendingDrop(token) {
  try {
    var m = JSON.parse(bot_prop(BOT_PROP.PENDING_INPUT) || '{}'); delete m[token];
    bot_setProp(BOT_PROP.PENDING_INPUT, JSON.stringify(m));
  } catch (e) { /* ігноруємо */ }
}

/** Користувач, від якого чекаємо число (інша сума оплати). */
function bot_awaitPut(userId, payload) {
  var m = {};
  try { m = JSON.parse(bot_prop('AWAIT_INPUT') || '{}'); } catch (e) { m = {}; }
  m[String(userId)] = { t: Date.now(), p: payload };
  bot_setProp('AWAIT_INPUT', JSON.stringify(m));
}

function bot_awaitTake(userId) {
  try {
    var m = JSON.parse(bot_prop('AWAIT_INPUT') || '{}');
    var x = m[String(userId)];
    if (!x) return null;
    delete m[String(userId)];
    bot_setProp('AWAIT_INPUT', JSON.stringify(m));
    return (Date.now() - x.t < 900000) ? x.p : null;      // очікуємо число не довше 15 хв
  } catch (e) { return null; }
}

// =====================================================================
// Опитування
// =====================================================================

function bot_threadOf(msg) {
  return (msg.is_topic_message && msg.message_thread_id) ? String(msg.message_thread_id) : '0';
}

var BOT_MAX_ATTEMPTS_ = 3;

/** Атомарно «займає» опитування (два запуски тригера одночасно не можуть обробляти ті самі оновлення). */
function bot_pollEnter_(now) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return false;
  try {
    var ts = Number(bot_prop(BOT_PROP.POLL_LOCK_TS) || 0);
    if (ts && now - ts < 370000) return false;               // попередній запуск ще працює (ліміт Apps Script — 6 хв = 360 с; раніше другий запуск міг накластися на довгий перший)
    bot_setProp(BOT_PROP.POLL_LOCK_TS, now);
    return true;
  } finally { lock.releaseLock(); }
}

function bot_retryState_() {
  try { return JSON.parse(bot_prop('UPDATE_RETRY') || '{}'); } catch (e) { return {}; }
}

/** Забирає оновлення з Telegram. Оновлення «підтверджується» (offset) лише після успішної обробки
 *  або після 3 невдалих спроб — тимчасовий збій не губить замовлення. */
function bot_pollUpdates_(started) {
  var offset = Number(bot_prop(BOT_PROP.OFFSET) || 0);
  var payload = { timeout: 0, limit: 100, allowed_updates: BOT_ALLOWED_UPDATES };
  if (offset) payload.offset = offset;
  var res = bot_tgRaw('getUpdates', payload);
  if (!res.ok) { bot_log('ПОМИЛКА', 'getUpdates', res.description); return; }
  bot_setProp(BOT_PROP.LAST_POLL_TS, Date.now());
  var list = res.result.slice().sort(function (a, b) { return a.update_id - b.update_id; });
  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    if (Date.now() - started > 200000) return;                // решта — у наступному запуску
    try {
      bot_handleUpdate(u);
    } catch (e) {
      var st = bot_retryState_();
      var n = (st.id === u.update_id ? st.n : 0) + 1;
      bot_log('ПОМИЛКА', 'update ' + u.update_id + ' (спроба ' + n + ')', e.message + ' | ' + (e.stack || '').split('\n')[1]);
      if (n < BOT_MAX_ATTEMPTS_) {
        bot_setProp('UPDATE_RETRY', JSON.stringify({ id: u.update_id, n: n }));
        return;                                               // оновлення лишається в черзі Telegram, порядок зберігається
      }
      try { bot_sendToOwners('⚠️ Не вдалося обробити оновлення Telegram після ' + n + ' спроб (пропущено): ' + bot_esc(bot_scrub(e.message))); } catch (e2) { /* ігноруємо */ }
    }
    bot_delProp('UPDATE_RETRY');
    bot_setProp(BOT_PROP.OFFSET, u.update_id + 1);
  }
}

/** Тригер «щохвилини». */
function bot_poll() {
  if (bot_prop(BOT_PROP.ENABLED) === '0') return;
  var started = Date.now();
  if (!bot_pollEnter_(started)) return;
  try {
    try { bot_pollUpdates_(started); } catch (e) { bot_log('ПОМИЛКА', 'опитування Telegram', e.message); }
    try { bot_flushDeletes(); } catch (e) { bot_log('ПОМИЛКА', 'flushDeletes', e.message); }
    if (Date.now() - started < 150000) {
      try { bot_tickScheduled(started); } catch (e) { bot_log('ПОМИЛКА', 'tickScheduled', e.message); }
    }
  } finally {
    bot_delProp(BOT_PROP.POLL_LOCK_TS);
  }
}

function bot_handleUpdate(u) {
  if (u.message) return bot_onMessage(u.message, false);
  if (u.edited_message) return bot_onMessage(u.edited_message, true);
  if (u.callback_query) return bot_onCallback(u.callback_query);
  if (u.my_chat_member) {
    var m = u.my_chat_member;
    bot_log('ІНФО', 'my_chat_member', (m.chat && m.chat.title ? m.chat.title : m.chat.id) + ' → ' + (m.new_chat_member && m.new_chat_member.status));
  }
}

// =====================================================================
// Повідомлення
// =====================================================================

function bot_onMessage(msg, edited) {
  var chat = msg.chat || {};
  var from = msg.from || {};
  var text = msg.text || '';

  // ----- особисті повідомлення -----
  if (chat.type === 'private') {
    var cmd0 = bot_parseCommand(text);
    if (cmd0 && cmd0.cmd === 'start' && !bot_ownerIds().length) {
      bot_setSetting('OWNER_IDS', String(from.id));
      bot_log('ІНФО', 'owner', 'Власник: ' + from.id + ' ' + (from.username || ''));
      bot_send(chat.id, '👋 Вітаю! Ви — власник бота. Далі:\n1) додайте бота в групу виробництва;\n2) у гілці «Замовлення на клієнта» напишіть <code>/bind orders</code>;\n3) у гілці «Реєстри» — <code>/bind registry</code>.\n\n' + bot_helpText());
      return;
    }
    if (!bot_isOwner(from.id)) { bot_log('УВАГА', 'чужий користувач', 'private ' + from.id + ' ' + (from.username || '')); return; }
    if (edited) return;
    if (msg.document) return bot_onDocument(msg);
    if (cmd0) return bot_onCommand(msg, cmd0);
    var awaiting = bot_awaitTake(from.id);
    if (awaiting) return bot_onAwaitedInput(msg, awaiting);
    return;
  }

  // ----- група -----
  if (chat.type === 'group' || chat.type === 'supergroup') {
    var cmd = bot_parseCommand(text);
    if (cmd && cmd.cmd === 'bind') {
      if (!bot_isOwner(from.id)) return;
      return bot_cmdBind(msg, cmd.arg);
    }
    var payChat = bot_setting('PAY_CHAT_ID');
    if (cmd && cmd.cmd === 'id') return bot_send(chat.id, 'Ваш Telegram ID: <code>' + from.id + '</code>', bot_threadOf(msg) !== '0' ? { thread: bot_threadOf(msg) } : {});
    if (cmd && cmd.cmd === 'registry') return bot_registryFromGroup(msg, from);
    var groupId = bot_setting('GROUP_CHAT_ID');
    var isOrdersChat = groupId && String(chat.id) === String(groupId) && bot_threadOf(msg) === String(bot_setting('ORDERS_THREAD_ID'));
    if (payChat && String(chat.id) === String(payChat) && !isOrdersChat) return bot_handlePayMessage(msg, edited);   // чат «Отправка отчет» (ніколи не перехоплює гілку замовлень)
    if (!groupId || String(chat.id) !== String(groupId)) return;                       // чужа група
    var ordersThread = bot_setting('ORDERS_THREAD_ID');
    if (ordersThread === '' ) return;
    if (bot_threadOf(msg) !== String(ordersThread)) return;                            // інша гілка
    var caption = msg.caption || msg.text || '';
    if (!caption) return;
    return bot_handleOrderMessage(msg, caption, edited);
  }
}

function bot_botUsername() {
  var u = bot_prop(BOT_PROP.BOT_USERNAME);
  if (!u) {
    try { u = bot_tg('getMe', {}).username || ''; bot_setProp(BOT_PROP.BOT_USERNAME, u); } catch (e) { u = ''; }
  }
  return u;
}

/** «/bind@my_bot orders» → {cmd:'bind', arg:'orders'}; команда для іншого бота → null. */
function bot_parseCommand(text) {
  var m = String(text || '').match(/^\/([A-Za-z_]+)(?:@(\w+))?(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  if (m[2]) {
    var me = bot_botUsername();
    if (me && m[2].toLowerCase() !== me.toLowerCase()) return null;
  }
  return { cmd: m[1].toLowerCase(), arg: (m[3] || '').trim() };
}

function bot_helpText() {
  return '<b>Що вмію</b>\n' +
    '• Надішліть файл виробництва <b>.xlsx</b> — зроблю звірку і покажу, що можна оплатити.\n' +
    '• /borg — борг і неоплачені доставлені ТТН\n' +
    '• /find &lt;ТТН або №&gt; — знайти замовлення\n' +
    '• /cancel &lt;№&gt; — скасувати замовлення\n' +
    '• /history — останні 10 звірок\n' +
    '• /undo &lt;ID&gt; — відкликати звірку\n' +
    '• /disputes — відкладені спірні ТТН\n' +
    '• /files — папка з файлами виробництва\n' +
    '• /price — чинні ціни; /price Худі фліс 780 15.11.2026 — нова ціна\n' +
    '• /report — ранковий звіт зараз (тільки вам)\n' +
    '• /month — місячний звіт (/month 2026-08 — за вказаний місяць)\n' +
    '• /desc &lt;ТТН&gt; — опис ТТН і його статус\n' +
    '• /setdesc &lt;ТТН&gt; &lt;текст&gt; — свій текст опису (до 100 символів; «-» — повернути автоматичний)\n' +
    '• /backfill — створити описи для замовлень із таблиці (імпорт), яких ще немає в «ТТН»\n' +
    '• /allocate — які ТТН покривають внесені оплати (позначу «Оплачено» після вашої кнопки); /undoalloc &lt;ID&gt; — скасувати\n' +
    '• /addpay &lt;сума&gt; [дата] — додати оплату вручну (напр. <code>/addpay 21401 12.09.2026</code>)\n' +
    '• /registry — реєстр зараз; /registry preview — що ввійде; /registry now — ЕКСТРЕНИЙ додатковий реєстр\n' +
    '• /nptest &lt;ТТН&gt; &lt;текст&gt; — перевірка запису на ТЕСТОВІЙ ТТН; /npdoc &lt;ТТН&gt; — що віддає НП\n' +
    '• /retry [ТТН] — повторити запис опису для ТТН з «Помилка НП»\n' +
    '• /live — бойовий режим (запис у НП); /preview — режим перевірки\n' +
    '• /help — ця довідка';
}

function bot_onCommand(msg, c) {
  var chatId = msg.chat.id;
  switch (c.cmd) {
    case 'start': case 'help': return bot_send(chatId, bot_helpText());
    case 'borg': return bot_cmdBorg(chatId);
    case 'find': return bot_cmdFind(chatId, c.arg);
    case 'cancel': return bot_cmdCancel(chatId, c.arg);
    case 'history': return bot_cmdHistory(chatId);
    case 'undo': return bot_cmdUndo(chatId, c.arg);
    case 'disputes': return bot_cmdDisputes(chatId);
    case 'files': return bot_cmdFiles(chatId);
    case 'price': return bot_cmdPrice(chatId, c.arg);
    case 'report': return bot_cmdReport(chatId);
    case 'month': return bot_cmdMonth(chatId, c.arg);
    case 'desc': return bot_cmdDesc(chatId, c.arg);
    case 'backfill': return bot_cmdBackfill(chatId);
    case 'addpay': return bot_cmdAddPay(chatId, c.arg, msg);
    case 'allocate': return bot_cmdAllocate(chatId);
    case 'undoalloc': return bot_cmdUndoAlloc(chatId, c.arg);
    case 'setdesc': return bot_cmdSetDesc(chatId, c.arg);
    case 'registry': return bot_cmdRegistry(chatId, c.arg);
    case 'live': return bot_cmdLive(chatId);
    case 'retry': return bot_cmdRetry(chatId, c.arg);
    case 'unbind': if (String(c.arg).trim().toLowerCase() === 'payments') { bot_setSetting('PAY_CHAT_ID', ''); bot_setSetting('PAY_THREAD_ID', ''); return bot_send(chatId, 'Чат оплат відключено.'); } return bot_send(chatId, 'Формат: <code>/unbind payments</code>');
    case 'preview': return bot_cmdPreviewMode(chatId);
    case 'npdoc': return bot_cmdNpDoc(chatId, c.arg);
    case 'nptest': return bot_cmdNpTest(chatId, c.arg);
    default: return bot_send(chatId, 'Не знаю такої команди. /help — що я вмію.');
  }
}

/** /bind orders | /bind report — запам'ятати цю гілку. */
function bot_cmdBind(msg, arg) {
  var what = String(arg || '').trim().toLowerCase().replace(/\s+force$/, '');
  var chatId = msg.chat.id, thread = bot_threadOf(msg);
  var opts = thread !== '0' ? { thread: thread } : {};
  if (what === 'registry') what = 'report';
  if (what === 'payments') {
    var ordersGroup = bot_setting('GROUP_CHAT_ID');
    if (ordersGroup && String(chatId) === String(ordersGroup) && thread === bot_setting('ORDERS_THREAD_ID')) {
      bot_sendToOwners('⛔ Це гілка замовлень — тут `/bind payments` не підключаю, інакше замовлення перестали б прийматись. Напишіть <code>/bind payments</code> у чаті «Отправка отчет».');
      return;
    }                                      // чат «Отправка отчет»: у ньому бот НІЧОГО не пише, підтвердження — лише власнику в особисті
    bot_withLock(function () { bot_setSetting('PAY_CHAT_ID', chatId); bot_setSetting('PAY_THREAD_ID', thread); });
    bot_log('ІНФО', 'bind payments', 'chat ' + chatId + ' thread ' + thread);
    bot_sendToOwners('✅ Чат «' + bot_esc((msg.chat && msg.chat.title) || chatId) + '» підключено для оплат: повідомлення власника виду <code>+10 000</code>, <code>+15к</code> стануть оплатами. У тому чаті бот нічого не пише.');
    return;
  }
  if (what !== 'orders' && what !== 'report') {
    var r0 = bot_send(chatId, 'Напишіть <code>/bind orders</code> (гілка «Замовлення на клієнта»), <code>/bind registry</code> (гілка «Реєстри») або <code>/bind payments</code> (чат «Отправка отчет»).', opts);
    if (r0.ok) bot_scheduleDelete(chatId, r0.result.message_id, 15);
    return;
  }
  var curGroup = bot_setting('GROUP_CHAT_ID');
  if (curGroup && String(curGroup) !== String(chatId) && !/force/i.test(String(arg))) {          // захист: /bind в іншій групі мовчки зламав би прийом замовлень
    bot_sendToOwners('⛔ Чат виробництва вже прив\'язано (' + curGroup + '), а це інша група (' + chatId + '). Щоб ПЕРЕНЕСТИ на цю групу, напишіть <code>/bind ' + what + ' force</code>.');
    return;
  }
  bot_withLock(function () {
    bot_setSetting('GROUP_CHAT_ID', chatId);
    bot_setSetting(what === 'orders' ? 'ORDERS_THREAD_ID' : 'REPORT_THREAD_ID', thread);
  });
  bot_log('ІНФО', 'bind ' + what, 'chat ' + chatId + ' thread ' + thread);
  var r = bot_send(chatId, '✅ Готово: ' + (what === 'orders' ? 'тут беру замовлення' : 'сюди надсилатиму реєстри й ранковий звіт') + '.', opts);
  if (r.ok) bot_scheduleDelete(chatId, r.result.message_id, 10);
}

/** Власник надіслав число після «✏️ Інша сума». */
function bot_onAwaitedInput(msg, awaiting) {
  if (awaiting.kind === 'paySum') return bot_paymentCustomSum(msg, awaiting);
  if (awaiting.kind === 'cancel') return;
}

// =====================================================================
// Кнопки
// =====================================================================

function bot_onCallback(cb) {
  var from = cb.from || {};
  if (!bot_isOwner(from.id)) {
    bot_answerCb(cb.id, 'Немає доступу', true);
    bot_log('УВАГА', 'чужий callback', from.id + ' ' + cb.data);
    return;
  }
  var data = String(cb.data || '');
  var parts = data.split('|');
  var ctx = { cb: cb, chatId: cb.message && cb.message.chat.id, msgId: cb.message && cb.message.message_id, userId: from.id,
    userName: [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || String(from.id) };
  try {
    switch (parts[0]) {
      case 'pay': case 'payy': case 'payn': case 'det': case 'cnc': case 'dsp': case 'rs': case 'rsy': case 'rsn':
      case 'sup': case 'opy': case 'opc': case 'opn': case 'undy': case 'undn':
        return bot_reconCallback(parts, ctx);
      case 'aly': case 'aln':
        return bot_allocCallback(parts, ctx);
      case 'regy': case 'regn': case 'regx':
        return bot_registryCallback(parts, ctx);
      case 'nptq': case 'nptn':
        return bot_npTestCallback(parts, ctx);
      case 'prcy': case 'prcn':
        return bot_priceCallback(parts, ctx);
      default:
        bot_answerCb(cb.id, 'Кнопка застаріла');
    }
  } catch (e) {
    bot_log('ПОМИЛКА', 'callback ' + data, e.message);
    bot_answerCb(cb.id, 'Помилка: ' + bot_scrub(e.message), true);
  }
}


// ======================= Orders.gs =======================
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
      prints: p.prints, colorCode: p.colorCode || '', ttn: p.ttn, cost: cost
    },
    issues: issues, yellow: yellow
  };
}

/**
 * Ключ рядка в колонці msg_id: перше замовлення повідомлення — його message_id, наступні — «id#1», «id#2».
 * (Не «id.1»: Google перетворює такий текст на число, і «id.10» збігалось би з «id.1».)
 */
function bot_msgKey(mid, idx) { return idx === 0 ? String(mid) : mid + '#' + idx; }

/** Рядок за ключем; розуміє і старий формат «id.N» (N < 10), яким користувались до виправлення. */
function bot_findByMsgKey_(orders, mid, idx) {
  var key = bot_msgKey(mid, idx), legacy = (idx > 0 && idx < 10) ? mid + '.' + idx : null, found = null;
  orders.forEach(function (o) { if (o.msgId === key || (legacy && o.msgId === legacy)) found = o; });
  return found;
}

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
      var existing = bot_findByMsgKey_(orders, mid, idx);
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
        // вручну виправлену чи «за файлом» змінену собівартість не скидаємо: перераховуємо лише коли змінився тип речі
        if (existing.status !== 'В роботі' || (existing.type === p.type && existing.cost > 0)) delete f.cost;
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
      if (dup.length && p.ttn && dup[0].ttn === p.ttn) {            // точна повторна публікація (напр. «ТЕРМІНОВО») — не турбуємо власника
        bot_log('ІНФО', 'повтор замовлення №' + p.no, 'та сама ТТН — проігноровано');
        return;
      }
      if (dup.length && !dup[0].ttn && p.ttn && dup[0].status !== 'Скасовано') {   // ТТН дописали окремим повідомленням (перше було без ТТН) — прив'язуємо до наявного рядка
        bot_patchOrders([{ row: dup[0]._row, fields: { ttn: p.ttn, stage: '', npStatus: '', ttnDate: '', handoff: '', arrived: '' } }]);
        bot_clearYellow(dup[0]._row, ['ttn']);
        BOT_NEW_TTN_ROWS_.push(dup[0]._row);
        dup[0].ttn = p.ttn;
        bot_sendToOwners('ℹ️ ТТН ' + bot_code(p.ttn) + ' дописано до замовлення №' + p.no + ' (воно було без ТТН).' + linkTxt);
        if (react !== '✍') react = '👌';
        return;
      }
      if (dup.length) {
        bot_sendToOwners('⚠️ Дубль: замовлення №' + p.no + ' уже є в таблиці (рядок ' + dup[0]._row + (dup[0].ttn && p.ttn && dup[0].ttn !== p.ttn ? ', ТТН там ' + dup[0].ttn + ', а в цьому повідомленні ' + p.ttn + ' — номер замовлення вже використаний, рядок не змінюю' : '') + '). Новий рядок не додаю.' + linkTxt);
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

    try { bot_ttnSync(msg, caption, list, edited); }                // аркуш «ТТН»: оригінал + скорочений опис
    catch (e) { bot_log('ПОМИЛКА', 'ТТН-опис', e.message); bot_sendToOwners('⚠️ Не вдалося зберегти опис ТТН: ' + bot_esc(bot_scrub(e.message))); }

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
    var cancelTtns = []; rows.forEach(function (o) { if (o.ttn && cancelTtns.indexOf(o.ttn) < 0) cancelTtns.push(o.ttn); });
    try { bot_ttnAfterCancel(cancelTtns); } catch (e) { bot_log('ПОМИЛКА', 'ТТН після /cancel', e.message); }
    bot_log('ІНФО', 'cancel №' + no, rows.length + ' рядків');
    bot_send(chatId, '✅ Замовлення №' + no + ' скасовано (рядків: ' + rows.length + '), собівартість 0.');
  });
}

function bot_cmdBorg(chatId) {
  var orders = bot_readOrders(), pays = bot_readPayments();
  var d = bot_computeDebt(orders, pays, bot_openingFromSettings());
  bot_send(chatId, '💰 <b>Борг: ' + bot_fmtMoney(d.debt) + '</b>\n' +
    'Собівартість усього: ' + bot_fmtMoney(d.cost) + (d.opening ? ' (разом із початковим залишком ' + bot_fmtMoney(d.opening) + ')' : '') + '\n' +
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
    bot_syncTypeList();                                   // новий тип одразу з'являється у списку «Тип речі»
  });
  bot_pendingDrop(parts[1]);
  bot_answerCb(ctx.cb.id, 'Додано');
  bot_edit(ctx.chatId, ctx.msgId, '✅ Додано: <b>' + bot_esc(p.type) + '</b> — ' + bot_fmtMoney(p.price) + ' з ' + bot_fmtDate(new Date(p.from)));
}


// ======================= Shorten.gs =======================
/**
 * Shorten.gs — Модуль B: скорочення опису ТТН до ≤ 100 символів (розділ 5 ТЗ).
 * ЧИСТА логіка: жодних викликів Google API, перевіряється в Node.
 *
 * Режим за замовчуванням (DESC_MODE = повний): повний опис → без назви принта → «позаду» одним словом → номер + річ → лише номери; режим «драбина» (mode === 'ladder') — драбина з розділу 5 ТЗ.
 * Вхід — масив замовлень з bot_parseOrderMessage (одне повідомлення = одна ТТН).
 * Вихід — {text, len, level, overflow}.
 *
 * Драбина (зупиняємось, щойно рядок ≤ ліміту; на кожній сходинці спершу «Всі позаду», потім «Позаду»):
 *  1 повний формат · 2 спільне «позаду» в кінець · 3 футболка → лише колір · 4 (стікерпак без слова — див. нижче)
 *  5 назви принтів без пробілів · 6 прибрати (W)/(B) з футболок · 7 прибрати (W)/(B) скрізь
 * Далі, за вказівкою власника, «переповнення» без кнопок: номер + річ → номер + річ без деталей → лише номери через кому.
 */

var BOT_DESC_LIMIT_DEFAULT = 100;

/** Довжина для ліміту НП: рахуємо в одиницях UTF-16 (кирилиця = 1; емодзі = 2) — це не менше, ніж у кодових точок, тож ліміт гарантовано дотримано за будь-якого способу підрахунку НП. */
function bot_len(s) { return String(s).length; }

// ---------- назва принта ----------

function bot_capWord_(w) {
  if (!w) return w;
  var letters = w.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/g, '');
  if (!letters || letters !== letters.toLowerCase()) return w;           // уже є великі літери (McLaren, CV, MX5) або це число — не чіпаємо
  var i = 0;
  while (i < w.length && !/[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(w.charAt(i))) i++;
  return w.slice(0, i) + w.charAt(i).toUpperCase() + w.slice(i + 1);
}

/** Назва принта для опису: без слова «Принт», без «ДВА ПРИНТА», « + » → «+», (w)/(b) → (W)/(B), Title Case. */
function bot_cleanPrintName(raw, kind) {
  var s = String(raw || '').replace(/[ ​]/g, ' ');
  s = s.replace(/^\s*принти?\s+/i, '');
  if (kind === 'sticker') s = s.replace(/^\s*стік[еи]р\s*-?\s*пак\s*/i, '');
  s = s.replace(/(^|[^а-яіїєґ])два\s+принт[а-яіїєґ]*/ig, '$1');
  s = s.replace(/\(\s*([wWbB])\s*\)/g, function (m, c) { return '(' + c.toUpperCase() + ')'; });
  if (/^не\s*потрібен\.?$/i.test(s.trim())) return 'без принта';       // «Принт не потрібен»
  s = s.replace(/\s*\+\s*/g, '+').replace(/\s+/g, ' ').trim();
  return s.split(/([\s\-+])/).map(bot_capWord_).join('');
}

function bot_kindOf_(type) {
  if (type === 'Футболка' || type === 'Футболка виварена') return 'tee';
  if (type === 'Худі фліс' || type === 'Худі не утеплене' || type === 'Худі виварене') return 'hoodie';
  if (type === 'Стікерпак') return 'sticker';
  if (type === 'Кепка' || type === 'Кепка виварена') return 'cap';
  return 'other';
}

/** Розібрані замовлення → прості елементи для опису. */
function bot_descItems(list) {
  return list.map(function (p) {
    var kind = bot_kindOf_(p.type);
    if (!kind || kind === 'other') kind = p.typeAmbiguous ? 'hoodie' : 'other';
    return {
      no: p.no, kind: kind, washed: /виварен/.test(p.type || ''), raw: p.print || '', name: bot_cleanPrintName(p.print, kind), color: p.color || '', size: p.size || '',
      code: p.colorCode || (kind === 'hoodie' ? (BOT_CODE_OF_COLOR_[p.color] || 0) : 0), noFleece: p.type === 'Худі не утеплене', placement: p.placement || '', two: (p.prints || 1) >= 2,
      urgent: !!p.urgent
    };
  });
}

var BOT_COLOR_FEM_ = { 'Чорний': 'чорна', 'Білий': 'біла', 'Сірий': 'сіра' };
var BOT_COLOR_SHORT_ = { 'Чорний': 'чор', 'Білий': 'біла', 'Сірий': 'сіра' };

function bot_nameForLevel_(it, o) {
  var n = it.name;
  if (o.dropMarkers === 'all' || (o.dropMarkers === 'tee' && it.kind === 'tee')) n = n.replace(/\s*\([WB]\)/g, '');
  if (o.glue && n !== 'без принта') n = n.replace(/\s+(?!\()/g, '');                    // «Norris World Champion» → «NorrisWorldChampion»; «(W)» лишається окремо
  return n.trim();
}

function bot_placementTail_(it) {
  var t = [];
  if (it.two) t.push('ДВА ПРИНТА');
  return t;
}

/** Номер замовлення в описі: повний («15150») або короткий («150» — без спільного «15» на початку; склад так просив). */
function bot_showNo_(it, o) { return o && o.shortNo ? it.sno : String(it.no); }

/** Короткі номери — лише коли всі замовлення з однієї «тисячі» (15150, 15151 → 150, 151); інакше лишаємо повні, щоб не переплутати. */
function bot_setShortNos_(items) {
  var uniform = items.length > 0 && items.every(function (i) { return i.no >= 1000 && Math.floor(i.no / 1000) === Math.floor(items[0].no / 1000); });
  items.forEach(function (i) { i.sno = uniform ? ('00' + (i.no % 1000)).slice(-3) : String(i.no); });
}

function bot_renderItem_(it, o) {
  if (it.kind === 'sticker') return bot_showNo_(it, o) + ' ' + (o.keepStickerWord ? 'Стікерпак ' : '') + bot_nameForLevel_(it, o);
  if (it.kind === 'cap') return bot_showNo_(it, o) + ' ' + (/^кепк/i.test(it.raw) ? it.raw : 'Кепка ' + it.raw).replace(/\s+/g, ' ').trim();
  if (it.kind === 'other') return bot_showNo_(it, o) + ' ' + bot_nameForLevel_(it, o);
  var parts = [bot_showNo_(it, o)];
  var nm = o.dropName ? '' : bot_nameForLevel_(it, o);                 // dropName: назву принта не пишемо (вона не обов'язкова для складу)
  if (nm) parts.push(nm);
  if (it.kind === 'tee') {
    if (o.teeShort) { if (it.color) parts.push((BOT_COLOR_SHORT_[it.color] || '') + (it.washed ? ' виварена' : '')); }
    else parts.push('футболка' + (it.color ? ' ' + BOT_COLOR_FEM_[it.color] : '') + (it.washed ? ' виварена' : ''));
  } else if (o.hoodieX) {                                                  // слово «худі» прибрано: лишається x + цифра кольору (x1 = чорний теж пишемо, інакше не видно, що це худі)
    parts.push((o.latinX ? 'x' : 'х') + (it.code || 1) + (it.washed ? ' виварене' : ''));
  } else {
    parts.push('худі' + (it.washed ? ' виварене' : ''));   // колір худі несе код хN
  }
  if (it.code > 1 && !o.hoodieX) parts.push((o.latinX ? 'x' : 'х') + it.code);          // код кольору худі: х2/х3/х4 (х1 = чорний, не пишемо)
  if (it.kind === 'hoodie' && it.noFleece) parts.push('БЕЗ ФЛІСУ');
  if (it.size) parts.push(it.size);
  var s = parts.filter(Boolean).join(' ');
  var tail = bot_placementTail_(it);
  if (it.placement === 'Позаду') { if (!o.hoist) tail.push('принт позаду'); }
  else if (it.placement === 'Спереду') tail.push('спереду');
  else if (it.placement === 'Як на візуалі') tail.push('як на візуалі');
  else if (it.placement === 'Спереду і позаду') tail.push('спереду і позаду');
  return s + (tail.length ? ', ' + tail.join(', ') : '');
}

/** Чи можна винести «позаду» одним словом: усі «речі» (не стікерпак/кепка) мають розміщення «Позаду». */
function bot_canHoist_(items) {
  var things = items.filter(function (i) { return i.kind === 'tee' || i.kind === 'hoodie'; });
  return things.length > 0 && things.every(function (i) { return i.placement === 'Позаду'; });
}

function bot_urgentPrefix_(items) { return items.some(function (i) { return i.urgent; }) ? 'ТЕРМІНОВО ' : ''; }

function bot_renderAll_(items, o, suffix) {
  var body = items.map(function (it) { return bot_renderItem_(it, o); }).join('. ');
  return bot_urgentPrefix_(items) + body + (o.hoist && suffix ? '. ' + suffix : '');
}

var BOT_LADDER_ = [
  { hoist: false },
  { hoist: true },
  { hoist: true, teeShort: true },
  { hoist: true, teeShort: true, glue: true },
  { hoist: true, teeShort: true, glue: true, dropMarkers: 'tee' },
  { hoist: true, teeShort: true, glue: true, dropMarkers: 'all' }
];

/** Крайній випадок (за вказівкою власника): номер + річ, далі лише номери через кому. */
function bot_overflowTexts_(items, shortNo) {
  var pre = bot_urgentPrefix_(items);
  var thing = function (it, full) {
    var t;
    if (it.kind === 'tee') t = (BOT_COLOR_SHORT_[it.color] || 'футб') + (it.washed ? ' виварена' : '');
    else if (it.kind === 'hoodie') t = 'x' + (it.code || 1) + (it.washed ? ' виварене' : '');
    else if (it.kind === 'sticker') t = bot_nameForLevel_(it, { glue: true });
    else if (it.kind === 'cap') t = 'кепка';
    else t = '';
    if (full) {
      if (it.code > 1 && it.kind !== 'hoodie') t += ' х' + it.code;
      if (it.kind === 'hoodie' && it.noFleece) t += ' БЕЗ ФЛІСУ';
      if (it.size) t += ' ' + it.size;
    }
    return (bot_showNo_(it, { shortNo: shortNo }) + ' ' + t).trim();
  };
  return [
    pre + items.map(function (i) { return thing(i, true); }).join(', '),
    pre + items.map(function (i) { return thing(i, false); }).join(', '),
    pre + items.map(function (i) { return bot_showNo_(i, { shortNo: shortNo }); }).join(', ')
  ];
}

/** Номери → «14732-14750» для послідовних серій з 3+ номерів; решта через кому. */
function bot_numberRanges(nos, fmt) {
  fmt = fmt || String;
  var a = nos.map(Number).filter(function (n) { return n > 0; }).sort(function (x, y) { return x - y; });
  var out = [], i = 0;
  while (i < a.length) {
    var j = i;
    while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++;
    if (j - i >= 2) out.push(fmt(a[i]) + '-' + fmt(a[j])); else for (var k = i; k <= j; k++) out.push(fmt(a[k]));
    i = j + 1;
  }
  return out.join(', ');
}

/**
 * Основна функція модуля B.
 * @return {text, len, level (1..6 — драбина, 7..9 — переповнення), overflow:boolean (не влізло навіть у номери)}
 */
function bot_buildDescription(list, limit, mode) {
  limit = limit || BOT_DESC_LIMIT_DEFAULT;
  var items = bot_descItems(list);
  if (!items.length) return { text: '', len: 0, level: 0, overflow: false };
  if (mode !== 'ladder') {
    // Формат власника: повний опис кожного замовлення («15037 No-Risk (W) худі x3 БЕЗ ФЛІСУ S, принт позаду»).
    // Не вміщається — спочатку прибираємо назву принта (склад просив: номер + річ + розмір + «принт позаду/спереду»), потім «позаду» одним словом,
    // потім «номер + річ + розмір», «номер + річ» і лише в останню чергу — самі номери.
    bot_setShortNos_(items);
    var base = { hoist: false, keepStickerWord: true, latinX: true };
    var full = bot_renderAll_(items, base, '');
    if (bot_len(full) <= limit) return { text: full, len: bot_len(full), level: 1, overflow: false };
    var canH = bot_canHoist_(items), multiple = items.length > 1;
    var D = { keepStickerWord: true, latinX: true, dropName: true }, mk = function (extra) { var o = {}; Object.keys(D).forEach(function (k) { o[k] = D[k]; }); Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; };
    var hs = multiple ? ['Всі позаду', 'Позаду'] : ['Позаду'];
    var tiers = [{ o: mk({ hoist: false }), sfx: [''], lv: 2 }];
    if (canH) {
      tiers.push({ o: mk({ hoist: true }), sfx: hs, lv: 3 });
      tiers.push({ o: mk({ hoist: true, teeShort: true }), sfx: hs, lv: 4 });
      tiers.push({ o: mk({ hoist: true, teeShort: true, hoodieX: true }), sfx: hs, lv: 5 });          // «худі» → лише «x3» (за побажанням складу)
    }
    tiers.push({ o: mk({ hoist: false, teeShort: true, hoodieX: true }), sfx: [''], lv: 6 });
    // ще тісніше: номери без спільного «15» на початку (15150 → 150)
    if (canH) tiers.push({ o: mk({ hoist: true, teeShort: true, hoodieX: true, shortNo: true }), sfx: hs, lv: 6 });
    tiers.push({ o: mk({ hoist: false, teeShort: true, hoodieX: true, shortNo: true }), sfx: [''], lv: 6 });
    for (var ti = 0; ti < tiers.length; ti++) for (var si = 0; si < tiers[ti].sfx.length; si++) {
      var tx = bot_renderAll_(items, tiers[ti].o, tiers[ti].sfx[si]);
      if (bot_len(tx) <= limit) return { text: tx, len: bot_len(tx), level: tiers[ti].lv, overflow: false };
    }
    var ovs = bot_overflowTexts_(items, true);
    for (var oi = 0; oi < 2; oi++) if (bot_len(ovs[oi]) <= limit) return { text: ovs[oi], len: bot_len(ovs[oi]), level: 7 + oi, overflow: false };
    var nums = ovs[2];
    var rg0 = bot_urgentPrefix_(items) + bot_numberRanges(items.map(function (i) { return i.no; }), function (n) { return bot_showNo_(items.filter(function (i) { return i.no === n; })[0], { shortNo: true }); });
    if (bot_len(rg0) <= limit) return { text: rg0, len: bot_len(rg0), level: 10, overflow: false };       // «150-155»: середні номери не пишемо (за побажанням складу)
    if (bot_len(nums) <= limit) return { text: nums, len: bot_len(nums), level: 9, overflow: false };
    return { text: nums, len: bot_len(nums), level: 9, overflow: true };
  }
  var multi = items.length > 1;
  var canHoist = bot_canHoist_(items);
  for (var lv = 0; lv < BOT_LADDER_.length; lv++) {
    var o = {}; Object.keys(BOT_LADDER_[lv]).forEach(function (k) { o[k] = BOT_LADDER_[lv][k]; });
    o.keepStickerWord = !multi;                       // «15082 Стікерпак ГТА» лише коли замовлення одне; в багатозамовних — «Ландо Норріс»
    if (o.hoist && !canHoist) o.hoist = false;        // нема що виносити в «позаду» (напр. є «спереду») — розміщення лишаються біля речей
    var suffixes = o.hoist ? (multi ? ['Всі позаду', 'Позаду'] : ['Позаду']) : [''];
    for (var s = 0; s < suffixes.length; s++) {
      var text = bot_renderAll_(items, o, suffixes[s]);
      if (bot_len(text) <= limit) return { text: text, len: bot_len(text), level: lv + 1, overflow: false };
    }
  }
  var ov = bot_overflowTexts_(items);
  for (var k = 0; k < ov.length; k++) {
    if (bot_len(ov[k]) <= limit) return { text: ov[k], len: bot_len(ov[k]), level: 7 + k, overflow: false };
  }
  var rg = bot_urgentPrefix_(items) + bot_numberRanges(items.map(function (i) { return i.no; }));
  if (bot_len(rg) <= limit) return { text: rg, len: bot_len(rg), level: 10, overflow: false };      // послідовні номери діапазоном
  return { text: ov[2], len: bot_len(ov[2]), level: 9, overflow: true };       // навіть так не влізло → потрібне рішення власника
}

/** Перевірка: чи в описі збережено номери, розміри, «БЕЗ ФЛІСУ» і «хN» (для рівнів 1–6; на рівнях переповнення — лише номери). */
function bot_descMustHaves(list, text) {
  var missing = [];
  list.forEach(function (p) {
    if (text.indexOf(String(p.no)) < 0) missing.push('№' + p.no);
  });
  return missing;
}


// ======================= ReconcileLogic.gs =======================
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
    // «значущі» рядки: скасований/нульовий рядок (cost 0, статус не «В роботі») не робить ТТН «частково оплаченою»
    var relevant = rows.filter(function (r) { return r.status === 'В роботі' || (Number(r.cost) || 0) > 0; });
    if (!relevant.length) relevant = rows;
    var paid = relevant.filter(function (r) { return r.paid === 'Оплачено'; });
    var firstPaid = paid[0];
    var spornaRows = rows.filter(function (r) { return r.paid === 'Спірна'; });
    if (spornaRows.length) {
      var m = String(spornaRows[0].note || '').match(/Спірна,\s*(З-[\d-]+)/);
      d.deferred = m ? m[1] : 'раніше';
    }
    if (paid.length === relevant.length) {
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
  var L = ['У файлі ' + bot_esc(meta.fileName) + ' не сходяться:'];
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
/**
 * opening (необов'язково) = {debt, ordersAfter:Date|null, paysAfter:Date|null}: початковий залишок боргу.
 * Він додається до собівартості; замовлення з датою ≤ ordersAfter і оплати з датою ≤ paysAfter вже в ньому — не рахуємо вдруге.
 */
function bot_openingFromSettings() {
  var raw = bot_setting('OPENING_DEBT', '');
  var debt = bot_toNumber(raw);
  if (raw === '' || !isFinite(debt)) return null;
  return { debt: debt, ordersAfter: bot_settingDate_('OPENING_ORDERS_AFTER'), paysAfter: bot_settingDate_('OPENING_PAYS_AFTER') };
}

/** Дата з налаштувань: підходить і текст «31.08.2026», і справжня дата (якщо Google перетворив клітинку на дату). */
function bot_settingDate_(key) {
  var raw = bot_settingsMap()[key];
  if (bot_isDate(raw)) return bot_makeDateFrom_(raw);
  return bot_parseDate(bot_setting(key, ''));
}

function bot_afterCut_(d, cut) {
  if (!cut) return true;
  if (!bot_isDate(d)) return true;
  return bot_dayNum(d) > bot_dayNum(cut);
}

function bot_computeDebt(orders, payments, opening) {
  var ordersC = opening ? orders.filter(function (o) { return bot_afterCut_(o.date, opening.ordersAfter); }) : orders;
  var paysC = opening ? payments.filter(function (p) { return bot_afterCut_(p.date, opening.paysAfter); }) : payments;
  var cost = bot_sumBy_(ordersC, function (o) { return Number(o.cost) || 0; }) + (opening ? opening.debt : 0);
  var paid = bot_sumBy_(paysC, function (p) { return Number(p.sum) || 0; });
  var groups = {};
  orders.forEach(function (o) {
    if (!o.ttn || o.paid === 'Оплачено' || o.status !== 'В роботі') return;
    if (o.stage !== 'Отримано' && o.stage !== 'Відмова') return;
    (groups[o.ttn] = groups[o.ttn] || []).push(o);
  });
  var keys = Object.keys(groups);
  return {
    cost: cost, paid: paid, debt: bot_round2(cost - paid), opening: opening ? opening.debt : 0,
    unpaidDelivered: { count: keys.length, sum: bot_sumBy_(keys, function (k) { return bot_sumBy_(groups[k], function (o) { return Number(o.cost) || 0; }); }) }
  };
}


// ======================= Reconcile.gs =======================
/**
 * Reconcile.gs — Модулі 2–3: звірка файлу виробництва, підтвердження оплати, відкат, запис в «Оплати»,
 * архів файлів. Чиста логіка — в ReconcileLogic.gs; тут усе, що торкається Telegram / Google.
 */

var BOT_DECISION_TEXT_ = { table: 'за таблицею', file: 'за файлом', defer: 'відкладено' };
var BOT_DECISION_CODE_ = { 'за таблицею': 'table', 'за файлом': 'file', 'відкладено': 'defer' };
var BOT_ARCHIVE_FOLDER_NAME = 'Монокло — файли виробництва';

// =====================================================================
// Читання файлу
// =====================================================================

function bot_hex_(bytes) {
  return bytes.map(function (b) { return ((b < 0 ? b + 256 : b).toString(16)).replace(/^(.)$/, '0$1'); }).join('');
}

function bot_blobToValues_(blob, name) {
  if (/\.csv$/i.test(name)) {
    // Excel в Україні зберігає CSV у windows-1251: якщо як UTF-8 заголовки не впізнано — пробуємо 1251
    var decode = function (charset) {
      var text = blob.getDataAsString(charset).replace(/^\uFEFF/, '');
      var first = text.split('\n')[0];
      var delim = (first.indexOf(';') >= 0 && first.indexOf(',') < 0) ? ';' : (first.indexOf('\t') >= 0 && first.indexOf(',') < 0 ? '\t' : ',');
      return Utilities.parseCsv(text, delim);
    };
    var utf = decode('UTF-8');
    if (bot_parseProductionFile(utf).error) {
      try { var cp = decode('windows-1251'); if (!bot_parseProductionFile(cp).error) return cp; } catch (e) { /* лишаємо UTF-8 */ }
    }
    return utf;
  }
  var mime = /\.xls$/i.test(name) ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  var src = blob.copyBlob().setContentType(mime);
  var tmp = Drive.Files.insert({ title: 'tmp-reconcile-' + Date.now(), mimeType: MimeType.GOOGLE_SHEETS }, src, { convert: true });
  try {
    var sheets = SpreadsheetApp.openById(tmp.id).getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getLastRow() > 0) return sheets[i].getDataRange().getValues();
    }
    return [];
  } finally {
    try { Drive.Files.remove(tmp.id); } catch (e) { bot_log('УВАГА', 'не видалився тимчасовий файл', e.message); }
  }
}

// =====================================================================
// Архів файлів (5.5)
// =====================================================================

function bot_archiveFolder_() {
  var id = bot_setting('ARCHIVE_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* створимо нову */ } }
  var parents = DriveApp.getFileById(bot_ss().getId()).getParents();
  var parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  var existing = parent.getFoldersByName(BOT_ARCHIVE_FOLDER_NAME);
  var folder = existing.hasNext() ? existing.next() : parent.createFolder(BOT_ARCHIVE_FOLDER_NAME);
  bot_setSetting('ARCHIVE_FOLDER_ID', folder.getId());
  return folder;
}

function bot_archiveFile(blob, reconId, name) {
  var folder = bot_archiveFolder_();
  var safe = String(name).replace(/[\\\/:*?"<>|]/g, '_');
  var file = folder.createFile(blob.copyBlob().setName(bot_dayKey(new Date()) + '_' + reconId + '_' + safe));
  return file.getUrl();
}

// =====================================================================
// Аркуші «Звірки» і «Звірки_деталі»
// =====================================================================

function bot_reconSheet_() { return bot_sheet(BOT_SHEETS.recon); }

function bot_reconList() {
  var sh = bot_reconSheet_();
  var map = bot_headerMap(sh, BOT_RECON_COLS);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  return vals.map(function (r, i) {
    var o = { _row: i + 2 };
    BOT_RECON_COLS.forEach(function (c) { o[c[0]] = r[map[c[0]] - 1]; });
    o.id = String(o.id);
    return o;
  }).filter(function (o) { return o.id; });
}

function bot_reconGet(id) {
  var list = bot_reconList();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function bot_reconPatch(id, fields) {
  var sh = bot_reconSheet_();
  var map = bot_headerMap(sh, BOT_RECON_COLS);
  var rec = bot_reconGet(id);
  if (!rec) throw new Error('Звірку ' + id + ' не знайдено');
  Object.keys(fields).forEach(function (k) { if (map[k]) sh.getRange(rec._row, map[k]).setValue(fields[k]); });
}

function bot_detailRows_(id) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var out = [];
  vals.forEach(function (r, i) {
    if (String(r[map.recon - 1]) !== id) return;
    out.push({ _row: i + 2, ttn: bot_normTtn(r[map.ttn - 1]), decision: BOT_DECISION_CODE_[r[map.decision - 1]] || '', category: r[map.category - 1] });
  });
  return out;
}

function bot_writeDetails_(id, details) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  var width = sh.getLastColumn();
  var start = sh.getLastRow() + 1;
  var rows = details.map(function (d) {
    var arr = []; for (var i = 0; i < width; i++) arr.push('');
    var set = function (k, v) { arr[map[k] - 1] = v; };
    set('recon', id); set('ttn', d.ttn);
    set('orders', d.orders.map(function (o) { return o.no; }).join(', '));
    set('items', d.orders.map(function (o) { return (o.type || 'виріб') + ' ' + o.cost; }).join('; '));
    set('fileSum', d.fileSum); set('tableSum', d.tableSum); set('diff', d.diff); set('fileStatus', d.fileStatus);
    set('category', BOT_CAT_LABEL[d.category]); set('decision', BOT_DECISION_TEXT_[d.decision] || '');
    return arr;
  });
  if (!rows.length) return;
  if (start + rows.length - 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), start + rows.length - sh.getMaxRows() + 100);
  sh.getRange(start, map.ttn, rows.length, 1).setNumberFormat('@');
  sh.getRange(start, 1, rows.length, width).setValues(rows);
}

function bot_setDetailDecision_(id, ttn, decision) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  bot_detailRows_(id).forEach(function (r) {
    if (r.ttn === ttn) sh.getRange(r._row, map.decision).setValue(BOT_DECISION_TEXT_[decision] || '');
  });
}

/** Оновити категорії/суми в «Звірки_деталі» для звірки id (після підтвердження). */
function bot_refreshDetails_(id, details) {
  var sh = bot_sheet(BOT_SHEETS.reconDetails);
  var map = bot_headerMap(sh, BOT_DETAIL_COLS);
  var byTtn = {}; details.forEach(function (d) { byTtn[d.ttn] = d; });
  var rows = bot_detailRows_(id).filter(function (r) { return byTtn[r.ttn]; });
  // рядки однієї звірки записані підряд; якщо їх порядок змінили сортуванням — пишемо відрізками
  var i = 0;
  while (i < rows.length) {
    var j = i;
    while (j + 1 < rows.length && rows[j + 1]._row === rows[j]._row + 1) j++;
    var vals = [];
    for (var t = i; t <= j; t++) { var d = byTtn[rows[t].ttn]; vals.push([d.tableSum, d.diff, BOT_CAT_LABEL[d.category]]); }
    var cols = [map.tableSum, map.diff, map.category];
    if (cols[1] === cols[0] + 1 && cols[2] === cols[1] + 1) sh.getRange(rows[i]._row, cols[0], vals.length, 3).setValues(vals);
    else for (var c = 0; c < 3; c++) sh.getRange(rows[i]._row, cols[c], vals.length, 1).setValues(vals.map(function (v) { return [v[c]]; }));
    i = j + 1;
  }
}

// =====================================================================
// Побудова / оновлення зведення з поточного стану таблиці
// =====================================================================

function bot_fileRowsFromJson_(json) {
  return JSON.parse(json).map(function (a) {
    return { ttn: a[0], price: a[1], refusal: !!a[2], chatNo: a[3] || null, status: a[4] || '', note: '' };
  });
}

var BOT_CELL_LIMIT_ = 48000;      // у клітинку Google Таблиць влазить до 50 000 символів

/** Дані файлу для «Звірок». Якщо не вміщаються — стискаємо (без статусів); null — файл завеликий. */
function bot_fileRowsToJson_(rows) {
  var full = JSON.stringify(rows.map(function (r) { return [r.ttn, r.price, r.refusal ? 1 : 0, r.chatNo || 0, String(r.status || '').slice(0, 24)]; }));
  if (full.length <= BOT_CELL_LIMIT_) return full;
  var compact = JSON.stringify(rows.map(function (r) { return [r.ttn, r.price, r.refusal ? 1 : 0]; }));
  return compact.length <= BOT_CELL_LIMIT_ ? compact : null;
}

/** Перерахувати details для звірки з поточним станом таблиці + збережені рішення. */
function bot_reconDetailsNow_(rec) {
  var fileRows = bot_fileRowsFromJson_(rec.fileData);
  var details = bot_reconcileCompute(fileRows, bot_readOrders(), { priceRows: bot_readPriceRows(), today: new Date() });
  var decisions = {};
  bot_detailRows_(rec.id).forEach(function (r) { if (r.decision) decisions[r.ttn] = r.decision; });
  details.forEach(function (d) { if (decisions[d.ttn] && d.category !== 'DUP' && d.category !== 'MISSING' && d.category !== 'PAID') d.decision = decisions[d.ttn]; });
  return details;
}

function bot_reconMeta_(rec, warning) { return { id: rec.id, fileName: rec.fileName, warning: warning || '' }; }

function bot_refMsg_(rec) {
  var m = String(rec.summaryMsg || '').split(':');
  return m.length === 2 ? { chatId: m[0], msgId: Number(m[1]) } : null;
}

/** Оновити текст і кнопки зведення в Telegram і суму «До оплати» в «Звірках». */
function bot_reconRerender_(rec, details) {
  var S = bot_reconSummary(details);
  bot_reconPatch(rec.id, { toPay: S.pay.sum, diff: S.diffTotal });
  var ref = bot_refMsg_(rec);
  if (ref) bot_edit(ref.chatId, ref.msgId, bot_buildReconSummary(bot_reconMeta_(rec), details), bot_reconKeyboard(bot_reconMeta_(rec), details));
}

// =====================================================================
// Звірка: прийом файлу
// =====================================================================

function bot_onDocument(msg) {
  var chatId = msg.chat.id, doc = msg.document;
  var name = doc.file_name || 'file.xlsx';
  if (!/\.(xlsx|xls|csv)$/i.test(name)) {
    return bot_send(chatId, 'Для звірки надішліть файл Excel (.xlsx, .xls) або .csv. Файл «' + bot_esc(name) + '» не підходить.');
  }
  if (doc.file_size && doc.file_size > 19 * 1024 * 1024) return bot_send(chatId, 'Файл завеликий (понад 20 МБ).');
  bot_send(chatId, '⏳ Отримав «' + bot_esc(name) + '», рахую звірку…');
  var blob = bot_downloadFile(doc.file_id, name);
  bot_reconcileFile(chatId, blob, name);
}

function bot_reconcileFile(chatId, blob, name) {
  var values = bot_blobToValues_(blob, name);
  var parsed = bot_parseProductionFile(values);
  if (parsed.error) return bot_send(chatId, '⚠️ ' + bot_esc(parsed.error));
  if (!parsed.rows.length) return bot_send(chatId, '⚠️ У файлі «' + bot_esc(name) + '» немає жодної ТТН із сумою.');
  var fileJson = bot_fileRowsToJson_(parsed.rows);
  if (fileJson === null) {
    return bot_send(chatId, '⚠️ Файл завеликий: ' + parsed.rows.length + ' ТТН. За раз бот обробляє до ≈1 500 ТТН — розділіть файл на кілька частин і надішліть окремо. Нічого не змінено.');
  }
  var hash = bot_hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, blob.getBytes()));

  var created = bot_withLock(function () {
    var now = new Date();
    var recons = bot_reconList();
    var id = bot_nextReconId(recons.map(function (r) { return r.id; }), now);
    var orders = bot_readOrders();
    var details = bot_reconcileCompute(parsed.rows, orders, { priceRows: bot_readPriceRows(), today: now });
    var S = bot_reconSummary(details);

    // Повторна обробка того самого файлу після збою (зведення не дійшло) — не створюємо другу чернетку й архів
    var orphan = null;
    recons.forEach(function (r) {
      if (!orphan && r.status === 'Чернетка' && String(r.hash) === hash && !r.summaryMsg && r.date && now.getTime() - new Date(r.date).getTime() < 1800000) orphan = r;
    });
    if (orphan) return { id: orphan.id, details: details, warning: '', fileUrl: String(orphan.fileLink || '') };

    // чи не оплачували цей файл / цей набір ТТН раніше
    var confirmed = recons.filter(function (r) { return r.status === 'Підтверджено'; });
    var history = confirmed.map(function (r) { return { id: r.id, date: r.date, hash: String(r.hash), status: r.status, ttns: [] }; });
    if (history.length) {
      var wanted = {}; confirmed.forEach(function (r) { wanted[r.id] = []; });
      var dsh = bot_sheet(BOT_SHEETS.reconDetails); var dmap = bot_headerMap(dsh, BOT_DETAIL_COLS);
      if (dsh.getLastRow() >= 2) {
        dsh.getRange(2, 1, dsh.getLastRow() - 1, dsh.getLastColumn()).getValues().forEach(function (r) {
          var rid = String(r[dmap.recon - 1]); if (wanted[rid]) wanted[rid].push(bot_normTtn(r[dmap.ttn - 1]));
        });
      }
      history.forEach(function (h) { h.ttns = wanted[h.id]; });
    }
    var prev = bot_findPreviousRecon(history, hash, parsed.rows.map(function (r) { return r.ttn; }));
    var warning = prev ? 'Цей файл уже оплачено звіркою ' + prev.id + (prev.date ? ' від ' + bot_fmtDate(new Date(prev.date)) : '') : '';

    var fileUrl = '';
    try { fileUrl = bot_archiveFile(blob, id, name); } catch (e) { bot_log('ПОМИЛКА', 'архів файлу', e.message); }

    var sh = bot_reconSheet_(); var map = bot_headerMap(sh, BOT_RECON_COLS);
    var arr = []; for (var i = 0; i < sh.getLastColumn(); i++) arr.push('');
    var set = function (k, v) { arr[map[k] - 1] = v; };
    set('id', id); set('date', now); set('fileLink', fileUrl); set('hash', hash); set('ttnCount', S.ttnCount);
    set('fileSum', S.fileTotal); set('toPay', S.pay.sum); set('diff', S.diffTotal); set('status', 'Чернетка');
    set('fileName', name); set('fileData', fileJson);
    var row = sh.getLastRow() + 1;
    sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy hh:mm');
    sh.getRange(row, map.hash).setNumberFormat('@');
    sh.getRange(row, map.summaryMsg).setNumberFormat('@');            // «чат:повідомлення» — інакше Google може прочитати як час
    sh.getRange(row, map.fileName).setNumberFormat('@');
    sh.getRange(row, 1, 1, arr.length).setValues([arr]);
    bot_writeDetails_(id, details);
    bot_log('ІНФО', 'звірка ' + id, name + ' · ТТН ' + S.ttnCount + ' · до оплати ' + S.pay.sum);
    return { id: id, details: details, warning: warning, fileUrl: fileUrl };
  });

  var meta = { id: created.id, fileName: name, warning: created.warning };
  var res = bot_send(chatId, bot_buildReconSummary(meta, created.details), { keyboard: bot_reconKeyboard(meta, created.details) });
  if (!res.ok) {                                                // без зведення й кнопок чернетка марна — не лишаємо «висіти»
    bot_withLock(function () { bot_reconPatch(created.id, { status: 'Скасовано' }); });
    bot_send(chatId, '⚠️ Не вдалося надіслати зведення звірки ' + bot_esc(created.id) + ' (' + bot_esc(bot_scrub(res.description)) +
      '). Чернетку скасовано, таблиця не змінювалась, файл збережено в архіві. Надішліть файл ще раз.');
    return;
  }
  bot_reconPatch(created.id, { summaryMsg: chatId + ':' + res.result.message_id });
  if (parsed.warnings && parsed.warnings.length) bot_send(chatId, '⚠️ ' + parsed.warnings.map(bot_esc).join('\n⚠️ '));
  if (parsed.skipped.length) {
    bot_send(chatId, '⚠️ Пропущено рядків файлу: ' + parsed.skipped.length + '\n' + parsed.skipped.slice(0, 10).map(function (s) { return 'рядок ' + s.line + ': ' + bot_esc(s.reason); }).join('\n'));
  }
  var diffText = bot_buildDiffMessage(meta, created.details);
  if (diffText) {
    var diffParts = bot_splitText(diffText, 3900);
    diffParts.forEach(function (part, i) {
      bot_send(chatId, part, i === diffParts.length - 1 ? { keyboard: bot_diffKeyboard(meta, created.details, created.fileUrl) } : {});
    });
  }
}

// =====================================================================
// Кнопки звірки
// =====================================================================

function bot_reconCallback(parts, ctx) {
  var act = parts[0], id = parts[1];
  var cbId = ctx.cb.id;
  var rec = bot_reconGet(id);
  if (!rec) return bot_answerCb(cbId, 'Звірку ' + id + ' не знайдено', true);
  var isDraft = rec.status === 'Чернетка';

  switch (act) {
    case 'det': {
      bot_answerCb(cbId);
      var d = bot_reconDetailsNow_(rec);
      return bot_sendMany(ctx.chatId, bot_buildDetailsMessages(bot_reconMeta_(rec), d).concat(rec.fileLink ? ['📁 <a href="' + rec.fileLink + '">Файл у архіві</a> · аркуш «Звірки_деталі», фільтр за ID ' + bot_esc(id)] : []));
    }
    case 'sup': {
      bot_answerCb(cbId);
      return bot_send(ctx.chatId, bot_buildSupplierText(bot_reconMeta_(rec), bot_reconDetailsNow_(rec)));
    }
    case 'cnc': {
      if (!isDraft) return bot_answerCb(cbId, 'Вже ' + String(rec.status).toLowerCase() + ' — скасувати не можна', true);
      bot_withLock(function () { bot_reconPatch(id, { status: 'Скасовано' }); });
      bot_answerCb(cbId, 'Скасовано');
      return bot_edit(ctx.chatId, ctx.msgId, bot_buildReconSummary(bot_reconMeta_(rec), bot_reconDetailsNow_(rec)) + '\n\n✖️ <b>Скасовано</b> — таблиця не змінювалась.');
    }
    case 'dsp': return bot_decisionList_(rec, ctx);
    case 'rs': return bot_decisionTap_(rec, parts, ctx);
    case 'rsy': return bot_decisionApplyFile_(rec, Number(parts[2]), ctx);
    case 'rsn': return bot_decisionShowButtons_(rec, Number(parts[2]), ctx, bot_reconDetailsNow_(rec));
    case 'pay': return bot_payAsk_(rec, ctx);
    case 'payn': bot_answerCb(cbId, 'Ок'); return bot_tgRaw('deleteMessage', { chat_id: ctx.chatId, message_id: ctx.msgId });
    case 'payy': return bot_payConfirm_(rec, ctx);
    case 'opy': return bot_paymentRecord_(rec, Number(parts[2]), ctx);
    case 'opc':
      bot_answerCb(cbId);
      bot_awaitPut(ctx.userId, { kind: 'paySum', id: id });
      return bot_send(ctx.chatId, '✏️ Напишіть суму оплати числом (наприклад, <code>25000</code>).');
    case 'opn': bot_answerCb(cbId, 'Ок'); return bot_edit(ctx.chatId, ctx.msgId, 'Добре, оплату в аркуші «Оплати» внесіть самі.');
    case 'undy': return bot_undoDo_(rec, ctx);
    case 'undn': bot_answerCb(cbId, 'Ок'); return bot_edit(ctx.chatId, ctx.msgId, 'Відкат не виконано.');
  }
}

// ---------- спірні ТТН ----------

function bot_decisionKeyboard_(id, idx, d) {
  return { inline_keyboard: [[
    { text: 'За таблицею ' + bot_fmtNum(d.tableSum), callback_data: 'rs|' + id + '|' + idx + '|t' },
    { text: 'За файлом ' + bot_fmtNum(d.fileSum), callback_data: 'rs|' + id + '|' + idx + '|f' },
    { text: 'Відкласти', callback_data: 'rs|' + id + '|' + idx + '|d' }]] };
}

function bot_decisionText_(d) {
  return '⚖️ ' + bot_code(d.ttn) + '\nфайл ' + bot_fmtNum(d.fileSum) + ' / таблиця ' + bot_fmtNum(d.tableSum) + ' → ' + bot_fmtSigned(d.diff) + '\n' +
    d.orders.map(bot_orderLine_).map(bot_esc).join(' · ') + (d.hint ? '\n' + bot_esc(d.hint) : '') +
    (d.decision ? '\n<b>Рішення: ' + bot_decisionLabel_(d.decision) + '</b>' : '');
}

function bot_decisionList_(rec, ctx) {
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Звірка вже ' + String(rec.status).toLowerCase(), true);
  var details = bot_reconDetailsNow_(rec);
  var list = [];
  details.forEach(function (d, i) { if (d.category === 'MISMATCH' || (d.decision && d.category === 'OK')) list.push({ d: d, i: i }); });
  var mism = list.filter(function (x) { return x.d.category === 'MISMATCH'; });
  if (!mism.length) return bot_answerCb(ctx.cb.id, 'Спірних ТТН немає', true);
  bot_answerCb(ctx.cb.id);
  mism.slice(0, 20).forEach(function (x) {
    bot_send(ctx.chatId, bot_decisionText_(x.d), { keyboard: bot_decisionKeyboard_(rec.id, x.i, x.d) });
  });
  if (mism.length > 20) bot_send(ctx.chatId, 'Показано перші 20 із ' + mism.length + ' спірних ТТН.');
}

function bot_decisionShowButtons_(rec, idx, ctx, details) {
  var d = details[idx];
  bot_answerCb(ctx.cb.id);
  bot_edit(ctx.chatId, ctx.msgId, bot_decisionText_(d), bot_decisionKeyboard_(rec.id, idx, d));
}

function bot_decisionTap_(rec, parts, ctx) {
  var idx = Number(parts[2]), code = parts[3];
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Звірка вже ' + String(rec.status).toLowerCase(), true);
  var details = bot_reconDetailsNow_(rec);
  var d = details[idx];
  if (!d) return bot_answerCb(ctx.cb.id, 'ТТН не знайдено', true);
  if (code === 'f') {
    bot_answerCb(ctx.cb.id);
    return bot_edit(ctx.chatId, ctx.msgId, bot_decisionText_(d) + '\n\nОновити собівартість ТТН з <b>' + bot_fmtNum(d.tableSum) + '</b> на <b>' + bot_fmtNum(d.fileSum) +
      '</b> грн? Стару суму запишу в «Примітку».', { inline_keyboard: [[{ text: '✅ Так, за файлом', callback_data: 'rsy|' + rec.id + '|' + idx }, { text: 'Ні', callback_data: 'rsn|' + rec.id + '|' + idx }]] });
  }
  var dec = code === 't' ? 'table' : 'defer';
  bot_withLock(function () {
    bot_applyDecisionMarks_(rec.id, d, dec);
    bot_setDetailDecision_(rec.id, d.ttn, dec);
  });
  d.decision = dec;
  bot_answerCb(ctx.cb.id, bot_decisionLabel_(dec));
  bot_edit(ctx.chatId, ctx.msgId, bot_decisionText_(d), bot_decisionKeyboard_(rec.id, idx, d));
  bot_reconRerender_(rec, bot_reconDetailsNow_(rec));
}

/** «Відкласти» ставить «Спірна» + примітку; інший вибір знімає цю позначку. */
function bot_applyDecisionMarks_(reconId, d, decision) {
  var tag = 'Спірна, ' + reconId;
  var patches = [];
  var current = bot_readOrders().filter(function (o) { return o.ttn === d.ttn; });
  current.forEach(function (o) {
    var notes = o.note.split('; ').filter(function (s) { return s && s.indexOf('Спірна, ') !== 0; });
    var fields;
    if (decision === 'defer') { notes.push(tag); fields = { paid: 'Спірна', note: notes.join('; ') }; }
    else if (o.paid === 'Спірна') { fields = { paid: 'Не оплачено', note: notes.join('; ') }; }
    if (fields) patches.push({ row: o._row, fields: fields });
  });
  bot_patchOrders(patches);
}

function bot_decisionApplyFile_(rec, idx, ctx) {
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Звірка вже ' + String(rec.status).toLowerCase(), true);
  var details = bot_reconDetailsNow_(rec);
  var d = details[idx];
  bot_withLock(function () {
    var orders = bot_readOrders().filter(function (o) { return o.ttn === d.ttn; });
    if (orders.some(function (o) { return o.paid === 'Оплачено'; })) throw new Error('ТТН уже оплачена — змінювати не можна');
    var plan = bot_planCostUpdate(orders, d.fileSum, rec.id);
    if (Math.abs(plan.oldSum - plan.newSum) > 0.005) {
      bot_patchOrders([{ row: plan.row, fields: { cost: plan.cost, note: plan.note } }].concat(
        orders.filter(function (o) { return o.paid === 'Спірна'; }).map(function (o) { return { row: o._row, fields: { paid: 'Не оплачено' } }; })));
    }
    bot_setDetailDecision_(rec.id, d.ttn, 'file');
  });
  bot_answerCb(ctx.cb.id, 'Собівартість оновлено');
  var fresh = bot_reconDetailsNow_(rec);
  var nd = fresh[idx]; nd.decision = 'file';
  bot_edit(ctx.chatId, ctx.msgId, '⚖️ ' + bot_code(d.ttn) + '\n✅ Рішення: за файлом — собівартість ТТН тепер ' + bot_fmtNum(d.fileSum) + ' грн.');
  bot_reconRerender_(rec, fresh);
}

// ---------- підтвердження оплати ----------

function bot_payAsk_(rec, ctx) {
  if (rec.status !== 'Чернетка') return bot_answerCb(ctx.cb.id, 'Вже ' + String(rec.status).toLowerCase() + (rec.confirmedAt ? ' ' + bot_fmtDateTime(new Date(rec.confirmedAt)) : ''), true);
  var d = bot_reconDetailsNow_(rec);
  var plan = bot_planPayment(d);
  if (!plan.rows.length) return bot_answerCb(ctx.cb.id, 'Нічого оплачувати', true);
  bot_answerCb(ctx.cb.id);
  bot_send(ctx.chatId, '❓ <b>Точно?</b> Буде позначено <b>' + plan.rows.length + '</b> ' + bot_plural(plan.rows.length, 'рядок', 'рядки', 'рядків') + ' на <b>' + bot_fmtMoney(plan.sum) + '</b> (ТТН: ' + plan.ttns.length + ').',
    { keyboard: { inline_keyboard: [[{ text: 'Так, оплатити', callback_data: 'payy|' + rec.id }, { text: 'Ні', callback_data: 'payn|' + rec.id }]] } });
}

function bot_payConfirm_(rec0, ctx) {
  var out = bot_withLock(function () {
    var rec = bot_reconGet(rec0.id);                                  // свіжий стан під блокуванням
    if (rec.status !== 'Чернетка') return { error: 'Вже ' + String(rec.status).toLowerCase() + (rec.confirmedAt ? ' ' + bot_fmtDateTime(new Date(rec.confirmedAt)) : '') };
    if (rec.date && Date.now() - new Date(rec.date).getTime() > 48 * 3600000) return { error: 'Чернетка старша за 48 годин — надішліть файл знову.' };

    // Попередня спроба встигла позначити рядки «Оплачено», але впала до оновлення звірки → лише завершуємо
    // (повторно рядки не чіпаємо, гроші двічі не рахуємо).
    var already = bot_readOrders().filter(function (o) { return o.recon === rec.id && o.paid === 'Оплачено'; });
    if (already.length) {
      var doneSum = bot_sumBy_(already, function (o) { return Number(o.cost) || 0; });
      var when = new Date();
      bot_reconPatch(rec.id, { status: 'Підтверджено', confirmedSum: doneSum, rowsCount: already.length, confirmedAt: when, confirmedBy: ctx.userName });
      bot_log('УВАГА', 'оплата ' + rec.id + ' завершена після збою', already.length + ' рядків · ' + doneSum);
      return { ok: true, recovered: true, rec: rec, plan: { rows: already, sum: doneSum }, now: when };
    }

    var details = bot_reconDetailsNow_(rec);
    var changed = bot_recheckPayable(details, bot_readOrders());
    var plan = bot_planPayment(details);
    if (changed.length || Math.abs(plan.sum - Number(rec.toPay)) > 0.005) {
      return { stale: true, rec: rec, details: details };
    }
    if (!plan.rows.length) return { error: 'Нічого оплачувати' };
    var today = bot_today();
    // «Оплачено» пишемо ОСТАННІМ: якщо запуск перервуть посередині, рядки лишаться «Не оплачено» з ID звірки, і повтор безпечно допише решту
    var patches = plan.rows.map(function (r) { return { row: r, fields: { recon: rec.id, paidDate: today, paid: 'Оплачено' } }; });
    bot_patchOrders(patches);
    var now = new Date();
    bot_reconPatch(rec.id, { status: 'Підтверджено', confirmedSum: plan.sum, rowsCount: plan.rows.length, confirmedAt: now, confirmedBy: ctx.userName });
    bot_refreshDetails_(rec.id, details);
    bot_log('ІНФО', 'оплата ' + rec.id, plan.rows.length + ' рядків · ' + plan.sum);
    return { ok: true, rec: rec, plan: plan, now: now, details: details };
  });

  if (out.error) { bot_answerCb(ctx.cb.id, out.error, true); return bot_edit(ctx.chatId, ctx.msgId, '⚠️ ' + bot_esc(out.error)); }
  if (out.stale) {
    bot_answerCb(ctx.cb.id, 'Таблиця змінилась з моменту звірки', true);
    bot_edit(ctx.chatId, ctx.msgId, '⚠️ Таблиця змінилась з моменту звірки — нічого не оплачено. Нижче нове зведення.');
    bot_reconRerender_(out.rec, out.details);
    return;
  }
  bot_answerCb(ctx.cb.id, 'Підтверджено');
  var stamp = '✅ <b>Підтверджено ' + bot_fmtDateTime(out.now) + ' · ' + out.plan.rows.length + ' ' + bot_plural(out.plan.rows.length, 'рядок', 'рядки', 'рядків') + ' · ' + bot_fmtMoney(out.plan.sum) + '</b>' +
    (out.recovered ? '\n(операцію завершено після короткого збою — рядки повторно не змінювались)' : '');
  var ref = bot_refMsg_(out.rec);
  if (ref) {
    if (out.recovered) bot_tgRaw('editMessageReplyMarkup', { chat_id: ref.chatId, message_id: ref.msgId, reply_markup: { inline_keyboard: [] } });
    else bot_edit(ref.chatId, ref.msgId, bot_buildReconSummary(bot_reconMeta_(out.rec), out.details) + '\n\n' + stamp);
  }
  bot_edit(ctx.chatId, ctx.msgId, stamp);
  bot_send(ctx.chatId, 'Додати оплату <b>' + bot_fmtMoney(out.plan.sum) + '</b> у аркуш «Оплати»?',
    { keyboard: { inline_keyboard: [[
      { text: '✅ Так, ' + bot_fmtMoney(out.plan.sum), callback_data: 'opy|' + out.rec.id + '|' + out.plan.sum },
      { text: '✏️ Інша сума', callback_data: 'opc|' + out.rec.id },
      { text: 'Ні, внесу сам', callback_data: 'opn|' + out.rec.id }]] } });
}

// ---------- запис в «Оплати» (6.4) ----------

/** Формула «Накопичено оплат» для рядка row: лише оплати ПІСЛЯ дати початкового залишку (Підсумки!H6; 0 — усі). */
function bot_accumFormula_(map, row) {
  var s = bot_colLetter(map.sum), d = bot_colLetter(map.date);
  return bot_fx('=SUMIFS($' + s + '$2:' + s + row + ',$' + d + '$2:' + d + row + ',">"&\'' + BOT_SHEETS.summary + '\'!$H$6)');
}

/** Виправляє формули «Накопичено / Собівартість / Залишок боргу» лише в тих рядках «Оплат», де вони дали помилку (#ERROR! від формул з іншим роздільником). */
function bot_rewritePaymentFormulas() {
  bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.payments);
    var map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
    if (!map.accum || !map.cost || !map.balance) return;
    var last = sh.getLastRow(); if (last < 2) return;
    var width = sh.getLastColumn();
    var vals = sh.getRange(2, 1, last - 1, width).getValues();
    function isErr(v) { return typeof v === 'string' && v.charAt(0) === '#'; }
    var fixed = 0;
    vals.forEach(function (r, i) {
      var row = i + 2;
      if (r[map.sum - 1] === '' || r[map.sum - 1] === null) return;
      if (!(isErr(r[map.accum - 1]) || isErr(r[map.cost - 1]) || isErr(r[map.balance - 1]))) return;
      sh.getRange(row, map.accum).setFormula(bot_accumFormula_(map, row));
      sh.getRange(row, map.cost).setFormula("='" + BOT_SHEETS.summary + "'!$A$5");
      sh.getRange(row, map.balance).setFormula('=' + bot_colLetter(map.cost) + row + '-' + bot_colLetter(map.accum) + row);
      fixed++;
    });
    if (fixed) bot_log('ІНФО', 'формули «Оплат»', 'виправлено рядків: ' + fixed);
  });
}

function bot_addPaymentRow_(reconId, sum, dateOpt) {
  return bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.payments);
    var map = bot_headerMap(sh, bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);
    if (!map.recon) {                                              // стара структура без колонки «Звірка»
      var c = sh.getLastColumn() + 1;
      sh.getRange(1, c).setValue('Звірка'); map.recon = c;
    }
    var last = sh.getLastRow();
    var existing = last >= 2 ? sh.getRange(2, map.recon, last - 1, 1).getValues() : [];
    for (var i = 0; i < existing.length; i++) if (String(existing[i][0]) === reconId) return { duplicate: true, row: i + 2 };
    var nos = last >= 2 ? sh.getRange(2, map.no, last - 1, 1).getValues() : [];
    var dts = last >= 2 ? sh.getRange(2, map.date, last - 1, 1).getValues() : [], sms = last >= 2 ? sh.getRange(2, map.sum, last - 1, 1).getValues() : [];
    var lastNo = 0, lastRow = 1;
    nos.forEach(function (r, i) {
      var n = Number(r[0]); if (r[0] !== '' && !isNaN(n)) lastNo = Math.max(lastNo, n);
      if ((r[0] !== '' && !isNaN(n)) || (dts[i] && dts[i][0] !== '') || (sms[i] && sms[i][0] !== '')) lastRow = i + 2;      // рядок, внесений вручну без «№», не затираємо
    });
    var row = lastRow + 1;
    var width = sh.getLastColumn();
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 50);
    var arr = []; for (var k = 0; k < width; k++) arr.push('');
    arr[map.no - 1] = lastNo + 1; arr[map.date - 1] = dateOpt || bot_today(); arr[map.sum - 1] = sum; arr[map.recon - 1] = reconId;
    sh.getRange(row, 1, 1, width).setValues([arr]);
    sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy');
    // накопичено — лише оплати ПІСЛЯ дати початкового залишку (раніші вже в ньому); без залишку «Підсумки»!H6 = 0 → усі
    if (map.accum) sh.getRange(row, map.accum).setFormula(bot_accumFormula_(map, row));
    if (map.cost) sh.getRange(row, map.cost).setFormula("='" + BOT_SHEETS.summary + "'!$A$5");
    if (map.balance && map.cost && map.accum) sh.getRange(row, map.balance).setFormula('=' + bot_colLetter(map.cost) + row + '-' + bot_colLetter(map.accum) + row);
    SpreadsheetApp.flush();
    var balance = map.balance ? sh.getRange(row, map.balance).getValue() : null;
    return { row: row, no: lastNo + 1, balance: balance };
  });
}

function bot_paymentRecord_(rec, sum, ctx) {
  var res = bot_addPaymentRow_(rec.id, sum);
  if (res.duplicate) {
    bot_answerCb(ctx.cb.id, 'Оплату для цієї звірки вже додано', true);
    return bot_edit(ctx.chatId, ctx.msgId, 'ℹ️ Оплату для звірки ' + bot_esc(rec.id) + ' уже додано (рядок ' + res.row + ').');
  }
  bot_answerCb(ctx.cb.id, 'Додано');
  bot_edit(ctx.chatId, ctx.msgId, '✅ Оплату <b>' + bot_fmtMoney(sum) + '</b> додано в «Оплати» (№' + res.no + '). Банк і квитанцію допишіть самі.' +
    (typeof res.balance === 'number' ? '\n💰 Новий борг: <b>' + bot_fmtMoney(res.balance) + '</b>' : ''));
}

/** Власник написав суму після «✏️ Інша сума». Нічого не записуємо, доки він не натисне «Так». */
function bot_paymentCustomSum(msg, awaiting) {
  var sum = bot_toNumber(msg.text);
  if (sum === null || sum <= 0 || sum > 10000000) {
    bot_awaitPut(msg.from.id, awaiting);
    return bot_send(msg.chat.id, 'Не зрозумів суму. Напишіть число, наприклад <code>25000</code>.');
  }
  sum = bot_round2(sum);
  var rec = bot_reconGet(awaiting.id);
  if (!rec) return bot_send(msg.chat.id, 'Звірку не знайдено.');
  bot_send(msg.chat.id, 'Додати оплату <b>' + bot_fmtMoney(sum) + '</b> у аркуш «Оплати» (звірка ' + bot_esc(rec.id) + ')?',
    { keyboard: { inline_keyboard: [[
      { text: '✅ Так, ' + bot_fmtMoney(sum), callback_data: 'opy|' + rec.id + '|' + sum },
      { text: 'Скасувати', callback_data: 'opn|' + rec.id }]] } });
}

// =====================================================================
// Команди: /history /undo /disputes /files
// =====================================================================

function bot_cmdHistory(chatId) {
  var list = bot_reconList().slice(-10).reverse();
  if (!list.length) return bot_send(chatId, 'Звірок ще не було.');
  bot_send(chatId, '🗂 <b>Останні звірки</b>\n' + list.map(function (r) {
    return '• <code>' + bot_esc(r.id) + '</code> · ' + bot_esc(r.fileName) + ' · ' + bot_esc(r.status) + ' · ' +
      bot_fmtMoney(r.status === 'Підтверджено' ? Number(r.confirmedSum) : Number(r.toPay));
  }).join('\n'));
}

/** «Z-2026-10-07-1» (латинська Z), ««З-…»» → «З-2026-10-07-1». */
function bot_normReconId_(s) {
  return String(s || '').replace(/[«»"'`]/g, '').trim().replace(/^[ZzЗз3]\s*-/, 'З-');
}

function bot_cmdUndo(chatId, arg) {
  var id = bot_normReconId_(arg);
  if (!id) return bot_send(chatId, 'Напишіть: <code>/undo З-2026-10-07-1</code> (ID дивіться в /history).');
  var rec = bot_reconGet(id);
  if (!rec) return bot_send(chatId, 'Звірки «' + bot_esc(id) + '» немає. Перевірте /history.');
  if (rec.status !== 'Підтверджено') return bot_send(chatId, 'Відкликати можна лише підтверджену звірку (ця: ' + bot_esc(rec.status).toLowerCase() + ').');
  var n = bot_readOrders().filter(function (o) { return o.recon === id; }).length;
  bot_send(chatId, '↩️ Відкликати звірку <b>' + bot_esc(id) + '</b>? З ' + n + ' рядків буде прибрано «Оплачено», дату і ID.',
    { keyboard: { inline_keyboard: [[{ text: 'Так, відкликати', callback_data: 'undy|' + id }, { text: 'Ні', callback_data: 'undn|' + id }]] } });
}

function bot_undoDo_(rec, ctx) {
  var res = bot_withLock(function () {
    var fresh = bot_reconGet(rec.id);
    if (fresh.status !== 'Підтверджено') return { error: 'Звірка вже ' + String(fresh.status).toLowerCase() };
    var rows = bot_readOrders().filter(function (o) { return o.recon === rec.id; });
    bot_patchOrders(rows.map(function (o) { return { row: o._row, fields: { paid: 'Не оплачено', paidDate: '', recon: '' } }; }));
    bot_reconPatch(rec.id, { status: 'Відкликано' });
    var pay = bot_readPayments().filter(function (p) { return p.recon === rec.id; })[0];
    bot_log('ІНФО', 'undo ' + rec.id, rows.length + ' рядків');
    return { n: rows.length, pay: pay };
  });
  if (res.error) { bot_answerCb(ctx.cb.id, res.error, true); return bot_edit(ctx.chatId, ctx.msgId, '⚠️ ' + bot_esc(res.error)); }
  bot_answerCb(ctx.cb.id, 'Відкликано');
  bot_edit(ctx.chatId, ctx.msgId, '↩️ Звірку <b>' + bot_esc(rec.id) + '</b> відкликано: знято «Оплачено» з ' + res.n + ' рядків.' +
    (res.pay ? '\n⚠️ Рядок оплати №' + res.pay.no + ' (' + bot_fmtMoney(res.pay.sum) + ') в аркуші «Оплати» я не видаляю — гроші вже переказані. Перевірте його.' : ''));
}

function bot_cmdDisputes(chatId) {
  var rows = bot_readOrders().filter(function (o) { return o.paid === 'Спірна'; });
  if (!rows.length) return bot_send(chatId, '✅ Відкладених спірних ТТН немає.');
  var groups = bot_groupByTtn_(rows);
  var total = 0;
  var lines = groups.map(function (g) {
    var sum = bot_sumBy_(g.rows, function (o) { return o.cost; }); total += sum;
    var tag = (g.rows[0].note.match(/Спірна,\s*(З-[\d-]+)/) || [])[1] || '';
    return '• ' + bot_code(g.ttn) + ' · ' + g.rows.map(function (o) { return '№' + o.no; }).join(', ') + ' · ' + bot_fmtMoney(sum) + (tag ? ' · ' + bot_esc(tag) : '');
  });
  bot_sendMany(chatId, bot_splitMessages(['⏸ <b>Відкладені ТТН: ' + groups.length + ' на ' + bot_fmtMoney(total) + '</b>'].concat(lines), 4000));
}

function bot_cmdFiles(chatId) {
  var id = bot_setting('ARCHIVE_FOLDER_ID');
  if (!id) return bot_send(chatId, 'Папка з\'явиться після першої звірки.');
  bot_send(chatId, '📁 <a href="https://drive.google.com/drive/folders/' + id + '">Папка «' + BOT_ARCHIVE_FOLDER_NAME + '»</a> (доступ — лише власнику таблиці).');
}


// ======================= PayImport.gs =======================
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
  } else if (/^[1-9]\d{0,2}(?:,\d{3})+(?:\.\d{1,2})?$/.test(raw)) {                    // «10,000», «1,500», «10,000.00» — кома як роздільник тисяч
    v = parseFloat(raw.replace(/,/g, ''));
  } else if (/^\d+(?:[.,]\d{1,2})?$/.test(raw)) {                                // «14300», «1,5», «1500.50»
    var dm = raw.match(/^(\d{1,2})[.,](\d{2})$/);
    if (dm && Number(dm[1]) >= 1 && Number(dm[1]) <= 31 && Number(dm[2]) >= 1 && Number(dm[2]) <= 12) return null;   // «+10.09» схоже на дату — не вгадуємо (для малих сум є /addpay)
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
  if (sum === null) {                                                     // «+...» з цифрою, але не розпізнано — не мовчимо
    var raw = String(msg.text || msg.caption || '').trim();
    if (/^\+\s*\d/.test(raw)) {
      try { bot_sendToOwners('⚠️ Оплату «' + bot_esc(raw.slice(0, 60)) + '» не розпізнав — у таблицю НЕ внесено. Напишіть суму простіше («+15000», «+15к») або команда <code>/addpay сума</code>.'); } catch (e) { bot_log('ПОМИЛКА', 'оплата не розпізнана', String(e)); }
    }
    return;
  }
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


// ======================= Allocate.gs =======================
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


// ======================= NovaPoshta.gs =======================
/**
 * NovaPoshta.gs — статуси Нової пошти (розділ 7.6 ТЗ): оновлення кожні 30 хв пакетами до 100 ТТН,
 * етап доставки за StatusCode, «Дата створення ТТН», «Дата передачі НП» (7.7), «Прибуло у відділення».
 *
 * УВАГА: цей файл написано за документацією API НП, бо старий скрипт NovaPoshtaStatus.gs не було передано.
 * Таблиця відповідності кодів (BOT_NP_STAGE_BY_CODE) — в одному місці, її легко звірити зі старим скриптом.
 */

// StatusCode → «Етап доставки». Невідомий код → етап НЕ змінюємо, пишемо в «Лог».
var BOT_NP_STAGE_BY_CODE = {
  '1': 'Не передана',      // Відправник самостійно створив цю накладну, але ще не надав до відправки
  '2': 'Немає ТТН',        // Видалено
  '3': 'Немає ТТН',        // Номер не знайдено
  '4': 'В дорозі',         // Відправлення у місті відправлення
  '41': 'В дорозі',
  '5': 'В дорозі',         // Відправлення прямує до міста одержувача
  '6': 'В дорозі',         // Відправлення у місті одержувача
  '12': 'В дорозі',        // Нова Пошта комплектує відправлення
  '101': 'В дорозі',       // На шляху до одержувача
  '104': 'В дорозі',       // Змінено адресу
  '111': 'В дорозі',       // Невдала спроба доставки
  '112': 'В дорозі',       // Дату доставки перенесено
  '7': 'На відділенні',    // Прибув на відділення
  '8': 'На відділенні',    // Прибув на відділення (завантажено в поштомат)
  '9': 'Отримано',         // Відправлення отримано
  '10': 'Отримано',
  '11': 'Отримано',
  '102': 'Відмова',        // Відмова від отримання (відправником)
  '103': 'Відмова',        // Відмова одержувача (створюється заявка на повернення)
  '105': 'Повернення',     // Припинено зберігання
  '106': 'Повернення'      // Одержано і створено ЄН зворотної доставки
};

function bot_npStageByCode(code) {
  var c = String(code === null || code === undefined ? '' : code).trim();
  return Object.prototype.hasOwnProperty.call(BOT_NP_STAGE_BY_CODE, c) ? BOT_NP_STAGE_BY_CODE[c] : '';
}

function bot_isFinalStage(stage) { return BOT_FINAL_STAGES.indexOf(stage) >= 0; }

/** «dd-mm-yyyy hh:mm:ss» (як у старій таблиці). */
function bot_fmtNpDate(date) {
  var p = bot_kyivParts(date);
  return bot_pad2(p.d) + '-' + bot_pad2(p.m) + '-' + p.y + ' ' + bot_pad2(p.h) + ':' + bot_pad2(p.mi) + ':' + bot_pad2(p.s);
}

/** Відповідь getStatusDocuments для однієї ТТН → зручна структура. */
function bot_npParseItem(raw) {
  var scheduled = bot_parseDate(raw.ScheduledDeliveryDate);
  var status = bot_trim(raw.Status);
  var item = {
    ttn: bot_normTtn(raw.Number),
    code: String(raw.StatusCode === undefined || raw.StatusCode === null ? '' : raw.StatusCode).trim(),
    status: status,
    created: bot_parseDate(raw.DateCreated),
    scheduled: scheduled,
    actualDelivery: bot_parseDate(raw.ActualDeliveryDate),
    firstStorageDay: bot_parseDate(raw.DateFirstDayStorage),
    payedKeepingFrom: bot_parseDate(raw.DatePayedKeeping),
    name: bot_trim(raw.RecipientFullName),
    phone: bot_trim(raw.PhoneRecipient || raw.RecipientPhone)
  };
  item.stage = bot_npStageByCode(item.code);
  // як у старому скрипті: дата «очік. доставка» — рівно в такому вигляді, як її віддає НП (напр. 12-07-2026 12:00:00)
  var scheduledRaw = bot_trim(raw.ScheduledDeliveryDate);
  item.statusText = status + (scheduledRaw ? ' (очік. доставка: ' + scheduledRaw + ')' : '');
  item.notFound = item.code === '3' || /не знайдено/i.test(status);
  return item;
}

/**
 * Що записати в рядок «Замовлення» за відповіддю НП (чиста функція).
 * order — поточний рядок; item — bot_npParseItem; now — Date.
 * @return {fields, unknownCode}
 */
function bot_npPlanPatch(order, item, now) {
  var f = {};
  var unknown = false;
  if (item.statusText && item.statusText !== order.npStatus) f.npStatus = item.statusText;
  if (item.created && (!order.ttnDate || order.ttnDate.getTime() !== item.created.getTime())) f.ttnDate = item.created;
  if (!item.stage) {
    unknown = true;                                           // етап не змінюємо
  } else {
    if (item.stage !== order.stage) f.stage = item.stage;
    // перша передача НП: етап вперше змінився з «Не передана» на будь-який інший (7.7)
    if (order.stage === 'Не передана' && item.stage !== 'Не передана' && item.stage !== 'Немає ТТН' && !order.handoff) f.handoff = now;
    if (item.stage === 'На відділенні' && !order.arrived) f.arrived = item.actualDelivery || item.firstStorageDay || now;
    // посилка пішла з відділення (переадресація / повернення) — наступне прибуття рахуємо заново
    if (order.stage === 'На відділенні' && item.stage !== 'На відділенні' && order.arrived) f.arrived = '';
  }
  return { fields: f, unknownCode: unknown };
}

// ---------- API ----------

function bot_npCall_(modelName, calledMethod, props) {
  var key = bot_prop(BOT_PROP.NP_KEY);
  if (!key) throw new Error('Не введено ключ API Нової пошти. Меню 🤖 Бот → Ввести ключ Нової пошти.');
  var payload = JSON.stringify({ apiKey: key, modelName: modelName, calledMethod: calledMethod, methodProperties: props });
  for (var attempt = 0; ; attempt++) {
    var resp = UrlFetchApp.fetch('https://api.novaposhta.ua/v2.0/json/', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: payload });
    var body;
    try { body = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('НП відповіла не JSON (HTTP ' + resp.getResponseCode() + ')'); }
    if (body.success) return body.data || [];
    var text = (body.errors || []).join('; ') || 'невідома помилка';
    if (/to+ many requests|too many requests/i.test(text)) {            // ліміт запитів НП — не відмова: чекаємо й повторюємо, далі — «тимчасова» помилка
      if (attempt < 3) { if (typeof Utilities !== 'undefined' && Utilities.sleep) Utilities.sleep(2500 * (attempt + 1)); continue; }
      var tr = new Error('НП: забагато запитів — повторю пізніше'); tr.npTransient = true; throw tr;
    }
    if (/internal|unavailable|temporar|timeout|time out|server error|try again|service\s+(error|down|is\s+(down|busy))/i.test(text) && !/invalid|cannot|not found|incorrect/i.test(text)) {
      var tr2 = new Error('НП: тимчасова помилка (' + text + ') — повторю пізніше'); tr2.npTransient = true; throw tr2;      // збій на боці НП — не відмова
    }
    if (/api\s*key/i.test(text)) { var ke = new Error('НП: ключ API недійсний або не має прав (' + text + ')'); ke.npTransient = true; ke.npKey = true; throw ke; }   // не позначаємо кожну ТТН помилкою
    var err = new Error('НП: ' + text); err.npLogical = true; throw err;
  }
}

/** ТТН → розібрані дані НП. Пакети по 100. */
function bot_npFetch(ttns, phone) {
  var out = {};
  for (var i = 0; i < ttns.length; i += 100) {
    if (i > 0 && typeof Utilities !== 'undefined' && Utilities.sleep) Utilities.sleep(300);   // не частити до API НП
    var docs = ttns.slice(i, i + 100).map(function (t) {
      var d = { DocumentNumber: t };
      if (phone) d.Phone = phone;
      return d;
    });
    bot_npCall_('TrackingDocument', 'getStatusDocuments', { Documents: docs }).forEach(function (raw) {
      var it = bot_npParseItem(raw);
      if (it.ttn) out[it.ttn] = it;
    });
  }
  return out;
}

/** Перевірка ключа (для «Перевірити, що все працює»). */
function bot_npPing() {
  bot_npCall_('TrackingDocument', 'getStatusDocuments', { Documents: [{ DocumentNumber: '20400048799000' }] });
  return true;
}

// ---------- оновлення таблиці ----------

/**
 * @param opts {rows:[номери рядків]|null — лише ці рядки, onlyUnsent:true — лише «Не передана»,
 *              maxTtn: ліміт ТТН за запуск}
 * @return {updated, checked, unknown:[...], error}
 */
function bot_npUpdate(opts) {
  opts = opts || {};
  if (!bot_prop(BOT_PROP.NP_KEY)) return { skipped: 'немає ключа НП' };
  var orders = bot_readOrders().filter(function (o) { return bot_isTtn(o.ttn) && o.status !== 'Скасовано'; });
  var rowSet = null;
  if (opts.rows) { rowSet = {}; opts.rows.forEach(function (r) { rowSet[r] = true; }); }
  var want = {};
  orders.forEach(function (o) {
    if (rowSet && !rowSet[o._row]) return;
    if (opts.onlyUnsent) { if (o.stage !== 'Не передана') return; }
    else if (!rowSet && bot_isFinalStage(o.stage) && o.ttnDate) return;
    want[o.ttn] = true;
  });
  var ttns = Object.keys(want).slice(0, opts.maxTtn || 600);
  if (!ttns.length) return { checked: 0, updated: 0, unknown: [] };

  var items;
  try { items = bot_npFetch(ttns, bot_setting('NP_SENDER_PHONE')); }
  catch (e) { bot_log('ПОМИЛКА', 'НП', e.message); return { error: e.message }; }

  var now = new Date(), updated = 0, unknown = [];
  bot_withLock(function () {
    var patches = [];
    bot_readOrders().forEach(function (o) {
      var it = items[o.ttn];
      if (!it) return;
      var plan = bot_npPlanPatch(o, it, now);
      if (plan.unknownCode && unknown.indexOf(it.code) < 0) { unknown.push(it.code); bot_log('УВАГА', 'невідомий код НП', 'код ' + it.code + ' · «' + it.status + '» · ТТН ' + it.ttn); }
      if (Object.keys(plan.fields).length) { patches.push({ row: o._row, fields: plan.fields }); updated++; }
    });
    bot_patchOrders(patches);
  });
  bot_setProp(BOT_PROP.LAST_NP_TS, Date.now());
  return { checked: ttns.length, updated: updated, unknown: unknown, items: items };
}


// ======================= NpDesc.gs =======================
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

/** НП: «DateTime cannot be less then now» — дата відправлення в минулому не приймається; тоді ставимо сьогодні (поле, яке НП змушує оновити). */
function bot_npNotPast_(ddmmyyyy) {
  var d = bot_parseDate(ddmmyyyy), today = bot_makeDate(bot_kyivParts(new Date()).y, bot_kyivParts(new Date()).m, bot_kyivParts(new Date()).d);
  if (!d || bot_dayNum(d) >= bot_dayNum(today)) return ddmmyyyy;
  return bot_fmtDate(today);
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
    payload[f[0]] = f[0] === 'DateTime' ? bot_npNotPast_(bot_npDateOnly_(val)) : val;
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
    if (f[0] === 'DateTime') return;                                  // НП вимагає дату ≥ сьогодні — це поле може змінитись і це очікувано
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
  // НП: різниця DateTimeFrom–DateTimeTo не більше трьох місяців
  return { from: bot_fmtDate(new Date(now.getTime() - 55 * 86400000)), to: bot_fmtDate(new Date(now.getTime() + 30 * 86400000)) };   // 85 днів — менше за ліміт НП (3 місяці); ТТН з датою відправлення в майбутньому теж знаходяться
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
      return { state: 'error', ref: ref, changed: changed, error: '⛔ Після запису змінились інші поля: ' + changed.join(', ') + ' — перевірте ТТН у кабінеті НП!' };
    }
    return { state: 'written', ref: ref };
  } catch (e) {
    if (e.npLogical && !e.npTransient) return { state: 'error', error: bot_scrub(e.message) };
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
  // перевірка походження: пишемо в НП лише ТТН, яка справді з повідомлення гілки «Замовлення на клієнта»
  var orders = bot_readOrders(), bad = [], good = [];
  rows.forEach(function (r) { (bot_ttnThreadEvidence_(r, orders) ? good : bad).push(r); });
  if (bad.length) {
    bot_ttnPatch(bad.map(function (r) { return { row: r._row, fields: { status: 'Помилка НП', note: '⛔ немає повідомлення в гілці «Замовлення на клієнта» — в НП не пишу' } }; }));
    bot_sendToOwners('⛔ ТТН без повідомлення в гілці «Замовлення на клієнта» — в НП не пишу і в реєстр не беру: ' + bad.map(function (r) { return bot_code(r.ttn); }).join(', '));
  }
  rows = good;
  if (!rows.length) return;
  if (!bot_npLive()) {
    var lines = rows.map(function (r) { return bot_code(r.ttn) + ' → ' + bot_esc(r.desc) + ' <i>(' + r.len + ' симв.)</i>' + (r.orders ? '\n   №' + bot_esc(r.orders) : ''); });
    bot_sendToOwners('👀 <b>Режим перевірки</b> — в НП нічого не записую. Ось що записав би:\n\n' + lines.join('\n\n') +
      '\n\nЯкщо все гаразд — <code>/live</code> (бойовий режим). Свій текст для ТТН: <code>/setdesc ТТН текст</code>.');
    bot_ttnPatch(rows.map(function (r) { return { row: r._row, fields: { status: 'Перевірка' } }; }));
    return;
  }
  var now = new Date(), patches = [], errs = [], stopTick = false, keyAlert = false;
  var eligible = rows.filter(function (r) { return !(r.note && r.note.indexOf('⏳') === 0 && now.getMinutes() % 3 !== 0); });   // ⏳-рядки (після збою) — не частіше ніж раз на 3 хв і не займають чергу
  eligible.slice(0, 6).forEach(function (r) {                          // не більше 6 ТТН за хвилину: ліміт запитів НП
    if (stopTick) return;
    if (typeof Utilities !== 'undefined' && Utilities.sleep) Utilities.sleep(800);
    var res = bot_npWriteDesc(r.ttn, r.desc);
    if (res.state === 'transient' && /забагато запитів|ключ API/.test(res.error || '')) stopTick = true;   // ліміт НП / недійсний ключ — решту не чіпаємо
    if (res.state === 'transient' && /ключ API/.test(res.error || '')) keyAlert = true;
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
  if (keyAlert && Date.now() - Number(bot_prop('LAST_KEY_ALERT_TS') || 0) > 3600000) {
    bot_setProp('LAST_KEY_ALERT_TS', Date.now());
    bot_sendToOwners('🔑 НП відхиляє ключ API (недійсний або без прав). Описи не записуються, ТТН чекають у черзі. Введіть ключ знову: 🤖 Бот → Ввести ключ Нової пошти.');
  }
  var okNow = patches.filter(function (p) { return p.fields.status === 'Записано в НП'; }).length;
  var left = bot_readTtnRows().filter(function (r) { return r.status === 'Новий'; }).length;
  if (okNow && (okNow >= 3 || left > 0)) bot_sendToOwners('✅ Записано в НП: ' + okNow + ' ТТН' + (left ? ' · лишилось в черзі: ' + left + ' (по ~6 на хвилину)' : ' · черга порожня'));
  if (errs.length) bot_sendToOwners('❌ <b>Помилка НП</b> — опис не записано (повторів не буде, ТТН не піде в реєстр, доки ви не вирішите):\n\n' + errs.join('\n') + '\n\nСвій текст: <code>/setdesc ТТН текст</code>; повторити: <code>/retry</code>.');
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
/** /retry [ТТН] [force] — повторити запис опису для ТТН зі статусом «Помилка НП». Рядки з поміткою «⛔» (змінились інші поля / немає повідомлення в гілці) — лише після ручної перевірки: /retry ТТН force. */
function bot_cmdRetry(chatId, arg) {
  var parts = String(arg || '').trim().split(/\s+/).filter(Boolean);
  var force = parts.some(function (x) { return /^force$/i.test(x); });
  var q = bot_normTtn(parts.filter(function (x) { return !/^force$/i.test(x); }).join(''));
  var res = bot_withLock(function () {
    var rows = bot_readTtnRows().filter(function (r) { return r.status === 'Помилка НП' && (!q || r.ttn === q); });
    var blocked = rows.filter(function (r) { return r.note.indexOf('⛔') === 0 && !(force && q); });
    var go = rows.filter(function (r) { return blocked.indexOf(r) < 0; });
    bot_ttnPatch(go.map(function (r) { return { row: r._row, fields: { status: 'Новий', note: '' } }; }));
    return { n: go.length, blocked: blocked.map(function (r) { return r.ttn; }) };
  });
  var t = res.n ? '🔁 Повторюю запис для ' + res.n + ' ТТН (не більше 6 на хвилину). Результат — окремим повідомленням, якщо будуть помилки.' : 'Немає ТТН зі статусом «Помилка НП» для повтору.';
  if (res.blocked.length) t += '\n⛔ Не повторюю (потрібна ручна перевірка в кабінеті НП, далі <code>/retry ТТН force</code>): ' + res.blocked.map(bot_code).join(', ');
  bot_send(chatId, t);
}

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


// ======================= Ttn.gs =======================
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


// ======================= Registry.gs =======================
/**
 * Registry.gs — Модуль D: щоденний реєстр (за замовчуванням о 10:00) і PDF маркування 100×100 у гілку «Реєстри».
 *
 * У реєстр потрапляють ЛИШЕ ТТН з аркуша «ТТН» (а він наповнюється тільки повідомленнями гілки «Замовлення на клієнта»),
 * і перед створенням кожна ТТН ще раз звіряється із замовленнями з гілки. ТТН інших друкарень сюди потрапити не можуть.
 * Усі попередження (хто не ввійшов і чому) — лише власнику в особисті, не в групу.
 */

// ---------- чиста логіка ----------

/** «15038-15088» (мінімальний-максимальний), одне замовлення → «15038». */
function bot_regRange(nos) {
  var a = nos.filter(function (n) { return n > 0; });
  if (!a.length) return '';
  var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a);
  return mn === mx ? String(mn) : mn + '-' + mx;
}
function bot_regFileName(nos) { return bot_regRange(nos) + '.pdf'; }

/**
 * Відбір ТТН у реєстр (розділ 7.1–7.2).
 * @param ttnRows рядки аркуша «ТТН»; orders — «Замовлення»; fromNo — поріг DESC_FROM_ORDER
 * @return {include:[рядки], excluded:[{ttn, orders, reason}], orderNos:[номери замовлень включених ТТН]}
 */
function bot_regSelect(ttnRows, orders, fromNo) {
  var include = [], excluded = [], nos = [];
  ttnRows.forEach(function (r) {
    if (r.registry || r.status === 'Знято') return;                          // уже в реєстрі / знято (ТТН прибрано чи замінено в повідомленні, усі замовлення скасовано)
    var rowNos = bot_ttnOrderNos(r.orders);
    if (!rowNos.some(function (n) { return n > fromNo; })) return;           // старі — не наші
    var mine = orders.filter(function (o) { return o.ttn === r.ttn && o.msgId; });   // замовлення, прийняті з гілки
    var threadEvidence = bot_ttnThreadEvidence_(r, orders);                  // замовлення з гілки з цією ТТН або сам рядок «ТТН» створено з повідомлення гілки
    var reason = '';
    if (r.status === 'Чекає рішення') reason = 'чекає вашого рішення щодо опису';
    else if (r.status === 'Помилка НП') reason = 'помилка НП: ' + (r.note || '');
    else if (r.status === 'Новий') reason = 'опис ще не записаний у НП';
    else if (r.status === 'Перевірка') reason = 'режим перевірки';
    else if (r.status !== 'Записано в НП') reason = 'статус «' + r.status + '»';
    else if (!threadEvidence) reason = 'немає повідомлення в гілці «Замовлення на клієнта» (відкинуто)';
    else if (mine.length && mine.every(function (o) { return o.status === 'Скасовано'; })) reason = 'усі замовлення скасовані';
    if (reason) { excluded.push({ ttn: r.ttn, orders: r.orders, reason: reason, hard: r.status === 'Записано в НП' }); return; }
    include.push(r);
    if (mine.length) mine.forEach(function (o) { if (o.status !== 'Скасовано') nos.push(Number(o.no)); });
    else rowNos.forEach(function (n) { nos.push(n); });                                  // немає рядків у «Замовлення» — номери з рядка «ТТН»
  });
  return { include: include, excluded: excluded, orderNos: nos };
}

/** Посилання на друк маркування 100×100 (PDF). Ключ API — лише тут, на боці скрипта; у Telegram і логи не потрапляє. */
function bot_regPrintUrl(ttns, key) {
  // UrlFetchApp відхиляє «[]» у посиланні («Недійсний аргумент») — кодуємо як %5B%5D (сервер НП розкодовує)
  return 'https://my.novaposhta.ua/orders/printMarking100x100/' + ttns.map(function (t) { return 'orders%5B%5D/' + t; }).join('/') + '/type/pdf/apiKey/' + key;
}

/** Запасне посилання: усі номери одним сегментом через кому. */
function bot_regPrintUrlAlt(ttns, key) {
  return 'https://my.novaposhta.ua/orders/printMarking100x100/orders/' + ttns.join(',') + '/type/pdf/apiKey/' + key;
}

// ---------- аркуш «Реєстри» ----------

function bot_readRegistries() {
  var sh = bot_sheet(BOT_SHEETS.registries), map = bot_headerMap(sh, BOT_REG_COLS), last = sh.getLastRow();
  if (last < 2) return [];
  var out = [];
  sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues().forEach(function (r, i) {
    function g(k) { return r[map[k] - 1]; }
    if (g('date') === '' && g('no') === '') return;
    out.push({ _row: i + 2, date: bot_cellDate_(g('date')), no: bot_cellStr_(g('no')), ref: bot_cellStr_(g('ref')), range: bot_cellStr_(g('range')),
      count: Number(g('count')) || 0, fileId: bot_cellStr_(g('fileId')), status: bot_cellStr_(g('status')), ttns: bot_cellStr_(g('ttns')) });
  });
  return out;
}

function bot_regWrite_(row, fields) {
  bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.registries), map = bot_headerMap(sh, BOT_REG_COLS), width = sh.getLastColumn();
    if (!row) row = Math.max(sh.getLastRow(), 1) + 1;
    var rng = sh.getRange(row, 1, 1, width), cur = rng.getValues()[0];
    Object.keys(fields).forEach(function (k) { if (map[k]) cur[map[k] - 1] = fields[k]; });
    rng.setNumberFormat('@'); if (map.date) sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy hh:mm');
    rng.setValues([cur]);
  });
  return row;
}

// ---------- Telegram: PDF ----------

function bot_sendDocument(chatId, thread, doc, caption) {
  var p = { chat_id: String(chatId), caption: caption, document: doc };
  if (thread && thread !== '0') p.message_thread_id = String(thread);
  var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + bot_token() + '/sendDocument', { method: 'post', payload: p, muteHttpExceptions: true });
  var body;
  try { body = JSON.parse(resp.getContentText()); } catch (e) { body = { ok: false, description: 'HTTP ' + resp.getResponseCode() }; }
  return body;
}

// ---------- НП: створення реєстру і друк ----------

function bot_npCreateScanSheet_(refs) {
  var data = bot_npCall_('ScanSheet', 'insertDocuments', { DocumentRefs: refs });
  var d = data[0] || {};
  var okList = (d.Data && d.Data.Success) || d.Success || [];
  var errList = (d.Data && d.Data.Errors) || d.Errors || [];
  return { ref: d.Ref || d.ScanSheetRef || '', no: d.Number || '', ok: okList, errors: errList, raw: d };
}

/** Максимум ТТН в одному посиланні: UrlFetchApp обмежує довжину URL (~2 КБ), а одна ТТН у посиланні займає ≈ 28 символів. */
var BOT_REG_CHUNK_ = 60;

function bot_regChunks(ttns) {
  var out = [];
  for (var i = 0; i < ttns.length; i += BOT_REG_CHUNK_) out.push(ttns.slice(i, i + BOT_REG_CHUNK_));
  return out;
}

/** PDF маркування для ОДНІЄЇ порції ТТН: основне посилання, потім запасне. */
function bot_npDownloadMarking_(ttns) {
  var key = bot_prop(BOT_PROP.NP_KEY);
  var urls = [bot_regPrintUrl(ttns, key), bot_regPrintUrlAlt(ttns, key)], lastErr = '';
  for (var i = 0; i < urls.length; i++) {
    try {
      var resp = UrlFetchApp.fetch(urls[i], { muteHttpExceptions: true });
      if (resp.getResponseCode() !== 200) { lastErr = 'HTTP ' + resp.getResponseCode(); continue; }
      var blob = resp.getBlob();
      var head = String.fromCharCode.apply(null, blob.getBytes().slice(0, 4).map(function (b) { return b & 255; }));
      if (head === '%PDF') return blob;
      lastErr = 'відповідь не PDF (імовірно, помилка ключа або ТТН)';
    } catch (e) { lastErr = bot_scrub(String(e.message)).slice(0, 120); }
  }
  throw new Error('Не вдалося завантажити PDF маркування з НП: ' + lastErr + '. Реєстр у НП уже створено — після виправлення просто повторіть /registry: бот надішле PDF, а другий реєстр не створить.');
}

// ---------- запуск ----------

function bot_regCaption_(reg, now, part, parts) {
  return 'Реєстр №' + reg.no + ' · ' + reg.count + ' ТТН · ' + bot_fmtDM(now) + (parts > 1 ? ' · частина ' + part + '/' + parts : '');
}

function bot_regThread_() {
  return { chat: bot_setting('GROUP_CHAT_ID'), thread: bot_setting('REPORT_THREAD_ID') };
}

/**
 * Надсилає PDF реєстру (одна ТТН-порція = один файл; зазвичай файл один). Прогрес зберігається в колонці «file_id PDF»
 * (через кому): збій на 2-й порції не повторить надсилання 1-ї. Статус «Надіслано» — лише коли надіслано все.
 */
function bot_regSend_(reg, ttns, nos, now) {
  var dest = bot_regThread_();
  if (!dest.chat || dest.thread === '') throw new Error('не задано гілку «Реєстри» (/bind registry)');
  var chunks = bot_regChunks(ttns), name = bot_regFileName(nos).replace(/\.pdf$/, '');
  var fids = String(reg.fileId || '').split(',').filter(Boolean);
  var resend = reg.status === 'Надіслано';                              // ручне повторне надсилання вже надісланого реєстру
  for (var i = resend ? 0 : fids.length; i < chunks.length; i++) {
    var caption = bot_regCaption_(reg, reg.date || now, i + 1, chunks.length), res;
    if (resend && fids[i]) res = bot_sendDocument(dest.chat, dest.thread, fids[i], caption);
    else {
      var blob = bot_npDownloadMarking_(chunks[i]).setName(chunks.length > 1 ? name + '_' + (i + 1) + '.pdf' : name + '.pdf');
      res = bot_sendDocument(dest.chat, dest.thread, blob, caption);
    }
    if (!res.ok) throw new Error('Telegram: ' + res.description);
    if (!resend) {
      fids.push((res.result && res.result.document && res.result.document.file_id) || '');
      bot_regWrite_(reg._row, { fileId: fids.join(',') });             // прогрес: уже надіслані порції
    }
  }
  if (!resend) bot_regWrite_(reg._row, { status: 'Надіслано', fileId: fids.join(',') });
  return fids.join(',');
}

/** Номери замовлень (для назви файлу) за списком ТТН: усі нескасовані замовлення цих ТТН. */
function bot_regOrderNos_(ttns) {
  var set = {}; ttns.forEach(function (t) { set[t] = true; });
  var nos = [], have = {};
  bot_readOrders().forEach(function (o) { if (set[o.ttn] && o.status !== 'Скасовано' && o.no) { nos.push(Number(o.no)); have[o.ttn] = true; } });
  bot_readTtnRows().forEach(function (r) { if (set[r.ttn] && !have[r.ttn]) bot_ttnOrderNos(r.orders).forEach(function (n) { nos.push(n); }); });   // ТТН без рядків у «Замовлення»
  return nos;
}

/**
 * Основний запуск. opts: {manual:true — запит власника}.
 * @return {done:boolean, text?:повідомлення для власника (ручний запуск)}; scheduled → тиша, якщо немає ТТН.
 */
/** Захист від паралельного запуску (два тригери поспіль, ручний + запланований): другий нічого не робить, поки перший не завершився (до 5 хв). */
function bot_registryRun(opts) {
  var ts = Number(bot_prop('REGISTRY_RUN_TS') || 0);
  if (ts && Date.now() - ts < 300000) return { done: false, text: 'Реєстр уже формується — зачекайте хвилину.' };
  bot_setProp('REGISTRY_RUN_TS', Date.now());
  try { return bot_registryRun_(opts); } finally { bot_delProp('REGISTRY_RUN_TS'); }
}

function bot_registryRun_(opts) {
  opts = opts || {};
  var now = new Date(), today = bot_dayKey(now);
  if (!bot_npLive()) return { done: true, text: 'Режим перевірки: реєстр не створюю (це запис у НП). Після <code>/live</code> — працюватиму.' };
  var regs = bot_readRegistries();
  var todays = opts.force ? null : regs.filter(function (r) { return r.date && bot_dayKey(r.date) === today && r.status !== 'Помилка'; })[0];   // force — екстрений додатковий реєстр
  var pending = regs.filter(function (r) { return r.status === 'Створено'; })[0];       // створено в НП, але PDF ще не надіслано
  if (todays && todays.status === 'Надіслано') {
    if (!opts.manual) return { done: true };
    var tt = todays.ttns.split(/[,\s]+/).filter(Boolean);
    bot_regSend_(todays, tt, bot_regOrderNos_(tt), now);
    return { done: true, text: '🔁 Реєстр №' + bot_esc(todays.no) + ' сьогодні вже є — перевідправив той самий PDF.' };
  }
  var reg = pending, ttns, nos;
  var sel = null;
  if (!reg) {
    sel = bot_withLock(function () { return bot_regSelect(bot_readTtnRows(), bot_readOrders(), bot_descFromOrder()); });
    if (sel.excluded.length) {
      var lines = sel.excluded.map(function (x) { return bot_code(x.ttn) + ' (№' + bot_esc(x.orders) + ') — ' + bot_esc(x.reason); });
      bot_sendToOwners('⚠️ До реєстру не ввійшли (перейдуть у наступний, коли вирішите):\n' + lines.join('\n'));
    }
    if (!sel.include.length) return { done: true, text: opts.manual ? 'Немає ТТН для реєстру.' : '' };
    var refs = [], ref2ttn = {};
    for (var i = 0; i < sel.include.length; i++) {
      var r = sel.include[i], ref = r.npRef;
      if (!ref) { var doc = bot_npGetDoc(r.ttn); ref = doc && doc.Ref; }
      if (!ref) { sel.excluded.push({ ttn: r.ttn, orders: r.orders, reason: 'НП не знайшла ТТН' }); continue; }
      refs.push(ref); ref2ttn[ref] = r;
    }
    if (!refs.length) return { done: true, text: opts.manual ? 'НП не знайшла жодної ТТН.' : '' };
    var created = bot_npCreateScanSheet_(refs);
    var okRefs = created.ok.map(function (x) { return x.Ref || x; });
    var failed = created.errors.map(function (x) { return (x.Number || x.Ref || '') + ' ' + (x.Error || x.Message || JSON.stringify(x)); });
    if (!okRefs.length && !created.ref) throw new Error('НП не створила реєстр: ' + (failed.join('; ') || JSON.stringify(created.raw).slice(0, 300)));
    var used = (okRefs.length ? okRefs : refs).map(function (rf) { return ref2ttn[rf]; }).filter(Boolean);
    ttns = used.map(function (u) { return u.ttn; });
    nos = bot_regOrderNos_(ttns);
    if (failed.length) bot_sendToOwners('⚠️ НП не додала в реєстр: ' + bot_esc(failed.join('; ')) + ' — ці ТТН залишились на наступний раз.');
    var regNo = created.no || ('без-№-' + bot_fmtDate(now) + '-' + String(created.ref || '').slice(0, 6));       // порожній номер від НП не повинен лишити ТТН «поза реєстром»
    reg = { date: now, no: regNo, ref: created.ref, range: bot_regRange(nos), count: ttns.length, status: 'Створено', ttns: ttns.join(', ') };
    reg._row = bot_regWrite_(null, reg);                                              // 1) запис про реєстр (з переліком ТТН) — одразу після створення в НП
  } else {
    ttns = reg.ttns.split(/[,\s]+/).filter(Boolean);
    nos = bot_regOrderNos_(ttns);
  }
  // 2) позначка «Реєстр» в рядках ТТН — і при відновленні після збою (ідемпотентно): інакше ці ТТН завтра потрапили б у другий реєстр
  var setNo = reg.no;
  var toMark = bot_readTtnRows().filter(function (x) { return ttns.indexOf(x.ttn) >= 0 && x.registry !== setNo; });
  bot_ttnPatch(toMark.map(function (u) { return { row: u._row, fields: { registry: setNo } }; }));
  bot_regSend_(reg, ttns, nos, now);
  bot_log('ІНФО', 'реєстр', '№' + reg.no + ' · ' + reg.count + ' ТТН · ' + bot_regRange(nos));
  return { done: true, text: opts.manual ? '✅ Реєстр №' + bot_esc(reg.no) + ' (' + reg.count + ' ТТН) надіслано в гілку «Реєстри».' : '' };
}

function bot_registryUserIds_() { return String(bot_setting('REGISTRY_USERS', '')).split(/[,\s;]+/).filter(Boolean); }

/**
 * /registry у гілці «Реєстри» від власника або дозволеної людини з виробництва → реєстр прямо зараз (як екстрений).
 * Відповіді в гілці — мінімальні; подробиці, попередження й помилки — лише власнику. Не частіше ніж раз на 2 хв.
 */
function bot_registryFromGroup(msg, from) {
  var chatId = msg.chat.id, thread = bot_threadOf(msg);
  if (String(chatId) !== String(bot_setting('GROUP_CHAT_ID')) || thread !== String(bot_setting('REPORT_THREAD_ID'))) return;     // лише гілка «Реєстри»
  if (!(bot_isOwner(from.id) || bot_registryUserIds_().indexOf(String(from.id)) >= 0)) return;
  var opts = thread !== '0' ? { thread: thread } : {};
  var last = Number(bot_prop('LAST_GROUP_REGISTRY_TS') || 0);
  if (Date.now() - last < 120000) return bot_send(chatId, 'Зачекайте хвилину: реєстр щойно створювався.', opts);
  bot_setProp('LAST_GROUP_REGISTRY_TS', Date.now());
  var r;
  try { r = bot_registryRun({ manual: true, force: true }); }
  catch (e) {
    bot_log('ПОМИЛКА', 'реєстр із групи', e.message);
    bot_sendToOwners('❌ Реєстр, запрошений з групи (' + bot_esc([from.first_name, from.username].filter(Boolean).join(' ')) + '), не створено: ' + bot_esc(bot_scrub(e.message)));
    return bot_send(chatId, 'Не вдалося створити реєстр — власника повідомлено.', opts);
  }
  if (/уже формується/i.test(r.text || '')) bot_send(chatId, 'Реєстр уже формується — зачекайте кілька хвилин, нічого повторно не натискайте.', opts);
  else if (!/створено|надіслано|перевідправив/i.test(r.text || '')) bot_send(chatId, 'Немає нових ТТН для реєстру.', opts);
  else bot_sendToOwners('🗂 Реєстр створено на запит ' + bot_esc([from.first_name, from.username].filter(Boolean).join(' ')) + ' (з гілки «Реєстри»).');
}

/** /registry preview — що ввійде, нічого не створюючи. */
function bot_registryPreview(chatId) {
  var sel = bot_regSelect(bot_readTtnRows(), bot_readOrders(), bot_descFromOrder());
  var nos = sel.orderNos;
  var t = '📋 <b>Реєстр (попередній перегляд)</b> — нічого не створюю.\nУвійде: <b>' + sel.include.length + '</b> ТТН' + (nos.length ? ' · файл <code>' + bot_regFileName(nos) + '</code>' : '') + '\n' +
    sel.include.map(function (r) { return bot_code(r.ttn) + ' №' + bot_esc(r.orders); }).join('\n');
  if (sel.excluded.length) t += '\n\nНе ввійде:\n' + sel.excluded.map(function (x) { return bot_code(x.ttn) + ' — ' + bot_esc(x.reason); }).join('\n');
  bot_send(chatId, t);
}

function bot_cmdRegistry(chatId, arg) {
  var a = String(arg || '').trim().toLowerCase();
  if (a === 'preview') return bot_registryPreview(chatId);
  if (a === 'now' || a === 'екстрено') {
    return bot_send(chatId, '🚨 <b>Екстрений реєстр.</b> Створю ще один реєстр у НП із усіх ТТН, що готові і ще не в реєстрі (навіть якщо сьогодні вже був реєстр), і одразу надішлю PDF у гілку «Реєстри». Створити?',
      { keyboard: { inline_keyboard: [[{ text: '🚨 Так, створити зараз', callback_data: 'regx' }, { text: 'Ні', callback_data: 'regn' }]] } });
  }
  bot_send(chatId, 'Сформувати реєстр у НП зараз і надіслати PDF у гілку «Реєстри»? Якщо сьогодні реєстр уже є — лише перевідправлю його.',
    { keyboard: { inline_keyboard: [[{ text: '✅ Так', callback_data: 'regy' }, { text: 'Ні', callback_data: 'regn' }]] } });
}

function bot_registryCallback(parts, ctx) {
  if (parts[0] === 'regn') { bot_edit(ctx.chatId, ctx.msgId, 'Скасовано.'); return bot_answerCb(ctx.cb.id, 'Скасовано'); }
  bot_answerCb(ctx.cb.id, 'Працюю…');
  var r;
  try { r = bot_registryRun({ manual: true, force: parts[0] === 'regx' }); } catch (e) { r = { text: '❌ ' + bot_esc(bot_scrub(e.message)) }; }
  bot_edit(ctx.chatId, ctx.msgId, r.text || 'Готово.');
}

// ---------- планувальник: 9:45 нагадування, 10:00 реєстр ----------

function bot_registryTick(now, minutes, today) {
  var remindMin = bot_parseTimeSetting_(bot_setting('REMIND_TIME', '09:45'), 585);
  var regMin = bot_parseTimeSetting_(bot_setting('REGISTRY_TIME', '10:00'), 600);
  if (minutes >= remindMin && bot_prop(BOT_PROP.LAST_REMIND_DATE) !== today) {
    bot_setProp(BOT_PROP.LAST_REMIND_DATE, today);
    var bad = bot_readTtnRows().filter(function (r) {
      return !r.registry && (r.status === 'Чекає рішення' || r.status === 'Помилка НП') && bot_ttnOrderNos(r.orders).some(function (n) { return n > bot_descFromOrder(); });
    });
    if (bad.length) {
      bot_sendToOwners('⏰ Через ' + Math.max(regMin - minutes, 0) + ' хв реєстр. Ці ТТН НЕ ввійдуть, доки не вирішите:\n' +
        bad.map(function (r) { return bot_code(r.ttn) + ' №' + bot_esc(r.orders) + ' — ' + bot_esc(r.status) + (r.note ? ': ' + bot_esc(r.note) : ''); }).join('\n') +
        '\n\nСвій текст опису: <code>/setdesc ТТН текст</code>.');
    }
  }
  if (minutes >= regMin && bot_prop(BOT_PROP.LAST_REGISTRY_DATE) !== today) {
    var prog = {};
    try { prog = JSON.parse(bot_prop('REGISTRY_PROGRESS') || '{}'); } catch (e) { prog = {}; }
    if (prog.day !== today) prog = { day: today, fails: 0 };
    try {
      var r = bot_registryRun({});
      if (r.done) bot_setProp(BOT_PROP.LAST_REGISTRY_DATE, today);
    } catch (e) {
      prog.fails++;
      bot_setProp('REGISTRY_PROGRESS', JSON.stringify(prog));
      bot_log('ПОМИЛКА', 'реєстр', 'спроба ' + prog.fails + ': ' + e.message);
      if (prog.fails >= 3) {
        bot_setProp(BOT_PROP.LAST_REGISTRY_DATE, today);
        var stuck = bot_readRegistries().filter(function (x) { return x.status === 'Створено'; })[0];
        if (stuck) bot_regWrite_(stuck._row, { status: 'Помилка' });             // реєстр уже є в НП, але PDF не надіслано — не блокуємо наступні реєстри
        bot_sendToOwners('❌ Реєстр не вдалося сформувати/надіслати: ' + bot_esc(bot_scrub(e.message)) + (stuck ? '\n⚠️ Реєстр №' + bot_esc(stuck.no) + ' у НП створено, але PDF не надіслано — завантажте маркування в кабінеті НП. Його ТТН вже позначені як у реєстрі.' : '') + '\nПісля виправлення — <code>/registry</code>.');
      }
    }
  }
}


// ======================= ReportsLogic.gs =======================
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
  groups.forEach(function (g) { g.sort = bot_unsentSortKey_(g); });
  // у звіт — лише ТТН, не передані вже `warn` днів і більше (вік — від створення ТТН, інакше від дати замовлення;
  // якщо дат немає зовсім — показуємо, бо перевірити неможливо)
  var dayWord = warn + '+ ' + bot_plural(warn, 'день', 'дні', 'днів');
  groups = groups.filter(function (g) {
    var d = g.sort.created || (isFinite(g.sort.key) ? new Date(g.sort.key) : null);
    return !d || bot_daysBetween(d, now) >= warn;
  });
  if (!groups.length) return ['✅ Немає ТТН, не переданих ' + dayWord];
  groups.sort(function (a, b) { return (a.sort.key - b.sort.key) || (a.sort.no - b.sort.no); });

  var p = bot_kyivParts(now);
  var head = '📦 <b>Не передані до відправки ' + dayWord + ' — ' + groups.length + ' ТТН</b> · ' + BOT_WEEKDAYS_UA_FULL[p.dow] + ', ' + bot_pad2(p.d) + '.' + bot_pad2(p.m);
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
  return bot_splitMessages(parts, 3800);
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
  return bot_splitMessages(parts, 3800);
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
function bot_monthMetrics(orders, payments, y, m, opening) {
  var monthStartN = Math.round(Date.UTC(y, m - 1, 1) / 86400000);
  var nextStartN = Math.round(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1) / 86400000);
  var rows = orders.filter(function (o) { return o.status === 'В роботі' && bot_inMonth_(bot_rowMonthDate_(o), y, m); });
  var byType = { 'Футболка': 0, 'Худі фліс': 0, 'Худі не утеплене': 0 };
  var stickers = 0;
  rows.forEach(function (o) { if (byType[o.type] !== undefined) byType[o.type]++; else if (o.type === 'Стікерпак') stickers++; });
  var cost = bot_sumBy_(rows, function (o) { return Number(o.cost) || 0; });
  var paid = bot_sumBy_(payments.filter(function (p) { return bot_inMonth_(p.date, y, m); }), function (p) { return Number(p.sum) || 0; });
  var ordersD = opening ? orders.filter(function (o) { return bot_afterCut_(o.date, opening.ordersAfter); }) : orders;   // зріз — за датою ЗАМОВЛЕННЯ (як у /borg і «Підсумках»); раніші — вже в початковому залишку
  var paysD = opening ? payments.filter(function (p) { return bot_afterCut_(p.date, opening.paysAfter); }) : payments;
  var costToEnd = bot_sumBy_(ordersD, function (o) {
    var d = bot_rowMonthDate_(o);
    return (!d || bot_dayNum(d) < nextStartN) ? (Number(o.cost) || 0) : 0;
  });
  var paidToEnd = bot_sumBy_(paysD, function (p) { return (bot_isDate(p.date) && bot_dayNum(p.date) >= nextStartN) ? 0 : (Number(p.sum) || 0); });
  var refusals = rows.filter(function (o) { return o.stage === 'Відмова'; });
  var finals = rows.filter(function (o) { return o.stage === 'Відмова' || o.stage === 'Отримано'; });
  var speed = bot_computeSpeed(orders, new Date(monthStartN * 86400000 + 12 * 3600000), new Date(nextStartN * 86400000 + 12 * 3600000));
  return {
    y: y, m: m, items: rows.length, byType: byType, stickers: stickers, cost: cost, paid: paid,
    debtEnd: bot_round2(costToEnd - paidToEnd + (opening && nextStartN > bot_dayNum(opening.ordersAfter || opening.paysAfter || new Date(0)) ? opening.debt : 0)),
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

/**
 * Покриття собівартості оплатами за місяць: 🟢 покрито (оплачено ≥ собівартості), 🟡 недоплата (≤ redPct % собівартості),
 * 🔴 велика різниця (більше). Без собівартості — порожньо.
 */
function bot_coverageStatus(cost, paid, redPct) {
  cost = Number(cost) || 0; paid = Number(paid) || 0;
  if (cost <= 0) return { icon: '', label: '', diff: 0 };
  var diff = bot_round2(paid - cost);
  if (diff >= 0) return { icon: '🟢', label: diff > 0 ? 'Покрито (переплата)' : 'Покрито', diff: diff };
  var pct = (redPct === undefined || redPct === null || isNaN(Number(redPct))) ? 10 : Number(redPct);
  return (-diff <= cost * pct / 100) ? { icon: '🟡', label: 'Недоплата', diff: diff } : { icon: '🔴', label: 'Велика різниця', diff: diff };
}

function bot_buildMonthReport(cur, prev) {
  var L = ['📊 <b>Місячний звіт · ' + BOT_MONTHS_UA[cur.m - 1] + ' ' + cur.y + '</b>', ''];
  L.push('Замовлено виробів: <b>' + cur.items + '</b>' + bot_fmtDelta(cur.items, prev && prev.items));
  L.push('   футболок ' + cur.byType['Футболка'] + ' · худі фліс ' + cur.byType['Худі фліс'] + ' · худі не утеплене ' + cur.byType['Худі не утеплене'] + (cur.stickers ? ' · стікерпаків ' + cur.stickers : ''));
  L.push('Собівартість: <b>' + bot_fmtMoney(cur.cost) + '</b>' + bot_fmtDelta(cur.cost, prev && prev.cost));
  L.push('Оплачено: <b>' + bot_fmtMoney(cur.paid) + '</b>' + bot_fmtDelta(cur.paid, prev && prev.paid));
  var cov = bot_coverageStatus(cur.cost, cur.paid, cur.redPct);
  if (cov.icon) L.push(cov.icon + ' Покриття собівартості: ' + cov.label + ' (' + (cov.diff >= 0 ? '+' : '−') + bot_fmtMoney(Math.abs(cov.diff)) + ')');
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


// ======================= Reports.gs =======================
/**
 * Reports.gs — планувальник (викликається з щохвилинного bot_poll) і звіти:
 * ранковий про невідправлені ТТН (6а), посилки на відділенні (6а.5), місячний (6б), команди /report і /month.
 */

function bot_parseTimeSetting_(s, defMin) {
  var m = String(s || '').match(/^(\d{1,2})[:.](\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : defMin;
}

/** Дні тижня звіту: «Пн,Вт,Ср», діапазон «Пн-Сб», у будь-якому регістрі. Нерозпізнане → Пн–Сб. */
function bot_reportDays_() {
  var order = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  var dowOf = { 'Пн': 1, 'Вт': 2, 'Ср': 3, 'Чт': 4, 'Пт': 5, 'Сб': 6, 'Нд': 0 };
  var norm = function (t) { t = String(t).replace(/\./g, ''); return t.charAt(0).toUpperCase() + t.slice(1, 2).toLowerCase(); };
  var days = {};
  String(bot_setting('REPORT_DAYS', 'Пн,Вт,Ср,Чт,Пт,Сб')).split(/[,\s;]+/).filter(Boolean).forEach(function (tok) {
    var parts = tok.split(/[-–—]/);
    if (parts.length === 2) {
      var a = order.indexOf(norm(parts[0])), b = order.indexOf(norm(parts[1]));
      if (a >= 0 && b >= 0) { for (var k = a; ; k = (k + 1) % 7) { days[dowOf[order[k]]] = true; if (k === b) break; } return; }
    }
    var i = order.indexOf(norm(tok));
    if (i >= 0) days[dowOf[order[i]]] = true;
  });
  var list = Object.keys(days).map(Number);
  return list.length ? list : [1, 2, 3, 4, 5, 6];
}

/** Викликається щохвилини з bot_poll. */
function bot_tickScheduled(startedMs) {
  var now = new Date();
  var p = bot_kyivParts(now);
  var today = bot_dayKey(now);
  var minutes = p.h * 60 + p.mi;
  var hasNp = !!bot_prop(BOT_PROP.NP_KEY);
  var reportMin = bot_parseTimeSetting_(bot_setting('REPORT_TIME', '09:00'), 540);
  var dayOk = bot_reportDays_().indexOf(p.dow) >= 0;

  // 1) нові замовлення з ТТН — одразу запитати статус
  if (hasNp && BOT_NEW_TTN_ROWS_.length) {
    var rows = BOT_NEW_TTN_ROWS_.slice(); BOT_NEW_TTN_ROWS_.length = 0;
    try { bot_npUpdate({ rows: rows }); } catch (e) { bot_log('ПОМИЛКА', 'НП (нові ТТН)', e.message); }
  }

  // 2) регулярне оновлення статусів НП — кожні 30 хв (час спроби фіксуємо ДО запиту: помилка НП не повторюється щохвилини)
  if (hasNp && Date.now() - Number(bot_prop(BOT_PROP.LAST_NP_TS) || 0) >= 29 * 60000) {
    bot_setProp(BOT_PROP.LAST_NP_TS, Date.now());
    var r = bot_npUpdate({});
    if (r.error) bot_log('ПОМИЛКА', 'оновлення НП', r.error);
    else bot_log('ІНФО', 'оновлення НП', 'перевірено ' + r.checked + ', змінено ' + r.updated);
    try { bot_refreshSpeedSummary(); } catch (e) { bot_log('ПОМИЛКА', 'підсумки: швидкість', e.message); }
  }

  // 3) о 08:50 — свіжі статуси для «Не передана»
  if (hasNp && dayOk && minutes >= reportMin - 10 && bot_prop(BOT_PROP.LAST_PRE_REFRESH) !== today) {
    bot_setProp(BOT_PROP.LAST_PRE_REFRESH, today);
    var r2 = bot_npUpdate({ onlyUnsent: true });
    bot_log('ІНФО', 'ранкове оновлення НП', r2.error ? r2.error : 'перевірено ' + r2.checked);
  }

  // 3б) описи ТТН: перевірка / запис у НП (щохвилини), реєстр о REGISTRY_TIME (щодня)
  try { bot_ttnProcess(); } catch (e) { bot_log('ПОМИЛКА', 'описи ТТН', e.message); }
  if (hasNp) { try { bot_registryTick(now, minutes, today); } catch (e) { bot_log('ПОМИЛКА', 'реєстр (планувальник)', e.message); } }

  // 4) ранковий звіт
  if (dayOk && minutes >= reportMin && bot_prop(BOT_PROP.LAST_REPORT_DATE) !== today) {
    var done = bot_sendMorningReport();
    if (done) bot_setProp(BOT_PROP.LAST_REPORT_DATE, today);
    if (done) {
      try { bot_sendStorageReportToOwners_(); } catch (e) { bot_log('ПОМИЛКА', 'звіт про відділення', e.message); }
    }
  }

  // 5) місячний звіт 1-го числа (мітку «надіслано» ставимо лише після успіху — інакше збій = звіт втрачено)
  if (p.d === 1 && minutes >= 540 && String(bot_setting('MONTHLY_REPORT', 'так')).toLowerCase() !== 'ні' &&
      bot_prop(BOT_PROP.LAST_MONTH_REPORT) !== bot_monthKey(now)) {
    var prev = bot_prevYm(p.y, p.m);
    var allOk = true;
    bot_ownerIds().forEach(function (id) {
      try { bot_sendMonthly_(id, prev.y, prev.m, true); } catch (e) { allOk = false; bot_log('ПОМИЛКА', 'місячний звіт', e.message); }
    });
    if (allOk) bot_setProp(BOT_PROP.LAST_MONTH_REPORT, bot_monthKey(now));
  }
}

// ---------- ранковий звіт ----------

function bot_morningParts_() {
  var warn = Number(bot_setting('REPORT_WARN_DAYS', '3'));
  return bot_buildMorningReport(bot_readOrders(), new Date(), { warnDays: isNaN(warn) ? 3 : warn });
}

/**
 * @return true — звіт доставлено повністю (або не може бути доставлений і власника попереджено);
 *         false — спробуємо ще раз за хвилину, продовживши з тієї частини, на якій зупинились (без дублів).
 */
function bot_sendMorningReport() {
  var today = bot_dayKey(new Date());
  var chat = bot_setting('GROUP_CHAT_ID'), thread = bot_setting('REPORT_THREAD_ID');
  if (!chat || thread === '') {
    bot_sendToOwners('⚠️ Ранковий звіт не надіслано: не задано гілку «Реєстри». Напишіть <code>/bind report</code> у цій гілці групи.');
    return true;
  }
  var parts = bot_morningParts_();
  var opts = thread !== '0' ? { thread: thread } : {};
  var prog = {};
  try { prog = JSON.parse(bot_prop('REPORT_PROGRESS') || '{}'); } catch (e) { prog = {}; }
  if (prog.day !== today) prog = { day: today, sent: 0, fails: 0 };
  for (var i = prog.sent; i < parts.length; i++) {
    var r;
    try { r = bot_send(chat, parts[i], opts); } catch (e) { r = { ok: false, description: bot_scrub(e.message) }; }
    if (r.ok) { prog.sent = i + 1; bot_setProp('REPORT_PROGRESS', JSON.stringify(prog)); continue; }
    if (/thread not found/i.test(r.description || '')) {
      bot_sendToOwners('⚠️ Ранковий звіт не надіслано: гілку «Реєстри» не знайдено (message thread not found). Перенастройте: у гілці групи напишіть <code>/bind report</code>. Звіт нижче.');
      bot_sendMany(bot_ownerIds()[0], parts.slice(prog.sent));
      return true;
    }
    prog.fails = (prog.fails || 0) + 1;
    bot_setProp('REPORT_PROGRESS', JSON.stringify(prog));
    bot_log('ПОМИЛКА', 'ранковий звіт', 'спроба ' + prog.fails + ': ' + r.description);
    if (prog.fails >= 3) {
      bot_sendToOwners('⚠️ Ранковий звіт не надіслано: ' + bot_esc(bot_scrub(r.description)) + '. Перевірте, що бот ще в групі й може писати в гілку «Реєстри» (за потреби — <code>/bind report</code>). Звіт нижче.');
      bot_sendMany(bot_ownerIds()[0], parts.slice(prog.sent));
      return true;                                           // сьогодні більше не повторюємо
    }
    return false;
  }
  bot_log('ІНФО', 'ранковий звіт', 'частин: ' + parts.length);
  return true;
}

function bot_cmdReport(chatId) {
  if (bot_prop(BOT_PROP.NP_KEY)) { try { bot_npUpdate({ onlyUnsent: true }); } catch (e) { bot_log('ПОМИЛКА', '/report НП', e.message); } }
  bot_sendMany(chatId, bot_morningParts_());
}

// ---------- посилки на відділенні (лише власнику) ----------

function bot_sendStorageReportToOwners_() {
  if (!bot_prop(BOT_PROP.NP_KEY)) return;
  var warn = Number(bot_setting('STORAGE_WARN_DAYS', '4'));
  var orders = bot_readOrders().filter(function (o) { return o.stage === 'На відділенні' && o.ttn && o.status === 'В роботі'; });
  if (!orders.length) return;
  var ttns = [];
  orders.forEach(function (o) { if (ttns.indexOf(o.ttn) < 0) ttns.push(o.ttn); });
  var items = bot_npFetch(ttns, bot_setting('NP_SENDER_PHONE'));
  var info = {};
  Object.keys(items).forEach(function (t) {
    var it = items[t];
    info[t] = { arrived: it.actualDelivery || it.firstStorageDay || null, payedKeepingFrom: it.payedKeepingFrom, name: it.name, phone: it.phone };
  });
  var parts = bot_buildStorageReport(orders, info, new Date(), { warnDays: isNaN(warn) ? 4 : warn });
  if (!parts.length) return;
  bot_ownerIds().forEach(function (id) { bot_sendMany(id, parts); });
}

// ---------- місячний звіт ----------

function bot_sendMonthly_(chatId, y, m, silentOnEmpty) {
  var orders = bot_readOrders(), pays = bot_readPayments();
  var op = bot_openingFromSettings();
  var redPct = parseFloat(String(bot_setting('PAY_RED_PERCENT', '10')).replace('%', '').replace(',', '.'));
  var cur = bot_monthMetrics(orders, pays, y, m, op); cur.redPct = redPct;
  var pv = bot_prevYm(y, m);
  var prev = bot_monthMetrics(orders, pays, pv.y, pv.m, op);
  bot_sendMany(chatId, bot_splitText(bot_buildMonthReport(cur, prev), 3900));
  bot_withLock(function () {
    var sh = bot_sheet(BOT_SHEETS.monthly);
    var row = bot_monthlyRow(cur);
    var last = sh.getLastRow();
    var keys = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
    var target = last + 1;
    for (var i = 0; i < keys.length; i++) if (String(keys[i][0]) === row[0]) { target = i + 2; break; }
    sh.getRange(target, 1).setNumberFormat('@');
    sh.getRange(target, 1, 1, row.length).setValues([row]);
  });
}

function bot_cmdMonth(chatId, arg) {
  var y, m;
  if (arg) {
    var ym = bot_parseYm(arg);
    if (!ym) return bot_send(chatId, 'Формат: <code>/month 2026-08</code> (або просто /month — за минулий місяць).');
    y = ym.y; m = ym.m;
  } else {
    var p = bot_kyivParts(new Date());
    var pv = bot_prevYm(p.y, p.m); y = pv.y; m = pv.m;
  }
  bot_sendMonthly_(chatId, y, m, false);
}


// ======================= Summary.gs =======================
/**
 * Summary.gs — аркуш «Підсумки» (розділ 7.2): усі числа — формули від «Замовлення» і «Оплати»
 * (окрім блоку «Швидкість виробництва» — його рахує скрипт кожні 30 хв, див. bot_refreshSpeedSummary).
 * Колонки в формулах підставляються за назвами заголовків.
 */

var BOT_SUM_SPEED_ROW = 28;     // перший рядок блоку «Швидкість» (заголовок таблиці)

function bot_buildSummary() {
  var ss = bot_ss();
  var sh = ss.getSheetByName(BOT_SHEETS.summary);
  var om = bot_headerMap(bot_sheet(BOT_SHEETS.orders), BOT_ORDER_COLS, ['arrived']);
  var pm = bot_headerMap(bot_sheet(BOT_SHEETS.payments), bot_payColsAlias_(), ['recon', 'accum', 'cost', 'balance']);

  function R(k) { var c = bot_colLetter(om[k]); return "'" + BOT_SHEETS.orders + "'!$" + c + '$2:$' + c; }
  function P(k) { var c = bot_colLetter(pm[k]); return "'" + BOT_SHEETS.payments + "'!$" + c + '$2:$' + c; }
  var W = '"В роботі"';

  /** Кількість / сума за період [s, e) — за «Датою створення ТТН», а якщо її нема — за «Датою замовлення». */
  function monthCount(extra, s, e) {
    return 'COUNTIFS(' + extra + R('status') + ',' + W + ',' + R('ttnDate') + ',">="&' + s + ',' + R('ttnDate') + ',"<"&' + e + ')+' +
           'COUNTIFS(' + extra + R('status') + ',' + W + ',' + R('ttnDate') + ',"",' + R('date') + ',">="&' + s + ',' + R('date') + ',"<"&' + e + ')';
  }
  function monthSum(extra, s, e) {
    return 'SUMIFS(' + R('cost') + ',' + extra + R('status') + ',' + W + ',' + R('ttnDate') + ',">="&' + s + ',' + R('ttnDate') + ',"<"&' + e + ')+' +
           'SUMIFS(' + R('cost') + ',' + extra + R('status') + ',' + W + ',' + R('ttnDate') + ',"",' + R('date') + ',">="&' + s + ',' + R('date') + ',"<"&' + e + ')';
  }
  /** Статус покриття: 🟢 оплачено ≥ собівартості · 🟡 недоплата ≤ порогу % · 🔴 більше. */
  function covStatus(cost, paid) {
    return 'IF(' + cost + '<=0,"",IF(' + paid + '>=' + cost + ',"🟢 Покрито",IF(' + cost + '-' + paid + '<=' + cost + '*$H$7/100,"🟡 Недоплата","🔴 Велика різниця")))';
  }
  function crit(key, val) { return R(key) + ',"' + val + '",'; }

  sh.clear();
  sh.clearConditionalFormatRules();
  bot_formulaSep_(sh);                                   // «,» чи «;» — залежить від мови таблиці
  sh.setHiddenGridlines(true);
  var money = '#,##0" грн"';
  var f = {};                                       // комірка → формула / значення

  // ---- заголовок і картки ----
  sh.getRange('A1').setValue('Монокло — Виробництво 2026 · Підсумки').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('Усе рахується автоматично з аркушів «Замовлення» і «Оплати». Цей аркуш не редагуйте.').setFontColor('#666666');
  sh.getRange('A4:E4').setValues([['Собівартість усього', 'Оплачено усього', 'БОРГ', 'Остання оплата — дата', 'Остання оплата — сума']]);
  // Початковий залишок (аркуш «Налаштування»): входить у собівартість; замовлення/оплати до дат зрізу вже в ньому
  function S(key) { return 'VLOOKUP("' + key + '",\'' + BOT_SHEETS.settings + '\'!$A$2:$B$60,2,FALSE)'; }
  function D(key) { return 'IFERROR(IF(ISNUMBER(' + S(key) + '),' + S(key) + ',DATE(VALUE(MID(' + S(key) + ',7,4)),VALUE(MID(' + S(key) + ',4,2)),VALUE(LEFT(' + S(key) + ',2)))),0)'; }   // і текст «31.08.2026», і справжня дата
  sh.getRange('G4').setValue('Початковий залишок').setFontColor('#999999');
  sh.getRange('H4').setFormula(bot_fx('=IFERROR(VALUE(' + S('OPENING_DEBT') + '),0)')).setNumberFormat(money).setFontColor('#999999');
  sh.getRange('G5').setValue('Замовлення після').setFontColor('#999999');
  sh.getRange('H5').setFormula(bot_fx('=' + D('OPENING_ORDERS_AFTER'))).setNumberFormat('dd.mm.yyyy').setFontColor('#999999');
  sh.getRange('G7').setValue('Поріг «червоного», %').setFontColor('#999999');
  sh.getRange('H7').setFormula(bot_fx('=IFERROR(VALUE(SUBSTITUTE(' + S('PAY_RED_PERCENT') + ',"%","")),10)')).setFontColor('#999999');
  sh.getRange('G6').setValue('Оплати після').setFontColor('#999999');
  sh.getRange('H6').setFormula(bot_fx('=' + D('OPENING_PAYS_AFTER'))).setNumberFormat('dd.mm.yyyy').setFontColor('#999999');
  sh.getRange('A6').setFormula(bot_fx('=IF($H$4>0,"У собівартість і борг входить початковий залишок "&TEXT($H$4,"# ##0")&" грн (борг станом на 31.08.2026 з оплатами по 08.09.2026 включно)","")')).setFontColor('#666666').setFontStyle('italic');
  sh.getRange('A5').setFormula(bot_fx('=$H$4+SUM(' + R('cost') + ')-IF($H$5>0,SUMIFS(' + R('cost') + ',' + R('date') + ',"<="&$H$5),0)'));
  sh.getRange('B5').setFormula(bot_fx('=SUM(' + P('sum') + ')-IF($H$6>0,SUMIFS(' + P('sum') + ',' + P('date') + ',"<="&$H$6),0)'));
  sh.getRange('C5').setFormula(bot_fx('=A5-B5'));
  // остання заповнена оплата в стовпці «Сума оплати»
  sh.getRange('D5').setFormula(bot_fx('=IFERROR(INDEX(' + P('date') + ',COUNT(' + P('sum') + ')),"")'));
  sh.getRange('E5').setFormula(bot_fx('=IFERROR(INDEX(' + P('sum') + ',COUNT(' + P('sum') + ')),"")'));
  sh.getRange('A4:E4').setFontWeight('bold').setBackground('#1f3864').setFontColor('#ffffff').setHorizontalAlignment('center');
  sh.getRange('A5:E5').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#eef3fb');
  sh.getRange('A5:C5').setNumberFormat(money);
  sh.getRange('E5').setNumberFormat(money);
  sh.getRange('D5').setNumberFormat('dd.mm.yyyy');
  sh.getRange('C4:C5').setBackground('#c00000').setFontColor('#ffffff');

  // службові клітинки місяця
  sh.getRange('G1').setValue('Початок місяця').setFontColor('#999999');
  sh.getRange('G2').setValue('Початок наступного').setFontColor('#999999');
  sh.getRange('H1').setFormula(bot_fx('=DATE(YEAR(TODAY()),MONTH(TODAY()),1)')).setNumberFormat('dd.mm.yyyy').setFontColor('#999999');
  sh.getRange('H2').setFormula(bot_fx('=EDATE(H1,1)')).setNumberFormat('dd.mm.yyyy').setFontColor('#999999');

  // ---- Сьогодні ----
  bot_sumHeader_(sh, 7, 'Сьогодні');
  sh.getRange('A8').setValue('Додано речей · собівартість');
  sh.getRange('B8').setFormula(bot_fx('=COUNTIFS(' + R('date') + ',TODAY(),' + R('status') + ',' + W + ')'));
  sh.getRange('C8').setFormula(bot_fx('=SUMIFS(' + R('cost') + ',' + R('date') + ',TODAY(),' + R('status') + ',' + W + ')')).setNumberFormat(money);
  sh.getRange('A9').setValue('ТТН «Не передана»');
  sh.getRange('B9').setFormula(bot_fx('=IFERROR(ROWS(UNIQUE(FILTER(' + R('ttn') + ',' + R('stage') + '="Не передана",' + R('status') + '=' + W + ',' + R('ttn') + '<>""))),0)'));
  sh.getRange('A10').setValue('Посилок «На відділенні» 4+ дні');
  if (om.arrived) {
    sh.getRange('B10').setFormula(bot_fx('=IFERROR(ROWS(UNIQUE(FILTER(' + R('ttn') + ',' + R('stage') + '="На відділенні",' + R('status') + '=' + W + ',' + R('arrived') + '<>"",' + R('arrived') + '<=TODAY()-4))),0)'));
  }

  // ---- Поточний місяць ----
  bot_sumHeader_(sh, 12, 'Поточний місяць');
  sh.getRange('A13:C13').setValues([['Тип речі', 'Речей', 'Собівартість']]).setFontWeight('bold');
  BOT_TYPES.forEach(function (t, i) {
    var r = 14 + i;
    sh.getRange('A' + r).setValue(t);
    sh.getRange('B' + r).setFormula(bot_fx('=' + monthCount(crit('type', t), '$H$1', '$H$2')));
    sh.getRange('C' + r).setFormula(bot_fx('=' + monthSum(crit('type', t), '$H$1', '$H$2'))).setNumberFormat(money);
  });
  sh.getRange('A17').setValue('Разом').setFontWeight('bold');
  sh.getRange('B17').setFormula(bot_fx('=' + monthCount('', '$H$1', '$H$2'))).setFontWeight('bold');
  sh.getRange('C17').setFormula(bot_fx('=' + monthSum('', '$H$1', '$H$2'))).setNumberFormat(money).setFontWeight('bold');
  sh.getRange('A18').setValue('Оплачено за місяць');
  sh.getRange('B18').setFormula(bot_fx('=SUMIFS(' + P('sum') + ',' + P('date') + ',">="&$H$1,' + P('date') + ',"<"&$H$2)')).setNumberFormat(money);
  // покриття поточного місяця: оплачено проти собівартості
  sh.getRange('D18').setFormula(bot_fx('=' + covStatus('$C$17', '$B$18')));
  sh.getRange('E18').setFormula(bot_fx('=IF($C$17>0,$B$18-$C$17,"")')).setNumberFormat('+#,##0" грн";-#,##0" грн"');
  sh.getRange('A19').setValue('Відмови: шт. · грн · % від отриманих+відмов');
  sh.getRange('B19').setFormula(bot_fx('=' + monthCount(crit('stage', 'Відмова'), '$H$1', '$H$2')));
  sh.getRange('C19').setFormula(bot_fx('=' + monthSum(crit('stage', 'Відмова'), '$H$1', '$H$2'))).setNumberFormat(money);
  sh.getRange('D19').setFormula(bot_fx('=IFERROR(B19/(B19+' + monthCount(crit('stage', 'Отримано'), '$H$1', '$H$2') + '),0)')).setNumberFormat('0.0%');

  sh.getRange('A20').setValue('У «Разом» входять також стікерпаки (0 грн), шт.');
  sh.getRange('B20').setFormula(bot_fx('=' + monthCount(crit('type', 'Стікерпак'), '$H$1', '$H$2')));

  // ---- До оплати наступної звірки ----
  bot_sumHeader_(sh, 21, 'До оплати наступної звірки');
  sh.getRange('A22').setValue('Сума «Не оплачено» для етапів «Отримано» + «Відмова» (орієнтир, скільки має виставити виробництво)');
  sh.getRange('A22').setWrap(true);
  sh.getRange('B22').setFormula(bot_fx('=SUMIFS(' + R('cost') + ',' + R('paid') + ',"Не оплачено",' + R('stage') + ',"Отримано",' + R('status') + ',' + W + ')+' +
    'SUMIFS(' + R('cost') + ',' + R('paid') + ',"Не оплачено",' + R('stage') + ',"Відмова",' + R('status') + ',' + W + ')')).setNumberFormat(money).setFontWeight('bold');

  // ---- Спірні ----
  bot_sumHeader_(sh, 24, 'Спірні');
  sh.getRange('A25').setValue('Рядків «Спірна» · сума');
  sh.getRange('B25').setFormula(bot_fx('=COUNTIFS(' + R('paid') + ',"Спірна")'));
  sh.getRange('C25').setFormula(bot_fx('=SUMIFS(' + R('cost') + ',' + R('paid') + ',"Спірна")')).setNumberFormat(money);

  // ---- Швидкість виробництва (значення пише скрипт) ----
  bot_sumHeader_(sh, BOT_SUM_SPEED_ROW - 1, 'Швидкість виробництва (замовлення → передача Новій пошті)');
  sh.getRange(BOT_SUM_SPEED_ROW, 1, 1, 3).setValues([['Показник', 'Поточний місяць', 'Останні 7 днів']]).setFontWeight('bold');
  ['ТТН у вибірці', 'Середній термін, дн', 'Медіана, дн', 'Передано за ≤1 день', 'Передано за 2 дні', 'Передано за 3+ дні', 'Найдовша ТТН (№ · днів)']
    .forEach(function (label, i) { sh.getRange(BOT_SUM_SPEED_ROW + 1 + i, 1).setValue(label); });
  sh.getRange(BOT_SUM_SPEED_ROW + 8, 1).setValue('Рахується від замовлень, прийнятих ботом; імпортовані рядки без дати замовлення не враховуються.').setFontColor('#888888');

  // ---- По місяцях (12 останніх) ----
  var mr = 39;
  bot_sumHeader_(sh, mr - 2, 'По місяцях: речі, собівартість і покриття оплатами (🟢 покрито · 🟡 недоплата · 🔴 велика різниця)');
  sh.getRange(mr - 1, 1, 1, 9).setValues([['Місяць'].concat(BOT_TYPES).concat(['Усього речей', 'Собівартість', 'Оплачено в місяці', 'Різниця', 'Покриття собівартості'])]).setFontWeight('bold');
  for (var k = 0; k < 12; k++) {
    var r = mr + k;
    sh.getRange(r, 1).setFormula(bot_fx('=EDATE($H$1,' + (k - 11) + ')')).setNumberFormat('mmmm yyyy');
    BOT_TYPES.forEach(function (t, i) {
      sh.getRange(r, 2 + i).setFormula(bot_fx('=' + monthCount(crit('type', t), '$A' + r, 'EDATE($A' + r + ',1)')));
    });
    sh.getRange(r, 5).setFormula(bot_fx('=' + monthCount('', '$A' + r, 'EDATE($A' + r + ',1)')));
    sh.getRange(r, 6).setFormula(bot_fx('=' + monthSum('', '$A' + r, 'EDATE($A' + r + ',1)'))).setNumberFormat(money);
    // місяці, що закінчились до дати початкового залишку, не показуємо (їх дані — в залишку)
    var skip = 'EDATE($A' + r + ',1)<=$H$5+1';
    sh.getRange(r, 7).setFormula(bot_fx('=IF(AND($H$5>0,' + skip + '),"",SUMIFS(' + P('sum') + ',' + P('date') + ',">="&$A' + r + ',' + P('date') + ',"<"&EDATE($A' + r + ',1)))')).setNumberFormat(money);
    sh.getRange(r, 8).setFormula(bot_fx('=IF(OR($G' + r + '="",$F' + r + '<=0),"",$G' + r + '-$F' + r + ')')).setNumberFormat('+#,##0" грн";-#,##0" грн"');
    sh.getRange(r, 9).setFormula(bot_fx('=IF($G' + r + '="","",' + covStatus('$F' + r, '$G' + r) + ')'));
  }

  sh.setColumnWidth(1, 330);
  [2, 3, 4, 5, 6].forEach(function (c) { sh.setColumnWidth(c, 150); });
  sh.setColumnWidth(7, 150); sh.setColumnWidth(8, 130); sh.setColumnWidth(9, 190);
  // кольори покриття: зелений / жовтий / червоний
  var covRanges = [sh.getRange('D18'), sh.getRange(mr, 9, 12, 1)];
  var rules = [['🟢', '#d9ead3', '#274e13'], ['🟡', '#fff2cc', '#7f6000'], ['🔴', '#f4cccc', '#990000']].map(function (c) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextContains(c[0]).setBackground(c[1]).setFontColor(c[2]).setRanges(covRanges).build();
  });
  sh.setConditionalFormatRules(rules);
  sh.setFrozenRows(0);
  try {
    sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
    var prot = sh.protect().setDescription('Підсумки: лише перегляд');
    prot.setWarningOnly(false);
    var me = Session.getEffectiveUser();
    prot.addEditor(me);
    prot.removeEditors(prot.getEditors().filter(function (u) { return u.getEmail() !== me.getEmail(); }));
    if (prot.canDomainEdit()) prot.setDomainEdit(false);
  } catch (e) { bot_log('УВАГА', 'захист «Підсумків»', e.message); }
}

function bot_sumHeader_(sh, row, title) {
  sh.getRange(row, 1, 1, 9).setBackground('#d9e2f3').setFontWeight('bold');
  sh.getRange(row, 1).setValue(title);
}

/** Блок «Швидкість виробництва» — значення з bot_speedSummaryBlock. */
function bot_refreshSpeedSummary() {
  var sh = bot_ss().getSheetByName(BOT_SHEETS.summary);
  if (!sh) return;
  var b = bot_speedSummaryBlock(bot_readOrders(), new Date());
  function col(s) {
    return [s.count, s.count ? s.avg : '', s.count ? s.median : '', s.count ? s.pct1 + '%' : '', s.count ? s.pct2 + '%' : '',
      s.count ? s.pct3 + '%' : '', s.longest ? '№' + s.longest.no + ' · ' + s.longest.days : ''];
  }
  var m = col(b.month), w = col(b.week);
  var vals = m.map(function (v, i) { return [v, w[i]]; });
  sh.getRange(BOT_SUM_SPEED_ROW + 1, 2, vals.length, 2).setValues(vals).setHorizontalAlignment('right');
}


// ======================= Setup.gs =======================
/**
 * Setup.gs — «Перше налаштування»: створює всі аркуші, заголовки, списки, формати, умовне форматування.
 * Можна запускати повторно: наявні дані не чіпає, лише дописує відсутнє.
 */

var BOT_ORDERS_ROWS = 10000;     // запас на рік роботи: формати, списки й кольори діють на всі ці рядки

function bot_setupAll() {
  var ss = bot_ss();
  try { ss.setSpreadsheetTimeZone(BOT_TZ); } catch (e) { bot_log('УВАГА', 'часовий пояс', e.message); }
  try { ss.setSpreadsheetLocale('uk_UA'); } catch (e) { bot_log('УВАГА', 'мова таблиці', e.message); }

  var order = [BOT_SHEETS.summary, BOT_SHEETS.orders, BOT_SHEETS.ttn, BOT_SHEETS.registries, BOT_SHEETS.payments, BOT_SHEETS.price, BOT_SHEETS.lists,
    BOT_SHEETS.recon, BOT_SHEETS.reconDetails, BOT_SHEETS.monthly, BOT_SHEETS.settings, BOT_SHEETS.log];
  var firstRun = !ss.getSheetByName(BOT_SHEETS.orders);
  order.forEach(function (name, i) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name, i);
  });
  // прибрати порожній стандартний аркуш
  ss.getSheets().forEach(function (sh) {
    if (/^(Лист|Аркуш|Sheet)\s?\d+$/i.test(sh.getName()) && sh.getLastRow() <= 1 && sh.getLastColumn() <= 1 && ss.getSheets().length > order.length) {
      try { ss.deleteSheet(sh); } catch (e) { /* ігноруємо */ }
    }
  });

  bot_setupLists_();
  bot_setupSettings_();
  bot_setupPrice_();
  bot_setupOrders_();
  bot_setupPayments_();
  bot_setupTtn_();
  bot_setupTable_(BOT_SHEETS.recon, BOT_RECON_COLS.map(function (c) { return c[1]; }), 16);
  bot_setupTable_(BOT_SHEETS.reconDetails, BOT_DETAIL_COLS.map(function (c) { return c[1]; }), 10);
  bot_setupTable_(BOT_SHEETS.monthly, BOT_MONTHLY_COLS, 13);
  bot_setupTable_(BOT_SHEETS.log, ['Час', 'Рівень', 'Подія', 'Деталі'], 4);
  var recon = bot_sheet(BOT_SHEETS.recon), rmap = bot_headerMap(recon, BOT_RECON_COLS);
  recon.getRange(2, rmap.date, recon.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  recon.getRange(2, rmap.confirmedAt, recon.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  recon.getRange(2, rmap.hash, recon.getMaxRows() - 1, 1).setNumberFormat('@');
  recon.hideColumns(rmap.fileData);
  ['id', 'fileName', 'summaryMsg', 'fileData'].forEach(function (k) { recon.getRange(2, rmap[k], recon.getMaxRows() - 1, 1).setNumberFormat('@'); });
  var det = bot_sheet(BOT_SHEETS.reconDetails), dmap = bot_headerMap(det, BOT_DETAIL_COLS);
  det.getRange(2, dmap.ttn, det.getMaxRows() - 1, 1).setNumberFormat('@');
  bot_sheet(BOT_SHEETS.monthly).getRange(2, 1, 500, 1).setNumberFormat('@');
  bot_sheet(BOT_SHEETS.log).getRange(2, 1, 2200, 1).setNumberFormat('dd.mm.yyyy hh:mm:ss');

  bot_buildSummary();
  try { bot_rewritePaymentFormulas(); } catch (e) { bot_log('УВАГА', 'формули «Оплат»', e.message); }
  bot_ss().setActiveSheet(bot_sheet(BOT_SHEETS.orders));
  bot_log('ІНФО', 'Перше налаштування', firstRun ? 'таблицю створено' : 'оновлено');
}

// ---------- загальне оформлення ----------

function bot_styleHeader_(sh, width) {
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#1f3864').setFontColor('#ffffff')
    .setVerticalAlignment('middle').setWrap(true).setHorizontalAlignment('center');
  sh.setRowHeight(1, 42);
  sh.setFrozenRows(1);
}

/** Заголовки: порожній аркуш — пише всі, інакше дописує відсутні в кінець. */
function bot_ensureHeaders_(sh, headers) {
  var existing = sh.getLastColumn() ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); }) : [];
  var empty = existing.every(function (h) { return !h; });
  if (empty) { sh.getRange(1, 1, 1, headers.length).setValues([headers]); return; }
  headers.forEach(function (h) {
    if (existing.indexOf(h) < 0) { sh.getRange(1, sh.getLastColumn() + 1).setValue(h); existing.push(h); }
  });
}

function bot_setupTable_(name, headers, width) {
  var sh = bot_sheet(name);
  bot_ensureHeaders_(sh, headers);
  bot_styleHeader_(sh, sh.getLastColumn());
  if (!sh.getFilter() && sh.getMaxRows() > 1) {
    try { sh.getRange(1, 1, sh.getMaxRows(), sh.getLastColumn()).createFilter(); } catch (e) { /* фільтр не критичний */ }
  }
}

// ---------- довідники ----------

function bot_setupLists_() {
  var sh = bot_sheet(BOT_SHEETS.lists);
  var headers = ['Тип речі', 'Колір', 'Розмір', 'Розміщення', 'Етап', 'Статус замовлення', 'Оплата'];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  bot_styleHeader_(sh, headers.length);
  var lists = [null, BOT_COLORS, BOT_SIZES, BOT_PLACEMENTS, BOT_STAGES, BOT_ORDER_STATUSES, BOT_PAID_VALUES];
  lists.forEach(function (arr, i) {
    if (!arr) return;
    sh.getRange(2, i + 1, arr.length, 1).setValues(arr.map(function (v) { return [v]; }));
  });
  sh.setColumnWidths(1, headers.length, 150);
}

// ---------- налаштування ----------

function bot_setupSettings_() {
  var sh = bot_sheet(BOT_SHEETS.settings);
  bot_ensureHeaders_(sh, ['Параметр', 'Значення', 'Пояснення']);
  bot_styleHeader_(sh, 3);
  var last = sh.getLastRow();
  var have = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  var rows = BOT_DEFAULT_SETTINGS.filter(function (s) { return have.indexOf(s[0]) < 0; });
  if (rows.length) {
    var start = Math.max(last, 1) + 1;
    sh.getRange(start, 1, rows.length, 3).setNumberFormat('@').setValues(rows);
  }
  sh.getRange(2, 2, 40, 1).setNumberFormat('@');
  sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 220); sh.setColumnWidth(3, 520);
  delete BOT_CACHE_.settings;
}

// ---------- прайс ----------

function bot_setupPrice_() {
  var sh = bot_sheet(BOT_SHEETS.price);
  bot_ensureHeaders_(sh, BOT_PRICE_COLS);
  bot_styleHeader_(sh, 4);
  if (sh.getLastRow() < 2) {
    var rows = BOT_DEFAULT_PRICES.map(function (r) { return [r[0], r[1], bot_parseDate(r[2]), r[3]]; });
    sh.getRange(2, 1, rows.length, 4).setValues(rows);
  }
  // доповнюємо прайс типами, яких ще немає (напр. «Стікерпак» у вже працюючій таблиці); існуючі рядки не чіпаємо
  var haveTypes = {};
  bot_readPriceRows().forEach(function (r) { haveTypes[r.type] = true; });
  var missing = BOT_DEFAULT_PRICES.filter(function (r) { return !haveTypes[r[0]]; }).map(function (r) { return [r[0], r[1], bot_parseDate(r[2]), r[3]]; });
  if (missing.length && sh.getLastRow() >= 2) sh.getRange(sh.getLastRow() + 1, 1, missing.length, 4).setValues(missing);
  sh.getRange(2, 2, 200, 1).setNumberFormat('#,##0" грн"');
  sh.getRange(2, 3, 200, 1).setNumberFormat('dd.mm.yyyy');
  sh.setColumnWidths(1, 4, 170);
  sh.getRange('F1').setValue('Нова ціна = новий рядок з датою «Діє з». Старі рядки не видаляйте.').setFontColor('#777777');
  bot_syncTypeList();
}

/** Список «Тип речі» в «Довідниках» — звичайні значення з аркуша «Прайс» (без формул, щоб не було #ERROR!). */
function bot_syncTypeList() {
  var types = [];
  bot_readPriceRows().forEach(function (r) { if (types.indexOf(r.type) < 0) types.push(r.type); });
  var sh = bot_sheet(BOT_SHEETS.lists);
  sh.getRange(2, 1, 39, 1).clearContent();
  if (types.length) sh.getRange(2, 1, types.length, 1).setValues(types.map(function (t) { return [t]; }));
}

// ---------- «Замовлення» ----------

function bot_setupOrders_() {
  var sh = bot_sheet(BOT_SHEETS.orders);
  bot_ensureHeaders_(sh, BOT_ORDER_COLS.map(function (c) { return c[1]; }));
  var width = sh.getLastColumn();
  bot_styleHeader_(sh, width);
  if (sh.getMaxRows() < BOT_ORDERS_ROWS) sh.insertRowsAfter(sh.getMaxRows(), BOT_ORDERS_ROWS - sh.getMaxRows());
  var map = bot_ordersMap(sh);
  var n = sh.getMaxRows() - 1;
  function col(k) { return sh.getRange(2, map[k], n, 1); }

  col('date').setNumberFormat('dd.mm.yyyy');
  col('ttnDate').setNumberFormat('dd.mm.yyyy hh:mm');
  col('paidDate').setNumberFormat('dd.mm.yyyy');
  col('handoff').setNumberFormat('dd.mm.yyyy hh:mm');
  if (map.arrived) col('arrived').setNumberFormat('dd.mm.yyyy hh:mm');
  col('ttn').setNumberFormat('@');                               // ТТН — завжди текст
  col('msgId').setNumberFormat('@');                             // ключі «id#1» — текст, не число
  col('cost').setNumberFormat('#,##0" грн"');
  col('no').setNumberFormat('0');

  // списки з аркуша «Довідники»
  var lists = bot_sheet(BOT_SHEETS.lists);
  var listCols = { type: 'A', color: 'B', size: 'C', placement: 'D', stage: 'E', status: 'F', paid: 'G' };
  Object.keys(listCols).forEach(function (k) {
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(lists.getRange(listCols[k] + '2:' + listCols[k] + '40'), true).setAllowInvalid(true).build();
    col(k).setDataValidation(rule);
  });
  col('prints').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['1', '2'], true).setAllowInvalid(true).build());

  // колір для «Етапу» і «Оплати»
  var rules = [];
  function addRule(k, text, bg, fg) {
    var b = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(bg);
    if (fg) b.setFontColor(fg);
    rules.push(b.setRanges([col(k)]).build());
  }
  addRule('stage', 'Відмова', '#f4cccc', '#990000');
  addRule('stage', 'Отримано', '#d9ead3', '#274e13');
  addRule('stage', 'Не передана', '#fce5cd', '#b45f06');
  addRule('stage', 'В дорозі', '#cfe2f3');
  addRule('stage', 'На відділенні', '#d9d2e9');
  addRule('stage', 'Повернення', '#eeeeee');
  addRule('paid', 'Оплачено', '#d9ead3', '#274e13');
  addRule('paid', 'Спірна', '#fce5cd', '#b45f06');
  addRule('paid', 'Не оплачено', '#f4cccc', '#990000');
  sh.setConditionalFormatRules(rules);

  [map.msgId, map.arrived].forEach(function (c) { if (c) sh.hideColumns(c); });
  sh.setFrozenColumns(1);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), width).createFilter();
  if (!sh.getBandings().length) {
    try { sh.getRange(1, 1, sh.getMaxRows(), width).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false); } catch (e) { /* не критично */ }
  }
  var widths = { no: 90, date: 100, print: 260, type: 130, color: 90, size: 70, placement: 150, prints: 70, ttn: 140, ttnDate: 130,
    stage: 120, npStatus: 300, cost: 110, status: 120, paid: 110, paidDate: 100, recon: 130, note: 280, handoff: 130 };
  Object.keys(widths).forEach(function (k) { if (map[k]) sh.setColumnWidth(map[k], widths[k]); });
}

// ---------- «Оплати» ----------

function bot_setupPayments_() {
  var sh = bot_sheet(BOT_SHEETS.payments);
  bot_ensureHeaders_(sh, BOT_PAY_COLS.map(function (c) { return c[1]; }));
  bot_styleHeader_(sh, sh.getLastColumn());
  var map = bot_headerMap(sh, bot_payColsAlias_());
  var n = Math.max(sh.getMaxRows() - 1, 100);
  if (sh.getMaxRows() < 101) sh.insertRowsAfter(sh.getMaxRows(), 101 - sh.getMaxRows());
  sh.getRange(2, map.date, n, 1).setNumberFormat('dd.mm.yyyy');
  [map.sum, map.accum, map.cost, map.balance].forEach(function (c) { sh.getRange(2, c, n, 1).setNumberFormat('#,##0" грн"'); });
  sh.setColumnWidths(1, sh.getLastColumn(), 140);
}

// ---------- «ТТН» і «Реєстри» ----------

function bot_setupTtn_() {
  var sh = bot_sheet(BOT_SHEETS.ttn);
  bot_ensureHeaders_(sh, BOT_TTN_COLS.map(function (c) { return c[1]; }));
  bot_styleHeader_(sh, sh.getLastColumn());
  var map = bot_ttnMap(sh), n = Math.max(sh.getMaxRows() - 1, 1);
  ['ttn', 'orders', 'original', 'desc', 'registry', 'msgId', 'npRef', 'note', 'status'].forEach(function (k) { if (map[k]) sh.getRange(2, map[k], n, 1).setNumberFormat('@'); });
  if (map.written) sh.getRange(2, map.written, n, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  if (map.len) sh.getRange(2, map.len, n, 1).setNumberFormat('0');
  if (map.status) sh.getRange(2, map.status, n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(BOT_TTN_STATUSES, true).setAllowInvalid(true).build());
  [map.msgId, map.npRef].forEach(function (c) { if (c) sh.hideColumns(c); });
  var widths = { ttn: 140, orders: 150, original: 320, desc: 360, len: 80, status: 120, written: 130, registry: 90, note: 260 };
  Object.keys(widths).forEach(function (k) { if (map[k]) sh.setColumnWidth(map[k], widths[k]); });
  sh.setFrozenRows(1);

  var rg = bot_sheet(BOT_SHEETS.registries);
  bot_ensureHeaders_(rg, BOT_REG_COLS.map(function (c) { return c[1]; }));
  bot_styleHeader_(rg, rg.getLastColumn());
  rg.setFrozenRows(1);
}


// ======================= Import.gs =======================
/**
 * Import.gs — одноразовий імпорт зі старої таблиці «Звітність Монокло — Кузнець 2026» (розділ 7.5).
 * Стару таблицю лише ЧИТАЄМО, нічого в ній не змінюємо.
 */

var BOT_OLD_ORDER_COLS_ = {
  no: ['№ з чату'], print: ['Назва принта / позиції', 'Назва принта', 'Назва'], color: ['Колір'], size: ['Розмір'],
  placement: ['Розміщення принту', 'Розміщення'], ttn: ['ТТН (Штрих-код)', 'ТТН'], cost: ['Собівартість (грн)', 'Собівартість'],
  npStatus: ['Статус доставки'], paid: ['Оплата']
};

function bot_oldFind_(headers, names) {
  var h = headers.map(function (x) { return String(x).trim().toLowerCase(); });
  for (var i = 0; i < names.length; i++) { var j = h.indexOf(names[i].toLowerCase()); if (j >= 0) return j; }
  for (var k = 0; k < names.length; k++) {
    for (var m = 0; m < h.length; m++) if (h[m].indexOf(names[k].toLowerCase()) === 0) return m;
  }
  return -1;
}

/** Читає стару таблицю (лише читання) і повертає {orders:[...], payments:[...]} у сирому вигляді. */
function bot_readOldWorkbook(url) {
  var old = SpreadsheetApp.openByUrl(url);
  var shO = old.getSheetByName('Замовлення') || old.getSheets()[0];
  var shP = old.getSheetByName('Оплати');
  var vals = shO.getDataRange().getValues();
  var hdr = vals[0];
  var ix = {};
  Object.keys(BOT_OLD_ORDER_COLS_).forEach(function (k) {
    ix[k] = bot_oldFind_(hdr, BOT_OLD_ORDER_COLS_[k]);
    if (ix[k] < 0) throw new Error('У старій таблиці не знайшов колонку «' + BOT_OLD_ORDER_COLS_[k][0] + '».');
  });
  var orders = [];
  for (var i = 1; i < vals.length; i++) {
    var r = vals[i];
    var o = { _line: i + 1 };
    Object.keys(ix).forEach(function (k) { o[k] = r[ix[k]]; });
    if ((o.no === '' || o.no === null) && !bot_trim(o.print) && !bot_normTtn(o.ttn)) continue;   // порожній рядок або рядок підсумків
    orders.push(o);
  }
  var payments = [];
  if (shP) {
    var pv = shP.getDataRange().getValues();
    var ph = pv[0];
    var pi = { no: bot_oldFind_(ph, ['№ оплати']), date: bot_oldFind_(ph, ['Дата оплати']), sum: bot_oldFind_(ph, ['Сума оплати']),
      bank: bot_oldFind_(ph, ['Спосіб / банк']), receipt: bot_oldFind_(ph, ['№ квитанції']) };
    for (var j = 1; j < pv.length; j++) {
      var sum = bot_toNumber(pv[j][pi.sum]);
      if (sum === null) continue;
      payments.push({ no: pv[j][pi.no], date: pv[j][pi.date], sum: sum, bank: pi.bank >= 0 ? pv[j][pi.bank] : '', receipt: pi.receipt >= 0 ? pv[j][pi.receipt] : '' });
    }
  }
  return { orders: orders, payments: payments };
}

/** Чи можна імпортувати: нова таблиця має бути порожньою (інакше з'являться дублі). */
function bot_importTargetIsEmpty() {
  return bot_readOrders().length === 0 && bot_readPayments().length === 0;
}

function bot_importFromUrl(url) {
  if (!bot_importTargetIsEmpty()) throw new Error('У новій таблиці вже є замовлення або оплати. Імпорт можливий лише в порожню таблицю — щоб не було дублів.');
  var data = bot_readOldWorkbook(url);
  var mapped = data.orders.map(function (o) { var m = bot_mapOldOrderRow(o); m._line = o._line; return m; });
  var rows = mapped.map(function (m) { return m.row; });
  var prop = bot_importPropagatePaid(rows);

  var unrecognized = [];
  mapped.forEach(function (m) {
    if (m.unrecognized.length) {
      unrecognized.push('рядок ' + m._line + ': ' + m.unrecognized.join(', '));
      m.row.note = (m.row.note ? m.row.note + '; ' : '') + BOT_NOTE_PREFIX_ + 'не розпізнано: ' + m.unrecognized.join(', ');
    }
  });

  bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var width = sh.getLastColumn();
    if (rows.length + 1 > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), rows.length + 200 - sh.getMaxRows());
    var arr = rows.map(function (r) {
      var line = []; for (var i = 0; i < width; i++) line.push('');
      BOT_ORDER_COLS.forEach(function (c) {
        var v = r[c[0]];
        if (map[c[0]] && v !== null && v !== undefined) line[map[c[0]] - 1] = v;
      });
      return line;
    });
    sh.getRange(2, map.ttn, rows.length, 1).setNumberFormat('@');
    if (arr.length) sh.getRange(2, 1, arr.length, width).setValues(arr);

    // оплати: переносимо як є, формули — нові
    var ps = bot_sheet(BOT_SHEETS.payments);
    var pm = bot_headerMap(ps, bot_payColsAlias_());
    var pwidth = ps.getLastColumn();
    if (data.payments.length + 1 > ps.getMaxRows()) ps.insertRowsAfter(ps.getMaxRows(), data.payments.length + 50);
    var sumL = bot_colLetter(pm.sum), accL = bot_colLetter(pm.accum), costL = bot_colLetter(pm.cost);
    var parr = data.payments.map(function (p, i) {
      var r = i + 2, line = []; for (var k = 0; k < pwidth; k++) line.push('');
      line[pm.no - 1] = p.no; line[pm.date - 1] = p.date; line[pm.sum - 1] = p.sum; line[pm.bank - 1] = p.bank; line[pm.receipt - 1] = p.receipt;
      line[pm.accum - 1] = '=SUM($' + sumL + '$2:' + sumL + r + ')';
      line[pm.cost - 1] = "='" + BOT_SHEETS.summary + "'!$A$5";
      line[pm.balance - 1] = '=' + costL + r + '-' + accL + r;
      return line;
    });
    if (parr.length) ps.getRange(2, 1, parr.length, pwidth).setValues(parr);
    SpreadsheetApp.flush();
  });

  var cost = bot_sumBy_(rows, function (r) { return r.cost; });
  var paid = bot_sumBy_(data.payments, function (p) { return p.sum; });
  var sum = bot_ss().getSheetByName(BOT_SHEETS.summary);
  var fromSummary = { cost: sum.getRange('A5').getValue(), paid: sum.getRange('B5').getValue(), debt: sum.getRange('C5').getValue() };

  var np = { skipped: 'ключ НП не введено — дати створення ТТН і статуси підтягнуться пізніше самі, коли введете ключ (меню 🤖 Бот → Ввести ключ Нової пошти)' };
  if (bot_prop(BOT_PROP.NP_KEY)) {
    np = bot_npUpdate({ maxTtn: 3000 });
  }
  var rep = {
    rows: rows.length, cost: cost, payments: data.payments.length, paid: paid, debt: bot_round2(cost - paid), summary: fromSummary,
    propagated: prop.propagated, paidRows: rows.filter(function (r) { return r.paid === 'Оплачено'; }).length,
    unrecognized: unrecognized, np: np
  };
  bot_log('ІНФО', 'імпорт', rep.rows + ' рядків · собівартість ' + rep.cost + ' · оплат ' + rep.paid);
  return rep;
}

function bot_importReportText(rep, forTelegram) {
  var L = [];
  L.push((forTelegram ? '📥 <b>Імпорт завершено</b>' : 'Імпорт завершено'));
  L.push('Рядків замовлень: ' + rep.rows);
  L.push('Собівартість: ' + bot_fmtMoney(rep.cost) + (rep.summary ? ' (у «Підсумках»: ' + bot_fmtMoney(rep.summary.cost) + ')' : ''));
  L.push('Оплат: ' + rep.payments + ' на ' + bot_fmtMoney(rep.paid) + (rep.summary ? ' (у «Підсумках»: ' + bot_fmtMoney(rep.summary.paid) + ')' : ''));
  L.push('Борг: ' + bot_fmtMoney(rep.debt) + (rep.summary ? ' (у «Підсумках»: ' + bot_fmtMoney(rep.summary.debt) + ')' : ''));
  L.push('Рядків «Оплачено»: ' + rep.paidRows + ' (з них дооплачено за правилом «усі рядки ТТН»: ' + rep.propagated + ')');
  if (rep.np && rep.np.skipped) L.push('Нова пошта: ' + rep.np.skipped);
  else if (rep.np && rep.np.error) L.push('Нова пошта: помилка — ' + rep.np.error);
  else if (rep.np) L.push('Нова пошта: перевірено ТТН ' + rep.np.checked + ', оновлено рядків ' + rep.np.updated);
  L.push(rep.unrecognized.length ? 'Не вдалося розпізнати рядків: ' + rep.unrecognized.length : 'Усі рядки розпізнано.');
  if (rep.unrecognized.length) L = L.concat(rep.unrecognized.slice(0, 20));
  if (rep.unrecognized.length > 20) L.push('… і ще ' + (rep.unrecognized.length - 20));
  if (forTelegram) return L.map(function (l, i) { return i === 0 ? l : bot_esc(l); }).join('\n');
  return L.join('\n');
}


// ======================= TgImport.gs =======================
/**
 * TgImport.gs — разовий імпорт замовлень з експорту історії чату Telegram Desktop (messages.html).
 * Потрібно, бо боти не бачать старих повідомлень групи. Розбір — чиста логіка (перевіряється в Node),
 * далі — читання файлу з Google Диска і запис у «Замовлення».
 *
 * Ті самі правила, що й для живих замовлень: bot_parseOrderMessage (кілька замовлень в одному
 * повідомленні, спільна ТТН, номер без крапки, «ТЕРМІНОВО»). Ключ msg_id рядка = id повідомлення Telegram
 * (для 2-го і далі замовлень у повідомленні — «id.1», «id.2»), тож згодом редагування в групі оновлюють той самий рядок.
 */

var BOT_UA_MONTHS_GEN_ = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

function bot_decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCodePoint(parseInt(d, 10)); })
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** «3 жовтня 2026, 13:19:40» → Date (за Києвом). */
function bot_parseUaDate(str) {
  var m = String(str || '').match(/(\d{1,2})\s+([а-яіїєґ]+)\s+(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?)?/i);
  if (!m) return null;
  var mon = BOT_UA_MONTHS_GEN_.indexOf(m[2].toLowerCase());
  if (mon < 0) return null;
  var base = bot_makeDate(+m[3], mon + 1, +m[1]);
  return new Date(base.getTime() + (((+m[4] || 0) * 60 + (+m[5] || 0)) * 60 + (+m[6] || 0)) * 1000);
}

function bot_htmlToText_(h) {
  return bot_decodeEntities(String(h).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
}

/** messages.html → [{id, service, text, date, replyTo, from, edited}] */
function bot_parseTelegramExport(html) {
  var blocks = String(html).split('<div class="message ').slice(1);
  var out = [], lastFrom = '';
  blocks.forEach(function (b) {
    var idm = b.match(/id="message(-?\d+)"/);
    if (!idm) return;
    var isService = /^service/.test(b);
    var msg = { id: parseInt(idm[1], 10), service: '', text: '', date: null, replyTo: null, from: '', edited: false };
    if (isService) {
      var sm = b.match(/<div class="body details">\s*([\s\S]*?)\s*<\/div>/);
      msg.service = sm ? bot_htmlToText_(sm[1]).replace(/\s+/g, ' ').trim() : '';
    } else {
      var tm = b.match(/<div class="text">\s*([\s\S]*?)\s*<\/div>/);
      msg.text = tm ? bot_htmlToText_(tm[1]) : '';
      var fm = b.match(/<div class="from_name">\s*([\s\S]*?)\s*<\/div>/);
      msg.from = fm ? bot_htmlToText_(fm[1]).trim() : lastFrom;       // «joined»-повідомлення (підряд від того ж автора) не мають імені — беремо попереднє
      if (fm) lastFrom = msg.from;
      var rm = b.match(/GoToMessage\((\d+)\)/);
      msg.replyTo = rm ? parseInt(rm[1], 10) : null;
      var dm = b.match(/class="pull_right date details" title="([^"]+)"([^>]*)>([^<]*)/);
      if (dm) { msg.date = bot_parseUaDate(dm[1]); msg.edited = /edited|змінено|ред/i.test(dm[3]); }
    }
    out.push(msg);
  });
  return out;
}

/**
 * Бере з експорту замовлення, яких ще немає в таблиці.
 * @param opts {afterNo — пропускаємо № ≤ цього, existingNos — масив № що вже є, priceRows, threadName}
 */
function bot_planTelegramImport(messages, opts) {
  opts = opts || {};
  var threadName = opts.threadName || 'Замовлення на клієнта';
  var existing = {}; (opts.existingNos || []).forEach(function (n) { existing[n] = true; });
  var afterNo = opts.afterNo || 0;
  var byId = {}; messages.forEach(function (m) { byId[m.id] = m; });
  var rootId = null;
  messages.forEach(function (m) {
    if (rootId === null && m.service && /Створено гілку/.test(m.service) && m.service.indexOf(threadName) >= 0) rootId = m.id;
  });
  function inThread(m) {
    if (rootId === null) return true;
    var cur = m, hops = 0;
    while (cur && hops++ < 30) {
      if (cur.replyTo === rootId) return true;
      cur = cur.replyTo !== null ? byId[cur.replyTo] : null;
    }
    return false;
  }

  var plan = { rootFound: rootId !== null, rows: [], skippedOld: 0, skippedExisting: 0, repeats: 0, sharedTtn: 0, problems: [], gaps: [], firstNo: null, lastNo: null };
  var seen = {};
  messages.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    if (m.service || !m.text || !inThread(m)) return;
    var list = bot_parseOrderMessage(m.text);
    list.forEach(function (p, idx) {
      if (seen[p.no]) { plan.repeats++; return; }               // повторна публікація (напр. «ТЕРМІНОВО») — лишаємо першу
      seen[p.no] = true;
      if (p.no <= afterNo) { plan.skippedOld++; return; }
      if (existing[p.no]) { plan.skippedExisting++; return; }
      var d = m.date || new Date();
      var kp = bot_kyivParts(d);
      var orderDate = bot_makeDate(kp.y, kp.m, kp.d);
      var b = bot_buildOrderFields_(p, orderDate, opts.priceRows || [], 'В роботі');
      var row = b.fields;
      row.stage = p.ttn ? '' : 'Немає ТТН';
      row.status = 'В роботі'; row.paid = 'Не оплачено'; row.msgId = bot_msgKey(m.id, idx);
      row.note = b.issues.length ? BOT_NOTE_PREFIX_ + b.issues.join(', ') : '';
      if (p.ttnShared) plan.sharedTtn++;
      plan.rows.push({ obj: row, yellow: b.yellow, issues: b.issues, no: p.no, tgId: m.id, hasTtn: !!p.ttn });
      if (b.issues.length) plan.problems.push('№' + p.no + ': ' + b.issues.join(', '));
    });
  });
  var nos = plan.rows.map(function (r) { return r.no; });
  if (nos.length) {
    plan.firstNo = Math.min.apply(null, nos); plan.lastNo = Math.max.apply(null, nos);
    var have = {}; nos.forEach(function (n) { have[n] = true; });
    for (var n = Math.max(plan.firstNo, afterNo + 1); n <= plan.lastNo; n++) if (!have[n] && !existing[n] && !seen[n]) plan.gaps.push(n);
  }
  return plan;
}

function bot_tgImportReportText(plan, forTelegram, done) {
  var L = [];
  L.push(done ? '📥 Імпорт замовлень з Telegram завершено' : 'Знайдено в експорті');
  L.push((done ? 'Додано' : 'Буде додано') + ' замовлень: ' + plan.rows.length + (plan.rows.length ? ' (№' + plan.firstNo + '–№' + plan.lastNo + ')' : ''));
  if (plan.sharedTtn) L.push('З них зі спільною ТТН на кілька замовлень: ' + plan.sharedTtn);
  L.push('Пропущено: уже в таблиці ' + plan.skippedExisting + ', старіші за останній № ' + plan.skippedOld + ', повторні публікації ' + plan.repeats);
  if (!plan.rootFound) L.push('⚠️ Не знайшов у файлі гілку «Замовлення на клієнта» — взяв усі повідомлення.');
  if (plan.gaps.length) L.push('Номери, яких немає в чаті: ' + plan.gaps.join(', '));
  L.push(plan.problems.length ? 'Рядки з проблемами (' + plan.problems.length + ', клітинки жовті, див. «Примітка»):' : 'Проблем у рядках немає.');
  plan.problems.slice(0, 25).forEach(function (p) { L.push('• ' + p); });
  if (plan.problems.length > 25) L.push('… і ще ' + (plan.problems.length - 25));
  return forTelegram ? L.map(function (l) { return bot_esc(l); }).join('\n') : L.join('\n');
}

// =====================================================================
// Google: читання файлів з Диска і запис
// =====================================================================

function bot_driveIdFromUrl(url) {
  var m = String(url).match(/\/d\/([-\w]{15,})/) || String(url).match(/[?&]id=([-\w]{15,})/) || String(url).match(/^([-\w]{25,})$/);
  return m ? m[1] : '';
}

/** urls — рядок з одним або кількома посиланнями (messages.html, messages2.html …). */
/** startAfter — імпортувати замовлення з № більшим за це (за замовчуванням — останній № у таблиці). */
function bot_tgImportPlan(urls, startAfter) {
  var ids = String(urls).split(/[\s,;]+/).filter(Boolean).map(bot_driveIdFromUrl);
  if (!ids.length || ids.some(function (x) { return !x; })) throw new Error('Не схоже на посилання на файл Google Диска. Завантажте messages.html на Диск → ПКМ → «Надати доступ / Копіювати посилання».');
  var messages = [];
  ids.forEach(function (id) {
    var html = DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8');
    if (html.indexOf('class="message ') < 0) throw new Error('У файлі немає повідомлень Telegram. Потрібен messages.html з експорту історії чату (формат HTML).');
    messages = messages.concat(bot_parseTelegramExport(html));
  });
  var orders = bot_readOrders();
  var nos = orders.map(function (o) { return o.no; }).filter(function (n) { return n !== ''; });
  var maxNo = nos.reduce(function (a, n) { return Math.max(a, Number(n) || 0); }, 0);
  var after = (startAfter === undefined || startAfter === null || startAfter === '' || isNaN(Number(startAfter))) ? maxNo : Number(startAfter);
  var plan = bot_planTelegramImport(messages, { afterNo: after, existingNos: nos, priceRows: bot_readPriceRows() });
  plan.afterNo = after; plan.maxNoInTable = maxNo;
  return plan;
}

function bot_tgImportApply(plan) {
  var rowNums = bot_withLock(function () {
    var nos = {}; bot_readOrders().forEach(function (o) { nos[o.no] = true; });       // перевірка ще раз під блокуванням
    var items = plan.rows.filter(function (r) { return !nos[r.no]; });
    var rows = bot_appendOrderRows(items);
    bot_log('ІНФО', 'імпорт з Telegram', 'додано ' + items.length + ' замовлень');
    return rows;
  });
  if (rowNums.length && bot_prop(BOT_PROP.NP_KEY)) {
    try { bot_npUpdate({ rows: rowNums, maxTtn: 3000 }); } catch (e) { bot_log('ПОМИЛКА', 'НП після імпорту з Telegram', e.message); }
  }
  return { added: rowNums.length, rows: rowNums };
}

// =====================================================================
// «Виварене»: виправити тип і собівартість уже доданих замовлень за експортом Telegram
// =====================================================================

/**
 * Чиста логіка. Для замовлень, де в тексті є «виварене», порівнює тип/собівартість у таблиці з тим, що має бути.
 * Уже ОПЛАЧЕНІ рядки не змінює — лише повідомляє. @return {changes, paidSkipped, missing, unchanged, delta}
 */
function bot_planWashedFix(messages, orders, priceRows) {
  var byNo = {}; orders.forEach(function (o) { if (o.no !== '' && !byNo[o.no]) byNo[o.no] = o; });
  var plan = { changes: [], paidSkipped: [], missing: [], unchanged: 0, delta: 0, checked: 0 };
  var seen = {};
  messages.slice().sort(function (a, b) { return a.id - b.id; }).forEach(function (m) {
    if (m.service || !m.text || !/виварен/i.test(m.text)) return;
    bot_parseOrderMessage(m.text).forEach(function (p) {
      if (seen[p.no]) return; seen[p.no] = true;
      if (BOT_WASHED_TYPES.indexOf(p.type) < 0) return;
      plan.checked++;
      var row = byNo[p.no];
      if (!row) { plan.missing.push(p.no); return; }
      if (row.status !== 'В роботі') return;
      var b = bot_buildOrderFields_(p, row.date || new Date(), priceRows, 'В роботі');
      var newCost = Number(b.fields.cost) || 0;
      if (row.type === p.type && row.cost === newCost) { plan.unchanged++; return; }
      var ch = { row: row._row, no: p.no, fromType: row.type, toType: p.type, oldCost: row.cost, newCost: newCost,
        fields: { type: p.type, color: p.color, colorCode: p.colorCode || '', cost: newCost }, issues: b.issues, yellow: b.yellow, oldNote: row.note };
      if (row.paid === 'Оплачено') { plan.paidSkipped.push(ch); return; }
      plan.changes.push(ch); plan.delta += newCost - row.cost;
    });
  });
  return plan;
}

function bot_washedFixApply(plan) {
  bot_withLock(function () {
    bot_patchOrders(plan.changes.map(function (c) {
      var f = {}; Object.keys(c.fields).forEach(function (k) { f[k] = c.fields[k]; });
      f.note = bot_mergeNote_(c.oldNote, c.issues);
      return { row: c.row, fields: f };
    }));
    var sh = bot_ordersSheet(), map = bot_ordersMap(sh);
    plan.changes.forEach(function (c) { bot_clearYellow(c.row, ['type', 'color', 'size', 'cost']); bot_markYellow_(sh, map, c.row, c.yellow); });
    bot_log('ІНФО', 'виварене', 'виправлено ' + plan.changes.length + ' рядків, різниця ' + plan.delta + ' грн');
  });
}

function bot_washedFixText(plan, done) {
  var L = [done ? '✅ «Виварене» виправлено' : 'Знайдено в експорті'];
  L.push('Замовлень з «виварене»: ' + plan.checked + '. ' + (done ? 'Виправлено' : 'Буде виправлено') + ' рядків: ' + plan.changes.length + ', уже правильних: ' + plan.unchanged + '.');
  L.push('Зміна собівартості: ' + (plan.delta >= 0 ? '+' : '') + bot_fmtNum(plan.delta) + ' грн.');
  if (plan.paidSkipped.length) L.push('⚠️ Уже ОПЛАЧЕНІ (не змінюю, перевірте вручну): ' + plan.paidSkipped.map(function (c) { return '№' + c.no + ' (' + bot_fmtNum(c.oldCost) + '→' + bot_fmtNum(c.newCost) + ')'; }).join(', '));
  if (plan.missing.length) L.push('Немає в таблиці (додайте імпортом): ' + plan.missing.join(', '));
  plan.changes.slice(0, 12).forEach(function (c) { L.push('• №' + c.no + ': ' + (c.fromType || '—') + ' → ' + c.toType + ', ' + bot_fmtNum(c.oldCost) + ' → ' + bot_fmtNum(c.newCost) + ' грн'); });
  if (plan.changes.length > 12) L.push('… і ще ' + (plan.changes.length - 12));
  return L.join('\n');
}

function bot_tgReadMessages_(urls) {
  var ids = String(urls).split(/[\s,;]+/).filter(Boolean).map(bot_driveIdFromUrl);
  if (!ids.length || ids.some(function (x) { return !x; })) throw new Error('Не схоже на посилання на файл Google Диска.');
  var messages = [];
  ids.forEach(function (id) {
    var html = DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8');
    if (html.indexOf('class="message ') < 0) throw new Error('У файлі немає повідомлень Telegram (потрібен messages.html).');
    messages = messages.concat(bot_parseTelegramExport(html));
  });
  return messages;
}

function bot_menuWashedFix() {
  var ui = bot_ui_();
  var r = ui.prompt('«Виварене»: виправити тип і собівартість', 'Вставте посилання на messages.html з вашого Google Диска (той самий файл, що й для імпорту). Бот знайде замовлення з «виварене» і виправить їм тип та собівартість за «Прайсом» (1490 грн). Оплачені рядки не чіпаю.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  try {
    var plan = bot_planWashedFix(bot_tgReadMessages_(r.getResponseText()), bot_readOrders(), bot_readPriceRows());
    if (!plan.changes.length) { bot_alert_('Нічого виправляти', bot_washedFixText(plan, false)); return; }
    var go = ui.alert('Виправити?', bot_washedFixText(plan, false) + '\n\nВиправити ці рядки?', ui.ButtonSet.YES_NO);
    if (go !== ui.Button.YES) return;
    bot_washedFixApply(plan);
    bot_alert_('Готово', bot_washedFixText(plan, true));
    try { bot_buildSummary(); } catch (e) { bot_log('УВАГА', 'підсумки після «виварене»', e.message); }
  } catch (e) { bot_alert_('Не вдалося', e.message); }
}


// ======================= Menu.gs =======================
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
  { command: 'month', description: 'Місячний звіт' },
  { command: 'desc', description: 'Опис ТТН: /desc ТТН' },
  { command: 'setdesc', description: 'Свій опис: /setdesc ТТН текст' },
  { command: 'registry', description: 'Реєстр зараз / preview' },
  { command: 'backfill', description: 'Описи для замовлень з таблиці' },
  { command: 'addpay', description: 'Додати оплату: /addpay сума дата' },
  { command: 'allocate', description: 'Які ТТН покривають оплати' },
  { command: 'live', description: 'Бойовий режим запису в НП' },
  { command: 'retry', description: 'Повторити ТТН з помилкою НП' },
  { command: 'preview', description: 'Режим перевірки (нічого в НП)' }
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🤖 Бот')
    .addItem('Перше налаштування', 'bot_menuSetup')
    .addItem('Ввести токен Telegram', 'bot_menuToken')
    .addItem('Ввести ключ Нової пошти', 'bot_menuNpKey')
    .addSeparator()
    .addItem('Імпорт з попередньої версії', 'bot_menuImport')
    .addItem('Імпорт замовлень з експорту Telegram', 'bot_menuTgImport')
    .addItem('«Виварене»: виправити тип і собівартість', 'bot_menuWashedFix')
    .addItem('Імпорт оплат з експорту Telegram («Отправка отчет»)', 'bot_menuPayImport')
    .addSeparator()
    .addItem('Режим запису в НП: показати / бойовий / перевірка', 'bot_menuMode')
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

// ---------- імпорт замовлень з експорту Telegram ----------

function bot_menuTgImport() {
  var ui = bot_ui_();
  var r = ui.prompt('Імпорт замовлень з експорту Telegram',
    'Вставте посилання на файл messages.html (він має лежати на вашому Google Диску). Якщо файлів кілька (messages.html, messages2.html…) — вставте всі посилання через пробіл.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  try {
    var urls = r.getResponseText();
    var last = bot_readOrders().reduce(function (a, o) { return Math.max(a, Number(o.no) || 0); }, 0);
    var r2 = ui.prompt('З якого номера?', 'Імпортувати замовлення з номером БІЛЬШИМ за… Залиште порожнім — після останнього в таблиці (зараз №' + last + ').', ui.ButtonSet.OK_CANCEL);
    if (r2.getSelectedButton() !== ui.Button.OK) return;
    var startAfter = r2.getResponseText().trim();
    if (startAfter && isNaN(Number(startAfter))) { bot_alert_('Не число', 'Потрібен номер замовлення, наприклад 1482.'); return; }
    bot_ss().toast('Читаю файл…', '🤖 Бот', 60);
    var plan = bot_tgImportPlan(urls, startAfter);
    if (!plan.rows.length) { bot_alert_('Нових замовлень немає', bot_tgImportReportText(plan, false, false)); return; }
    var go = ui.alert('Додати замовлення?', 'Останній номер у таблиці: ' + plan.afterNo + '.\n\n' + bot_tgImportReportText(plan, false, false) + '\n\nДодати їх у таблицю?', ui.ButtonSet.YES_NO);
    if (go !== ui.Button.YES) return;
    bot_ss().toast('Додаю замовлення…', '🤖 Бот', 60);
    bot_tgImportApply(plan);
    var text = bot_tgImportReportText(plan, false, true);
    bot_alert_('Готово', text);
    if (bot_ownerIds().length && bot_prop(BOT_PROP.TG_TOKEN)) bot_sendToOwners(bot_tgImportReportText(plan, true, true));
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
  try {
    var tz = bot_ss().getSpreadsheetTimeZone();
    add(/^Europe\/(Kyiv|Kiev)$/.test(tz), /^Europe\/(Kyiv|Kiev)$/.test(tz) ? 'Часовий пояс таблиці: Київ' : 'Часовий пояс таблиці: ' + tz + ' (має бути Київ: Файл → Налаштування → Часовий пояс)');
  } catch (e) { add(false, 'Не вдалося перевірити часовий пояс: ' + e.message); }
  var missing = Object.keys(BOT_SHEETS).filter(function (k) { return !bot_ss().getSheetByName(BOT_SHEETS[k]); });
  add(!missing.length, missing.length ? 'Немає аркушів: ' + missing.map(function (k) { return BOT_SHEETS[k]; }).join(', ') + ' — «Перше налаштування»' : 'Усі аркуші на місці');
  var st = bot_selfTest();
  add(st.failed === 0, 'Самоперевірка розбору замовлень: ' + st.passed + '/' + st.total);
  return out;
}

function bot_menuMode() {
  var ui = bot_ui_();
  var live = bot_npLive();
  var r = ui.alert('Режим запису в Нову пошту',
    'Зараз: ' + (live ? 'БОЙОВИЙ (опис пишеться в НП, реєстр створюється)' : 'ПЕРЕВІРКА (в НП нічого не пишеться)') + '.\n\n' +
    (live ? 'Повернутись у режим перевірки?' : 'Перейти в бойовий режим? Це дозволено лише після успішної перевірки на тестовій ТТН (команда /nptest у боті).'),
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  if (live) { bot_setSetting('NP_MODE', 'перевірка'); bot_alert_('Готово', 'Режим перевірки.'); return; }
  if (bot_prop(BOT_PROP.NP_TEST_OK) !== '1') { bot_alert_('Ще рано', 'Спершу перевірка на тестовій ТТН: у боті напишіть /nptest ТТН текст і підтвердіть кнопкою.'); return; }
  bot_cmdLive(bot_ownerIds()[0]);
  bot_alert_('Готово', 'Бойовий режим увімкнено.');
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


// ======================= SelfTest.gs =======================
/**
 * SelfTest.gs — bot_selfTest(): перевірка розбору підписів замовлень і нормалізації на прикладах з ТЗ.
 * Запуск: у редакторі Apps Script вибрати bot_selfTest → «Виконати», або «Перевірити, що все працює» в меню.
 */

function bot_selfTest() {
  var cases = [];
  function t(name, fn) { cases.push({ name: name, fn: fn }); }
  function eq(a, b, what) { if (a !== b) throw new Error((what || '') + ': очікував «' + b + '», отримав «' + a + '»'); }

  t('підпис 1538 (розділ 2.1)', function () {
    var p = bot_parseOrderCaption('1538. Принт Ferar1\nХуді чорне без флісу\nL\n\nПринт позаду\n\n20451553931463');
    eq(p.ok, true, 'ok'); eq(p.no, 1538, '№'); eq(p.print, 'Принт Ferar1', 'принт'); eq(p.type, 'Худі не утеплене', 'тип');
    eq(p.color, 'Чорний', 'колір'); eq(p.size, 'L', 'розмір'); eq(p.placement, 'Позаду', 'розміщення'); eq(p.ttn, '20451553931463', 'ТТН');
    eq(p.issues.length, 0, 'помилок');
  });
  t('підпис 1539', function () {
    var p = bot_parseOrderCaption('1539. Принт Zaporizhzhia\nФутболка чорна\nS\n\nПринт позаду\n\n20451553934449');
    eq(p.type, 'Футболка', 'тип'); eq(p.size, 'S', 'розмір'); eq(p.issues.length, 0, 'помилок');
  });
  t('не замовлення ігнорується', function () {
    eq(bot_parseOrderCaption('++++++').ok, false, '++++++'); eq(bot_parseOrderCaption('FERAR1 - WHITE.png').ok, false, 'файл');
  });
  t('немає розміру → одна помилка', function () {
    var p = bot_parseOrderCaption('1541. Принт X\nФутболка чорна\nПринт позаду\n20451553934449');
    eq(p.issues.length, 1, 'кількість'); eq(p.issues[0].field, 'size', 'поле');
  });
  t('худі без уточнення → тип порожній', function () {
    var p = bot_parseOrderCaption('1542. Принт X\nХуді чорне\nL\nПринт позаду\n20451553934449');
    eq(p.type, '', 'тип'); eq(p.typeAmbiguous, true, 'ambiguous');
  });
  t('ДВА → 2 принти', function () { eq(bot_parseOrderCaption('1543. Принт нижче ДВА\nФутболка біла\nM\n20451553934449').prints, 2, 'принтів'); });
  t('кириличні розміри', function () { eq(bot_normSize('М'), 'M', 'М'); eq(bot_normSize('ХL'), 'XL', 'ХL'); eq(bot_normSize('2XL'), 'XXL', '2XL'); });
  t('ТТН: число / текст / .0', function () {
    eq(bot_normTtn(20451553931463), '20451553931463', 'число'); eq(bot_normTtn('20451553931463.0'), '20451553931463', '.0'); eq(bot_normTtn(" 2045 1553 931463'"), '20451553931463', 'пробіли');
  });
  t('розміщення', function () { eq(bot_normPlacement('Перед + Зад'), 'Спереду і позаду', 'перед+зад'); eq(bot_normPlacement('Принти як на візуалі'), 'Як на візуалі', 'візуал'); });
  t('дати Києва', function () { eq(bot_fmtDate(new Date('2026-10-07T06:00:00Z')), '07.10.2026', 'формат'); eq(bot_kyivParts(new Date('2026-10-07T06:00:00Z')).h, 9, 'година'); });
  t('категорії звірки', function () {
    var orders = [{ _row: 2, no: 1, print: 'A', type: 'Футболка', ttn: '11111111111111', cost: 420, status: 'В роботі', paid: 'Не оплачено' }];
    var d = bot_reconcileCompute([{ ttn: '11111111111111', price: 420 }, { ttn: '22222222222222', price: 420 }, { ttn: '11111111111111', price: 420 }], orders, { priceRows: [], today: new Date() });
    eq(d[0].category, 'OK', 'OK'); eq(d[1].category, 'MISSING', 'MISSING'); eq(d[2].category, 'DUP', 'DUP');
  });

  var passed = 0, failed = 0, lines = [];
  cases.forEach(function (c) {
    try { c.fn(); passed++; lines.push('✅ ' + c.name); }
    catch (e) { failed++; lines.push('❌ ' + c.name + ' — ' + e.message); }
  });
  Logger.log(lines.join('\n') + '\n\nУсього: ' + cases.length + ', успішно: ' + passed + ', помилок: ' + failed);
  return { total: cases.length, passed: passed, failed: failed, lines: lines };
}

