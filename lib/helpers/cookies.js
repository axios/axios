 'use strict';

import utils from '../utils.js';
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
  /**
   * Set a cookie with the given name, value, and path/domain/s, if any.
   * @param {string} name - The cookie name
   * @param {string} value - The cookie value
   * @param {number} expires - The cookie expiration time, in seconds since the epoch
   * @param {string} path - The cookie path, or '/' to use the default path
   * @param {string} domain - The cookie domain, or '' to use the default domain
   * @param {boolean} secure - Whether the cookie should be sent over over HTTPS
   * @param {string} sameSite - The SameSite attribute, or '' to use the default value
   */
  async write(name, value, expires, path, domain, secure, sameSite) {
    if (hasCookieStore) {
      try {
        const cookieOptions = {
          name,
          value: encodeURIComponent(value),
          path: path || '/',  // default is /
          sameSite: sameSite || 'Lax' // default is Lax
        };

        if (utils.isNumber(expires)) {
          cookieOptions.expires = expires;
        }

        if (utils.isString(domain)) {
          cookieOptions.domain = domain;
        }

        if (secure === true) {
          cookieOptions.secure = true;
        }

        await cookieStoreAPI.set(cookieOptions);
        return;
      } catch (e) {
        // Fall back to document.cookie if cookieStore fails
      }
    }

    // Use fallback for browsers without cookieStore or if cookieStore fails
    syncCookies.write(name, value, expires, path, domain, secure, sameSite);
  },

  /**
   * Get the value of a cookie with the given name.
   * @param {string} name - The cookie name
   * @returns {string|null} - The cookie value, or null if not found
   */
  async read(name) {
    if (hasCookieStore) {
      try {
        const cookie = await cookieStoreAPI.get(name);
        return cookie ? decodeURIComponent(cookie.value) : null;
      } catch (e) {
        // Fall back to document.cookie if cookieStore fails
      }
    }

    // Use fallback for browsers without cookieStore or if cookieStore fails
    return syncCookies.read(name);
  },

  /**
   * Remove a cookie with the given name.
   * @param {string} name - The cookie name
   */
  async remove(name) {
    if (hasCookieStore) {
      try {
        await cookieStoreAPI.delete(name);
        return;
      } catch (e) {
        // Fall back to document.cookie if cookieStore fails
      }
    }

    // Use fallback for browsers without cookieStore or if cookieStore fails
    syncCookies.remove(name);
  }
}

export { asyncCookies };

export default syncCookies;