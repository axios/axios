import platform from '../platform/index.js';

function safeOrigin(origin) {
  try {
    return new URL(origin);
  } catch (error) {
    return null;
  }
}

export default platform.hasStandardBrowserEnv
  ? ((origin, isMSIE) => (url) => {
      if (!origin) {
        return false;
      }

      try {
        url = new URL(url, origin);
      } catch (error) {
        return false;
      }

      return (
        origin.protocol === url.protocol &&
        origin.host === url.host &&
        (isMSIE || origin.port === url.port)
      );
    })(
      safeOrigin(platform.origin),
      platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
    )
  : () => true;
