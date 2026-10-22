import * as esm from 'axios';
import { register } from './scenarios.mjs';
await register((name, run) => Deno.test({ name, fn: run }), esm);
