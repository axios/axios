import utils from '../utils.js';
import platform from '../platform/index.js';

function getCookieFromDocument(name) {
  if (typeof document === 'undefined') return null;

  const cookieString = document.cookie.split(';');

  for (let i = 0; i < cookieString.length; i++) {
    const cookie = cookieString[i].replace(/^\s+/, '');
    const eq = cookie.indexOf('=');
    if (eq !== -1 && cookie.slice(0, eq) === name) {
      return decodeURIComponent(cookie.slice(eq + 1));
    }
  }

  return null;
}

const readFromCookieStore = (name) => {
  if (typeof cookieStore === 'undefined' || !utils.isFunction(cookieStore.get)) {
    return null;
  }

  return cookieStore.get(name).then(
    (cookie) => (cookie ? cookie.value : null),
    () => null
  );
};

export default platform.hasStandardBrowserEnv
  ? // Standard browser envs support document.cookie
    {
      write(name, value, expires, path, domain, secure, sameSite) {
        if (typeof document === 'undefined') return;

        const cookie = [`${name}=${encodeURIComponent(value)}`];

        if (utils.isNumber(expires)) {
          cookie.push(`expires=${new Date(expires).toUTCString()}`);
        }
        if (utils.isString(path)) {
          cookie.push(`path=${path}`);
        }
        if (utils.isString(domain)) {
          cookie.push(`domain=${domain}`);
        }
        if (secure === true) {
          cookie.push('secure');
        }
        if (utils.isString(sameSite)) {
          cookie.push(`SameSite=${sameSite}`);
        }

        document.cookie = cookie.join('; ');
      },

      read(name) {
        return getCookieFromDocument(name);
      },

      async readAsync(name) {
        const cookieStoreValue = await readFromCookieStore(name);
        if (cookieStoreValue != null) {
          return cookieStoreValue;
        }

        return getCookieFromDocument(name);
      },

      remove(name) {
        this.write(name, '', Date.now() - 86400000, '/');
      },
    }
  : // Non-standard browser env (web workers, react-native) lack needed support.
    {
      write() {},
      read() {
        return null;
      },
      async readAsync() {
        return null;
      },
      remove() {},
    };
