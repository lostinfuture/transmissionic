#!/usr/bin/env node
// JSON-RPC 2.0 envelope, legacy field names, and session unit labels.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(rel) {
  const source = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      strict: true
    }
  }).outputText;
  const module = { exports: {} };
  const wrapper = new Function('exports', 'module', 'require', js);
  wrapper(module.exports, module, require);
  return module.exports;
}

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

const rpc = load('src/services/rpcProtocol.ts');
const units = load('src/services/units.ts');

const session = rpc.buildRequest('session-get', {}, 1, true);
assert.deepStrictEqual(session, {
  jsonrpc: '2.0',
  method: 'session_get',
  params: {},
  id: 1
});

const torrentGet = rpc.buildRequest('torrent-get', {
  fields: ['percentDone', 'downloadDir', 'peer-limit'],
  ids: 'recently-active'
}, 2, true);
assert.strictEqual(torrentGet.method, 'torrent_get');
assert.deepStrictEqual(torrentGet.params.fields, ['percent_done', 'download_dir', 'peer_limit']);
assert.strictEqual(torrentGet.params.ids, 'recently_active');

const sessionSet = rpc.buildRequest('session-set', { 'cache-size-mb': 4 }, 3, true);
assert.strictEqual(sessionSet.method, 'session_set');
assert.strictEqual(sessionSet.params.cache_size_mib, 4);
assert.strictEqual(sessionSet.params['cache-size-mb'], undefined);

const legacy = rpc.buildRequest('session-get', { 'download-dir': '/data' }, 4, false);
assert.deepStrictEqual(legacy, {
  method: 'session-get',
  arguments: { 'download-dir': '/data' },
  tag: 4
});

const addedRequest = rpc.buildRequest('torrent-add', {
  filename: 'magnet:?xt=urn:btih:abc',
  'download-dir': '/data/My Dir'
}, 5, true);
assert.strictEqual(addedRequest.params.filename, 'magnet:?xt=urn:btih:abc');
assert.strictEqual(addedRequest.params.download_dir, '/data/My Dir');

const sessionBody = rpc.normalizeResponse({
  jsonrpc: '2.0',
  result: {
    download_dir: '/tmp',
    cache_size_mib: 4,
    preferred_transports: ['tcp'],
    sequential_download: false,
    units: {
      size_bytes: 1000,
      size_units: ['B', 'kB', 'MB', 'GB', 'TB'],
      speed_bytes: 1000,
      speed_units: ['B/s', 'kB/s', 'MB/s', 'GB/s', 'TB/s']
    }
  },
  id: 7
}, 'session-get');
assert.strictEqual(sessionBody.result, 'success');
assert.strictEqual(sessionBody.tag, 7);
assert.strictEqual(sessionBody.arguments['download-dir'], '/tmp');
assert.strictEqual(sessionBody.arguments['cache-size-mb'], 4);
assert.strictEqual(sessionBody.arguments.units['size-bytes'], 1000);
assert.deepStrictEqual(sessionBody.arguments.units['speed-units'][1], 'kB/s');
assert.deepStrictEqual(sessionBody.arguments.preferred_transports, ['tcp']);
assert.strictEqual(sessionBody.arguments.sequential_download, false);

const torrentBody = rpc.normalizeResponse({
  jsonrpc: '2.0',
  result: {
    torrents: [{
      percent_done: 1,
      total_size: 1,
      rate_download: 0,
      download_dir: '/tmp',
      files: [{ bytes_completed: 1, begin_piece: 0, end_piece: 0, length: 1, name: 'a.txt' }],
      tracker_stats: [{ announce_state: 1, download_count: 2, downloader_count: 3 }]
    }]
  },
  id: 8
}, 'torrent-get');
const torrent = torrentBody.arguments.torrents[0];
assert.strictEqual(torrent.percentDone, 1);
assert.strictEqual(torrent.totalSize, 1);
assert.strictEqual(torrent.rateDownload, 0);
assert.strictEqual(torrent.downloadDir, '/tmp');
assert.strictEqual(torrent.files[0].bytesCompleted, 1);
assert.strictEqual(torrent.files[0].begin_piece, 0);
assert.strictEqual(torrent.trackerStats[0].announceState, 1);
assert.strictEqual(torrent.trackerStats[0].downloadCount, 2);
assert.strictEqual(torrent.trackerStats[0].downloader_count, 3);

const table = rpc.normalizeResponse({
  jsonrpc: '2.0',
  result: {
    torrents: [
      ['percent_done', 'files'],
      [1, [{ bytes_completed: 1, name: 'a.txt' }]]
    ]
  },
  id: 9
}, 'torrent-get');
assert.deepStrictEqual(table.arguments.torrents[0], ['percentDone', 'files']);
assert.strictEqual(table.arguments.torrents[1][1][0].bytesCompleted, 1);

