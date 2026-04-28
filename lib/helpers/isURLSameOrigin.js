import platform from '../platform/index.js';

export default ((origin, isMSIE) => (url, url2 = origin) => {
      url = new URL(url, origin);

      return (
        url2.protocol === url.protocol &&
        url2.hostname === url.hostname &&
        (isMSIE || url2.port === url.port)
      );
    })(
      new URL(platform.origin),
      platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
    );
