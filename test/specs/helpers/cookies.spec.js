import syncCookies, { asyncCookies } from '../../../lib/helpers/cookies';

describe('helpers::cookies', function () {
  afterEach(function () {
    // Remove all the cookies
    const expires = Date.now() - (60 * 60 * 24 * 7);
    document.cookie.split(';').map(function (cookie) {
      return cookie.split('=')[0];
    }).forEach(function (name) {
      document.cookie = name + '=; expires=' + new Date(expires).toGMTString();
    });
  });

  it('[sync] should write cookies', async function () {
    syncCookies.write('foo', 'baz');
    expect(document.cookie).toEqual('foo=baz');
  });

  it('[sync] should read cookies', async function () {
    syncCookies.write('foo', 'abc');
    syncCookies.write('bar', 'def');
    expect(syncCookies.read('foo')).toEqual('abc');
    expect(syncCookies.read('bar')).toEqual('def');
  });

  it('[sync] should remove cookies', async function () {
    syncCookies.write('foo', 'bar');
    syncCookies.remove('foo');
    expect(syncCookies.read('foo')).toEqual(null);
  });

  it('[sync] should uri encode values', async function () {
    syncCookies.write('foo', 'bar baz%');
    expect(document.cookie).toEqual('foo=bar%20baz%25');
  });

  it('[async] should write cookies', async function () {
    await asyncCookies.write('foo', 'baz');
    expect(document.cookie).toEqual('foo=baz');
  });

  it('[async] should read cookies', async function () {
    await asyncCookies.write('foo', 'abc');
    await asyncCookies.write('bar', 'def');
    expect(await asyncCookies.read('foo')).toEqual('abc');
    expect(await asyncCookies.read('bar')).toEqual('def');
  });

  it('[async] should remove cookies', async function () {
    await asyncCookies.write('foo', 'bar');
    await asyncCookies.remove('foo');
    expect(await asyncCookies.read('foo')).toEqual(null);
  });

  it('[async] should uri encode values', async function () {
    await asyncCookies.write('foo', 'bar baz%');
    expect(document.cookie).toEqual('foo=bar%20baz%25');
  });
});
