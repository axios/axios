import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { tokenizeSearchText } from './tokenizeSearchText.js';

test('preserves MiniSearch tokenization for non-Han text', () => {
  assert.deepEqual(tokenizeSearchText('Request config: Axios.create()'), [
    'Request',
    'config',
    'Axios',
    'create',
  ]);
});

test('indexes Han unigrams and overlapping bigrams', () => {
  assert.deepEqual(tokenizeSearchText('请求配置', 'title'), [
    '请',
    '求',
    '配',
    '置',
    '请求',
    '求配',
    '配置',
  ]);
});

test('uses Han bigrams for multi-character queries', () => {
  assert.deepEqual(tokenizeSearchText('配置'), ['配置']);
  assert.deepEqual(tokenizeSearchText('配'), ['配']);
});

test('matches queries within the Chinese request configuration docs', async () => {
  const requestConfig = await readFile(
    new URL('../zh/pages/advanced/request-config.md', import.meta.url),
    'utf8',
  );
  const indexTerms = new Set(tokenizeSearchText(requestConfig, 'text'));

  for (const queryTerm of tokenizeSearchText('配置')) {
    assert.ok(indexTerms.has(queryTerm));
  }
});
