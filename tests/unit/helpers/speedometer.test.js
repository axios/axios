import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import speedometer from '../../../lib/helpers/speedometer.js';

describe('helpers::speedometer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a function', () => {
    const speed = speedometer();
    expect(typeof speed).toBe('function');
  });

  it('should return undefined before minimum time elapsed', () => {
    const speed = speedometer(10, 1000);
    const result = speed(100);
    expect(result).toBeUndefined();
  });

  it('should calculate speed after minimum time elapsed', () => {
    const speed = speedometer(10, 500);

    speed(1000);
    vi.advanceTimersByTime(600);
    speed(2000);

    vi.advanceTimersByTime(600);
    const result = speed(3000);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('should use default samplesCount of 10', () => {
    const speed = speedometer();

    // Push more than 10 samples to test circular buffer wrapping
    for (let i = 0; i < 15; i++) {
      vi.advanceTimersByTime(200);
      speed(100);
    }

    // After min time (default 1000ms), should return a value
    const result = speed(100);
    expect(result).toBeDefined();
  });

  it('should use default min of 1000ms', () => {
    const speed = speedometer(10);

    speed(500);
    vi.advanceTimersByTime(500);
    expect(speed(500)).toBeUndefined(); // Still under 1000ms

    vi.advanceTimersByTime(600);
    const result = speed(500);
    expect(result).toBeDefined();
  });

  it('should handle custom min of 0', () => {
    const speed = speedometer(10, 0);

    speed(1000);
    vi.advanceTimersByTime(100);
    // With min=0, but startedAt won't be defined on first call
    // After second sample with time elapsed, it should work
    vi.advanceTimersByTime(100);
    speed(1000);

    vi.advanceTimersByTime(100);
    const result = speed(1000);
    expect(result).toBeDefined();
  });

  it('should return a numeric rate after sufficient samples and time', () => {
    const speed = speedometer(10, 0);

    speed(1000);
    vi.advanceTimersByTime(500);
    speed(1000);
    vi.advanceTimersByTime(500);
    const result = speed(1000);

    expect(result).toBeDefined();
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });
});
