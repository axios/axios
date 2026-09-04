/**
 * Adapter that resolves without performing a request and echoes the resolved
 * config back on the response, so tests can assert on the outgoing headers.
 */
export const echoHeaders = async (config) => ({
  data: null,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
  request: {},
});
