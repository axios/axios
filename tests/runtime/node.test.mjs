import { test } from 'node:test';
import * as esm from 'axios';
import { register } from './scenarios.mjs';
await register((name, run) => test(name, { timeout: 10000 }, run), esm);
