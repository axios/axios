import utils from './../utils.js';
import platform from '../platform/index.js';

// Check if cookieStore API is available
// use cookieStore API instead of document.cookie to avoid jank. see https://github.com/whatwg/html/issues/11658
const cookieStoreAPI = typeof window !== 'undefined' ? window.cookieStore : undefined;
const hasCookieStore = platform.hasStandardBrowserEnv && typeof cookieStoreAPI !== 'undefined';

const syncCookies = platform.hasStandardBrowserEnv ?

  // Standard browser envs support document.cookie
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
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    },

    remove(name) {
      this.write(name, '', Date.now() - 86400000, '/');
    }
  }

  :

  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {},
    read() {
      return null;
    },
    remove() {}
  };

const asyncCookies = {
    async write(name, value, expires, path, domain, secure, sameSite) {
      if (hasCookieStore) {
        try {
          const cookieOptions = {
            name,
            value: encodeURIComponent(value),
            path, // default is /
            sameSite // default is Lax
          };

          if (utils.isNumber(expires)) {
            cookieOptions.expires = new Date(expires).toUTCString();
          }

          if (utils.isString(domain)) {
            cookieOptions.domain = domain;
          }

          if (secure === true) {
            cookieOptions.secure = true;
          }

          await cookieStoreAPI.set(cookieOptions);
          return;
        } catch (error) {
          // Fall back to document.cookie if cookieStore fails
          console.warn('cookieStore.set failed, falling back to document.cookie:', error);
        }
      }

      // Use fallback for browsers without cookieStore or if cookieStore fails
      syncCookies.write(name, value, expires, path, domain, secure, sameSite);
    },

    async read(name) {
      if (hasCookieStore) {
        try {
          const cookie = await cookieStoreAPI.get(name);
          return cookie ? decodeURIComponent(cookie.value) : null;
        } catch (error) {
          // Fall back to document.cookie if cookieStore fails
          console.warn('cookieStore.get failed, falling back to document.cookie:', error);
        }
      }

      // Use fallback for browsers without cookieStore or if cookieStore fails
      return syncCookies.read(name);
    },

    async remove(name) {
      if (hasCookieStore) {
        try {
          await cookieStoreAPI.delete(name);
          return;
        } catch (error) {
          // Fall back to document.cookie if cookieStore fails
          console.warn('cookieStore.delete failed, falling back to document.cookie:', error);
        }
      }

      // Use fallback for browsers without cookieStore or if cookieStore fails
      syncCookies.remove(name);
    }
  }

export { asyncCookies };

export default syncCookies;