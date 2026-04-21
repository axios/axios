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
});
