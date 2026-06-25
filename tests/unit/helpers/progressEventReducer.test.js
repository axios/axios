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

  it('should ignore malformed events that lack a numeric loaded value', () => {
    const events = [];
    const [onProgress, flush] = progressEventReducer((data) => {
      events.push(data);
    }, false, Number.POSITIVE_INFINITY);

    onProgress(undefined);
    onProgress(null);
    onProgress({});
    onProgress({ loaded: null, total: 100, lengthComputable: true });
    onProgress({ loaded: 'abc', total: 100, lengthComputable: true });
    flush();

    expect(events.length).toBe(0);

    onProgress({ lengthComputable: true, loaded: 50, total: 100 });
    flush();

    expect(events.length).toBe(1);
    expect(events[0].loaded).toBe(50);
    expect(events[0].bytes).toBe(50);
  });
});
