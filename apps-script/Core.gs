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

/** Латинські літери-двійники → кириличні (менеджери іноді пишуть «cіра» з латинською c). */
function bot_deLatin_(s) {
  var map = { a: 'а', c: 'с', e: 'е', i: 'і', k: 'к', m: 'м', o: 'о', p: 'р', x: 'х', y: 'у', h: 'н', t: 'т', b: 'в' };
  return String(s).replace(/[acekimopxyhtb]/g, function (ch) { return map[ch]; });
}

function bot_normColor(text) {
  var t = bot_deLatin_(bot_trim(text).toLowerCase());
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
  if (/[а-яіїєґ]/.test(t)) t = bot_deLatin_(t);            // змішані латиниця + кирилиця → кирилиця
  var res = { type: '', color: bot_normColor(t), ambiguous: false, found: false };
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

var BOT_PREFIX_RE_ = /^[\s❗‼⚠️!]*(терміново[\s:!—\-]*)?/i;

/** Рядок початку замовлення: «1538. Принт …», «1542 Принт …», «❗️ТЕРМІНОВО 1520. Принт …». → {no, rest} | null */
function bot_orderStart_(line) {
  var s = bot_trim(line).replace(BOT_PREFIX_RE_, '');
  var m = s.match(/^(\d{1,6})(?:[.)]\s*|\s+(?=принт))(.+)$/i);
  return m ? { no: parseInt(m[1], 10), rest: m[2].trim() } : null;
}

/** Непорожні рядки; рядки-«префікси» на кшталт «❗️ТЕРМІНОВО» прибираємо. */
function bot_cleanLines_(text) {
  return String(text || '').split(/\r?\n/).map(bot_trim).filter(function (l) {
    return l !== '' && l.replace(BOT_PREFIX_RE_, '') !== '';
  });
}

function bot_parseOrderSegment_(lines) {
  var st = bot_orderStart_(lines[0]);
  var res = {
    ok: true, no: st.no, print: st.rest, prints: bot_countPrints(st.rest), type: '', typeAmbiguous: false, color: '',
    size: '', placement: '', ttn: '', issues: [], ttnShared: false
  };
  var badTtn = '', extras = [];
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
    var strong = /принт|візуал/i.test(line) || /^\s*(спереду|позаду|попереду|ззаду)\s*$/i.test(line);
    if (pl && strong) { if (!res.placement) res.placement = pl; continue; }
    if (!res.color) { var c = bot_normColor(line); if (c && line.length <= 20) { res.color = c; continue; } }
    extras.push(line);                                  // напр. «FC BARCA (PERED) W - ПЕРЕД» — опис принта
  }
  if (/^принти?\s*$/i.test(res.print) && extras.length) res.print = res.print + ' ' + extras.join(' / ');

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
