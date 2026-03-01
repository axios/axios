import { describe, it } from 'vitest';
import assert from 'assert';
import fromDataURI from '../../lib/helpers/fromDataURI.js';

describe('helpers::fromDataURI', () => {
  it('should return buffer from data uri', () => {
    const buffer = Buffer.from('123');

    const dataURI = 'data:application/octet-stream;base64,' + buffer.toString('base64');

    assert.deepStrictEqual(fromDataURI(dataURI, false), buffer);
  });
});
