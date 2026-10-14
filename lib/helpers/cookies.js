import utils from '../utils.js';
import platform from '../platform/index.js';

const decodeCookieValue = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
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
        if (typeof document === 'undefined') return null;
        const cookieString = document.cookie;
        if (!cookieString) return null;
        // Match name=value by splitting on the semicolon separator instead of building a
        // RegExp from `name` — interpolating an unescaped string into a RegExp would let
        // metacharacters (e.g. `.+?` in an attacker-influenced cookie name) cause ReDoS or
        // match the wrong cookie. Browsers may serialize cookie pairs as either ";" or
        // "; ", so ignore optional whitespace before each cookie name.
        const cookies = cookieString.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].replace(/^\s+/, '');
          const eq = cookie.indexOf('=');
          if (eq !== -1 && cookie.slice(0, eq) === name) {
            return decodeCookieValue(cookie.slice(eq + 1));
          }
        }
        return null;
      },

      async readAsync(name) {
        try {
          const store = typeof window !== 'undefined' && window.cookieStore;
          if (store && utils.isFunction(store.get)) {
            const cookie = await store.get(name);
            // Both APIs expose stored bytes; preserve Axios's existing URI decoding.
            return cookie ? decodeCookieValue(cookie.value) : null;
          }
        } catch (e) {
          // Restricted or unavailable storage retains the synchronous fallback.
        }

        return this.read(name);
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
