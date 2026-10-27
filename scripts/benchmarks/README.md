# FormData-to-JSON benchmark

Run from the repository root with Node.js 20.19 or newer:

```sh
npm ci --ignore-scripts
node scripts/benchmarks/form-data-to-json.js
```

The benchmark calls the source `formDataToJSON()` helper directly, using native
`FormData`. It implements the three workloads proposed in [#10982](https://github.com/axios/axios/issues/10982):

| Case          | Field names                                                | Expected output                                                 |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| `flat_100`    | `field0` through `field99`                                 | 100 top-level properties                                        |
| `indexed_100` | `items[0][name]` through `items[99][name]`                 | An object with an `items` array of 100 objects                  |
| `deep_100`    | `root[level][items][0][metadata][status]` through index 99 | `{ root: { level: { items: [...] } } }` with 100 nested objects |

Each case contains 100 unique fields with the same string values. Inputs and
expected outputs are constructed before measurement. One untimed conversion
checks the entire output, followed by an untimed warm-up batch of 100 conversions.
Then five timed samples of 100 conversions each are recorded. After warm-up and
each sample, assertions check the last output and confirm that the input entries
are unchanged. Assertions and fixture construction are outside the timed loops.
This measures conversion, including allocations, rather than FormData construction,
JSON stringification, or an HTTP request.

The output includes Node/V8 versions, platform, architecture, CPU model, and CSV
rows with the mean and sample standard deviation of batch times, mean time per
conversion, and all five raw batch times. Times are in milliseconds. Save the
output with shell redirection to compare revisions on the same machine and runtime.

These are exploratory measurements, not pass/fail performance tests. JIT warmup,
garbage collection, machine load, and case order can affect timings; repeat runs
and compare their variability before attributing a difference to a code change.
The nested cases also build more complex output objects, so their cost cannot be
attributed solely to parsing depth. No runtime optimization is proposed here.
