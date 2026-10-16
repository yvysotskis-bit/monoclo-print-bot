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

function bot_renderItem_(it, o) {
  if (it.kind === 'sticker') return it.no + ' ' + (o.keepStickerWord ? 'Стікерпак ' : '') + bot_nameForLevel_(it, o);
  if (it.kind === 'cap') return it.no + ' ' + (/^кепк/i.test(it.raw) ? it.raw : 'Кепка ' + it.raw).replace(/\s+/g, ' ').trim();
  if (it.kind === 'other') return it.no + ' ' + bot_nameForLevel_(it, o);
  var parts = [String(it.no)];
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
function bot_overflowTexts_(items) {
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
    return (it.no + ' ' + t).trim();
  };
  return [
    pre + items.map(function (i) { return thing(i, true); }).join(', '),
    pre + items.map(function (i) { return thing(i, false); }).join(', '),
    pre + items.map(function (i) { return String(i.no); }).join(', ')
  ];
}

/** Номери → «14732-14750» для послідовних серій з 3+ номерів; решта через кому. */
function bot_numberRanges(nos) {
  var a = nos.map(Number).filter(function (n) { return n > 0; }).sort(function (x, y) { return x - y; });
  var out = [], i = 0;
  while (i < a.length) {
    var j = i;
    while (j + 1 < a.length && a[j + 1] === a[j] + 1) j++;
    if (j - i >= 2) out.push(a[i] + '-' + a[j]); else for (var k = i; k <= j; k++) out.push(String(a[k]));
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
    for (var ti = 0; ti < tiers.length; ti++) for (var si = 0; si < tiers[ti].sfx.length; si++) {
      var tx = bot_renderAll_(items, tiers[ti].o, tiers[ti].sfx[si]);
      if (bot_len(tx) <= limit) return { text: tx, len: bot_len(tx), level: tiers[ti].lv, overflow: false };
    }
    var ovs = bot_overflowTexts_(items);
    for (var oi = 0; oi < 2; oi++) if (bot_len(ovs[oi]) <= limit) return { text: ovs[oi], len: bot_len(ovs[oi]), level: 7 + oi, overflow: false };
    var nums = bot_overflowTexts_(items)[2];
    if (bot_len(nums) <= limit) return { text: nums, len: bot_len(nums), level: 9, overflow: false };
    var rg0 = bot_urgentPrefix_(items) + bot_numberRanges(items.map(function (i) { return i.no; }));
    if (bot_len(rg0) <= limit) return { text: rg0, len: bot_len(rg0), level: 10, overflow: false };
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
