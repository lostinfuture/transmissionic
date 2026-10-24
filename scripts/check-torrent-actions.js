#!/usr/bin/env node
// Stop/resume all omits ids. The add dialog prefills the session directory.
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

function load(rel) {
  const source = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      strict: true
    }
  }).outputText;
  const module = { exports: {} };
  const wrapper = new Function("exports", "module", "require", js);
  wrapper(module.exports, module, require);
  return module.exports;
}

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

const rpc = load("src/services/rpcProtocol.ts");

const stop = rpc.buildRequest("torrent-stop", {}, 1, true);
assert.deepStrictEqual(stop, {
  jsonrpc: "2.0",
  method: "torrent_stop",
  params: {},
  id: 1
});
assert.strictEqual(Object.prototype.hasOwnProperty.call(stop.params, "ids"), false);

const start = rpc.buildRequest("torrent-start", {}, 2, true);
assert.strictEqual(start.method, "torrent_start");
assert.deepStrictEqual(start.params, {});

const one = rpc.buildRequest("torrent-stop", { ids: [3, 4] }, 3, true);
assert.deepStrictEqual(one.params.ids, [3, 4]);

const legacy = rpc.buildRequest("torrent-start", {}, 4, false);
assert.deepStrictEqual(legacy, {
  method: "torrent-start",
  arguments: {},
  tag: 4
});

const client = read("src/services/TransmissionRPC.ts");
assert.ok(client.includes('async torrentActionAll(action: string)'));
assert.ok(client.includes('return this.rpcCall("torrent-"+action, {})'));

const list = read("src/views/List.vue");
assert.ok(list.includes('Locale.stopAll'));
assert.ok(list.includes('Locale.resumeAll'));
assert.ok(list.includes('this.torrentActionAll("stop")'));
assert.ok(list.includes('this.torrentActionAll("start")'));
assert.ok(!list.includes('torrentAction("stop", [])'));
assert.ok(!list.includes('torrentAction("start", [])'));

const add = read("src/views/AddTorrent.vue");
assert.ok(add.includes("this.settings.downloadDir = this.defaultDownloadDir"));
assert.ok(add.includes("dir !== Locale.downloadDir"));
assert.ok(add.includes("delete payload.downloadDir"));

const locale = JSON.parse(read("public/locales/en.json"));
assert.strictEqual(locale.stopAll, "Stop all");
assert.strictEqual(locale.resumeAll, "Resume all");

const defaults = JSON.parse(read("public/default.json"));
assert.deepStrictEqual(defaults, {});

const pkg = JSON.parse(read("package.json"));
assert.strictEqual(pkg.version, "1.9.0");

console.log("torrent actions check ok");
