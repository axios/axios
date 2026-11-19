import { describe, expect, it, vi } from 'vitest';
import axios from '../../index.js';

describe('synchronous request interceptor thenables', () => {
  function setup(onRejected, legacyInterceptorReqResOrdering) {
    const adapter = vi.fn(async (config) => ({
      data: 'sent',
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    const client = axios.create({
      adapter,
      transitional: { legacyInterceptorReqResOrdering },
    });
    client.interceptors.request.use(
      () => {
        throw new Error('interceptor failed');
      },
      onRejected,
      { synchronous: true }
    );
    return { client, adapter };
  }

  for (const legacyOrdering of [true, false]) {
    describe(`legacy ordering: ${legacyOrdering}`, () => {
      it.each(['object', 'function'])(
        'assimilates a rejecting %s thenable without catch',
        async (kind) => {
          const failure = new Error('rejected recovery');
          const then = vi.fn((resolve, reject) => reject(failure));
          const thenable = kind === 'function' ? Object.assign(() => {}, { then }) : { then };
          const { client, adapter } = setup(() => thenable, legacyOrdering);
          const onResponseRejected = vi.fn((error) => {
            throw error;
          });
          client.interceptors.response.use(undefined, onResponseRejected);

          await expect(client.get('/test')).rejects.toBe(failure);
          expect(then).toHaveBeenCalledOnce();
          expect(adapter).not.toHaveBeenCalled();
          expect(onResponseRejected).toHaveBeenCalledWith(failure);
        }
      );

      it('waits for fulfillment and keeps the last valid config', async () => {
        let fulfill;
        const then = vi.fn((resolve) => {
          fulfill = resolve;
        });
        const { client, adapter } = setup(() => ({ then }), legacyOrdering);
        const request = client.get('/original');
        await Promise.resolve();
        expect(then).toHaveBeenCalledOnce();
        expect(adapter).not.toHaveBeenCalled();
        fulfill({ url: '/replacement' });
        const response = await request;
        expect(response.config.url).toBe('/original');
        expect(adapter).toHaveBeenCalledOnce();
      });

      it('ignores a catch getter when assimilating a thenable', async () => {
        const failure = new Error('rejected recovery');
        const catchGetter = vi.fn(() => {
          throw new Error('catch was read');
        });
        const thenable = {
          then(resolve, reject) {
            reject(failure);
          },
        };
        Object.defineProperty(thenable, 'catch', { get: catchGetter });
        const { client, adapter } = setup(() => thenable, legacyOrdering);
        await expect(client.get('/test')).rejects.toBe(failure);
        expect(catchGetter).not.toHaveBeenCalled();
        expect(adapter).not.toHaveBeenCalled();
      });

      it('rejects when invoking then throws', async () => {
        const failure = new Error('then failed');
        const { client, adapter } = setup(
          () => ({
            then() {
              throw failure;
            },
          }),
          legacyOrdering
        );
        await expect(client.get('/test')).rejects.toBe(failure);
        expect(adapter).not.toHaveBeenCalled();
      });

      it.each([undefined, { then: 1 }, { catch() {} }])(
        'preserves synchronous recovery for %j',
        async (result) => {
          const { client, adapter } = setup(() => result, legacyOrdering);
          const response = await client.get('/original');
          expect(response.config.url).toBe('/original');
          expect(adapter).toHaveBeenCalledOnce();
        }
      );
    });
  }
});
