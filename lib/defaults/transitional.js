'use strict';

export default {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false,
  legacyInterceptorReqResOrdering: true,
  advertiseZstdAcceptEncoding: false,
  validateStatusUndefinedResolves: true,
  // When true (default), postForm/putForm/patchForm inject a placeholder
  // Content-Type: multipart/form-data header so adapters can overwrite it
  // with the real boundary. Set to false to let the adapter/platform set
  // the header directly (fixes React Native Android where the placeholder
  // without a boundary is rejected by the networking layer).
  formDataContentType: true,
};
