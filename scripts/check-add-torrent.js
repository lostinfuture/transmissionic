#!/usr/bin/env node
// Checks the add-torrent parser without a browser and without crypto.subtle.
// The sample magnet is the base32 link from upstream issue #1384.
const assert = require('assert');
const crypto = require('crypto');
const parseTorrent = require('parse-torrent');

const magnet = 'magnet:?xt=urn:btih:U27DMI6B2HGRZRJOZHEF6SFDUDJ47ZPA';
const expectedMagnetHash = 'a6be3623c1d1cd1cc52ec9c85f48a3a0d3cfe5e0';

const parsedMagnet = parseTorrent(magnet);
assert.strictEqual(parsedMagnet.infoHash, expectedMagnetHash);

const metainfo = Buffer.from(
  'ZDg6YW5ub3VuY2UyNzpodHRwOi8vMTI3LjAuMC4xOjkvYW5ub3VuY2U0OmluZm9kNjpsZW5ndGhpMWU0Om5hbWU1OmEudHh0MTI6cGllY2UgbGVuZ3RoaTE2Mzg0ZTY6cGllY2VzMjA6hvfkN/qlp/zhXR3cuerq6jd2Z7hlZQ==',
  'base64'
);
const parsedFile = parseTorrent(metainfo);
const bencode = require('bencode');
const decoded = bencode.decode(metainfo);
const infoHash = crypto.createHash('sha1').update(bencode.encode(decoded.info)).digest('hex');
assert.strictEqual(parsedFile.infoHash, infoHash);
assert.strictEqual(parsedFile.name, 'a.txt');
assert.ok(!/no web crypto support/.test(require('fs').readFileSync(require.resolve('parse-torrent'), 'utf8')));

console.log('add-torrent check ok');
