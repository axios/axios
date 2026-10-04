import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import formDataToJSON from '../../lib/helpers/formDataToJSON.js';

const fields = 100;
const conversions = 100;
const samples = 5;
const values = Array.from({ length: fields }, (_, index) => `value${index}`);

const cases = [
  {
    name: 'flat_100',
    key: (index) => `field${index}`,
    expected: Object.fromEntries(values.map((value, index) => [`field${index}`, value])),
  },
  {
    name: 'indexed_100',
    key: (index) => `items[${index}][name]`,
    expected: { items: values.map((name) => ({ name })) },
  },
  {
    name: 'deep_100',
    key: (index) => `root[level][items][${index}][metadata][status]`,
    expected: {
      root: { level: { items: values.map((status) => ({ metadata: { status } })) } },
    },
  },
];

console.log(`# node=${process.version} v8=${process.versions.v8}`);
console.log(`# platform=${process.platform} arch=${process.arch} cpu=${cpus()[0]?.model}`);
console.log(
  '# One untimed warm-up batch per case; input construction and assertions are not timed.'
);
console.log(
  'case,fields,conversions_per_sample,samples,mean_ms,stdev_ms,mean_ms_per_conversion,' +
    Array.from({ length: samples }, (_, index) => `sample_${index + 1}_ms`).join(',')
);

for (const benchmark of cases) {
  const input = new FormData();
  values.forEach((value, index) => input.append(benchmark.key(index), value));
  const entries = Array.from(input.entries());

  // Validate the complete shape and values before warming the conversion path.
  assert.deepStrictEqual(formDataToJSON(input), benchmark.expected);

  let warmResult;
  for (let iteration = 0; iteration < conversions; iteration++) {
    warmResult = formDataToJSON(input);
  }
  assert.deepStrictEqual(warmResult, benchmark.expected);
  assert.deepStrictEqual(Array.from(input.entries()), entries);

  const timings = [];
  for (let sample = 0; sample < samples; sample++) {
    let result;
    const start = performance.now();
    for (let iteration = 0; iteration < conversions; iteration++) {
      result = formDataToJSON(input);
    }
    timings.push(performance.now() - start);
    assert.deepStrictEqual(result, benchmark.expected);
    assert.deepStrictEqual(Array.from(input.entries()), entries);
  }

  const mean = timings.reduce((total, time) => total + time, 0) / samples;
  const deviation = Math.sqrt(
    timings.reduce((total, time) => total + (time - mean) ** 2, 0) / (samples - 1)
  );
  console.log(
    [
      benchmark.name,
      fields,
      conversions,
      samples,
      mean.toFixed(3),
      deviation.toFixed(3),
      (mean / conversions).toFixed(6),
      ...timings.map((time) => time.toFixed(3)),
    ].join(',')
  );
}

