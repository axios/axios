import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser } from 'acorn';

const LIB_DIR = fileURLToPath(new URL('../../lib/', import.meta.url));
const ECMA_VERSION = 2018;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

describe('lib/ source files parse as ES2018', () => {
  for (const file of walk(LIB_DIR)) {
    const rel = file.slice(LIB_DIR.length);
    it(rel, () => {
      const src = readFileSync(file, 'utf8');
      expect(() =>
        Parser.parse(src, { ecmaVersion: ECMA_VERSION, sourceType: 'module' })
      ).not.toThrow();
    });
  }
});
