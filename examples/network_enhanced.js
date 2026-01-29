import axios from 'axios';

function enhanceNetworkError(error) {
  // when Offline (no internet)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    error.code = 'ERR_NO_INTERNET';
    error.detailedMessage =
      'No internet connection detected. Please check your connection and try again.';
  }

  // when DNS failure occurs (invalid domain)
  else if (error.code === 'ENOTFOUND' || /dns/i.test(error.message)) {
    error.code = 'ERR_DNS_FAILURE';
    error.detailedMessage =
      'Unable to reach the requested domain. Please verify the URL or your network settings.';
  }

  // when Connection refused by server
  else if (error.code === 'ECONNREFUSED' || /refused/i.test(error.message)) {
    error.code = 'ERR_CONNECTION_REFUSED';
    error.detailedMessage =
      'Connection was refused by the server. It may be temporarily unavailable.';
  }

  // when Request timeout happens
  else if (error.code === 'ETIMEDOUT' || /timeout/i.test(error.message)) {
    error.code = 'ERR_TIMEOUT';
    error.detailedMessage =
      'The request took too long to respond. Please try again later.';
  }

  // when CORS restriction happens (for browser only)
  else if (/CORS/i.test(error.message)) {
    error.code = 'ERR_CORS_BLOCKED';
    error.detailedMessage =
      'The request was blocked due to cross-origin restrictions.';
  }

  // when Server-side error occurs 
  else if (error.response && error.response.status >= 500) {
    error.code = 'ERR_SERVER';
    error.detailedMessage =
      'A server-side issue occurred. Please try again later.';
  }

  // when Client-side error occurs
  else if (error.response && error.response.status >= 400) {
    error.code = 'ERR_CLIENT';
    error.detailedMessage =
      'A client-side error occurred. Please check your request.';
  }

  //  when unknown network issue occurs
  else {
    error.code = 'ERR_NETWORK_GENERIC';
    error.detailedMessage =
      'A network issue occurred. Please check your connection or try again later.';
  }

  return error;
}


export function createEnhancedClient(config = {}) {
  const client = axios.create(config);

  client.interceptors.response.use(
    response => response,
    error => {
      throw enhanceNetworkError(error);
    }
  );

  return client;
}

export default enhanceNetworkError;
