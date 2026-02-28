import assert from 'assert';
import { progressEventReducer } from '../../../lib/helpers/progressEventReducer.js';

describe('helpers::progressEventReducer', () => {
  it('should clamp loaded and progress when loaded exceeds total', (done) => {
    const events = [];
    const [onProgress, flush] = progressEventReducer((data) => {
      events.push(data);
    }, false, 1000);

    onProgress({ lengthComputable: true, loaded: 1, total: 100 });
    onProgress({ lengthComputable: true, loaded: 180, total: 100 });

    setTimeout(() => {
      flush();
      const last = events[events.length - 1];

      assert.strictEqual(last.loaded, 100);
      assert.strictEqual(last.total, 100);
      assert.strictEqual(last.progress, 1);
      assert.strictEqual(last.upload, true);
      assert.ok(last.bytes >= 0);
      done();
    }, 10);
  });
});
