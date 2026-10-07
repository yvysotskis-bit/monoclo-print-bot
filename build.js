// Збирає apps-script/ALL_IN_ONE.gs з усіх .gs (один файл замість багатьох). Запуск: node build.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'apps-script');
const order = ['Config', 'Core', 'Sheets', 'Telegram', 'Orders', 'ReconcileLogic', 'Reconcile', 'NovaPoshta', 'ReportsLogic', 'Reports', 'Summary', 'Setup', 'Import', 'Menu', 'SelfTest'];
const all = fs.readdirSync(dir).filter(f => f.endsWith('.gs') && f !== 'ALL_IN_ONE.gs').map(f => f.replace('.gs', ''));
const missing = all.filter(f => !order.includes(f));
if (missing.length) throw new Error('Додайте в порядок збірки: ' + missing.join(', '));
let out = '/* ALL_IN_ONE.gs — згенеровано командою `node build.js` з окремих файлів. Не редагуйте вручну. */\n';
order.forEach(n => { out += '\n// ======================= ' + n + '.gs =======================\n' + fs.readFileSync(path.join(dir, n + '.gs'), 'utf8') + '\n'; });
fs.writeFileSync(path.join(dir, 'ALL_IN_ONE.gs'), out);
console.log('ALL_IN_ONE.gs:', out.split('\n').length, 'рядків');
