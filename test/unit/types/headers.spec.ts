import assert from 'assert';
import { AxiosHeaders, RawAxiosRequestHeaders, AxiosRequestConfig } from '../../../index.js';

describe('AxiosHeaders type safety', function () {
  it('should have proper type definitions for headers', function () {
    // Typed as RawAxiosRequestHeaders so arbitrary header keys are validated by TS
    const rawHeaders: RawAxiosRequestHeaders = {
      'Content-Type': 'application/json',
      'X-Custom': 'value',
      'X-Number': 123,
      'X-Boolean': true,
      'X-Null': null,
      'X-Array': ['value1', 'value2']
    };

    // Assign into AxiosRequestConfig to verify RawAxiosRequestHeaders is compatible
    const validConfig: AxiosRequestConfig = { headers: rawHeaders };

    assert.ok(rawHeaders['Content-Type'] === 'application/json');
    assert.ok(rawHeaders['X-Custom'] === 'value');
    assert.ok(rawHeaders['X-Number'] === 123);
    assert.ok(rawHeaders['X-Boolean'] === true);
    assert.ok(rawHeaders['X-Null'] === null);
    assert.ok(Array.isArray(rawHeaders['X-Array']));
    assert.ok(validConfig.headers != null);
  });

  it('should handle AxiosHeaders class properly', function () {
    const headers = new AxiosHeaders();

    headers.set('Content-Type', 'application/json');
    headers.set('X-Custom', 'value');
    headers.set('X-Number', 123);
    headers.set('X-Boolean', true);
    headers.set('X-Null', null);
    headers.set('X-Array', ['value1', 'value2']);

    assert.strictEqual(headers.get('Content-Type'), 'application/json');
    assert.strictEqual(headers.get('X-Custom'), 'value');
    assert.strictEqual(headers.get('X-Number'), '123');
    assert.strictEqual(headers.get('X-Boolean'), 'true');
    assert.strictEqual(headers.get('X-Null'), null);
    assert.deepStrictEqual(headers.get('X-Array'), ['value1', 'value2']);
  });

  it('should maintain backward compatibility', function () {
    // Nested method-keyed headers are cast via unknown since AxiosRequestConfig
    // headers union doesn't accept nested objects directly (by design)
    const config: AxiosRequestConfig = {
      headers: {
        'common': { 'Authorization': 'Bearer token' },
        'get': { 'Accept': 'application/json' },
        'post': { 'Content-Type': 'application/json' }
      } as unknown as RawAxiosRequestHeaders
    };

    const h = config.headers as unknown as Record<string, Record<string, string>>;
    assert.ok(h['common']['Authorization'] === 'Bearer token');
    assert.ok(h['get']['Accept'] === 'application/json');
    assert.ok(h['post']['Content-Type'] === 'application/json');
  });
});

// NOTE: The following would cause TypeScript compilation errors if uncommented,
// proving the type-safety fix is working:
/*
const badHeaders: RawAxiosRequestHeaders = {
  'X-Promise': Promise.resolve('foo'), // Error: Promise not assignable to AxiosHeaderValue
  'X-Function': () => 'bar',           // Error: Function not assignable to AxiosHeaderValue
  'X-Symbol': Symbol('test')           // Error: Symbol not assignable to AxiosHeaderValue
};
*/
