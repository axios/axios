// Run with: node scripts/benchmark-merge-config.js [path/to/axios/index.js]
// To compare revisions, install dependencies in a baseline checkout and pass
// its index.js path. Alternate baseline/current processes on the same machine.
// This measures complete Axios requests through a no-I/O adapter, not network
// latency. Timings are observations, not assertions or cross-runtime guarantees.
import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2]))
  : new URL('../index.js', import.meta.url);
const { default: axios } = await import(entry.href);
const warmup = 1000;
const iterations = 2000;
const samples = 9;
const payload = { name: 'example', enabled: true };

const adapter = (config) =>
  Promise.resolve({
    data: config.data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });

const headers = (prefix) =>
  Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`X-${prefix}-${i}`, `value-${i}`]));

const scenarios = [
  {
    name: 'minimal GET',
    defaults: {},
    request: (client) => client.get('/items'),
    verify: ({ config }) => assert.equal(config.method, 'get'),
  },
  {
    name: 'typical POST',
    defaults: { headers: { 'X-Token': 'default' }, timeout: 5000 },
    request: (client) =>
      client.post('/items', payload, { headers: { 'x-token': 'request' }, params: { page: 1 } }),
    verify: ({ config }) => {
      assert.equal(config.method, 'post');
      assert.equal(config.data, JSON.stringify(payload));
      assert.equal(config.headers.get('X-Token'), 'request');
      assert.equal(config.params.page, 1);
    },
  },
  {
    name: 'header-heavy POST (20 default + 20 request headers)',
    defaults: { headers: headers('Default') },
    request: (() => {
      const config = { headers: headers('Request') };
      return (client) => client.post('/items', payload, config);
    })(),
    verify: ({ config }) => {
      assert.equal(config.method, 'post');
      assert.equal(config.data, JSON.stringify(payload));
      for (let i = 0; i < 20; i++) {
        assert.equal(config.headers.get(`X-Default-${i}`), `value-${i}`);
        assert.equal(config.headers.get(`X-Request-${i}`), `value-${i}`);
      }
    },
  },
];

console.log({
  entry: entry.href,
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  cpu: cpus()[0]?.model,
  warmup,
  iterations,
  samples,
});

for (const scenario of scenarios) {
  const client = axios.create({ ...scenario.defaults, adapter });
  scenario.verify(await scenario.request(client));
  for (let i = 0; i < warmup; i++) await scenario.request(client);

  const timings = [];
  for (let sample = 0; sample < samples; sample++) {
    let response;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) response = await scenario.request(client);
    timings.push(((performance.now() - start) * 1000) / iterations);
    scenario.verify(response);
  }

  timings.sort((a, b) => a - b);
  console.log({
    scenario: scenario.name,
    medianMicroseconds: timings[Math.floor(samples / 2)].toFixed(2),
    minMicroseconds: timings[0].toFixed(2),
    maxMicroseconds: timings[samples - 1].toFixed(2),
  });
}
