import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanupTempFixture } from './helpers/fixture.js';

describe('module fixture cleanup helper', () => {
  it('removes fixture directories without shelling out to rm', () => {
    const fixturePath = fs.mkdtempSync(path.join(os.tmpdir(), 'axios-esm-module-fixture-'));
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

    expect(fs.existsSync(fixturePath)).toBe(false);
  });
});