const stats = rpc.normalizeResponse({
  jsonrpc: '2.0',
  result: {
    download_speed: 0,
    upload_speed: 0,
    active_torrent_count: 1,
    current_stats: { downloaded_bytes: 5, uploaded_bytes: 6, files_added: 1, seconds_active: 2, session_count: 1 },
    cumulative_stats: { uploaded_bytes: 7 }
  },
  id: 10
}, 'session-stats');
assert.strictEqual(stats.arguments.downloadSpeed, 0);
assert.strictEqual(stats.arguments.uploadSpeed, 0);
assert.strictEqual(stats.arguments['current-stats'].downloadedBytes, 5);
assert.strictEqual(stats.arguments['cumulative-stats'].uploadedBytes, 7);

const added = rpc.normalizeResponse({
  jsonrpc: '2.0',
  result: { torrent_added: { hash_string: '7e60028086e70f7ef5cd05c10856badfc9a3183e', id: 1, name: 'a.txt' } },
  id: 11
}, 'torrent-add');
assert.strictEqual(added.arguments['torrent-added'].id, 1);
assert.strictEqual(added.arguments['torrent-added'].hashString, '7e60028086e70f7ef5cd05c10856badfc9a3183e');

const freeSpace = rpc.normalizeResponse({
  jsonrpc: '2.0',
  result: { path: '/tmp', size_bytes: 9, total_size: 10 },
  id: 12
}, 'free-space');
assert.strictEqual(freeSpace.arguments['size-bytes'], 9);
assert.strictEqual(freeSpace.arguments.total_size, 10);

assert.strictEqual(rpc.shouldFallbackToLegacy({ result: 'no method name' }), true);
assert.strictEqual(rpc.shouldFallbackToLegacy({
  jsonrpc: '2.0',
  error: { code: -32601, message: 'Method not found' },
  id: 1
}), false);
assert.strictEqual(rpc.shouldFallbackToLegacy({
  jsonrpc: '2.0',
  result: { version: '4.1.4' },
  id: 1
}), false);

const methodMiss = rpc.normalizeResponse({
  jsonrpc: '2.0',
  error: { code: -32601, message: 'Method not found' },
  id: 13
}, 'session-get');
assert.strictEqual(methodMiss.result, 'Method not found');
assert.strictEqual(methodMiss.tag, 13);

const unchanged = { result: 'success', arguments: { 'download-dir': '/tmp' }, tag: 4 };
assert.strictEqual(rpc.normalizeResponse(unchanged, 'session-get'), unchanged);

const size = units.readByteUnits(undefined, 'size');
const speed = units.readByteUnits(undefined, 'speed');
assert.strictEqual(units.formatByteCount(1000, size, 2, 'en-US'), '1 kB');
assert.strictEqual(units.formatByteCount(1024, size, 2, 'en-US'), '1.02 kB');
assert.strictEqual(units.formatByteCount(0, size, 2, 'en-US'), '0 B');
assert.strictEqual(units.formatByteCount(1500, speed, 1, 'en-US'), '1.5 kB/s');

const sessionUnits = units.readByteUnits({
  'size-bytes': 1024,
  'size-units': ['B', 'KiB', 'MiB']
}, 'size');
assert.strictEqual(units.formatByteCount(1024, sessionUnits, 0, 'en-US'), '1 KiB');

const torrentVue = read('src/views/components/Torrent.vue');
assert.ok(torrentVue.includes('["medium","warning","warning","medium","success","primary","primary"]'));
assert.ok(!torrentVue.includes('"success",null,'));

const infosVue = read('src/views/components/Infos.vue');
assert.ok(infosVue.includes('Locale.filters.queued'));
assert.ok(!/^\s*"5",\s*$/m.test(infosVue));

const utilsSource = read('src/services/Utils.ts');
assert.ok(utilsSource.includes('bytes*8'));
assert.ok(utilsSource.includes('formatByteCount'));
assert.ok(utilsSource.includes('torrent.status == 3 || torrent.status == 5'));
assert.ok(utilsSource.includes('percentDone*100'));

const clientSource = read('src/services/TransmissionRPC.ts');
assert.ok(clientSource.includes('buildRequest'));
assert.ok(clientSource.includes('shouldFallbackToLegacy'));
assert.ok(clientSource.includes('useJsonRpc'));
assert.ok(clientSource.includes('ret.data.tag != null ? ret.data.tag : ret.data.id'));

console.log('rpc check ok');
