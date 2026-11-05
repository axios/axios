'use strict';

// Node-only: relies on the built-in `http2` module. Browser/react-native
// builds replace `lib/adapters/http.js` (the sole importer) with `lib/helpers/null.js`
// via the `browser` package.json field, so this module is never reached in
// those environments. Do not import it from any browser-reachable code path.

import http2 from 'http2';
import util from 'util';

class Http2Sessions {
  constructor() {
    this.sessions = Object.create(null);
    this.pendingClosePromise = null;
  }

  getSession(authority, options) {
    options = Object.assign(
      Object.create(null),
      {
        sessionTimeout: 1000,
      },
      options
    );

    let authoritySessions = this.sessions[authority];

    if (authoritySessions) {
      let len = authoritySessions.length;

      for (let i = 0; i < len; i++) {
        const [sessionHandle, sessionOptions] = authoritySessions[i];
        if (
          !sessionHandle.destroyed &&
          !sessionHandle.closed &&
          util.isDeepStrictEqual(sessionOptions, options)
        ) {
          return sessionHandle;
        }
      }
    }

    const session = http2.connect(authority, options);

    let removed;
    let timer;

    const removeSession = () => {
      if (removed) {
        return;
      }

      removed = true;

      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      this.removeSession(authority, session);
    };

    const originalRequestFn = session.request;

    const { sessionTimeout } = options;

    if (sessionTimeout != null) {
      let streamsCount = 0;

      session.request = function () {
        const stream = originalRequestFn.apply(this, arguments);

        streamsCount++;

        if (timer) {
          clearTimeout(timer);
          timer = null;
        }

        stream.once('close', () => {
          if (!--streamsCount && !removed) {
            timer = setTimeout(() => {
              timer = null;
              removeSession();
            }, sessionTimeout);
          }
        });

        return stream;
      };
    }

    session.once('close', removeSession);
    session.once('error', removeSession);
    session.once('goaway', removeSession);

    let entry = [session, options];

    authoritySessions
      ? authoritySessions.push(entry)
      : (authoritySessions = this.sessions[authority] = [entry]);

    return session;
  }

  removeSession(authority, sessionHandle) {
    const entries = this.sessions[authority];

    if (!entries) {
      return;
    }

    const len = entries.length;
    let i = len;

    while (i--) {
      if (entries[i][0] === sessionHandle) {
        if (len === 1) {
          delete this.sessions[authority];
        } else {
          entries.splice(i, 1);
        }
        if (!sessionHandle.closed) {
          sessionHandle.close();
        }
        return;
      }
    }
  }

  closeAll({ timeout } = {}) {
    const closing = [];

    for (const authority of Object.keys(this.sessions)) {
      const entries = this.sessions[authority];

      delete this.sessions[authority];

      for (const [session] of entries) {
        if (!session.destroyed) {
          closing.push(session);
        }
      }
    }

    const shutdown = Promise.all(closing.map((session) => this.closeSession(session, timeout))).then(() => { });

    this.pendingClosePromise = this.pendingClosePromise
      ? Promise.all([this.pendingClosePromise, shutdown]).then(() => { })
      : shutdown;

    return this.pendingClosePromise;
  }

  closeSession(session, timeout) {
    const closed = new Promise((resolve) => {
      // Node marks closed=true as soon as close() is requested, while
      // in-flight streams still drain; wait for the 'close' event.
      session.once('close', resolve);
      if (!session.closed) {
        session.close();
      }
    });

    if (timeout != null && timeout > 0) {
      let timer;
      const forced = new Promise((resolve) => {
        timer = setTimeout(() => {
          if (!session.destroyed) {
            session.destroy();
          }
          resolve();
        }, timeout);
      });

      return Promise.race([closed, forced]).finally(() => clearTimeout(timer));
    }

    return closed;
  }

}

export default Http2Sessions;
