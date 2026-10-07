// Імітація Google Apps Script у пам'яті: таблиця, Script Properties, Telegram, Нова пошта, Drive.
// Не повна: лише те, що використовує бот. Усе оформлення (кольори, формати, фільтри) — «заглушки».
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { readSheet, ROOT, OLD } = require('./helpers');

function noop() {
  const f = function () {};
  return new Proxy(f, { get: (t, p) => (p === Symbol.toPrimitive ? () => '' : p === 'then' ? undefined : noop()), apply: () => noop() });
}

function a1(s) {
  const m = String(s).match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
  if (!m) throw new Error('A1? ' + s);
  const colN = x => x.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);
  const c1 = colN(m[1]), r1 = +m[2], c2 = m[3] ? colN(m[3]) : c1, r2 = m[4] ? +m[4] : r1;
  return [r1, c1, r2 - r1 + 1, c2 - c1 + 1];
}

class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); const px = new Proxy(this, { get: (t, p) => (p in t ? t[p] : (p === 'then' ? undefined : () => px)) }); return px; }
  getValues() { this.sh._ensure(this.r + this.nr - 1, this.c + this.nc - 1); const out = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) { const v = this.sh.data[this.r - 1 + i][this.c - 1 + j]; row.push(v === undefined ? '' : v); } out.push(row); } return out; }
  getValue() { return this.getValues()[0][0]; }
  setValues(a) { this.sh._ensure(this.r + a.length - 1, this.c + a[0].length - 1); a.forEach((row, i) => row.forEach((v, j) => { this.sh.data[this.r - 1 + i][this.c - 1 + j] = v; })); return this; }
  setValue(v) { return this.setValues([[v]]); }
  setFormula(f) {                                   // моделюємо мову таблиці: «;»-мови не розуміють «,» між аргументами
    const semi = this.sh.ss.semi, bare = String(f).replace(/"[^"]*"/g, '');
    if (semi && bare.includes(',')) return this.setValue('#ERROR!');
    if (f === (semi ? '=MAX(1;2)' : '=MAX(1,2)')) return this.setValue(2);
    return this.setValue(f);
  }
  setBackground(c) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.bg[(this.r + i) + ',' + (this.c + j)] = c; return this; }
  getBackground() { return this.sh.bg[this.r + ',' + this.c] || null; }
  setNumberFormat(f) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.fmt[(this.r + i) + ',' + (this.c + j)] = f; return this; }
  getRow() { return this.r; } getColumn() { return this.c; } getNumRows() { return this.nr; }
  createFilter() { this.sh._filter = {}; return {}; }
  copyTo() { return this; }
  clear() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sh.data[this.r - 1 + i][this.c - 1 + j] = ''; return this; }
}

class Sheet {
  constructor(ss, name) { this.ss = ss; this.name = name; this.data = []; this.maxRows = 1000; this.maxCols = 26; this.bg = {}; this.fmt = {}; this._filter = null; return new Proxy(this, { get: (t, p) => (p in t ? t[p] : (p === 'then' ? undefined : () => noop())) }); }
  _ensure(r, c) { while (this.data.length < r) this.data.push([]); this.data.forEach(row => { while (row.length < c) row.push(''); }); }
  getName() { return this.name; }
  getMaxRows() { return this.maxRows; } getMaxColumns() { return this.maxCols; }
  getLastRow() { let last = 0; this.data.forEach((row, i) => { if (row.some(v => v !== '' && v !== undefined && v !== null)) last = i + 1; }); return last; }
  getLastColumn() { let last = 0; this.data.forEach(row => row.forEach((v, j) => { if (v !== '' && v !== undefined && v !== null) last = Math.max(last, j + 1); })); return last; }
  getRange(a, b, c, d) { if (typeof a === 'string') { [a, b, c, d] = a1(a); } const r = new Range(this, a, b, c || 1, d || 1); this.maxRows = Math.max(this.maxRows, a + (c || 1) - 1); return r; }
  getDataRange() { return this.getRange(1, 1, Math.max(this.getLastRow(), 1), Math.max(this.getLastColumn(), 1)); }
  insertRowsAfter(pos, n) { this.maxRows += n; } insertRowsBefore(pos, n) { this.maxRows += n; }
  deleteRows(from, n) { this.data.splice(from - 1, n); }
  appendRow(arr) { const r = this.getLastRow() + 1; this._ensure(r, arr.length); arr.forEach((v, j) => { this.data[r - 1][j] = v; }); }
  getFilter() { return this._filter; } getBandings() { return []; } getProtections() { return []; }
  clear() { this.data = []; this.bg = {}; }
}

