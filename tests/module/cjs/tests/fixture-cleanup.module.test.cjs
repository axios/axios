const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it } = require('mocha');
const { cleanupTempFixture } = require('./helpers/fixture.cjs');

describe('module fixture cleanup helper', () => {
  it('removes fixture directories without shelling out to rm', () => {
    const fixturePath = fs.mkdtempSync(path.join(os.tmpdir(), 'axios-module-fixture-'));
    const nestedPath = path.join(fixturePath, 'nested');
    const originalPath = process.env.PATH;

    fs.mkdirSync(nestedPath);
    fs.writeFileSync(path.join(nestedPath, 'index.ts'), 'export {};\n');
    process.env.PATH = '';

    try {
      cleanupTempFixture(fixturePath);
    } finally {
      process.env.PATH = originalPath;
    }

    assert.strictEqual(fs.existsSync(fixturePath), false);
  });

  it('removes fixture directories when fs.rmSync is unavailable', () => {
    const fixturePath = fs.mkdtempSync(path.join(os.tmpdir(), 'axios-module-fixture-legacy-'));
    const nestedPath = path.join(fixturePath, 'nested');
    const originalRmSync = fs.rmSync;

    fs.mkdirSync(nestedPath);
    fs.writeFileSync(path.join(nestedPath, 'index.ts'), 'export {};\n');
    fs.rmSync = undefined;

    try {
      cleanupTempFixture(fixturePath);
    } finally {
      fs.rmSync = originalRmSync;
    }

    assert.strictEqual(fs.existsSync(fixturePath), false);
  });
});
