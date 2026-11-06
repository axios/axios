import { afterEach, describe, expect, it, vi } from 'vitest';
import speedometer from '../../../lib/helpers/speedometer.js';
import { progressEventReducer } from '../../../lib/helpers/progressEventReducer.js';

describe('helpers::speedometer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each([1500, 100000])('ignores a wall-clock adjustment to %s', (adjustedTime) => {
    let time = 1000;
    const wallClock = vi.spyOn(Date, 'now').mockImplementation(() => time);
    vi.stubGlobal('performance', { now: () => time });
    const sample = speedometer(3, 0);

    sample(100);
    time = 2000;
    expect(sample(100)).toBe(100);
    time = 3000;
    expect(sample(100)).toBe(100);
    time = 4000;
    wallClock.mockReturnValue(adjustedTime);

    expect(sample(100)).toBe(100);
  });

  it('supports a monotonic clock that starts at zero', () => {
    let time = 0;
    vi.stubGlobal('performance', { now: () => time });
    vi.spyOn(Date, 'now').mockImplementation(() => time);
    const sample = speedometer(3, 1000);

    expect(sample(100)).toBeUndefined();
    time = 500;
    expect(sample(100)).toBeUndefined();
    time = 1000;
    expect(sample(100)).toBe(200);
  });

  it.each([undefined, {}])('falls back when performance.now is unavailable: %s', (performance) => {
    let time = 1000;
    vi.stubGlobal('performance', performance);
    vi.spyOn(Date, 'now').mockImplementation(() => time);
    const sample = speedometer(3, 0);

    expect(sample(100)).toBeUndefined();
    time = 2000;
    expect(sample(100)).toBe(100);
  });

  it('does not report a negative rate if the fallback wall clock moves backwards', () => {
    let time = 1000;
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockImplementation(() => time);
    const sample = speedometer(3, 0);

    sample(100);
    time = 2000;
    sample(100);
    time = 3000;
    sample(100);
    time = 1500;

    expect(sample(100)).toBeUndefined();
  });

  it('discards fallback samples from the future after a clock correction', () => {
    let time = 1000;
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockImplementation(() => time);
    const sample = speedometer(3, 0);

    sample(100);
    time = 100000;
    sample(100);
    time = 2000;
    expect(sample(100)).toBeUndefined();
    time = 3000;
    expect(sample(100)).toBe(100);
  });

  it('restarts the minimum sampling interval after a fallback clock correction', () => {
    let time = 1000;
    vi.stubGlobal('performance', undefined);
    vi.spyOn(Date, 'now').mockImplementation(() => time);
    const sample = speedometer(3, 1000);

    sample(100);
    time = 100000;
    sample(100);
    time = 2000;
    expect(sample(100)).toBeUndefined();
    time = 2500;
    expect(sample(100)).toBeUndefined();
    time = 3000;
    expect(sample(100)).toBe(200);
  });

  it('keeps progress rate and remaining time stable after a wall-clock adjustment', () => {
    let time = 1000;
    const wallClock = vi.spyOn(Date, 'now').mockImplementation(() => time);
    vi.stubGlobal('performance', { now: () => time });
    const events = [];
    const [, , force] = progressEventReducer((event) => events.push(event), true);

    for (let i = 0; i < 51; i++) {
      time = 1000 + i * 1000;
      force({ loaded: (i + 1) * 100, total: 10000, lengthComputable: true });
    }
    time = 52000;
    wallClock.mockReturnValue(2000);
    force({ loaded: 5200, total: 10000, lengthComputable: true });

    expect(events.at(-1).rate).toBe(100);
    expect(events.at(-1).estimated).toBe(48);
  });
});
