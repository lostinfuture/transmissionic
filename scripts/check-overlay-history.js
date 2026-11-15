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
      strict: true
    }
  }).outputText;
  const module = { exports: {} };
  const wrapper = new Function('exports', 'module', 'require', js);
  wrapper(module.exports, module, require);
  return module.exports;
}

async function testReentry() {
  let restores = 0;
  let workCalls = 0;
  const { createHistoryGuard } = load('src/services/historyGuard.ts');
  const guard = createHistoryGuard(() => {
    restores += 1;
    guard.run(async () => {
      workCalls += 1;
      return true;
    });
  }, 30);

  const ran = await guard.run(async () => {
    workCalls += 1;
    return true;
  });
  assert.strictEqual(ran, true);
  assert.strictEqual(restores, 1);
  assert.strictEqual(workCalls, 1);

  await new Promise((resolve) => setTimeout(resolve, 50));
  const ranAgain = await guard.run(async () => true);
  assert.strictEqual(ranAgain, true);
}

async function testNoRestoreStaysOpen() {
  let restores = 0;
  const { createHistoryGuard } = load('src/services/historyGuard.ts');
  const guard = createHistoryGuard(() => {
    restores += 1;
  }, 500);
  await guard.run(async () => false);
  const ranAgain = await guard.run(async () => true);
  assert.strictEqual(ranAgain, true);
  assert.strictEqual(restores, 1);
}

async function testNestedDuringAwait() {
  let restores = 0;
  const { createHistoryGuard } = load('src/services/historyGuard.ts');
  const guard = createHistoryGuard(() => {
    restores += 1;
  }, 20);
  await guard.run(async () => {
    const nested = await guard.run(async () => true);
    assert.strictEqual(nested, false);
    return true;
  });
  assert.strictEqual(restores, 1);
}

testReentry()
  .then(() => testNestedDuringAwait())
  .then(() => testNoRestoreStaysOpen())
  .then(() => {
    console.log('overlay history check ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
