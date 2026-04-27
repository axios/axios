import { describe, expect, it, vi } from 'vitest';

import settle from '../../lib/core/settle.js';
import AxiosError from '../../lib/core/AxiosError.js';

describe('core::settle (vitest browser)', () => {
  it('resolves when response status is missing', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      config: {
        validateStatus: () => true,
      },
    };

    settle(resolve, reject, response);

    expect(resolve).toHaveBeenCalledOnce();
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('resolves when validateStatus is not configured', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      status: 500,
      config: {},
    };

    settle(resolve, reject, response);

    expect(resolve).toHaveBeenCalledOnce();
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('resolves when validateStatus returns true', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      status: 500,
      config: {
        validateStatus: () => true,
      },
    };

    settle(resolve, reject, response);

    expect(resolve).toHaveBeenCalledOnce();
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('rejects with an AxiosError when validateStatus returns false', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const request = {
      path: '/foo',
    };
    const response = {
      status: 500,
      config: {
        validateStatus: () => false,
      },
      request,
    };

    settle(resolve, reject, response);

    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledOnce();

    const reason = reject.mock.calls[0][0];
    expect(reason).toBeInstanceOf(AxiosError);
    expect(reason.message).toBe('Request failed with status code 500');
    expect(reason.code).toBe(AxiosError.ERR_BAD_RESPONSE);
    expect(reason.config).toBe(response.config);
    expect(reason.request).toBe(request);
    expect(reason.response).toBe(response);
  });

  it('passes response status to validateStatus', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const validateStatus = vi.fn();
    const response = {
      status: 500,
      config: {
        validateStatus,
      },
    };

    settle(resolve, reject, response);

    expect(validateStatus).toHaveBeenCalledOnce();
    expect(validateStatus).toHaveBeenCalledWith(500);
  });

  it('sets duration to a positive number when requestedAt is present', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const now = Date.now();
    const response = {
      status: 200,
      config: {
        validateStatus: () => true,
        requestedAt: now - 100,
      },
    };

    settle(resolve, reject, response);

    expect(resolve).toHaveBeenCalledOnce();
    const resolvedResponse = resolve.mock.calls[0][0];
    expect(resolvedResponse.duration).toBeDefined();
    expect(typeof resolvedResponse.duration).toBe('number');
    expect(resolvedResponse.duration).toBeGreaterThan(0);
  });

  it('sets duration on rejected response when validateStatus returns false', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const now = Date.now();
    const request = {
      path: '/foo',
    };
    const response = {
      status: 500,
      config: {
        validateStatus: () => false,
        requestedAt: now - 100,
      },
      request,
    };

    settle(resolve, reject, response);

    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalledOnce();

    const reason = reject.mock.calls[0][0];
    expect(reason).toBeInstanceOf(AxiosError);
    expect(reason.response).toBeDefined();
    expect(reason.response.duration).toBeDefined();
    expect(typeof reason.response.duration).toBe('number');
    expect(reason.response.duration).toBeGreaterThan(0);
  });

  it('calculates duration within reasonable error range', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const now = Date.now();
    const elapsedMs = 100;
    const response = {
      status: 200,
      config: {
        validateStatus: () => true,
        requestedAt: now - elapsedMs,
      },
    };

    settle(resolve, reject, response);

    const resolvedResponse = resolve.mock.calls[0][0];
    expect(resolvedResponse.duration).toBeGreaterThanOrEqual(elapsedMs);
    expect(resolvedResponse.duration).toBeLessThan(elapsedMs + 50);
  });

  it('does not set duration when requestedAt is not present', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      status: 200,
      config: {
        validateStatus: () => true,
      },
    };

    settle(resolve, reject, response);

    expect(resolve).toHaveBeenCalledOnce();
    const resolvedResponse = resolve.mock.calls[0][0];
    expect(resolvedResponse.duration).toBeUndefined();
  });
});
