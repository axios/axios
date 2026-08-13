import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  it('should clamp negative loaded values to zero', () => {
    const events = [];
    const [onProgress, flush] = progressEventReducer((data) => {
      events.push(data);
    }, false, Number.POSITIVE_INFINITY);

    onProgress({ lengthComputable: true, loaded: -5, total: 10 });
    flush();

    expect(events.length).toBe(1);
    expect(events[0].loaded).toBe(0);
    expect(events[0].progress).toBe(0);
    expect(events[0].bytes).toBe(0);
  });

  it('should clamp negative loaded values to zero when length is not computable', () => {
    const events = [];
    const [onProgress, flush] = progressEventReducer((data) => {
      events.push(data);
    }, false, Number.POSITIVE_INFINITY);

    onProgress({ lengthComputable: false, loaded: -5 });
    flush();

    expect(events.length).toBe(1);
    expect(events[0].loaded).toBe(0);
    expect(events[0].progress).toBeUndefined();
    expect(events[0].bytes).toBe(0);
  });

  describe('force with a fresh event', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should deliver a fresh progress event even when nothing is pending', () => {
      const events = [];
      const [onProgress, , force] = progressEventReducer((data) => {
        events.push(data);
      }, true, 1);

      onProgress({ lengthComputable: false, loaded: 10 });
      force({ lengthComputable: false, loaded: 30 });

      expect(events.length).toBe(2);
      expect(events[1].loaded).toBe(30);
      expect(events[1].download).toBe(true);
    });

    it('should prefer a fresh progress event over the pending one and clear it', () => {
      const events = [];
      const [onProgress, flush, force] = progressEventReducer((data) => {
        events.push(data);
      }, true, 1);

      onProgress({ lengthComputable: false, loaded: 10 });
      onProgress({ lengthComputable: false, loaded: 20 });
      force({ lengthComputable: false, loaded: 30 });

      expect(events.length).toBe(2);
      expect(events[1].loaded).toBe(30);

      flush();
      vi.runAllTimers();

      expect(events.length).toBe(2);
    });

    it('should replay the pending event without inspecting a loaded-shaped flush argument', () => {
      const events = [];
      const [onProgress, flush] = progressEventReducer((data) => {
        events.push(data);
      }, true, 1);

      onProgress({ lengthComputable: false, loaded: 10 });
      onProgress({ lengthComputable: false, loaded: 20 });
      flush(Object.assign(new Error('stream error'), { loaded: 30 }));

      expect(events.length).toBe(2);
      expect(events[1].loaded).toBe(20);
    });

    it('should not inspect arbitrary flush arguments', () => {
      const events = [];
      const [onProgress, flush] = progressEventReducer((data) => {
        events.push(data);
      }, true, 1);
      const reason = {};

      Object.defineProperty(reason, 'loaded', {
        get() {
          throw new Error('loaded must not be read');
        },
      });

      onProgress({ lengthComputable: false, loaded: 10 });
      onProgress({ lengthComputable: false, loaded: 20 });

      expect(() => flush(reason)).not.toThrow();

      expect(events.length).toBe(2);
      expect(events[1].loaded).toBe(20);
    });
  });
});
