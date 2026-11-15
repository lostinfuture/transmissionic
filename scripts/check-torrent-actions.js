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
assert.strictEqual(pkg.version, "1.10.25");
assert.ok(pkg.scripts && pkg.scripts.test);
assert.strictEqual(pkg.devDependencies["@types/node"], "^26.0.0");
assert.ok(!("chart.js" in pkg.dependencies));
assert.ok(!("swiper" in pkg.dependencies));
assert.ok(!("@capacitor/core" in pkg.dependencies));
assert.ok(!("capacitor-secure-storage-plugin" in pkg.dependencies));
assert.ok(!("@capacitor-community/electron" in (pkg.devDependencies || {})));

const readme = read("README.md");
assert.ok(readme.includes("Node.js 26"));
assert.ok(!readme.includes("Node.js 24"));

const upstreamWorkflow = read(".github/workflows/upstream.yml");
assert.ok(upstreamWorkflow.includes("actions/checkout@v7"));
assert.ok(!upstreamWorkflow.includes("actions/checkout@v4"));

const mainTs = read("src/main.ts");
assert.ok(mainTs.includes('mode: "md"'));
assert.ok(!mainTs.includes("@ionic/pwa-elements"));

const userSettingsSource = read("src/services/UserSettings.ts");
assert.ok(!userSettingsSource.includes("@capacitor"));
assert.ok(!userSettingsSource.includes("capacitor-secure-storage-plugin"));
assert.ok(userSettingsSource.includes("sanitizeServersForStorage"));

const detailsSource = read("src/views/TorrentDetails.vue");
assert.ok(!detailsSource.includes("@ionic/core/dist/collection"));
assert.ok(!list.includes("@ionic/core/dist/collection"));
assert.ok(!fs.existsSync(path.join(__dirname, "..", "src/services/swiperLayout.ts")));
assert.ok(!client.includes("electronRequest"));
assert.ok(!client.includes("window.net"));

for (const view of ["About.vue", "Settings.vue", "List.vue", "TorrentDetails.vue", "ServerDetails.vue", "AddTorrent.vue"]) {
  const src = read(`src/views/${view}`);
  assert.ok(!src.includes('isPlatform("capacitor")'), view);
  assert.ok(!src.includes('isPlatform("electron")'), view);
  assert.ok(!src.includes("swiper"), view);
}

const lock = JSON.parse(read("package-lock.json"));
for (const key of Object.keys(lock.packages || {})) {
  assert.ok(!key.includes("@capacitor"), key);
  assert.ok(!key.includes("chart.js"), key);
  assert.ok(!key.includes("swiper"), key);
}

const styleSource = read("src/theme/style.css");
assert.ok(styleSource.includes("--background-hover-opacity: 0 !important;"));
assert.ok(!list.includes('class="add-button"\n            fill="solid"\n            color="primary"'));
assert.ok(detailsSource.includes("<ion-page>"));
assert.ok(detailsSource.includes('<ion-segment-button :value="0"'));
assert.ok(add.includes("<ion-page>"));
assert.ok(add.includes('<ion-segment-button :value="0"'));

const infosSource = read("src/views/components/Infos.vue");
assert.ok(infosSource.includes('class="ion-padding"'));
assert.ok(infosSource.includes("<ion-list>"));

const trackersSource = read("src/views/components/Trackers.vue");
assert.ok(trackersSource.includes('class="ion-padding"'));
assert.ok(trackersSource.includes('class="tracker-card"'));

const peersSource = read("src/views/components/Peers.vue");
assert.ok(!peersSource.includes("down.png"));
assert.ok(!peersSource.includes("up.png"));

console.log("torrent actions check ok");
