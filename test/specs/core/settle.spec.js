var settle = require('../../../lib/core/settle');

describe('core::settle', function() {
  var resolve;
  var reject;

  beforeEach(function() {
    resolve = jasmine.createSpy('resolve');
    reject = jasmine.createSpy('reject');
  });

  it('should resolve promise if status is not set', function() {
    var response = {
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

  it('should resolve promise if validateStatus set null', function() {
    var response = {
      status: 500,
      config: {
        validateStatus: null
      }
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should reject promise if validateStatus is not set', function() {
    var req = {
      path: '/foo'
    };
    var response = {
      status: 500,
      config: {
      },
      request: req
    };
    settle(resolve, reject, response);
    expect(resolve).not.toHaveBeenCalled();
    expect(reject).toHaveBeenCalled();
    var reason = reject.calls.first().args[0];
    expect(reason instanceof Error).toBe(true);
    expect(reason.config).toBe(response.config);
    expect(reason.request).toBe(req);
    expect(reason.response).toBe(response);
    expect(reason.isAxiosError).toBe(true);
    expect(typeof reason.toJSON).toEqual('function');
    expect(reason.toJSON().message).toBe('Request failed with status code 500');
  });

  it('should resolve promise if validateStatus returns true', function() {
    var response = {
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
    var req = {
      path: '/foo'
    };
    var response = {
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
    var reason = reject.calls.first().args[0];
    expect(reason instanceof Error).toBe(true);
    expect(reason.config).toBe(response.config);
    expect(reason.request).toBe(req);
    expect(reason.response).toBe(response);
    expect(reason.isAxiosError).toBe(true);
    expect(typeof reason.toJSON).toEqual('function');
    expect(reason.toJSON().message).toBe('Request failed with status code 500');
  });

  it('should pass status to validateStatus', function() {
    var validateStatus = jasmine.createSpy('validateStatus');
    var response = {
      status: 500,
      config: {
        validateStatus: validateStatus
      }
    };
    settle(resolve, reject, response);
    expect(validateStatus).toHaveBeenCalledWith(500);
  });
});
