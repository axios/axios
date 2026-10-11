import { describe, it } from 'vitest';
import assert from 'assert';
import cookies from '../../../lib/helpers/cookies.js';

describe('helpers::cookies', () => {
  it('readAsync resolves to null outside a standard browser env', async () => {
    // In Node there is no document.cookie, so the non-standard-env shim applies.
    assert.strictEqual(await cookies.readAsync('XSRF-TOKEN'), null);
    assert.strictEqual(cookies.read('XSRF-TOKEN'), null);
  });
});
