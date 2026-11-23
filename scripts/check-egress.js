#!/usr/bin/env node
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
      strict: true,
    },
  }).outputText;
  const module = { exports: {} };
  const wrapper = new Function('exports', 'module', 'require', js);
  wrapper(module.exports, module, require);
  return module.exports;
}

async function run() {
  const egress = load('src/services/EgressInfo.ts');
  const gesture = load('src/services/menuGesture.ts');

  const parsed = egress.parseIpApiPayload({
    status: 'success',
    query: '82.29.100.176',
    city: 'Zurich',
    regionName: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    isp: 'Datacamp Limited',
  });
  assert.deepStrictEqual(parsed, {
    ip: '82.29.100.176',
    city: 'Zurich',
    region: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    isp: 'Datacamp Limited',
  });
  assert.strictEqual(egress.formatEgressLocation(parsed), 'Zurich, Switzerland');
  assert.strictEqual(egress.formatEgressTitle(parsed), 'Zurich, Switzerland (Datacamp Limited)');
  assert.strictEqual(egress.parseIpApiPayload({ status: 'fail', message: 'private range' }), null);

  // Prefers local ./egress.json when present and does not call external ip-api.com.
  const calls = [];
  const fromLocal = await egress.fetchEgressInfo(async (url) => {
    calls.push(url);
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          status: 'success',
          query: '82.29.100.176',
          city: 'Zurich',
          country: 'Switzerland',
          countryCode: 'CH',
        };
      },
    };
  }, 'http:');
  assert.deepStrictEqual(calls, ['./egress.json']);
  assert.strictEqual(fromLocal.ip, '82.29.100.176');

  // Explicit offline status in ./egress.json must NOT fall back to browser IP.
  const offlineCalls = [];
  const offline = await egress.fetchEgressInfo(async (url) => {
    offlineCalls.push(url);
    return {
      ok: true,
      status: 200,
      async json() {
        return { status: 'fail', query: '' };
      },
    };
  }, 'http:');
  assert.deepStrictEqual(offlineCalls, ['./egress.json']);
  assert.strictEqual(offline, null);

  // Falls back to ip-api.com on 404 over HTTP, and skips on HTTPS.
  const httpFallbackCalls = [];
  const fromFallback = await egress.fetchEgressInfo(async (url) => {
    httpFallbackCalls.push(url);
    if (url === './egress.json') {
      return { ok: false, status: 404, async json() { return {}; } };
    }
    return {
      ok: true,
      status: 200,
      async json() {
        return { status: 'success', query: '198.51.100.9', city: 'Frankfurt', country: 'Germany' };
      },
    };
  }, 'http:');
  assert.strictEqual(httpFallbackCalls.length, 2);
  assert.strictEqual(httpFallbackCalls[1], egress.IP_API_URL);
  assert.strictEqual(fromFallback.ip, '198.51.100.9');

  const httpsCalls = [];
  const fromHttps = await egress.fetchEgressInfo(async (url) => {
    httpsCalls.push(url);
    return { ok: false, status: 404, async json() { return {}; } };
  }, 'https:');
  assert.deepStrictEqual(httpsCalls, ['./egress.json']);
  assert.strictEqual(fromHttps, null);

  // Mobile menu swipe edge threshold reaches past center of screen.
  assert.strictEqual(gesture.computeMenuMaxEdgeStart(390), 254);
  assert.strictEqual(gesture.computeMenuMaxEdgeStart(430), 280);
  assert.ok(gesture.computeMenuMaxEdgeStart(360) > 180);
  assert.strictEqual(gesture.computeMenuMaxEdgeStart(0), 240);

  console.log('egress & menu gesture check ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
