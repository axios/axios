import assert from 'assert';
import { progressEventReducer } from '../../../lib/helpers/progressEventReducer.js';

describe('helpers::progressEventReducer', () => {
  it('should clamp loaded/progress and avoid negative bytes for out-of-order events', () => {
    const events = [];
    const [onProgress, flush] = progressEventReducer((data) => {
      events.push(data);
    }, false, Number.POSITIVE_INFINITY);

    onProgress({ lengthComputable: true, loaded: 80, total: 100 });
    onProgress({ lengthComputable: true, loaded: 60, total: 100 });
    onProgress({ lengthComputable: true, loaded: 180, total: 100 });
    flush();

    assert.strictEqual(events.length, 3);
    assert.strictEqual(events[0].bytes, 80);
    assert.strictEqual(events[1].bytes, 0);

    const last = events[events.length - 1];
    assert.strictEqual(last.loaded, 100);
    assert.strictEqual(last.total, 100);
    assert.strictEqual(last.progress, 1);
    assert.strictEqual(last.upload, true);
    assert.strictEqual(last.bytes, 20);
  });
});
