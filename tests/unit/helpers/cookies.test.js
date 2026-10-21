import assert from 'assert';
import { describe, it } from 'vitest';

import cookies from '../../../lib/helpers/cookies.js';

describe('helpers::cookies (non-standard environment)', () => {
  it('should resolve an async read to null', async () => {
    const result = cookies.readAsync('XSRF-TOKEN');

    assert.ok(result instanceof Promise);
    assert.strictEqual(await result, null);
  });
});
