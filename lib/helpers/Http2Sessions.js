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
  }

  getSession(authority, options) {
    options = Object.assign(
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

      let entries = authoritySessions,
        len = entries.length,
        i = len;

      while (i--) {
        if (entries[i][0] === session) {
          if (len === 1) {
            delete this.sessions[authority];
          } else {
            entries.splice(i, 1);
          }
          if (!session.closed) {
            session.close();
          }
          return;
        }
      }
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
          if (!--streamsCount) {
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

    let entry = [session, options];

    authoritySessions
      ? authoritySessions.push(entry)
      : (authoritySessions = this.sessions[authority] = [entry]);

    return session;
  }
}

export default Http2Sessions;
