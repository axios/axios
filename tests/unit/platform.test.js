import { describe, it } from 'vitest';
import platform from '../../lib/platform/index.js';
import assert from 'assert';

describe('generateString', () => {
  it('should generate a string of the specified length using the default alphabet', () => {
    const size = 10;
    const str = platform.generateString(size);

    assert.strictEqual(str.length, size);
  });

  it('should generate a string using only characters from the default alphabet', () => {
    const size = 10;
    const alphabet = platform.ALPHABET.ALPHA_DIGIT;

    const str = platform.generateString(size, alphabet);

    for (let char of str) {
      assert.ok(alphabet.includes(char), `Character ${char} is not in the alphabet`);
    }
  });
});
