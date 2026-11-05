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
    this.draining = new Set();
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

  closeAll(options) {
    // Only an own `timeout` property on the caller-supplied options is
    // honored; inherited values must not affect behavior.
    const timeout =
      options != null && Object.prototype.hasOwnProperty.call(options, 'timeout')
        ? options.timeout
        : undefined;
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

    let shutdown = Promise.all([
      this.pendingClosePromise,
      Promise.all(closing.map((session) => this.closeSession(session))),
    ]).then(() => { });

    if (timeout != null && timeout > 0) {
      shutdown = this.awaitSessionCloseOrDestroy(shutdown, timeout);
    }

    this.pendingClosePromise = shutdown;

    return shutdown;
  }

  closeSession(session) {
    return new Promise((resolve) => {
      this.draining.add(session);
      session.once('close', () => {
        this.draining.delete(session);
        resolve();
      });
      // Node marks closed=true as soon as close() is requested, while
      // in-flight streams still drain; wait for the 'close' event.
      if (!session.closed) {
        session.close();
      }
    });
  }

  awaitSessionCloseOrDestroy(shutdown, timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        for (const session of this.draining) {
          if (!session.destroyed) {
            session.destroy();
          }
        }
      }, timeout);

      shutdown.finally(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

}

export default Http2Sessions;
