import settle from '../../../lib/core/settle';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('core::settle', function() {
  let resolve;
  let reject;

  beforeEach(function() {
    resolve = jasmine.createSpy('resolve');
    reject = jasmine.createSpy('reject');
  });

  it('should resolve promise if status is not set', function() {
    const response = {
      config: {
        validateStatus: function() {
          return true;
        }
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should resolve promise if validateStatus is not set', function() {
    const response = {
      status: 500,
      config: {
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should resolve promise if validateStatus returns true', function() {
    const response = {
      status: 500,
      config: {
        validateStatus: function() {
          return true;
        }
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should reject promise if validateStatus returns false', function() {
    const req = {
      path: '/foo'
    };
    const response = {
      status: 500,
      config: {
        validateStatus: function() {
          return false;
        }
      },
      request: req
    };
    settle(resolve, reject, response);
    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalled();
    const reason = reject.calls.first().args[0];
    expect(reason instanceof Error).toBe(true);
    expect(reason.message).toBe('Request failed with status code 500');
    expect(reason.config).toBe(response.config);
    expect(reason.request).toBe(req);
    expect(reason.response).toBe(response);
  });

  it('should pass status to validateStatus', function() {
    const validateStatus = jasmine.createSpy('validateStatus');
    const response = {
      status: 500,
      config: {
        validateStatus: validateStatus
      }
    };
    settle(resolve, reject, response);
    expect(validateStatus).toHaveBeenCalledWith(500);
  });

  it('should handle status 0 correctly - validate if validateStatus is provided', function() {
    const response = {
      status: 0,
      config: {
        validateStatus: function(status) {
          return status === 0; // Allow status 0 (e.g., file: protocol)
        }
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should handle status 0 correctly - reject if validateStatus returns false', function() {
    const req = {
      path: '/foo'
    };
    const response = {
      status: 0,
      config: {
        validateStatus: function() {
          return false; // Reject status 0
        }
      },
      request: req
    };
    settle(resolve, reject, response);
    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalled();
    const reason = reject.calls.first().args[0];
    expect(reason.message).toBe('Request failed with status code 0');
  });

  it('should handle null status correctly', function() {
    const response = {
      status: null,
      config: {
        validateStatus: function() {
          return false;
        }
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should handle undefined status correctly', function() {
    const response = {
      status: undefined,
      config: {
        validateStatus: function() {
          return false;
        }
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should use ERR_BAD_REQUEST for 4xx status codes', function() {
    const req = {
      path: '/foo'
    };
    const response = {
      status: 404,
      config: {
        validateStatus: function() {
          return false;
        }
      },
      request: req
    };
    settle(resolve, reject, response);
    expect(reject).toHaveBeenCalled();
    const reason = reject.calls.first().args[0];
    expect(reason.code).toBe(AxiosError.ERR_BAD_REQUEST);
  });

  it('should use ERR_BAD_RESPONSE for 5xx status codes', function() {
    const req = {
      path: '/foo'
    };
    const response = {
      status: 500,
      config: {
        validateStatus: function() {
          return false;
        }
      },
      request: req
    };
    settle(resolve, reject, response);
    expect(reject).toHaveBeenCalled();
    const reason = reject.calls.first().args[0];
    expect(reason.code).toBe(AxiosError.ERR_BAD_RESPONSE);
  });

  it('should use ERR_BAD_RESPONSE for other error status codes', function() {
    const req = {
      path: '/foo'
    };
    const response = {
      status: 600, // Non-standard status code
      config: {
        validateStatus: function() {
          return false;
        }
      },
      request: req
    };
    settle(resolve, reject, response);
    expect(reject).toHaveBeenCalled();
    const reason = reject.calls.first().args[0];
    expect(reason.code).toBe(AxiosError.ERR_BAD_RESPONSE);
  });
});
