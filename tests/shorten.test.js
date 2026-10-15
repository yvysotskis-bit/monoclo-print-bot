const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBot } = require('./helpers');
const B = loadBot();
const TTN = '20451556067718';
const desc = text => B.bot_buildDescription(B.bot_parseOrderMessage(text));
const len = s => [...s].length;

// ---- еталони з розділу 5 ТЗ: точні рядки ----
const ETALONS = [
  ['15037 No-Risk (W) худі х3 БЕЗ ФЛІСУ S, принт позаду', 51,
    `15037. Принт no-risk (W)\nХуді x3 ❗️БЕЗ ФЛІСУ\nS\n\nПринт позаду\n\n${TTN}`],
  ['14640 Mazda-MX5 худі БЕЗ ФЛІСУ XS, принт позаду', 47,
    `14640. Принт Mazda-MX5\nХуді x1 БЕЗ ФЛІСУ\nXS\nПринт позаду\n${TTN}`],
  ['14634 Cuba Libre (W) чор XL. 14635 CV (W) чор XL. 14636 Bill чор M. Всі позаду', 78,
    `14634. Принт Cuba Libre (W)\nФутболка чорна\nXL\nПринт позаду\n\n14635. Принт CV (W)\nФутболка чорна\nXL\nПринт позаду\n\n14636. Принт Bill\nФутболка чорна\nM\nПринт позаду\n\n${TTN}`],
  ['14637 MaxikChemp чор M. 14638 NorrisWorldChampion чор M. 14639 TurboLando худі БЕЗ ФЛІСУ M. Позаду', 98,
    `14637. Принт Maxik Chemp\nФутболка чорна\nM\nПринт позаду\n\n14638. Принт Norris World Champion\nФутболка чорна\nM\nПринт позаду\n\n14639. Принт Turbo Lando\nХуді ❗️БЕЗ ФЛІСУ\nM\nПринт позаду\n\n${TTN}`],
  ['14858 Ландо Норріс. 14859 McLaren 1963 (W)+Lando-Logo худі х3 БЕЗ ФЛІСУ S, як на візуалі', 88,
    `14858. Стікерпак Ландо Норріс\n\n14859. Принт McLaren 1963 (W) + Lando-Logo\nХуді x3 БЕЗ ФЛІСУ\nS\nПринти як на візуалі\n\n${TTN}`]
];
ETALONS.forEach(([expected, n, msg], i) => {
  test(`Еталон ${i + 1} з розділу 5: точний рядок, ${n} символів`, () => {
    const r = desc(msg);
    assert.equal(r.text, expected);
    assert.equal(r.len, n);
    assert.equal(len(r.text), n);
    assert.equal(r.overflow, false);
  });
});

test('Базові формати: стікерпак (одне замовлення) і кепка', () => {
  assert.equal(desc(`15082. Стікерпак ГТА\n${TTN}`).text, '15082 Стікерпак ГТА');
  assert.equal(desc(`15100. Кепка Ferrari - 0132\n${TTN}`).text, '15100 Кепка Ferrari - 0132');
});

test('Переповнення (15089–15092 з розділу 2): ніколи не > 100, номери й розміри на місці, без вигадок', () => {
  const msg = `15089. Принт Russel-Art\nФутболка чорна\nM\n\nПринт позаду\n\n15090. Принт George-Russell (B)\nФутболка сіра\nM\n\nПринт позаду\n\n15091. Принт george halftone\nХуді x1 ❗️БЕЗ ФЛІСУ\nM\n\nПринт позаду\n\n15092. Принт Russell Lines (W)\nХуді x3 ❗️БЕЗ ФЛІСУ\nM\n\nПринт позаду\n\n${TTN}`;
  const r = desc(msg);
  assert.ok(r.len <= 100, r.text);
  ['15089', '15090', '15091', '15092'].forEach(n => assert.ok(r.text.includes(n), n));
  assert.equal(B.bot_descMustHaves(B.bot_parseOrderMessage(msg), r.text).length, 0);
});

test('Переповнення: «номер + річ», далі лише номери через кому; ТЕРМІНОВО лишається', () => {
  const blocks = [];
  for (let i = 0; i < 12; i++) blocks.push(`${15200 + i}. Принт Dlinna-Nazva-${i}\nХуді x2 БЕЗ ФЛІСУ\nXL\nПринт позаду`);
  const r = desc(`ТЕРМІНОВО\n${blocks.join('\n\n')}\n\n${TTN}`);
  assert.ok(r.len <= 100, r.text + ' ' + r.len);
  assert.ok(r.text.startsWith('ТЕРМІНОВО '));
  assert.ok(r.level >= 8);
  const nums = desc(`${Array.from({ length: 30 }, (_, i) => `${15300 + i}. Принт A\nФутболка чорна\nM\nПринт позаду`).join('\n\n')}\n\n${TTN}`);
  assert.equal(nums.overflow, true);                 // не влізло навіть у номери → рішення власника
});

