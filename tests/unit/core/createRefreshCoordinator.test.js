import { describe, it, expect, vi, afterEach } from 'vitest';
import axios, { AxiosError, CancelToken, CanceledError, createRefreshCoordinator } from '../../../index.js';

function make401Error(config, status = 401) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    null,
    { status, statusText: status === 401 ? 'Unauthorized' : 'Error', headers: {}, config, data: {} }
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('core::createRefreshCoordinator', () => {
  it('validates refreshFn, cooldownMs, and reserved flag names', () => {
    expect(() => createRefreshCoordinator(null)).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { cooldownMs: -1 })).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { cooldownMs: Number.NaN })).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { retryFlag: '__proto__' })).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { retryFlag: 'constructor' })).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { skipFlag: 'prototype' })).toThrowError(AxiosError);
  });

  it('coalesces concurrent proactive timer and reactive 401 refreshes into one call', async () => {
    let resolveRefresh;
    const refreshFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );

    const coordinator = axios.createRefreshCoordinator(refreshFn);
    expect(coordinator.isRefreshing()).toBe(false);

    const proactivePromise = coordinator.refresh();
    expect(coordinator.isRefreshing()).toBe(true);

    const reactivePromise = coordinator.refresh();
    expect(refreshFn).toHaveBeenCalledTimes(1);

    resolveRefresh('new-access-token');

    const [t1, t2] = await Promise.all([proactivePromise, reactivePromise]);
    expect(t1).toBe('new-access-token');
    expect(t2).toBe('new-access-token');
    expect(coordinator.isRefreshing()).toBe(false);
  });

  it('reuses cached token within cooldownMs, expires after cooldownMs, and resets cleanly', async () => {
    vi.useFakeTimers();
    let counter = 0;
    const refreshFn = vi.fn(async () => `token-${++counter}`);
    const coordinator = createRefreshCoordinator(refreshFn, { cooldownMs: 5000 });

    expect(await coordinator.refresh()).toBe('token-1');
    expect(await coordinator.refresh()).toBe('token-1');
    expect(refreshFn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5001);
    expect(await coordinator.refresh()).toBe('token-2');
    expect(refreshFn).toHaveBeenCalledTimes(2);

    coordinator.reset();
    expect(await coordinator.refresh()).toBe('token-3');
    expect(refreshFn).toHaveBeenCalledTimes(3);
  });

  it('does not repopulate cooldown cache if reset() is called while refresh is in-flight', async () => {
    let resolveFirst;
    let counter = 0;
    const refreshFn = vi.fn(() => {
      counter += 1;
      if (counter === 1) {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve(`token-${counter}`);
    });

    const coordinator = createRefreshCoordinator(refreshFn, { cooldownMs: 5000 });

    const first = coordinator.refresh();
    coordinator.reset();
    resolveFirst('stale-pre-reset-token');
    expect(await first).toBe('stale-pre-reset-token');

    // Cache must NOT have been repopulated by the pre-reset refresh
    expect(await coordinator.refresh()).toBe('token-2');
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('clears the active lock when refreshFn rejects so subsequent attempts can recover', async () => {
    const refreshFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce('recovered-token');

    const coordinator = createRefreshCoordinator(refreshFn);

    const p1 = coordinator.refresh();
    const p2 = coordinator.refresh();

    await expect(p1).rejects.toThrow('refresh failed');
    await expect(p2).rejects.toThrow('refresh failed');
    expect(coordinator.isRefreshing()).toBe(false);

    expect(await coordinator.refresh()).toBe('recovered-token');
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it('coordinates reactive 401 retries with a concurrent proactive refresh via attachInterceptor', async () => {
    let currentToken = 'expired-token';
    let resolveRefresh;
    const refreshFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = (nextToken) => {
            currentToken = nextToken;
            resolve(nextToken);
          };
        })
    );

    const coordinator = axios.createRefreshCoordinator(refreshFn);
    const seenAuthHeaders = [];

    const client = axios.create({
      baseURL: 'https://api.example.com',
      adapter: async (config) => {
        const auth = config.headers.get('Authorization');
        seenAuthHeaders.push(auth);
        if (auth === 'Bearer fresh-token') {
          return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
        }
        throw make401Error(config, 401);
      },
    });

    coordinator.attachInterceptor(client);

    const proactive = coordinator.refresh();
    const req1 = client.get('/profile', { headers: { Authorization: `Bearer ${currentToken}` } });
    const req2 = client.get('/orders', { headers: { Authorization: `Bearer ${currentToken}` } });

    await new Promise((r) => setTimeout(r, 10));
    expect(refreshFn).toHaveBeenCalledTimes(1);

    resolveRefresh('fresh-token');

    const [tokenResult, res1, res2] = await Promise.all([proactive, req1, req2]);
    expect(tokenResult).toBe('fresh-token');
    expect(res1.data).toEqual({ ok: true });
    expect(res2.data).toEqual({ ok: true });
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(seenAuthHeaders).toEqual([
      'Bearer expired-token',
      'Bearer expired-token',
      'Bearer fresh-token',
      'Bearer fresh-token',
    ]);
  });

  it('does not mutate error.config in place on retry or refresh failure', async () => {
    const refreshFn = vi.fn(async () => 'fresh-token');
    const coordinator = createRefreshCoordinator(refreshFn);

    let failedError;
    const client = axios.create({
      adapter: async (config) => {
        if (config.headers.get('Authorization') === 'Bearer fresh-token') {
          return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
        }
        throw make401Error(config, 401);
      },
    });

    // Capture the original error before coordinator handles it
    client.interceptors.response.use(undefined, (err) => {
      failedError = err;
      return Promise.reject(err);
    });
    coordinator.attachInterceptor(client);

    const res = await client.get('/me', { headers: { Authorization: 'Bearer old-token' } });
    expect(res.data).toEqual({ ok: true });
    expect(failedError.config.__isRetryRequest).toBeUndefined();
    expect(failedError.config.headers.get('Authorization')).toBe('Bearer old-token');

    const failingCoordinator = createRefreshCoordinator(async () => {
      throw new Error('refresh failed');
    });
    let rejectedFailedError;
    const failingClient = axios.create({
      adapter: async (config) => {
        throw make401Error(config, 401);
      },
    });
    failingClient.interceptors.response.use(undefined, (err) => {
      rejectedFailedError = err;
      return Promise.reject(err);
    });
    failingCoordinator.attachInterceptor(failingClient);

    await expect(
      failingClient.get('/me', { headers: { Authorization: 'Bearer old-token' } })
    ).rejects.toThrow('refresh failed');
    expect(rejectedFailedError.config.__isRetryRequest).toBeUndefined();
    expect(rejectedFailedError.config.headers.get('Authorization')).toBe('Bearer old-token');
  });

  it('ignores inherited Object.prototype properties for baseURL, skipFlag, and retryFlag', async () => {
    const refreshFn = vi.fn(async () => 'fresh-token');
    const coordinator = createRefreshCoordinator(refreshFn);

    Object.prototype.baseURL = 'https://evil.example.com';
    Object.prototype.__skipAuthRefresh = true;
    Object.prototype.__isRetryRequest = true;

    try {
      const seenHeaders = [];
      const client = axios.create({
        adapter: async (config) => {
          seenHeaders.push(config.headers.get('Authorization'));
          if (seenHeaders.length === 1) {
            throw make401Error(config, 401);
          }
          return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
        },
      });
      coordinator.attachInterceptor(client);

      await client.get('https://evil.example.com/steal');
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(seenHeaders[1]).toBeUndefined();
    } finally {
      delete Object.prototype.baseURL;
      delete Object.prototype.__skipAuthRefresh;
      delete Object.prototype.__isRetryRequest;
    }
  });

  it('does not send refreshed bearer tokens to untrusted third-party absolute URLs by default', async () => {
    const refreshFn = vi.fn(async () => 'secret-token');
    const coordinator = createRefreshCoordinator(refreshFn);
    const seenHeaders = [];

    const client = axios.create({
      baseURL: 'https://api.example.com',
      adapter: async (config) => {
        seenHeaders.push(config.headers.get('Authorization'));
        throw make401Error(config, 401);
      },
    });

    coordinator.attachInterceptor(client);

    await expect(client.get('https://evil.thirdparty.test/resource')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(seenHeaders).toEqual([undefined, undefined]);
  });

  it('bypasses refresh interceptor when skipFlag is set on refresh requests to avoid deadlock', async () => {
    const client = axios.create({
      baseURL: 'https://api.example.com',
      adapter: async (config) => {
        throw make401Error(config, 401);
      },
    });

    const coordinator = createRefreshCoordinator(async () => {
      const res = await client.post('/auth/refresh', null, { __skipAuthRefresh: true });
      return res.data.token;
    });

    coordinator.attachInterceptor(client);

    await expect(client.get('/protected')).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it('rejects canceled requests while waiting on refresh without canceling the shared refresh', async () => {
    let resolveRefresh;
    const refreshFn = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );
    const coordinator = createRefreshCoordinator(refreshFn);

    const client = axios.create({
      adapter: async (config) => {
        if (config.headers.get('Authorization') === 'Bearer fresh-token') {
          return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
        }
        throw make401Error(config, 401);
      },
    });

    coordinator.attachInterceptor(client);

    const controller = new AbortController();
    const cancelSource = CancelToken.source();

    const abortedReq = client.get('/aborted', { signal: controller.signal });
    const canceledReq = client.get('/canceled', { cancelToken: cancelSource.token });
    const activeReq = client.get('/active');

    await new Promise((r) => setTimeout(r, 10));

    controller.abort();
    cancelSource.cancel('user canceled');

    await expect(abortedReq).rejects.toBeInstanceOf(CanceledError);
    await expect(canceledReq).rejects.toBeInstanceOf(CanceledError);

    resolveRefresh('fresh-token');
    const activeRes = await activeReq;
    expect(activeRes.data).toEqual({ ok: true });
  });

  it('does not start refresh if an earlier interceptor cancels the request and rethrows 401', async () => {
    const refreshFn = vi.fn(async () => 'fresh-token');
    const coordinator = createRefreshCoordinator(refreshFn);

    const controller = new AbortController();
    const client = axios.create({
      adapter: async (config) => {
        throw make401Error(config, 401);
      },
    });

    client.interceptors.response.use(undefined, (err) => {
      controller.abort();
      return Promise.reject(err);
    });
    coordinator.attachInterceptor(client);

    await expect(
      client.get('/canceled-in-interceptor', { signal: controller.signal })
    ).rejects.toBeInstanceOf(CanceledError);
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('resolves relative baseURL against location.origin and requires https for default Authorization injection', async () => {
    const refreshFn = vi.fn(async () => 'fresh-token');
    const coordinator = createRefreshCoordinator(refreshFn);

    const originalLocation = globalThis.location;
    globalThis.location = { origin: 'https://app.example.com' };

    try {
      const seenAuthHeaders = [];
      const client = axios.create({
        baseURL: '/api',
        adapter: async (config) => {
          seenAuthHeaders.push({ url: config.url, auth: config.headers && config.headers.Authorization });
          if (seenAuthHeaders.length === 1 || seenAuthHeaders.length === 3) {
            throw make401Error(config, 401);
          }
          return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
        },
      });
      coordinator.attachInterceptor(client);

      await client.get('https://app.example.com/v1/me');
      expect(seenAuthHeaders[1]).toEqual({
        url: 'https://app.example.com/v1/me',
        auth: 'Bearer fresh-token',
      });

      await client.get('http://app.example.com/v1/me');
      expect(seenAuthHeaders[3]).toEqual({
        url: 'http://app.example.com/v1/me',
        auth: undefined,
      });
    } finally {
      if (originalLocation === undefined) {
        delete globalThis.location;
      } else {
        globalThis.location = originalLocation;
      }
    }
  });

  it('prevents unhandledRejection when an in-flight refresh rejects after waiter cancellation', async () => {
    let rejectRefresh;
    const refreshFn = vi.fn(
      () =>
        new Promise((_resolve, reject) => {
          rejectRefresh = reject;
        })
    );
    const coordinator = createRefreshCoordinator(refreshFn);

    const client = axios.create({
      adapter: async (config) => {
        throw make401Error(config, 401);
      },
    });
    coordinator.attachInterceptor(client);

    const unhandled = [];
    const onUnhandled = (reason) => unhandled.push(reason);
    process.on('unhandledRejection', onUnhandled);
    try {
      const waiterController = new AbortController();
      const pendingReq = client.get('/waiter', { signal: waiterController.signal });
      await new Promise((r) => setTimeout(r, 10));
      waiterController.abort();
      await expect(pendingReq).rejects.toBeInstanceOf(CanceledError);

      rejectRefresh(new Error('refresh exploded after cancel'));
      await new Promise((r) => setTimeout(r, 10));
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('does not loop infinitely if the retried request also returns 401', async () => {
    const refreshFn = vi.fn(async () => 'still-rejected-token');
    const coordinator = createRefreshCoordinator(refreshFn);

    const client = axios.create({
      adapter: async (config) => {
        throw make401Error(config, 401);
      },
    });

    coordinator.attachInterceptor(client);

    await expect(client.get('/protected')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for non-401 errors by default', async () => {
    const refreshFn = vi.fn(async () => 'unused');
    const coordinator = createRefreshCoordinator(refreshFn);

    const client = axios.create({
      adapter: async (config) => {
        throw make401Error(config, 500);
      },
    });

    coordinator.attachInterceptor(client);

    await expect(client.get('/server-error')).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('does not re-run transformRequest on already transformed body when retrying 401', async () => {
    const refreshFn = vi.fn(async () => 'fresh-token');
    const coordinator = createRefreshCoordinator(refreshFn);
    const seenBodies = [];

    const client = axios.create({
      transformRequest: [(data) => `payload=${data}`],
      adapter: async (config) => {
        seenBodies.push(config.data);
        if (config.headers.get('Authorization') === 'Bearer fresh-token') {
          return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
        }
        throw make401Error(config, 401);
      },
    });

    coordinator.attachInterceptor(client);

    const res = await client.post('/submit', 'x');
    expect(res.data).toEqual({ ok: true });
    expect(seenBodies).toEqual(['payload=x', 'payload=x']);
  });

  it('rejects retrying non-replayable stream bodies by default and allows retry when onRefreshed recreates the body', async () => {
    const { Readable } = await import('node:stream');
    const refreshFn = vi.fn(async () => 'fresh-token');
    const coordinator = createRefreshCoordinator(refreshFn);

    const streamClient = axios.create({
      adapter: async (config) => {
        throw make401Error(config, 401);
      },
    });
    coordinator.attachInterceptor(streamClient);

    const consumedStream = Readable.from(['hello world']);
    await expect(streamClient.post('/upload', consumedStream)).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshFn).not.toHaveBeenCalled();

    // When onRefreshed replaces `retryConfig.data` with a fresh stream, the retry succeeds.
    const recreateRefreshFn = vi.fn(async () => 'fresh-token');
    const recreateCoordinator = createRefreshCoordinator(recreateRefreshFn);
    const seenStreams = [];
    const recreateClient = axios.create({
      adapter: async (config) => {
        seenStreams.push(config.data);
        if (config.headers.get('Authorization') === 'Bearer fresh-token') {
          return { data: { uploaded: true }, status: 200, statusText: 'OK', headers: {}, config };
        }
        throw make401Error(config, 401);
      },
    });
    const firstStream = Readable.from(['chunk-1']);
    const freshStream = Readable.from(['chunk-1']);
    recreateCoordinator.attachInterceptor(recreateClient, {
      onRefreshed: (token, retryConfig) => {
        retryConfig.headers.set('Authorization', `Bearer ${token}`);
        retryConfig.data = freshStream;
      },
    });

    const uploadRes = await recreateClient.post('/upload', firstStream);
    expect(uploadRes.data).toEqual({ uploaded: true });
    expect(recreateRefreshFn).toHaveBeenCalledTimes(1);
    expect(seenStreams[0]).toBe(firstStream);
    expect(seenStreams[1]).toBe(freshStream);
  });
});
