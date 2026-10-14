// Run with Node.js 20+ (native FormData/File):
//   node scripts/benchmark-form-data-to-json.js [path/to/axios/index.js]
// Install each revision's dependencies with npm ci --ignore-scripts, then pass
// its index.js to compare revisions on the same machine/runtime. This measures
// conversion only; input construction, assertions, and JSON encoding are untimed.
// Timings are observations, not pass/fail assertions. Interleaved indexed writes
// still require normalization and are not covered by the linear-scaling claim.
import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const entry = process.argv[2]
  ? pathToFileURL(resolve(process.argv[2]))
  : new URL('../index.js', import.meta.url);
const { default: axios } = await import(entry.href);
const warmups = 3;
const samples = 7;
const files = [new File(['first'], 'first.txt'), new File(['second'], 'second.txt')];
const scenarios = [
  { name: 'flat', key: 'items', expected: (values) => ({ items: values }) },
  { name: 'nested', key: 'items[id]', expected: (values) => ({ items: { id: values } }) },
  {
    name: 'sparse-then-repeated',
    key: 'items',
    seed: ['items[1]', 'indexed'],
    expected: (values) => ({ items: [{ 1: 'indexed' }, ...values] }),
  },
  {
    name: 'files',
    key: 'items',
    value: (index) => files[index % files.length],
    expected: (values) => ({ items: values }),
  },
];

console.log({
  entry: entry.href,
  node: process.version,
  v8: process.versions.v8,
  platform: process.platform,
  arch: process.arch,
  cpu: cpus()[0]?.model,
  warmups,
  samples,
});

for (const scenario of scenarios) {
  for (const count of [1000, 5000, 10000]) {
    const input = new FormData();
    const values = Array.from({ length: count }, (_, index) =>
      scenario.value ? scenario.value(index) : String(index)
    );
    if (scenario.seed) input.append(...scenario.seed);
    values.forEach((value) => input.append(scenario.key, value));
    const entries = [...input.entries()];
    const expected = scenario.expected(values);
    const verify = (result) => {
      assert.deepStrictEqual(result, expected);
      if (scenario.value) {
        values.forEach((value, index) => assert.strictEqual(result.items[index], value));
      }
      assert.deepStrictEqual([...input.entries()], entries);
    };

    for (let i = 0; i < warmups; i++) verify(axios.formToJSON(input));
    const timings = [];
    for (let i = 0; i < samples; i++) {
      const start = performance.now();
      const result = axios.formToJSON(input);
      timings.push(performance.now() - start);
      verify(result);
    }

    const sorted = timings.slice().sort((a, b) => a - b);
    console.log({
      scenario: scenario.name,
      count,
      medianMs: Number(sorted[Math.floor(samples / 2)].toFixed(3)),
      sampleMs: timings.map((time) => Number(time.toFixed(3))),
    });
  }
}
