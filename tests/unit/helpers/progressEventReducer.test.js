import { describe, it, expect } from 'vitest';
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

    expect(events.length).toBe(3);
    expect(events[0].bytes).toBe(80);
    expect(events[1].bytes).toBe(0);

    const last = events[events.length - 1];
    expect(last.loaded).toBe(100);
    expect(last.total).toBe(100);
    expect(last.progress).toBe(1);
    expect(last.upload).toBe(true);
    expect(last.bytes).toBe(20);
  });
});
