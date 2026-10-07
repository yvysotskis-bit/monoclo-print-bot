// Завантажує всі .gs з apps-script/ в один контекст (як це робить Apps Script) і читає xlsx з test-data/.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const XLSX = require('xlsx');

const ROOT = path.join(__dirname, '..');

function loadBot() {
  const dir = path.join(ROOT, 'apps-script');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.gs') && f !== 'ALL_IN_ONE.gs').sort().reverse();
  const ctx = vm.createContext({ console, Date, Math, JSON, Number, String, Object, Array, RegExp, isNaN, isFinite, parseInt, parseFloat });
  files.forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));
  return ctx;
}

/** Як getValues(): двовимірний масив (числа — числами, текст — текстом, дати — Date). */
function readSheet(file, sheetName) {
  const wb = XLSX.readFile(path.join(ROOT, 'test-data', file), { cellDates: true });
  const ws = wb.Sheets[sheetName || wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const out = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      row.push(cell && cell.v !== undefined ? cell.v : '');
    }
    out.push(row);
  }
  return out;
}

const OLD = 'stara-tablytsia-Zvitnist-Monoclo-Kuznets-2026.xlsx';
module.exports = { loadBot, readSheet, OLD, ROOT };
