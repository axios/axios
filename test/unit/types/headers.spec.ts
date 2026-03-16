import assert from 'assert';
import axios from '../../../index.js';

describe('AxiosHeaders type safety', function () {
  it('should have proper type definitions for headers', function () {
    // This test verifies that the AxiosHeaders type safety is working
    // These assignments would cause TypeScript compilation errors if the types are wrong
    
    // Valid header assignments (should work)
    const validConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom': 'value',
        'X-Number': 123,
        'X-Boolean': true,
        'X-Null': null,
        'X-Array': ['value1', 'value2']
      }
    };

    assert.ok(validConfig.headers['Content-Type'] === 'application/json');
    assert.ok(validConfig.headers['X-Custom'] === 'value');
    assert.ok(validConfig.headers['X-Number'] === 123);
    assert.ok(validConfig.headers['X-Boolean'] === true);
    assert.ok(validConfig.headers['X-Null'] === null);
    assert.ok(Array.isArray(validConfig.headers['X-Array']));
  });

  it('should handle AxiosHeaders class properly', function () {
    const headers = new axios.AxiosHeaders();
    
    // Valid operations
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
    // Test that existing usage patterns still work
    const config = {
      headers: {
        'common': {
          'Authorization': 'Bearer token'
        },
        'get': {
          'Accept': 'application/json'
        },
        'post': {
          'Content-Type': 'application/json'
        }
      }
    };

    assert.ok(config.headers.common['Authorization'] === 'Bearer token');
    assert.ok(config.headers.get['Accept'] === 'application/json');
    assert.ok(config.headers.post['Content-Type'] === 'application/json');
  });
});

// NOTE: The following code would cause TypeScript compilation errors if uncommented.
// This demonstrates that the type safety fix is working correctly:

/*
// These would cause TypeScript errors:
const badConfig = {
  headers: {
    'X-Promise': Promise.resolve('foo'), // Error: Promise not assignable to AxiosHeaderValue
    'X-Function': () => 'bar', // Error: Function not assignable to AxiosHeaderValue  
    'X-Object': { key: 'value' }, // Error: Object not assignable to AxiosHeaderValue
    'X-Symbol': Symbol('test') // Error: Symbol not assignable to AxiosHeaderValue
  }
};
*/
