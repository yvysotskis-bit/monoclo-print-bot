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

var BOT_PRICE_COLS = ['Тип речі', 'Собівартість, грн', 'Діє з', 'Примітка'];

// ---- Довідники (значення списків) ----
var BOT_TYPES = ['Футболка', 'Худі фліс', 'Худі не утеплене'];
var BOT_COLORS = ['Чорний', 'Білий', 'Сірий'];
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
  ['Худі не утеплене', 740, '01.01.2026', '']
];

// ---- Налаштування (аркуш «Налаштування»): [параметр, значення за замовчуванням, пояснення] ----
var BOT_DEFAULT_SETTINGS = [
  ['OWNER_IDS', '', 'ID власників у Telegram (через кому). Заповнюється, коли власник напише боту /start'],
  ['GROUP_CHAT_ID', '', 'ID групи з виробництвом (ставиться командою /bind)'],
  ['ORDERS_THREAD_ID', '', 'ID гілки «Замовлення на клієнта» (/bind orders)'],
  ['REPORT_THREAD_ID', '', 'ID гілки «Реєстри» (/bind report)'],
  ['REPORT_TIME', '09:00', 'Час ранкового звіту (за Києвом)'],
  ['REPORT_DAYS', 'Пн,Вт,Ср,Чт,Пт,Сб', 'Дні тижня ранкового звіту'],
  ['REPORT_WARN_DAYS', '3', 'Скільки днів ТТН «Не передана», щоб поставити ❗️'],
  ['STORAGE_WARN_DAYS', '4', 'Скільки днів посилка чекає на відділенні, щоб потрапити у звіт власнику'],
  ['NP_SENDER_PHONE', '', 'Телефон відправника (необов\'язково): тоді НП повертає ім\'я і телефон отримувача'],
  ['MONTHLY_REPORT', 'так', 'Місячний звіт 1-го числа: так / ні'],
  ['REACTIONS', 'так', 'Ставити реакцію 👌 на прийняте замовлення: так / ні'],
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
  IMPORT_NP_QUEUE: 'IMPORT_NP_QUEUE'
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
    return Math.round(v).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 0 });
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

function bot_normColor(text) {
  var t = bot_trim(text).toLowerCase();
  if (/чорн/.test(t)) return 'Чорний';
  if (/біл/.test(t)) return 'Білий';
  if (/сір|графіт/.test(t)) return 'Сірий';
  return '';
}

/**
 * Тип і колір з рядка на кшталт «Худі чорне без флісу» / «Футболка біла».
 * Повертає {type, color, ambiguous}. ambiguous=true — це худі без уточнення (є/нема фліс).
 */
function bot_parseTypeColor(text) {
  var t = bot_trim(text).toLowerCase();
  var res = { type: '', color: bot_normColor(t), ambiguous: false, found: false };
  if (/футболк/.test(t)) { res.type = 'Футболка'; res.found = true; return res; }
  if (/худі|худи/.test(t)) {
    res.found = true;
    if (/без\s+фліс|не\s*утепл|без\s+утепл/.test(t)) res.type = 'Худі не утеплене';
    else if (/з\s+фліс|флісом|утепл/.test(t)) res.type = 'Худі фліс';
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

/**
 * @return {ok, no, print, prints, type, typeAmbiguous, color, size, placement, ttn, issues:[{field,text}]}
 *   ok=false — це не замовлення (мовчки ігноруємо).
 */
function bot_parseOrderCaption(text) {
  var res = {
    ok: false, no: null, print: '', prints: 1, type: '', typeAmbiguous: false, color: '',
    size: '', placement: '', ttn: '', issues: []
  };
  var lines = String(text || '').split(/\r?\n/).map(bot_trim).filter(function (l) { return l !== ''; });
  if (!lines.length) return res;
  var m = lines[0].match(/^(\d{1,6})[.)]\s*(.+)$/);
  if (!m) return res;
  res.ok = true;
  res.no = parseInt(m[1], 10);
  res.print = m[2].trim();
  res.prints = bot_countPrints(res.print);

  var badTtn = '';
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var digits = line.replace(/[\s ]/g, '').replace(/^(ттн|тт|№)[:\-]?/i, '');

    if (/^\d{8,}$/.test(digits)) {                      // рядок із самих цифр — це ТТН
      if (bot_isTtn(digits)) { if (!res.ttn) res.ttn = digits; } else { badTtn = digits; }
      continue;
    }
    var sz = bot_normSize(line);
    if (sz && !res.size && line.length <= 14) { res.size = sz; continue; }

    var tc = bot_parseTypeColor(line);
    if (tc.found && !res.type && !res.typeAmbiguous) {
      if (tc.ambiguous) res.typeAmbiguous = true; else res.type = tc.type;
      if (tc.color) res.color = tc.color;
      continue;
    }
    var pl = bot_normPlacement(line);
    if (pl && !res.placement && /принт|спереду|позаду|візуал|перед|зад/i.test(line)) { res.placement = pl; continue; }
    if (!res.color) { var c = bot_normColor(line); if (c && line.length <= 20) res.color = c; }
  }

  if (!res.type) {
    res.issues.push({ field: 'type', text: res.typeAmbiguous ? 'Худі: не вказано «з флісом» чи «без флісу»' : 'не вказано вид речі (футболка / худі)' });
  }
  if (!res.color) res.issues.push({ field: 'color', text: 'не вказано колір' });
  if (!res.size) res.issues.push({ field: 'size', text: 'не вказано розмір' });
  if (!res.ttn) {
    res.issues.push({ field: 'ttn', text: badTtn ? 'ТТН «' + badTtn + '» — не 14 цифр' : 'немає ТТН' });
  }
  return res;
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
  sum: ['ціна', 'цена', 'сума', 'сумма'],
  status: ['статус'],
  note: ['примітка', 'примечан', 'коментар'],
  chatNo: ['№ з чату', '№ чату', 'номер замовлення']
};

