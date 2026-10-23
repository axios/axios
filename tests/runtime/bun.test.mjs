import { test } from 'bun:test';
import * as esm from 'axios';
import { register } from './scenarios.mjs';
await register((name, run) => test(name, run, 10000), esm);
