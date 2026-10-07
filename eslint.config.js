const gas = ['SpreadsheetApp','DriveApp','Drive','ScriptApp','PropertiesService','LockService','UrlFetchApp','Utilities','Session','Logger','MimeType','CacheService','HtmlService'];
module.exports = [{
  files: ['apps-script/ALL_IN_ONE.gs'],
  languageOptions: { ecmaVersion: 2020, sourceType: 'script', globals: Object.fromEntries(gas.map(g => [g, 'readonly'])) },
  rules: { 'no-undef': 'error', 'no-unused-vars': ['warn', { args: 'none' }], 'no-redeclare': 'error', 'no-dupe-keys': 'error', 'no-unreachable': 'warn' }
}];
