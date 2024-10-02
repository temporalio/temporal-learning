const fs = require('fs');

const files = [
  'adapters',
  'lang',
  'plugins/about',
  'plugins/clipboard',
  'plugins/dialog',
  'plugins/link',
  'plugins/table',
  'plugins/tableselection',
  'plugins/scayt',
  'plugins/icons_hidpi.png',
  'plugins/icons.png',
  'skins/moono-lisa',
  'vendor',
  'ckeditor.js',
  'contents.css',
  'styles.js',
  'CHANGES.md',
  'LICENSE.md',
  'README.md',
  'SECURITY.md'
];

const ckeditorDir = './node_modules/ckeditor4';
const destination = './ckeditor';

// Cleanup directory
fs.rmSync(destination, { recursive: true, force: true });

// Copy the files from the npm
files.forEach(file => {
  fs.cp(`${ckeditorDir}/${file}`, `${destination}/${file}`, {recursive: true}, err => {
    if (err) throw err;
    
  });
});