function bot_findHeader_(headers, aliases) {
  for (var a = 0; a < aliases.length; a++) {
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].indexOf(aliases[a]) >= 0) return i;
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
  return { rows: rows, skipped: skipped, headers: headersRaw };
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

function bot_log(level, event, details) {
  try {
    var sh = bot_ss().getSheetByName(BOT_SHEETS.log);
    if (!sh) return;
    sh.appendRow([new Date(), level, event, String(details === undefined ? '' : details).slice(0, 2000)]);
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
  return bot_headerMap(sheet || bot_ordersSheet(), BOT_ORDER_COLS, ['arrived']);
}

function bot_orderFromRow_(r, map, rowNum) {
  function g(k) { return map[k] ? r[map[k] - 1] : ''; }
  var no = g('no');
  return {
    _row: rowNum,
    no: (no === '' || no === null) ? '' : (isNaN(Number(no)) ? bot_cellStr_(no) : Number(no)),
    date: bot_cellDate_(g('date')), print: bot_cellStr_(g('print')), type: bot_cellStr_(g('type')),
    color: bot_cellStr_(g('color')), size: bot_cellStr_(g('size')), placement: bot_cellStr_(g('placement')),
    prints: Number(g('prints')) || 1, ttn: bot_normTtn(g('ttn')), ttnDate: bot_cellDate_(g('ttnDate')),
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

/** Остання заповнена в колонці A (№ замовлення) + 1. */
function bot_nextOrderRow_(sh, map) {
  var maxRows = sh.getMaxRows();
  if (maxRows < 2) return 2;
  var col = sh.getRange(1, map.no, maxRows, 1).getValues();
  var last = 1;
  for (var i = col.length - 1; i >= 1; i--) { if (col[i][0] !== '' && col[i][0] !== null) { last = i + 1; break; } }
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

function bot_markYellow_(sh, map, rowNum, keys) {
  keys.forEach(function (k) { if (map[k]) sh.getRange(rowNum, map[k]).setBackground(BOT_COLOR_YELLOW); });
}

/**
 * Пакетна зміна полів у рядках: patches = [{row, fields:{key:value}}].
 * Для кожної колонки — одне читання і один setValues.
 */
function bot_patchOrders(patches) {
  if (!patches.length) return;
  bot_withLock(function () {
    var sh = bot_ordersSheet();
    var map = bot_ordersMap(sh);
    var byKey = {};
    patches.forEach(function (p) {
      Object.keys(p.fields).forEach(function (k) {
        if (!map[k]) return;
        (byKey[k] = byKey[k] || []).push({ row: p.row, value: p.fields[k] });
      });
    });
    var last = sh.getLastRow();
    Object.keys(byKey).forEach(function (k) {
      var range = sh.getRange(2, map[k], last - 1, 1);
      var col = range.getValues();
      byKey[k].forEach(function (u) { if (u.row >= 2 && u.row <= last) col[u.row - 2][0] = (u.value === null || u.value === undefined) ? '' : u.value; });
      if (k === 'ttn') range.setNumberFormat('@');
      range.setValues(col);
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

/** Надіслати повідомлення. opts: {thread, keyboard, silent} */
function bot_send(chatId, text, opts) {
  opts = opts || {};
  var p = { chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (opts.thread) p.message_thread_id = Number(opts.thread);
  if (opts.keyboard) p.reply_markup = opts.keyboard;
  if (opts.silent) p.disable_notification = true;
  var r = bot_tgRaw('sendMessage', p);
  if (!r.ok) { bot_log('ПОМИЛКА', 'sendMessage', r.description + ' · chat ' + chatId); }
  return r;
}

function bot_edit(chatId, messageId, text, keyboard) {
  var p = { chat_id: chatId, message_id: messageId, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
  p.reply_markup = keyboard || { inline_keyboard: [] };
  var r = bot_tgRaw('editMessageText', p);
  if (!r.ok && !/not modified/i.test(r.description || '')) bot_log('ПОМИЛКА', 'editMessageText', r.description);
  return r;
}

function bot_answerCb(id, text, alert) {
  bot_tgRaw('answerCallbackQuery', { callback_query_id: id, text: text || '', show_alert: !!alert });
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
  parts.forEach(function (p) { bot_send(chatId, p, opts); });
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
    return (Date.now() - x.t < 3600000) ? x.p : null;
  } catch (e) { return null; }
}

// =====================================================================
// Опитування
// =====================================================================

function bot_threadOf(msg) {
  return (msg.is_topic_message && msg.message_thread_id) ? String(msg.message_thread_id) : '0';
}

/** Тригер «щохвилини». */
function bot_poll() {
  if (bot_prop(BOT_PROP.ENABLED) === '0') return;
  var started = Date.now();
  var lockTs = Number(bot_prop(BOT_PROP.POLL_LOCK_TS) || 0);
  if (lockTs && started - lockTs < 290000) return;           // попередній запуск ще працює
  bot_setProp(BOT_PROP.POLL_LOCK_TS, started);
  try {
    var offset = Number(bot_prop(BOT_PROP.OFFSET) || 0);
    var payload = { timeout: 0, limit: 100, allowed_updates: BOT_ALLOWED_UPDATES };
    if (offset) payload.offset = offset;
    var res = bot_tgRaw('getUpdates', payload);
    if (!res.ok) {
      bot_log('ПОМИЛКА', 'getUpdates', res.description);
    } else {
      res.result.forEach(function (u) {
        if (Date.now() - started > 200000) return;            // решта — у наступному запуску
        try {
          bot_handleUpdate(u);
        } catch (e) {
          bot_log('ПОМИЛКА', 'update ' + u.update_id, e.message + ' | ' + (e.stack || '').split('\n')[1]);
          try { bot_sendToOwners('⚠️ Помилка обробки оновлення: ' + bot_esc(e.message)); } catch (e2) { /* ігноруємо */ }
        }
        bot_setProp(BOT_PROP.OFFSET, u.update_id + 1);
      });
    }
    bot_setProp(BOT_PROP.LAST_POLL_TS, Date.now());
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
      bot_send(chat.id, '👋 Вітаю! Ви — власник бота. Далі:\n1) додайте бота в групу виробництва;\n2) у гілці «Замовлення на клієнта» напишіть <code>/bind orders</code>;\n3) у гілці «Реєстри» — <code>/bind report</code>.\n\n' + bot_helpText());
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
    var groupId = bot_setting('GROUP_CHAT_ID');
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
    default: return bot_send(chatId, 'Не знаю такої команди. /help — що я вмію.');
  }
}

/** /bind orders | /bind report — запам'ятати цю гілку. */
function bot_cmdBind(msg, arg) {
  var what = String(arg || '').trim().toLowerCase();
  var chatId = msg.chat.id, thread = bot_threadOf(msg);
  var opts = thread !== '0' ? { thread: thread } : {};
  if (what !== 'orders' && what !== 'report') {
    var r0 = bot_send(chatId, 'Напишіть <code>/bind orders</code> (гілка замовлень) або <code>/bind report</code> (гілка звіту).', opts);
    if (r0.ok) bot_scheduleDelete(chatId, r0.result.message_id, 15);
    return;
  }
  bot_withLock(function () {
    bot_setSetting('GROUP_CHAT_ID', chatId);
    bot_setSetting(what === 'orders' ? 'ORDERS_THREAD_ID' : 'REPORT_THREAD_ID', thread);
  });
  bot_log('ІНФО', 'bind ' + what, 'chat ' + chatId + ' thread ' + thread);
  var r = bot_send(chatId, '✅ Готово: ' + (what === 'orders' ? 'тут беру замовлення' : 'сюди надсилатиму ранковий звіт') + '.', opts);
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
      case 'prcy': case 'prcn':
        return bot_priceCallback(parts, ctx);
      default:
        bot_answerCb(cb.id, 'Кнопка застаріла');
    }
  } catch (e) {
    bot_log('ПОМИЛКА', 'callback ' + data, e.message);
    bot_answerCb(cb.id, 'Помилка: ' + e.message, true);
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
      prints: p.prints, ttn: p.ttn, cost: cost
    },
    issues: issues, yellow: yellow
  };
}

/** Обробка повідомлення з гілки «Замовлення на клієнта». */
function bot_handleOrderMessage(msg, caption, edited) {
  var p = bot_parseOrderCaption(caption);
  if (!p.ok) return;                                              // не замовлення — мовчки ігноруємо
  var chat = msg.chat, mid = String(msg.message_id), thread = bot_threadOf(msg);
  var link = bot_msgLink(chat, thread, msg.message_id);
  var linkTxt = link ? '\n<a href="' + link + '">Відкрити повідомлення</a>' : '';

  bot_withLock(function () {
    var orders = bot_readOrders();
    var existing = null;
    orders.forEach(function (o) { if (o.msgId === mid) existing = o; });
    var priceRows = bot_readPriceRows();
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
      bot_react(chat.id, msg.message_id, built.issues.length ? '✍' : '👌');
      if (built.issues.length) bot_sendToOwners('✍️ №' + p.no + ' оновлено, але ще не вистачає: ' + bot_esc(built.issues.join(', ')) + '.' + linkTxt);
      return;
    }

    // ---- нове повідомлення ----
    var dup = orders.filter(function (o) { return o.no === p.no; });
    if (dup.length) {
      bot_sendToOwners('⚠️ Дубль: замовлення №' + p.no + ' уже є в таблиці (рядок ' + dup[0]._row + '). Новий рядок не додаю.' + linkTxt);
      return;
    }
    var b = bot_buildOrderFields_(p, orderDate, priceRows, 'В роботі');
    var row = b.fields;
    row.stage = p.ttn ? '' : 'Немає ТТН';
    row.status = 'В роботі'; row.paid = 'Не оплачено'; row.msgId = mid;
    row.note = b.issues.length ? BOT_NOTE_PREFIX_ + b.issues.join(', ') : '';
    var rowNum = bot_appendOrderRow(row, b.yellow);
    if (p.ttn) BOT_NEW_TTN_ROWS_.push(rowNum);
    bot_log('ІНФО', 'замовлення №' + p.no, 'рядок ' + rowNum + (b.issues.length ? ' · ' + b.issues.join(', ') : ''));
    bot_react(chat.id, msg.message_id, b.issues.length ? '✍' : '👌');
    if (b.issues.length) bot_sendToOwners('✍️ Замовлення №' + p.no + ' додано, але: ' + bot_esc(b.issues.join(', ')) + '. Клітинки в таблиці підсвічені жовтим.' + linkTxt);
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
    var text = blob.getDataAsString('UTF-8');
    var delim = (text.split('\n')[0].indexOf(';') >= 0 && text.split('\n')[0].indexOf(',') < 0) ? ';' : ',';
    return Utilities.parseCsv(text, delim);
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
  var rows = bot_detailRows_(id);
  var byTtn = {}; details.forEach(function (d) { byTtn[d.ttn] = d; });
  rows.forEach(function (r) {
    var d = byTtn[r.ttn]; if (!d) return;
    sh.getRange(r._row, map.tableSum).setValue(d.tableSum);
    sh.getRange(r._row, map.diff).setValue(d.diff);
    sh.getRange(r._row, map.category).setValue(BOT_CAT_LABEL[d.category]);
  });
}

// =====================================================================
// Побудова / оновлення зведення з поточного стану таблиці
// =====================================================================

function bot_fileRowsFromJson_(json) {
  return JSON.parse(json).map(function (a) {
    return { ttn: a[0], price: a[1], refusal: !!a[2], chatNo: a[3] || null, status: a[4] || '', note: '' };
  });
}

function bot_fileRowsToJson_(rows) {
  return JSON.stringify(rows.map(function (r) { return [r.ttn, r.price, r.refusal ? 1 : 0, r.chatNo || 0, String(r.status || '').slice(0, 24)]; }));
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
  var hash = bot_hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, blob.getBytes()));

  var created = bot_withLock(function () {
    var now = new Date();
    var recons = bot_reconList();
    var id = bot_nextReconId(recons.map(function (r) { return r.id; }), now);
    var orders = bot_readOrders();
    var details = bot_reconcileCompute(parsed.rows, orders, { priceRows: bot_readPriceRows(), today: now });
    var S = bot_reconSummary(details);

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
    set('fileName', name); set('fileData', bot_fileRowsToJson_(parsed.rows));
    var row = sh.getLastRow() + 1;
    sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy hh:mm');
    sh.getRange(row, map.hash).setNumberFormat('@');
    sh.getRange(row, 1, 1, arr.length).setValues([arr]);
    bot_writeDetails_(id, details);
    bot_log('ІНФО', 'звірка ' + id, name + ' · ТТН ' + S.ttnCount + ' · до оплати ' + S.pay.sum);
    return { id: id, details: details, warning: warning, fileUrl: fileUrl };
  });

  var meta = { id: created.id, fileName: name, warning: created.warning };
  var res = bot_send(chatId, bot_buildReconSummary(meta, created.details), { keyboard: bot_reconKeyboard(meta, created.details) });
  if (res.ok) bot_reconPatch(created.id, { summaryMsg: chatId + ':' + res.result.message_id });
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
    var details = bot_reconDetailsNow_(rec);
    var changed = bot_recheckPayable(details, bot_readOrders());
    var plan = bot_planPayment(details);
    if (changed.length || Math.abs(plan.sum - Number(rec.toPay)) > 0.005) {
      return { stale: true, rec: rec, details: details };
    }
    if (!plan.rows.length) return { error: 'Нічого оплачувати' };
    var today = bot_today();
    var patches = plan.rows.map(function (r) { return { row: r, fields: { paid: 'Оплачено', paidDate: today, recon: rec.id } }; });
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
  var stamp = '✅ <b>Підтверджено ' + bot_fmtDateTime(out.now) + ' · ' + out.plan.rows.length + ' ' + bot_plural(out.plan.rows.length, 'рядок', 'рядки', 'рядків') + ' · ' + bot_fmtMoney(out.plan.sum) + '</b>';
  var ref = bot_refMsg_(out.rec);
  if (ref) bot_edit(ref.chatId, ref.msgId, bot_buildReconSummary(bot_reconMeta_(out.rec), out.details) + '\n\n' + stamp);
  bot_edit(ctx.chatId, ctx.msgId, stamp);
  bot_send(ctx.chatId, 'Додати оплату <b>' + bot_fmtMoney(out.plan.sum) + '</b> у аркуш «Оплати»?',
    { keyboard: { inline_keyboard: [[
      { text: '✅ Так, ' + bot_fmtMoney(out.plan.sum), callback_data: 'opy|' + out.rec.id + '|' + out.plan.sum },
      { text: '✏️ Інша сума', callback_data: 'opc|' + out.rec.id },
      { text: 'Ні, внесу сам', callback_data: 'opn|' + out.rec.id }]] } });
}

// ---------- запис в «Оплати» (6.4) ----------

function bot_addPaymentRow_(reconId, sum) {
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
    var lastNo = 0, lastRow = 1;
    nos.forEach(function (r, i) { var n = Number(r[0]); if (r[0] !== '' && !isNaN(n)) { lastNo = Math.max(lastNo, n); lastRow = i + 2; } });
    var row = lastRow + 1;
    var width = sh.getLastColumn();
    if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 50);
    var arr = []; for (var k = 0; k < width; k++) arr.push('');
    arr[map.no - 1] = lastNo + 1; arr[map.date - 1] = bot_today(); arr[map.sum - 1] = sum; arr[map.recon - 1] = reconId;
    sh.getRange(row, 1, 1, width).setValues([arr]);
    sh.getRange(row, map.date).setNumberFormat('dd.mm.yyyy');
    if (map.accum) sh.getRange(row, map.accum).setFormula('=SUM($' + bot_colLetter(map.sum) + '$2:' + bot_colLetter(map.sum) + row + ')');
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

function bot_paymentCustomSum(msg, awaiting) {
  var sum = bot_toNumber(msg.text);
  if (sum === null || sum <= 0) {
    bot_awaitPut(msg.from.id, awaiting);
    return bot_send(msg.chat.id, 'Не зрозумів суму. Напишіть число, наприклад <code>25000</code>.');
  }
  var rec = bot_reconGet(awaiting.id);
  if (!rec) return bot_send(msg.chat.id, 'Звірку не знайдено.');
  var res = bot_addPaymentRow_(rec.id, sum);
  if (res.duplicate) return bot_send(msg.chat.id, 'ℹ️ Оплату для звірки ' + bot_esc(rec.id) + ' уже додано (рядок ' + res.row + ').');
  bot_send(msg.chat.id, '✅ Оплату <b>' + bot_fmtMoney(sum) + '</b> додано в «Оплати» (№' + res.no + ').' +
    (typeof res.balance === 'number' ? '\n💰 Новий борг: <b>' + bot_fmtMoney(res.balance) + '</b>' : ''));
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

function bot_cmdUndo(chatId, arg) {
  var id = String(arg || '').trim();
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
  item.statusText = status + (scheduled ? ' (очік. доставка: ' + bot_fmtNpDate(scheduled) + ')' : '');
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
  }
  return { fields: f, unknownCode: unknown };
}

// ---------- API ----------

function bot_npCall_(modelName, calledMethod, props) {
  var key = bot_prop(BOT_PROP.NP_KEY);
  if (!key) throw new Error('Не введено ключ API Нової пошти. Меню 🤖 Бот → Ввести ключ Нової пошти.');
  var resp = UrlFetchApp.fetch('https://api.novaposhta.ua/v2.0/json/', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ apiKey: key, modelName: modelName, calledMethod: calledMethod, methodProperties: props })
  });
  var body;
  try { body = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('НП відповіла не JSON (HTTP ' + resp.getResponseCode() + ')'); }
  if (!body.success) throw new Error('НП: ' + ((body.errors || []).join('; ') || 'невідома помилка'));
  return body.data || [];
}

/** ТТН → розібрані дані НП. Пакети по 100. */
function bot_npFetch(ttns, phone) {
  var out = {};
  for (var i = 0; i < ttns.length; i += 100) {
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


// ======================= Reports.gs =======================
/**
 * Reports.gs — планувальник (викликається з щохвилинного bot_poll) і звіти:
 * ранковий про невідправлені ТТН (6а), посилки на відділенні (6а.5), місячний (6б), команди /report і /month.
 */

function bot_parseTimeSetting_(s, defMin) {
  var m = String(s || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : defMin;
}

function bot_reportDays_() {
  var raw = String(bot_setting('REPORT_DAYS', 'Пн,Вт,Ср,Чт,Пт,Сб')).split(/[,\s;]+/).filter(Boolean);
  var idx = [];
  raw.forEach(function (d) {
    var i = BOT_DAYS_UA.indexOf(d.charAt(0).toUpperCase() + d.slice(1, 2).toLowerCase());
    if (i >= 0) idx.push(i);
  });
  return idx;
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

  // 2) регулярне оновлення статусів НП — кожні 30 хв
  if (hasNp && Date.now() - Number(bot_prop(BOT_PROP.LAST_NP_TS) || 0) >= 29 * 60000) {
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

  // 4) ранковий звіт
  if (dayOk && minutes >= reportMin && bot_prop(BOT_PROP.LAST_REPORT_DATE) !== today) {
    var done = bot_sendMorningReport();
    if (done) bot_setProp(BOT_PROP.LAST_REPORT_DATE, today);
    if (done) {
      try { bot_sendStorageReportToOwners_(); } catch (e) { bot_log('ПОМИЛКА', 'звіт про відділення', e.message); }
    }
  }

  // 5) місячний звіт 1-го числа
  if (p.d === 1 && minutes >= 540 && String(bot_setting('MONTHLY_REPORT', 'так')).toLowerCase() !== 'ні' &&
      bot_prop(BOT_PROP.LAST_MONTH_REPORT) !== bot_monthKey(now)) {
    var prev = bot_prevYm(p.y, p.m);
    bot_setProp(BOT_PROP.LAST_MONTH_REPORT, bot_monthKey(now));
    bot_ownerIds().forEach(function (id) { bot_sendMonthly_(id, prev.y, prev.m, true); });
  }
}

// ---------- ранковий звіт ----------

function bot_morningParts_() {
  var warn = Number(bot_setting('REPORT_WARN_DAYS', '3'));
  return bot_buildMorningReport(bot_readOrders(), new Date(), { warnDays: isNaN(warn) ? 3 : warn });
}

/** @return true — звіт доставлено (або не може бути доставлений і власника попереджено). */
function bot_sendMorningReport() {
  var chat = bot_setting('GROUP_CHAT_ID'), thread = bot_setting('REPORT_THREAD_ID');
  if (!chat || thread === '') {
    bot_sendToOwners('⚠️ Ранковий звіт не надіслано: не задано гілку «Реєстри». Напишіть <code>/bind report</code> у цій гілці групи.');
    return true;
  }
  var parts = bot_morningParts_();
  var opts = thread !== '0' ? { thread: thread } : {};
  for (var i = 0; i < parts.length; i++) {
    var r = bot_send(chat, parts[i], opts);
    if (!r.ok) {
      if (/thread not found/i.test(r.description || '')) {
        bot_sendToOwners('⚠️ Ранковий звіт не надіслано: гілку «Реєстри» не знайдено (message thread not found). Перенастройте: у гілці групи напишіть <code>/bind report</code>. Звіт нижче.');
        bot_sendMany(bot_ownerIds()[0], parts);
        return true;
      }
      throw new Error('Не вдалося надіслати ранковий звіт: ' + r.description);
    }
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
  var cur = bot_monthMetrics(orders, pays, y, m);
  var pv = bot_prevYm(y, m);
  var prev = bot_monthMetrics(orders, pays, pv.y, pv.m);
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
  function crit(key, val) { return R(key) + ',"' + val + '",'; }

  sh.clear();
  sh.clearConditionalFormatRules();
  sh.setHiddenGridlines(true);
  var money = '#,##0" грн"';
  var f = {};                                       // комірка → формула / значення

  // ---- заголовок і картки ----
  sh.getRange('A1').setValue('Монокло — Виробництво 2026 · Підсумки').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('Усе рахується автоматично з аркушів «Замовлення» і «Оплати». Цей аркуш не редагуйте.').setFontColor('#666666');
  sh.getRange('A4:E4').setValues([['Собівартість усього', 'Оплачено усього', 'БОРГ', 'Остання оплата — дата', 'Остання оплата — сума']]);
  sh.getRange('A5').setFormula('=SUM(' + R('cost') + ')');
  sh.getRange('B5').setFormula('=SUM(' + P('sum') + ')');
  sh.getRange('C5').setFormula('=A5-B5');
  // остання заповнена оплата в стовпці «Сума оплати»
  sh.getRange('D5').setFormula('=IFERROR(INDEX(' + P('date') + ',MATCH(9.99E+307,' + P('sum') + ')),"")');
  sh.getRange('E5').setFormula('=IFERROR(INDEX(' + P('sum') + ',MATCH(9.99E+307,' + P('sum') + ')),"")');
  sh.getRange('A4:E4').setFontWeight('bold').setBackground('#1f3864').setFontColor('#ffffff').setHorizontalAlignment('center');
  sh.getRange('A5:E5').setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center').setBackground('#eef3fb');
  sh.getRange('A5:C5').setNumberFormat(money);
  sh.getRange('E5').setNumberFormat(money);
  sh.getRange('D5').setNumberFormat('dd.mm.yyyy');
  sh.getRange('C4:C5').setBackground('#c00000').setFontColor('#ffffff');

  // службові клітинки місяця
  sh.getRange('G1').setValue('Початок місяця').setFontColor('#999999');
  sh.getRange('G2').setValue('Початок наступного').setFontColor('#999999');
  sh.getRange('H1').setFormula('=DATE(YEAR(TODAY()),MONTH(TODAY()),1)').setNumberFormat('dd.mm.yyyy').setFontColor('#999999');
  sh.getRange('H2').setFormula('=EDATE(H1,1)').setNumberFormat('dd.mm.yyyy').setFontColor('#999999');

  // ---- Сьогодні ----
  bot_sumHeader_(sh, 7, 'Сьогодні');
  sh.getRange('A8').setValue('Додано речей · собівартість');
  sh.getRange('B8').setFormula('=COUNTIFS(' + R('date') + ',TODAY(),' + R('status') + ',' + W + ')');
  sh.getRange('C8').setFormula('=SUMIFS(' + R('cost') + ',' + R('date') + ',TODAY(),' + R('status') + ',' + W + ')').setNumberFormat(money);
  sh.getRange('A9').setValue('ТТН «Не передана»');
  sh.getRange('B9').setFormula('=IFERROR(ROWS(UNIQUE(FILTER(' + R('ttn') + ',' + R('stage') + '="Не передана",' + R('status') + '=' + W + ',' + R('ttn') + '<>""))),0)');
  sh.getRange('A10').setValue('Посилок «На відділенні» 4+ дні');
  if (om.arrived) {
    sh.getRange('B10').setFormula('=IFERROR(ROWS(UNIQUE(FILTER(' + R('ttn') + ',' + R('stage') + '="На відділенні",' + R('status') + '=' + W + ',' + R('arrived') + '<>"",' + R('arrived') + '<=TODAY()-4))),0)');
  }

  // ---- Поточний місяць ----
  bot_sumHeader_(sh, 12, 'Поточний місяць');
  sh.getRange('A13:C13').setValues([['Тип речі', 'Речей', 'Собівартість']]).setFontWeight('bold');
  BOT_TYPES.forEach(function (t, i) {
    var r = 14 + i;
    sh.getRange('A' + r).setValue(t);
    sh.getRange('B' + r).setFormula('=' + monthCount(crit('type', t), '$H$1', '$H$2'));
    sh.getRange('C' + r).setFormula('=' + monthSum(crit('type', t), '$H$1', '$H$2')).setNumberFormat(money);
  });
  sh.getRange('A17').setValue('Разом').setFontWeight('bold');
  sh.getRange('B17').setFormula('=' + monthCount('', '$H$1', '$H$2')).setFontWeight('bold');
  sh.getRange('C17').setFormula('=' + monthSum('', '$H$1', '$H$2')).setNumberFormat(money).setFontWeight('bold');
  sh.getRange('A18').setValue('Оплачено за місяць');
  sh.getRange('B18').setFormula('=SUMIFS(' + P('sum') + ',' + P('date') + ',">="&$H$1,' + P('date') + ',"<"&$H$2)').setNumberFormat(money);
  sh.getRange('A19').setValue('Відмови: шт. · грн · % від отриманих+відмов');
  sh.getRange('B19').setFormula('=' + monthCount(crit('stage', 'Відмова'), '$H$1', '$H$2'));
  sh.getRange('C19').setFormula('=' + monthSum(crit('stage', 'Відмова'), '$H$1', '$H$2')).setNumberFormat(money);
  sh.getRange('D19').setFormula('=IFERROR(B19/(B19+' + monthCount(crit('stage', 'Отримано'), '$H$1', '$H$2') + '),0)').setNumberFormat('0.0%');

  // ---- До оплати наступної звірки ----
  bot_sumHeader_(sh, 21, 'До оплати наступної звірки');
  sh.getRange('A22').setValue('Сума «Не оплачено» для етапів «Отримано» + «Відмова» (орієнтир, скільки має виставити виробництво)');
  sh.getRange('A22').setWrap(true);
  sh.getRange('B22').setFormula('=SUMIFS(' + R('cost') + ',' + R('paid') + ',"Не оплачено",' + R('stage') + ',"Отримано",' + R('status') + ',' + W + ')+' +
    'SUMIFS(' + R('cost') + ',' + R('paid') + ',"Не оплачено",' + R('stage') + ',"Відмова",' + R('status') + ',' + W + ')').setNumberFormat(money).setFontWeight('bold');

  // ---- Спірні ----
  bot_sumHeader_(sh, 24, 'Спірні');
  sh.getRange('A25').setValue('Рядків «Спірна» · сума');
  sh.getRange('B25').setFormula('=COUNTIFS(' + R('paid') + ',"Спірна")');
  sh.getRange('C25').setFormula('=SUMIFS(' + R('cost') + ',' + R('paid') + ',"Спірна")').setNumberFormat(money);

  // ---- Швидкість виробництва (значення пише скрипт) ----
  bot_sumHeader_(sh, BOT_SUM_SPEED_ROW - 1, 'Швидкість виробництва (замовлення → передача Новій пошті)');
  sh.getRange(BOT_SUM_SPEED_ROW, 1, 1, 3).setValues([['Показник', 'Поточний місяць', 'Останні 7 днів']]).setFontWeight('bold');
  ['ТТН у вибірці', 'Середній термін, дн', 'Медіана, дн', 'Передано за ≤1 день', 'Передано за 2 дні', 'Передано за 3+ дні', 'Найдовша ТТН (№ · днів)']
    .forEach(function (label, i) { sh.getRange(BOT_SUM_SPEED_ROW + 1 + i, 1).setValue(label); });
  sh.getRange(BOT_SUM_SPEED_ROW + 9, 1).setValue('Рахується від замовлень, прийнятих ботом; імпортовані рядки без дати замовлення не враховуються.').setFontColor('#888888');

  // ---- По місяцях (12 останніх) ----
  var mr = 39;
  bot_sumHeader_(sh, mr - 2, 'По місяцях (речей і собівартість)');
  sh.getRange(mr - 1, 1, 1, 6).setValues([['Місяць'].concat(BOT_TYPES).concat(['Усього речей', 'Собівартість'])]).setFontWeight('bold');
  for (var k = 0; k < 12; k++) {
    var r = mr + k;
    sh.getRange(r, 1).setFormula('=EDATE($H$1,' + (k - 11) + ')').setNumberFormat('mmmm yyyy');
    BOT_TYPES.forEach(function (t, i) {
      sh.getRange(r, 2 + i).setFormula('=' + monthCount(crit('type', t), '$A' + r, 'EDATE($A' + r + ',1)'));
    });
    sh.getRange(r, 5).setFormula('=' + monthCount('', '$A' + r, 'EDATE($A' + r + ',1)'));
    sh.getRange(r, 6).setFormula('=' + monthSum('', '$A' + r, 'EDATE($A' + r + ',1)')).setNumberFormat(money);
  }

  sh.setColumnWidth(1, 330);
  [2, 3, 4, 5, 6].forEach(function (c) { sh.setColumnWidth(c, 150); });
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
  sh.getRange(row, 1, 1, 6).setBackground('#d9e2f3').setFontWeight('bold');
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

var BOT_ORDERS_ROWS = 3000;

function bot_setupAll() {
  var ss = bot_ss();
  try { ss.setSpreadsheetTimeZone(BOT_TZ); } catch (e) { bot_log('УВАГА', 'часовий пояс', e.message); }
  try { ss.setSpreadsheetLocale('uk_UA'); } catch (e) { bot_log('УВАГА', 'мова таблиці', e.message); }

  var order = [BOT_SHEETS.summary, BOT_SHEETS.orders, BOT_SHEETS.payments, BOT_SHEETS.price, BOT_SHEETS.lists,
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
  bot_setupTable_(BOT_SHEETS.recon, BOT_RECON_COLS.map(function (c) { return c[1]; }), 16);
  bot_setupTable_(BOT_SHEETS.reconDetails, BOT_DETAIL_COLS.map(function (c) { return c[1]; }), 10);
  bot_setupTable_(BOT_SHEETS.monthly, BOT_MONTHLY_COLS, 13);
  bot_setupTable_(BOT_SHEETS.log, ['Час', 'Рівень', 'Подія', 'Деталі'], 4);
  var recon = bot_sheet(BOT_SHEETS.recon), rmap = bot_headerMap(recon, BOT_RECON_COLS);
  recon.getRange(2, rmap.date, recon.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  recon.getRange(2, rmap.confirmedAt, recon.getMaxRows() - 1, 1).setNumberFormat('dd.mm.yyyy hh:mm');
  recon.getRange(2, rmap.hash, recon.getMaxRows() - 1, 1).setNumberFormat('@');
  recon.hideColumns(rmap.fileData);
  var det = bot_sheet(BOT_SHEETS.reconDetails), dmap = bot_headerMap(det, BOT_DETAIL_COLS);
  det.getRange(2, dmap.ttn, det.getMaxRows() - 1, 1).setNumberFormat('@');
  bot_sheet(BOT_SHEETS.monthly).getRange(2, 1, 500, 1).setNumberFormat('@');
  bot_sheet(BOT_SHEETS.log).getRange(2, 1, 2200, 1).setNumberFormat('dd.mm.yyyy hh:mm:ss');

  bot_buildSummary();
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
  // «Тип речі» — з аркуша «Прайс» (новий тип з'являється в списку сам)
  sh.getRange('A2').setFormula("=IFERROR(UNIQUE(FILTER('" + BOT_SHEETS.price + "'!A2:A,'" + BOT_SHEETS.price + "'!A2:A<>\"\")),\"\")");
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
  sh.getRange(2, 2, 200, 1).setNumberFormat('#,##0" грн"');
  sh.getRange(2, 3, 200, 1).setNumberFormat('dd.mm.yyyy');
  sh.setColumnWidths(1, 4, 170);
  sh.getRange('F1').setValue('Нова ціна = новий рядок з датою «Діє з». Старі рядки не видаляйте.').setFontColor('#777777');
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

