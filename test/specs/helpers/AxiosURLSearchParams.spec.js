import AxiosURLSearchParams from '../../../lib/helpers/AxiosURLSearchParams';

describe('helpers::AxiosURLSearchParams', function () {
  it('should pass the AxiosURLSearchParams instance as `this` to a custom encoder', function () {
    const params = new AxiosURLSearchParams({foo: 'bar', baz: 'qux'});
    const capturedThis = [];

    const serialized = params.toString(function customEncoder(value, defaultEncode) {
      capturedThis.push(this);
      return defaultEncode(value);
    });

    expect(serialized).toEqual('foo=bar&baz=qux');
    expect(capturedThis).toEqual([params, params, params, params]);
  });
});
