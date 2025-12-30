# Overview of this document:

This document explains a simple approach to make Axios network errors more helpful and human-readable.  
By default, Axios shows a generic `"Network Error"` message for many failures.  
This can be confusing because it doesn't explain "what actually went wrong" (e.g., no internet, a timeout, a CORS issue, etc.).  

Our approach adds clear, categorised error messages for different network issues.

---

==> Problem
Axios currently throws the same `Network Error` message for many different cases:
- The Internet is disconnected  
- DNS lookup fails  
- Server is down or refusing connections  
- CORS blocked requests  
- Request timed out  

These cases all look the same to developers and users, making debugging harder.


--> Our Approach — Wrapper / Middleware

We created a small wrapper function called `enhanceNetworkError()` that:
- Detects  Common network problems using `error.code`, `error.message`, and response status.
- Adds a new field `error.detailedMessage` with a short, clear explanation.
- Assigns a new `error.code` (like `ERR_TIMEOUT`, `ERR_DNS_FAILURE`, etc.).
- Works for both browser and Node.js environments.

The wrapper is used inside an Axios instance via a Response interceptor.

-> How It Works

1. When Axios throws an error, the interceptor catches it.  
2. The `enhanceNetworkError()` function checks what type of error it is:
   - Offline → `ERR_NO_INTERNET`
   - DNS failure → `ERR_DNS_FAILURE`
   - Timeout → `ERR_TIMEOUT`
   - CORS blocked → `ERR_CORS_BLOCKED`
   - Server-side → `ERR_SERVER`
   - Client-side → `ERR_CLIENT`
   - Other → `ERR_NETWORK_GENERIC`
3. It returns a more descriptive error with both `code` and `detailedMessage`.


-> Example Usage

```javascript
const api = createEnhancedClient({ baseURL: 'https://example.com' });

api.get('/data')
  .then(res => console.log(res.data))
  .catch(err => {
    console.error(err.code);            // e.g., ERR_TIMEOUT
    console.error(err.detailedMessage); // e.g., "The request took too long to respond."
  });
```
