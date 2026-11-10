import { afterEach, describe, expect, it, vi } from 'vitest';
import { progressEventReducer } from '../../lib/helpers/progressEventReducer.js';

describe('progress rate timing', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([2000, 100000])('ignores a wall-clock adjustment to %s', (adjustedTime) => {
    let time = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => time);
    const wallClock = vi.spyOn(Date, 'now').mockImplementation(() => time);
    const events = [];
    const [, , force] = progressEventReducer((event) => events.push(event), true);

    for (let i = 0; i < 51; i++) {
      time = 1000 + i * 1000;
      force({ loaded: (i + 1) * 100, total: 10000, lengthComputable: true });
    }

    time = 52000;
    wallClock.mockReturnValue(adjustedTime);
    force({ loaded: 5200, total: 10000, lengthComputable: true });

    expect(events.at(-1).rate).toBe(100);
    expect(events.at(-1).estimated).toBe(48);
  });
});
