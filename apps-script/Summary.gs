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
  bot_formulaSep_(sh);                                   // «,» чи «;» — залежить від мови таблиці
  sh.setHiddenGridlines(true);
  var money = '#,##0" грн"';
  var f = {};                                       // комірка → формула / значення

  // ---- заголовок і картки ----
  sh.getRange('A1').setValue('Монокло — Виробництво 2026 · Підсумки').setFontSize(16).setFontWeight('bold');
  sh.getRange('A2').setValue('Усе рахується автоматично з аркушів «Замовлення» і «Оплати». Цей аркуш не редагуйте.').setFontColor('#666666');
  sh.getRange('A4:E4').setValues([['Собівартість усього', 'Оплачено усього', 'БОРГ', 'Остання оплата — дата', 'Остання оплата — сума']]);
  sh.getRange('A5').setFormula(bot_fx('=SUM(' + R('cost') + ')'));
  sh.getRange('B5').setFormula(bot_fx('=SUM(' + P('sum') + ')'));
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
  sh.getRange('A19').setValue('Відмови: шт. · грн · % від отриманих+відмов');
  sh.getRange('B19').setFormula(bot_fx('=' + monthCount(crit('stage', 'Відмова'), '$H$1', '$H$2')));
  sh.getRange('C19').setFormula(bot_fx('=' + monthSum(crit('stage', 'Відмова'), '$H$1', '$H$2'))).setNumberFormat(money);
  sh.getRange('D19').setFormula(bot_fx('=IFERROR(B19/(B19+' + monthCount(crit('stage', 'Отримано'), '$H$1', '$H$2') + '),0)')).setNumberFormat('0.0%');

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
  sh.getRange(BOT_SUM_SPEED_ROW + 9, 1).setValue('Рахується від замовлень, прийнятих ботом; імпортовані рядки без дати замовлення не враховуються.').setFontColor('#888888');

  // ---- По місяцях (12 останніх) ----
  var mr = 39;
  bot_sumHeader_(sh, mr - 2, 'По місяцях (речей і собівартість)');
  sh.getRange(mr - 1, 1, 1, 6).setValues([['Місяць'].concat(BOT_TYPES).concat(['Усього речей', 'Собівартість'])]).setFontWeight('bold');
  for (var k = 0; k < 12; k++) {
    var r = mr + k;
    sh.getRange(r, 1).setFormula(bot_fx('=EDATE($H$1,' + (k - 11) + ')')).setNumberFormat('mmmm yyyy');
    BOT_TYPES.forEach(function (t, i) {
      sh.getRange(r, 2 + i).setFormula(bot_fx('=' + monthCount(crit('type', t), '$A' + r, 'EDATE($A' + r + ',1)')));
    });
    sh.getRange(r, 5).setFormula(bot_fx('=' + monthCount('', '$A' + r, 'EDATE($A' + r + ',1)')));
    sh.getRange(r, 6).setFormula(bot_fx('=' + monthSum('', '$A' + r, 'EDATE($A' + r + ',1)'))).setNumberFormat(money);
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
