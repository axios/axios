import platform from '../platform/index.js';

export default platform.hasStandardBrowserEnv
  ? ((origin) => (url) => {
      url = new URL(url, platform.origin);

      return (
        origin.protocol === url.protocol &&
        origin.host === url.host &&
        origin.port === url.port
      );
    })(new URL(platform.origin))
  : () => true;
