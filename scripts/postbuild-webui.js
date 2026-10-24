#!/usr/bin/env node

/**
 * Run after "dist" exists. Synchronous so the zip cannot race the rewrite.
 */

const fs = require('fs');

const filename = './dist/index.html';
let data = fs.readFileSync(filename, 'utf8');
const loose = "script-src * 'unsafe-eval'";
const tight = "script-src 'self'";
if (data.includes(loose)) {
  data = data.replace(loose, tight);
} else if (!data.includes(tight)) {
  console.error('postbuild: CSP pattern not found');
  process.exit(1);
}
data = data.replace(/="\//g, '="./');
fs.writeFileSync(filename, data);

for (const name of ['LICENSE', 'NOTICE']) {
  fs.copyFileSync(name, `./dist/${name}`);
}