test('ТЕРМІНОВО на початку; х1 не пишемо; х2/х4 і розмір зберігаються', () => {
  const r = desc(`❗️ТЕРМІНОВО\n15500. Принт Test\nФутболка біла\nL\nx2\nПринт позаду\n${TTN}`);
  assert.equal(r.text, 'ТЕРМІНОВО 15500 Test футболка біла х2 L, принт позаду');
  assert.ok(!/ х1/.test(desc(`15501. Принт Test\nХуді x1 БЕЗ ФЛІСУ\nM\n${TTN}`).text));
});

test('Розміщення «спереду», «ДВА ПРИНТА» зберігаються', () => {
  const r = desc(`15510. Принт Test\nФутболка чорна\nM\nПринт спереду\nДВА ПРИНТА\n${TTN}`);
  assert.equal(r.text, '15510 Test футболка чорна M, ДВА ПРИНТА, спереду');
});

test('Назва принта: прибрати «Принт», Title Case, абревіатури, +', () => {
  const c = B.bot_cleanPrintName;
  assert.equal(c('Принт no-risk (w)'), 'No-Risk (W)');
  assert.equal(c('Принти george   halftone'), 'George Halftone');
  assert.equal(c('Принт CV (W)'), 'CV (W)');
  assert.equal(c('Принт McLaren 1963 (W) + Lando-Logo'), 'McLaren 1963 (W)+Lando-Logo');
});

test('Розбір: код кольору x/х (х1 чорний, х3 графітовий, х4 сірий), БЕЗ ФЛІСУ з емодзі, ДВА ПРИНТА, кепка, кількість у вартості не плутається з XL', () => {
  const l = B.bot_parseOrderMessage(`15091. Принт george halftone\nХуді х3 ❗️БЕЗ ФЛІСУ\nXL\nПринт позаду\n${TTN}`);
  assert.equal(l[0].colorCode, 3); assert.equal(l[0].color, 'Графітовий'); assert.equal(l[0].type, 'Худі не утеплене'); assert.equal(l[0].size, 'XL');
  assert.equal(l[0].issues.length, 0);
  assert.equal(B.bot_parseOrderMessage(`15001. Принт A\nФутболка чорна\n2XL\n${TTN}`)[0].colorCode, 0);
  const cap = B.bot_parseOrderMessage(`15100. Кепка Ferrari - 0132\n${TTN}`)[0];
  assert.equal(cap.type, 'Кепка'); assert.equal(cap.issues.length, 0);
});

test('Приклад з розділу 2 розбирається без зауважень (худі без кольору — ок)', () => {
  const msg = `15089. Принт Russel-Art\nФутболка чорна\nM\n\nПринт позаду\n\n15090. Принт George-Russell (B)\nФутболка сіра\nM\n\nПринт позаду\n\n15091. Принт george halftone\nХуді x1 ❗️БЕЗ ФЛІСУ\nM\n\nПринт позаду\n\n15092. Принт Russell Lines (W)\nХуді x3 ❗️БЕЗ ФЛІСУ\nM\n\nПринт позаду\n\n20451556067718`;
  const l = B.bot_parseOrderMessage(msg);
  assert.equal(l.length, 4);
  l.forEach(p => { assert.deepEqual(JSON.parse(JSON.stringify(p.issues)), []); assert.equal(p.ttn, '20451556067718'); });
  assert.equal(l[3].colorCode, 3);
});

test('х1/х3/х4 — код кольору худі (чорний/графітовий/сірий); х2 не вгадуємо; собівартість не множиться', () => {
  const c = (x) => B.bot_parseOrderMessage(`15600. Принт A\nХуді ${x} БЕЗ ФЛІСУ\nM\n${TTN}`)[0];
  assert.equal(c('x1').color, 'Чорний'); assert.equal(c('х3').color, 'Графітовий'); assert.equal(c('x4').color, 'Сірий');
  assert.equal(c('x2').color, ''); assert.equal(c('x2').colorCode, 2); assert.deepEqual(JSON.parse(JSON.stringify(c('x2').issues)), []);
  const row = B.bot_buildOrderFields_(c('х3'), new Date(), [{ type: 'Худі не утеплене', price: 740, from: null }], 'В роботі');
  assert.equal(row.fields.cost, 740);
});
