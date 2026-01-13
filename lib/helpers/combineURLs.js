'use strict';

export default function combineURLs(baseURL, relativeURL) {
  if (!relativeURL) {
    return baseURL;
  }

  // Remove trailing slashes from baseURL
  const sanitizedBase = baseURL.replace(/\/+$/, '');
  // Remove leading slashes from relativeURL
  const sanitizedRelative = relativeURL.replace(/^\/+/, '');

  const combined = sanitizedBase + '/' + sanitizedRelative;

  // 🛠️ Extra check: don't add slash at the end if it doesn't exist in original URL
  return combined.replace(/\/+$/, '');
}
