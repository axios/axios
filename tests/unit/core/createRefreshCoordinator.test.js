import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosError, createRefreshCoordinator } from '../../../index.js';

function make401Error(config, status = 401) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    config,
    null,
    { status, statusText: status === 401 ? 'Unauthorized' : 'Error', headers: {}, config, data: {} }
  );
}

describe('core::createRefreshCoordinator', () => {
  it('validates refreshFn and cooldownMs options', () => {
    expect(() => createRefreshCoordinator(null)).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { cooldownMs: -1 })).toThrowError(AxiosError);
    expect(() => createRefreshCoordinator(() => {}, { cooldownMs: Number.NaN })).toThrowError(AxiosError);
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

  it('reuses cached token within cooldownMs and resets cleanly', async () => {
    let counter = 0;
    const refreshFn = vi.fn(async () => `token-${++counter}`);
    const coordinator = createRefreshCoordinator(refreshFn, { cooldownMs: 5000 });

    expect(await coordinator.refresh()).toBe('token-1');
    expect(await coordinator.refresh()).toBe('token-1');
    expect(refreshFn).toHaveBeenCalledTimes(1);

    coordinator.reset();
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

    // 1. Proactive timer starts refreshing in the background
    const proactive = coordinator.refresh();

    // 2. Two API requests fail with 401 in the same tick while refresh is in-flight
    const req1 = client.get('/profile', { headers: { Authorization: `Bearer ${currentToken}` } });
    const req2 = client.get('/orders', { headers: { Authorization: `Bearer ${currentToken}` } });

    // Give microtasks a tick to hit the 401 interceptor
    await new Promise((r) => setTimeout(r, 10));
    expect(refreshFn).toHaveBeenCalledTimes(1);

    // 3. Complete the single shared refresh
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
});
