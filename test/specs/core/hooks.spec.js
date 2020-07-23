var Hooks = require('../../../lib/core/hooks');
var axios = require('../../../index');

describe('hooks', function() {
  function returnPromise(check, value) {
    return new Promise(function(resolve, reject) {
      if (!check) {
        resolve(value || true);
      } else {
        reject(value || false);
      }
    });
  }

  it('should be able to assign hooks', function() {
    var a = new Hooks();
    a.hook('hook1', function() {});
    expect(typeof a.hook1).toEqual('function');
  });

  it('should run without pres, posts and beforeError when not present', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(1);
      done();
    }, 100);
  });

  it('should run with pres when present', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.pre('save', function(next) {
      this.preValue = 2;
      next();
    });
    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(1);
      expect(a.preValue).toEqual(2);
      done();
    }, 100);
  });

  it('should run with posts when present', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.post('save', function(next) {
      this.value = 2;
      next();
    });
    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(2);
      done();
    }, 100);
  });

  it('should run with beforeError when present', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.beforeError('save', function(next) {
      next();
    });
    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(1);
      done();
    }, 100);
  });

  it('should run pres, posts and beforeError when present', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.pre('save', function(next) {
      this.preValue = 2;
      next();
    });
    a.post('save', function(next) {
      this.value = 3;
      next();
    });
    a.beforeError('save', function(next) {
      next();
    });
    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(3);
      expect(a.preValue).toEqual(2);
      done();
    }, 100);
  });

  it('should run posts after pres', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.pre('save', function(next) {
      this.override = 100;
      next();
    });
    a.post('save', function(next) {
      this.override = 200;
      next();
    });
    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(1);
      expect(a.override).toEqual(200);
      done();
    }, 100);
  });

  it('should not run a hook if a pre fails', function() {
    var a = new Hooks();
    var counter = 0;
    a.hook(
      'save',
      function() {
        this.value = 1;
      },
      function() {
        counter++;
      }
    );
    a.pre('save', function(next) {
      next(new Error());
    });
    a.save();
    expect(counter).toEqual(1);
    expect(typeof a.value).toEqual('undefined');
  });

  it('should be able to run multiple pres', function() {
    var a = new Hooks();

    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.pre('save', function(next) {
      this.v1 = 1;
      next();
    });
    a.pre('save', function(next) {
      this.v2 = 2;
      next();
    });
    a.save();
    expect(a.v1).toEqual(1);
    expect(a.v2).toEqual(2);
  });

  it('should run multiple pres until a pre fails and not call the hook', function() {
    var a = new Hooks();

    a.hook(
      'save',
      function() {
        this.value = 1;
        return returnPromise();
      },
      function() {}
    );
    a.pre('save', function(next) {
      this.v1 = 1;
      next();
    });
    a.pre('save', function(next) {
      next(new Error());
    });
    a.pre('save', function(next) {
      this.v3 = 3;
      next();
    });

    a.save();
    expect(a.v1).toEqual(1);
    expect(typeof a.v3).toEqual('undefined');
    expect(typeof a.value).toEqual('undefined');
  });

  it('should be able to run multiple posts', function(done) {
    var a = new Hooks();

    a.hook('save', function() {
      this.value = 1;
      return returnPromise();
    });
    a.post('save', function(next) {
      this.value = 2;
      next();
    })
      .post('save', function(next) {
        this.value = 3.14;
        next();
      })
      .post('save', function(next) {
        this.v3 = 3;
        next();
      });

    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(3.14);
      expect(a.v3).toEqual(3);
      done();
    }, 100);
  });

  it('should run only posts up until an error', function(done) {
    var a = new Hooks();

    a.hook(
      'save',
      function() {
        this.value = 1;
        return returnPromise();
      },
      function() {}
    );
    a.post('save', function(next) {
      this.value = 2;
      next();
    })
      .post('save', function(next) {
        this.value = 3;
        next(new Error());
      })
      .post('save', function(next) {
        this.value = 4;
        next();
      });

    a.save();
    setTimeout(function() {
      expect(a.value).toEqual(3);
      done();
    });
  });

  it('should fall back second to the default error handler if specified', function() {
    var a = new Hooks();

    var counter = 0;
    a.hook(
      'save',
      function() {
        this.value = 1;
      },
      function(err) {
        if (err instanceof Error) counter++;
      }
    );
    a.pre('save', function(next) {
      next(new Error());
    });

    a.save();
    expect(counter).toEqual(1);
    expect(a.value).toEqual(undefined);
  });

  it('should proceed without mutating arguments if `next(null|undefined)` is called in a serial pre', function() {
    var a = new Hooks();

    var counter = 0;
    a.hook('save', function(callback) {
      this.value = 1;
      callback();
      return returnPromise();
    });
    a.pre('save', function(next) {
      next();
    });
    a.pre('save', function(next) {
      next();
    });

    a.save(function(err) {
      if (err instanceof Error) counter++;
      else counter--;
    });
    expect(counter).toEqual(-1);
    expect(a.value).toEqual(1);
  });

  it('should proceed with mutating arguments if `next(null|undefined)` is callback in a serial pre, and the last argument of the target method is not a function', function() {
    var a = new Hooks();

    a.hook('set', function(v) {
      this.value = v;
      return returnPromise();
    });
    a.pre('set', function(next) {
      next(undefined);
    });
    a.pre('set', function(next) {
      next(null);
    });

    a.set(1);
    expect(a.value).toEqual(null);
  });

  it('should not run any posts if a pre fails', function() {
    var a = new Hooks();

    a.hook(
      'save',
      function() {
        this.value = 2;
      },
      function() {}
    );
    a.pre('save', function(next) {
      this.value = 1;
      next(new Error());
    }).post('save', function(next) {
      this.value = 3;
      next();
    });

    a.save();
    expect(a.value).toEqual(1);
  });

  it('hooked funtion return value should be passed to the post', function(done) {
    var a = new Hooks();

    a.hook('set', function() {
      return returnPromise(false, { val1: 'hello', val2: 'world' });
    });
    a.post('set', function(next, data) {
      expect(data.val1).toEqual('hello');
      expect(data.val2).toEqual('world');
      next();
      done();
    });
    a.set();
  });

  it("pres should be able to modify and pass on a modified version of the hook's arguments", function() {
    var a = new Hooks();

    a.hook('set', function(path, val) {
      this[path] = val;
      expect(arguments[2]).toEqual('optional');
      return returnPromise();
    });
    a.pre('set', function(next) {
      next('foo', 'bar');
    });
    a.pre('set', function(next, path, val) {
      expect(path).toEqual('foo');
      expect(val).toEqual('bar');
      next('rock', 'says', 'optional');
    });
    a.pre('set', function(next, path, val, opt) {
      expect(path).toEqual('rock');
      expect(val).toEqual('says');
      expect(opt).toEqual('optional');
      next();
    });

    a.set('hello', 'world');
    expect(typeof a.hello).toEqual('undefined');
    expect(a.rock).toEqual('says');
  });

  it('calling the hook next multiple times should have the effect of only calling it once', function(done) {
    var a = new Hooks();
    var counter = 0;
    a.hook('ack', function() {
      counter++;
      return returnPromise();
    });
    a.pre('ack', function(next) {
      next();
      next();
    });
    a.ack();
    setTimeout(function() {
      expect(counter).toEqual(1);
      done();
    });
  });

  it('should run beforeError when hooked function return a promise rejection', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise(true);
    });
    a.beforeError('save', function(next) {
      next(new Error('my error'));
    }).post('save', function(next) {
      this.value = 3;
      next();
    });
    a.save()
      .then()
      .catch(function(err) {
        expect(err.message).toEqual('my error');
        expect(a.value).toEqual(1);
        done();
      });
  });

  it('should not run any posts if hooked function return a promise rejection', function(done) {
    var a = new Hooks();
    a.hook('save', function() {
      this.value = 1;
      return returnPromise(true, { message: 'my error' });
    });
    a.post('save', function(next) {
      this.value = 3;
      next();
    });
    a.save()
      .then()
      .catch(function(err) {
        expect(err.message).toEqual('my error');
        expect(a.value).toEqual(1);
        done();
      });
  });

  it('should register beforeRequest hooks', function(done) {
    var a = new Hooks();
    var hook = {
      beforeRequest: [
        function(next) {
          this.value = 1;
          next();
        }
      ]
    };
    var registered = a.register(hook, function save() {
      this.value++;
      return returnPromise(false, { message: 'my value' });
    });
    expect(registered).toEqual(true);
    a.save()
      .then(function(res) {
        expect(res.message).toEqual('my value');
        expect(a.value).toEqual(2);
        done();
      })
      .catch();
  });

  it('should register beforeError hooks', function(done) {
    var a = new Hooks();
    var hook = {
      beforeError: [
        function(next) {
          next(new Error('new error'));
        }
      ]
    };
    var registered = a.register(hook, function save() {
      return returnPromise(true, { message: 'my error' });
    });
    expect(registered).toEqual(true);
    a.save()
      .then()
      .catch(function(err) {
        expect(err.message).toEqual('new error');
        done();
      });
  });

  it('should register afterResponse hooks', function(done) {
    var a = new Hooks();
    var hook = {
      afterResponse: [
        function(next, res) {
          this.value++;
          expect(res.message).toEqual('my value');
          next(100);
        }
      ]
    };
    var registered = a.register(hook, function save() {
      this.value = 1;
      return returnPromise(false, { message: 'my value' });
    });
    expect(registered).toEqual(true);
    a.save()
      .then(function(res) {
        expect(res).toEqual(100);
        expect(a.value).toEqual(2);
        done();
      })
      .catch();
  });

  it('should not register if hooks is (null | undefined | {})', function() {
    var a = new Hooks();
    var hook = {};
    var registered = a.register(hook, function() {});
    expect(registered).toEqual(false);
  });

  it('should not register if all hooks are empty array', function() {
    var a = new Hooks();
    var hook = {
      beforeRequest: [],
      beforeError: [],
      afterResponse: []
    };
    var registered = a.register(hook, function() {});
    expect(registered).toEqual(false);
  });

  it('should not register if non of the hook is a function', function() {
    var a = new Hooks();
    var hook = {
      beforeRequest: [1],
      beforeError: [{}, {}],
      afterResponse: ['a', 'b', 'c']
    };
    var registered = a.register(hook, function() {});
    expect(registered).toEqual(false);
  });
  it('should not register if all hooks are empty array', function() {
    var a = new Hooks();
    var hook = {
      beforeRequest: [function() {}],
      beforeError: [],
      afterResponse: []
    };
    var registered = a.register(hook, '');
    expect(registered).toEqual(false);
  });

  it('should register errorHandler if passed', function() {
    var a = new Hooks();
    var errorMsg;
    var hook = {
      beforeRequest: [
        function(next) {
          next(new Error('error1'));
        }
      ],
      beforeError: [],
      afterResponse: []
    };
    hook.errorHandler = function(err) {
      expect(err.message).toEqual('error1');
      errorMsg = 'error2';
    };
    // };
    var registered = a.register(hook, function save() {});
    expect(registered).toEqual(true);
    a.save();
    expect(errorMsg).toEqual('error2');
  });

  it('should register hook if present in the axios request config', function() {
    var errorMsg;
    var hooks = {
      beforeRequest: [
        function(next) {
          next(new Error('error1'));
        }
      ],
      beforeError: [],
      afterResponse: []
    };
    hooks.errorHandler = function(err) {
      expect(err.message).toEqual('error1');
      errorMsg = 'error2';
    };
    axios({
      url: '/foo',
      hooks: hooks
    });
    expect(errorMsg).toEqual('error2');
  });
});
