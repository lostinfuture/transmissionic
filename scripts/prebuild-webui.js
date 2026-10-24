#!/usr/bin/env node

/**
 * Run before the WebUI build. Synchronous so the webpack patch lands
 * before vue-cli starts.
 */

const fs = require('fs');

const filename = './node_modules/webpack/lib/web/JsonpChunkLoadingRuntimeModule.js';
const data = fs.readFileSync(filename, 'utf8');
const next = data.replace(/\$\{RuntimeGlobals\.publicPath\} \+ /g, '');
if (next === data) {
  // webpack 5.75 no longer concatenates publicPath in this file.
  // vue.config.js publicPath './' covers the web root instead.
  console.log('prebuild: publicPath join already absent');
  process.exit(0);
}
fs.writeFileSync(filename, next);
