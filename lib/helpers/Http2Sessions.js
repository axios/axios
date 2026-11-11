'use strict';

// Node-only: relies on the built-in `http2` module. Browser/react-native
// builds replace `lib/adapters/http.js` (the sole importer) with `lib/helpers/null.js`
// via the `browser` package.json field, so this module is never reached in
// those environments. Do not import it from any browser-reachable code path.

import http2 from 'http2';
import util from 'util';

class Http2Sessions {
  constructor() {
    // authority -> [[session, options], ...]
    this.sessions = Object.create(null);
    // Sessions that are closing but may still drain in-flight streams.
    // Per the Node docs, `close()` sets `closed` right away while the
    // 'close' event only fires once every open stream has finished
    // (and `destroy()` also emits 'close'). Each session maps to a
    // promise resolved by that event.
    this.closing = new Map();
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
        // The session leaves the pool while its in-flight streams may
        // still be draining (e.g. after a GOAWAY); keep it tracked until
        // it emits 'close' so a later shutdown can await or destroy it.
        if (!sessionHandle.closed) {
          this.closeSession(sessionHandle);
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

    const targets = new Set();

    // Empty the pool and close every live session in it.
    for (const authority of Object.keys(this.sessions)) {
      const entries = this.sessions[authority];

      delete this.sessions[authority];

      for (const [session] of entries) {
        if (!session.destroyed) {
          targets.add(session);
        }
      }
    }

    // Sessions removed from the pool earlier (GOAWAY, errors, idle expiry)
    // are still tracked in `closing` until they emit 'close'; include them.
    for (const session of this.closing.keys()) {
      if (!session.destroyed) {
        targets.add(session);
      }
    }

    let shutdown = Promise.all([
      this.pendingClosePromise,
      Promise.all([...targets].map((session) => this.closeSession(session))),
    ]).then(() => { });

    if (Number.isFinite(timeout) && timeout >= 0) {
      shutdown = this.awaitCloseOrDestroy(shutdown, timeout);
    }

    this.pendingClosePromise = shutdown;

    return shutdown;
  }

  // Tracks `session` in `closing` until it emits 'close' and returns the
  // promise resolved by that event. One promise (and one listener) per
  // session: overlapping shutdown calls share it instead of stacking
  // listeners. The listener must be registered before any close() call,
  // since a session may emit 'close' synchronously.
  trackUntilClosed(session) {
    let closed = this.closing.get(session);

    if (!closed) {
      closed = new Promise((resolve) => {
        session.once('close', () => {
          this.closing.delete(session);
          resolve();
        });
      });
      this.closing.set(session, closed);
    }

    return closed;
  }

  // Gracefully close a session and wait for its 'close' event, which Node
  // emits only after every in-flight stream has drained. Calling it on an
  // already-closing session just awaits that event.
  closeSession(session) {
    const closed = this.trackUntilClosed(session);

    if (!session.closed) {
      session.close();
    }

    return closed;
  }

  // Bounds a shutdown wait: if the tracked sessions are still draining
  // after `timeout` ms, destroy them so the promise can settle.
  awaitCloseOrDestroy(shutdown, timeout) {
    const bounded = [...this.closing.keys()];

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        for (const session of bounded) {
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
