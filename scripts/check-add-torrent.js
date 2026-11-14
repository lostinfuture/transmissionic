#!/usr/bin/env node
// Checks the add-torrent parser without a browser and without crypto.subtle.
// The sample magnet is the base32 link from upstream issue #1384.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const magnet = 'magnet:?xt=urn:btih:U27DMI6B2HGRZRJOZHEF6SFDUDJ47ZPA';
const expectedMagnetHash = 'a6be3623c1d1cd1cc52ec9c85f48a3a0d3cfe5e0';

(async () => {
  const parseTorrentModule = await import('parse-torrent');
  const parseTorrent = parseTorrentModule.default || parseTorrentModule;
  const bencodeModule = await import('bencode');
  const bencode = bencodeModule.default || bencodeModule;

  const parsedMagnet = await parseTorrent(magnet);
  assert.strictEqual(parsedMagnet.infoHash, expectedMagnetHash);

  const metainfo = Buffer.from(
    'ZDg6YW5ub3VuY2UyNzpodHRwOi8vMTI3LjAuMC4xOjkvYW5ub3VuY2U0OmluZm9kNjpsZW5ndGhpMWU0Om5hbWU1OmEudHh0MTI6cGllY2UgbGVuZ3RoaTE2Mzg0ZTY6cGllY2VzMjA6hvfkN/qlp/zhXR3cuerq6jd2Z7hlZQ==',
    'base64'
  );
  const parsedFile = await parseTorrent(metainfo);
  const decoded = bencode.decode(metainfo);
  const infoHash = crypto.createHash('sha1').update(bencode.encode(decoded.info)).digest('hex');
  assert.strictEqual(parsedFile.infoHash, infoHash);
  assert.strictEqual(parsedFile.name, 'a.txt');
  const ptSource = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'parse-torrent', 'index.js'), 'utf8');
  assert.ok(!/no web crypto support/.test(ptSource));

  console.log('add-torrent check ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
