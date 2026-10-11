import utils from '../utils.js';
import platform from '../platform/index.js';

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

      readAsync(name) {
        if (typeof document === 'undefined') return Promise.resolve(null);

        // Prefer the asynchronous Cookie Store API when available so XSRF reads
        // stay off the main thread. cookieStore deals in raw values, unlike the
        // document.cookie encoding quirk, so no decodeURIComponent here.
        try {
          const store =
            typeof window !== 'undefined' ? window.cookieStore : undefined;

          if (store && utils.isFunction(store.get)) {
            return store
              .get(name)
              .then(
                (entry) => (entry ? entry.value : null),
                () => this.read(name)
              );
          }
        } catch (e) {
          // fall through to the synchronous path
        }

        return Promise.resolve(this.read(name));
      },

      read(name) {
        if (typeof document === 'undefined') return null;
        // Match name=value by splitting on the semicolon separator instead of building a
        // RegExp from `name` — interpolating an unescaped string into a RegExp would let
        // metacharacters (e.g. `.+?` in an attacker-influenced cookie name) cause ReDoS or
        // match the wrong cookie. Browsers may serialize cookie pairs as either ";" or
        // "; ", so ignore optional whitespace before each cookie name.
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].replace(/^\s+/, '');
          const eq = cookie.indexOf('=');
          if (eq !== -1 && cookie.slice(0, eq) === name) {
            try {
              return decodeURIComponent(cookie.slice(eq + 1));
            } catch (e) {
              return cookie.slice(eq + 1);
            }
          }
        }
        return null;
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
      readAsync() {
        return Promise.resolve(null);
      },
      remove() {},
    };
