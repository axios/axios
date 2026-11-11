import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { echoHeaders } from '../../../setup/adapters.js';

const cjsAxios = createRequire(import.meta.url)('axios');

describe('header buckets across package exports', () => {
  for (const [name, client, otherClient] of [
    ['ESM', axios, cjsAxios],
    ['CommonJS', cjsAxios, axios],
  ]) {
    for (const [shape, Headers] of [
      ['instances', otherClient.AxiosHeaders],
      ['subclasses', class extends otherClient.AxiosHeaders {}],
    ]) {
      it(`should preserve foreign AxiosHeaders ${shape} as buckets in the ${name} client`, async () => {
        expect(client.AxiosHeaders).not.toBe(otherClient.AxiosHeaders);
        const instance = client.create({
          adapter: echoHeaders,
          headers: {
            common: new Headers({ 'X-Common': 'common' }),
            post: new Headers({ Authorization: 'Bearer TEST_ONLY' }),
          },
        });

        for (const method of ['get', 'post']) {
          const { config } = await instance.request({
            url: '/header-buckets',
            method,
            headers: { Link: Buffer.from('<https://example.com/resource>; rel="type"') },
          });

          expect(config.headers.get('X-Common')).toBe('common');
          expect(config.headers.get('Authorization')).toBe(
            method === 'post' ? 'Bearer TEST_ONLY' : undefined
          );
          expect(config.headers.get('Link')).toBe('<https://example.com/resource>; rel="type"');
          expect(config.headers.has('common')).toBe(false);
          expect(config.headers.has('post')).toBe(false);
        }
      });
    }
  }
});
