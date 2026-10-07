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
