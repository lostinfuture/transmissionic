#!/usr/bin/env node
// Same-origin RPC paths, and SHA-1 that does not call crypto.subtle.
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const bencode = require("bencode");

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

const rpc = load("src/services/rpcUrl.ts");

const lan = {
  href: "http://192.168.1.15:9091/transmission/web/",
  protocol: "http:",
  hostname: "192.168.1.15",
  port: "9091"
};
assert.strictEqual(rpc.rpcRequestUrl({
  host: "192.168.1.15",
  port: 9091,
  https: false
}, lan), "/transmission/rpc");
assert.ok(!rpc.rpcRequestUrl({}, lan).includes("localhost"));
assert.strictEqual(rpc.rpcRequestUrl({}, lan), "/transmission/rpc");

const proxy = {
  href: "https://torrent.example/transmission/web/index.html",
  protocol: "https:",
  hostname: "torrent.example",
  port: ""
};
assert.strictEqual(rpc.rpcRequestUrl({
  host: "torrent.example",
  https: true
}, proxy), "/transmission/rpc");
assert.ok(!rpc.rpcRequestUrl({ host: "torrent.example", https: true }, proxy).includes(":9091"));

const prefixed = {
  href: "https://example.com/apps/transmission/web/",
  protocol: "https:",
  hostname: "example.com",
  port: ""
};
assert.strictEqual(rpc.rpcRequestUrl({ host: "example.com", https: true }, prefixed), "/apps/transmission/rpc");

const remote = rpc.rpcRequestUrl({
  host: "transmission.myserver.com",
  path: "/my/transmission/rpc",
  https: true
});
assert.strictEqual(remote, "https://transmission.myserver.com/my/transmission/rpc");

assert.strictEqual(rpc.rpcRequestUrl({
  host: "192.168.1.20"
}), "http://192.168.1.20:9091/transmission/rpc");

assert.strictEqual(rpc.rpcRequestUrl({
  host: "2001:db8::1",
  port: 9091
}), "http://[2001:db8::1]:9091/transmission/rpc");

const directDaemon = {
  href: "https://torrent.example/transmission/web/",
  protocol: "https:",
  hostname: "torrent.example",
  port: ""
};
assert.strictEqual(rpc.rpcRequestUrl({
  host: "torrent.example",
  port: 9091,
  https: true
}, directDaemon), "https://torrent.example:9091/transmission/rpc");

assert.strictEqual(rpc.rpcRequestUrl({}), "http://localhost:9091/transmission/rpc");

const sha1 = require("../shims/simple-sha1.js");
const shim = read("shims/simple-sha1.js");
assert.ok(!shim.includes("subtle"));
assert.ok(!shim.includes("createWorker"));
assert.strictEqual(sha1.sync("a"), "86f7e437faa5a7fce15d1ddcb9eaeaea377667b8");

const metainfo = Buffer.from(
  "ZDg6YW5ub3VuY2UyNzpodHRwOi8vMTI3LjAuMC4xOjkvYW5ub3VuY2U0OmluZm9kNjpsZW5ndGhpMWU0Om5hbWU1OmEudHh0MTI6cGllY2UgbGVuZ3RoaTE2Mzg0ZTY6cGllY2VzMjA6hvfkN/qlp/zhXR3cuerq6jd2Z7hlZQ==",
  "base64"
);
const info = bencode.encode(bencode.decode(metainfo).info);
const expected = crypto.createHash("sha1").update(info).digest("hex");
assert.strictEqual(sha1.sync(info), expected);

const client = read("src/services/TransmissionRPC.ts");
assert.ok(client.includes("rpcRequestUrl"));
assert.ok(!client.includes('"://"+this.options.host+":"+this.options.port'));

const readme = read("README.md");
assert.ok(readme.includes("crypto.subtle"));
assert.ok(readme.includes("rpc-host-whitelist"));
assert.ok(readme.includes('"auth"'));
assert.ok(/plain HTTP/.test(readme));
assert.ok(readme.includes("username"));
assert.ok(readme.includes("password"));

const srcFiles = [
  "src/services/rpcUrl.ts",
  "src/services/TransmissionRPC.ts",
  "src/services/FileHandler.ts",
  "src/views/AddTorrent.vue"
];
for (const rel of srcFiles) {
  assert.ok(!read(rel).includes("crypto.subtle"), rel);
}

let asyncOk = false;
sha1(info, function (hash) {
  assert.strictEqual(hash, expected);
  asyncOk = true;
});
setImmediate(function () {
  assert.strictEqual(asyncOk, true);
  console.log("rpc url check ok");
});