function makeSpreadsheet() {
  const ss = { sheets: [] };
  ss.getSheetByName = n => ss.sheets.find(s => s.name === n) || null;
  ss.insertSheet = (n) => { const s = new Sheet(ss, n); ss.sheets.push(s); return s; };
  ss.getSheets = () => ss.sheets.slice();
  ss.deleteSheet = s => { ss.sheets = ss.sheets.filter(x => x !== s); };
  ss.getId = () => 'ss-id';
  ss.toast = () => {};
  ss.setActiveSheet = () => {};
  ss.setSpreadsheetTimeZone = () => {}; ss.setSpreadsheetLocale = () => {};
  return ss;
}

/** Нова «Google-середа» з завантаженим кодом бота. */
function newEnv(opts) {
  opts = opts || {};
  const ss = makeSpreadsheet(); ss.semi = !!opts.semi;
  const props = {};
  const tg = { calls: [], sent: [], edits: [], reactions: [], answers: [], deletes: [], pending: [], nextId: 100, fail: {} };
  const np = { calls: [], handler: () => [] };
  const files = { created: [] };

  const state = { nextFile: null };
  const mkBlob = (f) => { const b = { name: f.name, bytes: f.bytes, getBytes: () => Array.from(f.bytes).map(x => (x > 127 ? x - 256 : x)), copyBlob() { return b; }, setName(n) { b.name = n; return b; }, setContentType() { return b; }, getDataAsString: () => Buffer.from(f.bytes).toString('utf8') }; return b; };
  const respond = (obj) => ({ getResponseCode: () => 200, getContentText: () => JSON.stringify(obj) });
  const UrlFetchApp = {
    fetch(url, o) {
      const payload = o && o.payload ? JSON.parse(o.payload) : {};
      if (/telegram\.org\/file\//.test(url)) return { getResponseCode: () => 200, getBlob: () => mkBlob(state.nextFile) };
      let m = String(url).match(/api\.telegram\.org\/bot[^/]+\/(\w+)/);
      if (m) {
        const method = m[1]; tg.calls.push({ method, payload });
        if (tg.fail[method]) return respond({ ok: false, error_code: 400, description: tg.fail[method] });
        switch (method) {
          case 'sendMessage': { const id = tg.nextId++; tg.sent.push(Object.assign({ message_id: id }, payload)); return respond({ ok: true, result: { message_id: id } }); }
          case 'editMessageText': tg.edits.push(payload); return respond({ ok: true, result: true });
          case 'setMessageReaction': tg.reactions.push(payload); return respond({ ok: true, result: true });
          case 'answerCallbackQuery': tg.answers.push(payload); return respond({ ok: true, result: true });
          case 'deleteMessage': tg.deletes.push(payload); return respond({ ok: true, result: true });
          case 'getFile': return respond({ ok: true, result: { file_path: 'docs/file' } });
          case 'getMe': return respond({ ok: true, result: { id: 1, username: 'monoclo_test_bot' } });
          case 'getWebhookInfo': return respond({ ok: true, result: { url: '' } });
          case 'getUpdates': { const off = payload.offset || 0; const res = tg.pending.filter(u => u.update_id >= off); return respond({ ok: true, result: res }); }
          default: return respond({ ok: true, result: true });
        }
      }
      if (/novaposhta/.test(url)) { np.calls.push(payload); return respond({ success: true, data: np.handler(payload), errors: [] }); }
      throw new Error('Невідомий URL у моці: ' + url);
    }
  };

  const folder = { getId: () => 'folder-1', createFile: (b) => { files.created.push(b); return { getUrl: () => 'https://drive.example/file/' + files.created.length, getName: () => b.name }; }, getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => folder };
  const g = {
    console, Date, Math, JSON, Number, String, Object, Array, RegExp, isNaN, isFinite, parseInt, parseFloat, Error, Set, Map,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss, getUi: () => noop(), flush: () => {},
      newDataValidation: () => noop(), newConditionalFormatRule: () => noop(),
      CopyPasteType: {}, BandingTheme: {}, ProtectionType: {},
      openByUrl: (url) => opts.oldWorkbook ? opts.oldWorkbook(url) : (() => { throw new Error('немає старої таблиці'); })(),
      openById: () => { throw new Error('openById не змодельовано'); }
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {}, tryLock: () => true }) },
    UrlFetchApp,
    Utilities: {
      sleep() {}, getUuid: () => crypto.randomUUID(),
      computeDigest: (alg, bytes) => Array.from(crypto.createHash('md5').update(Buffer.from(bytes.map(b => b & 255))).digest()).map(b => (b > 127 ? b - 256 : b)),
      DigestAlgorithm: { MD5: 'MD5' },
      parseCsv: (t, d) => t.trim().split('\n').map(l => l.split(d || ','))
    },
    Session: noop(), Logger: { log() {} }, MimeType: { GOOGLE_SHEETS: 'sheet' },
    DriveApp: { getFileById: (id) => ({ getParents: () => ({ hasNext: () => false }), getBlob: () => ({ getDataAsString: () => { if (!(opts.driveFiles || {})[id]) throw new Error('Немає доступу до файлу ' + id); return opts.driveFiles[id]; } }) }), getRootFolder: () => folder, getFolderById: () => folder },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => noop(), deleteTrigger() {} }
  };
  g.SpreadsheetApp.getUi = () => ({ alert() {}, prompt: () => noop(), createMenu: () => noop(), Button: {}, ButtonSet: {} });
  const ctx = vm.createContext(g);
  const dir = path.join(ROOT, 'apps-script');
  fs.readdirSync(dir).filter(f => f.endsWith('.gs') && (opts.allInOne ? f === 'ALL_IN_ONE.gs' : f !== 'ALL_IN_ONE.gs')).sort().reverse().forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));

  // зручні помічники
  const env = { ctx, ss, props, tg, np, files, state, mkBlob };
  env.run = (code) => vm.runInContext(code, ctx);
  env.sheet = (n) => ss.getSheetByName(n);
  env.rows = (n) => { const s = ss.getSheetByName(n); const v = s.getDataRange().getValues(); return v.slice(1).filter(r => r.some(x => x !== '')); };
  env.setup = () => { ctx.bot_setupAll(); };
  let uid = 1;
  env.update = (u) => { u.update_id = uid++; tg.pending.push(u); return u; };
  env.poll = () => { ctx.bot_poll(); };
  env.setNow = (iso) => {
    const Real = Date;
    ctx.Date = class FakeDate extends Real { constructor(...a) { if (a.length) super(...a); else super(iso); } static now() { return new Real(iso).getTime(); } };
  };
  env.lastSent = () => tg.sent[tg.sent.length - 1];
  env.sentTo = (chat) => tg.sent.filter(s => String(s.chat_id) === String(chat));
  return env;
}

/** Імітація старої таблиці з test-data (лише читання). */
function oldWorkbook() {
  const mk = (name) => { const vals = readSheet(OLD, name); return { getDataRange: () => ({ getValues: () => vals }) }; };
  const sheets = { 'Замовлення': mk('Замовлення'), 'Оплати': mk('Оплати') };
  return { getSheetByName: n => sheets[n] || null, getSheets: () => Object.values(sheets) };
}

module.exports = { newEnv, oldWorkbook };
