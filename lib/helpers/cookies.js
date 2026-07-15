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

      async readAsync(name) {
        if (typeof window !== 'undefined' && window.cookieStore) {
          const cookie = await window.cookieStore.get(name);
          return cookie ? cookie.value : null;
        }
        return this.read(name);
      },

      async writeAsync(name, value, expires, path, domain, secure, sameSite) {
        if (typeof window !== 'undefined' && window.cookieStore) {
          const options = {
            name,
            value
          };
          if (utils.isNumber(expires)) {
            options.expires = expires;
          }
          if (utils.isString(path)) {
            options.path = path;
          }
          if (utils.isString(domain)) {
            options.domain = domain;
          }
          if (secure === true) {
            options.secure = true;
          }
          if (utils.isString(sameSite)) {
            options.sameSite = sameSite.toLowerCase();
          }
          await window.cookieStore.set(options);
          return;
        }
        this.write(name, value, expires, path, domain, secure, sameSite);
      },

      async removeAsync(name) {
        if (typeof window !== 'undefined' && window.cookieStore) {
          await window.cookieStore.delete(name);
          return;
        }
        this.remove(name);
      }
    }
  : // Non-standard browser env (web workers, react-native) lack needed support.
    {
      write() {},
      read() {
        return null;
      },
      remove() {},
      async readAsync() {
        return null;
      },
      async writeAsync() {},
      async removeAsync() {}
    };
