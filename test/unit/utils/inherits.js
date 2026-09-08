'use strict';

var assert = require('assert');
var utils = require('../../../lib/utils');
var childProcess = require('child_process');
var path = require('path');

describe('utils.inherits', function () {
  var originalToJSON;
  var hadToJSON;

  beforeEach(function () {
    hadToJSON = Object.prototype.hasOwnProperty.call(Error.prototype, 'toJSON');
    originalToJSON = hadToJSON
      ? Object.getOwnPropertyDescriptor(Error.prototype, 'toJSON')
      : undefined;
  });

  afterEach(function () {
    if (hadToJSON) {
      Object.defineProperty(Error.prototype, 'toJSON', originalToJSON);
    } else {
      delete Error.prototype.toJSON;
    }
  });

  it('installs props as own writable, enumerable and configurable properties', function () {
    function Custom() {}

    var toJSON = function () {
      return {};
    };

    utils.inherits(Custom, Error, {toJSON: toJSON, flag: true});

    var descriptor = Object.getOwnPropertyDescriptor(Custom.prototype, 'toJSON');

    assert.strictEqual(descriptor.value, toJSON);
    assert.strictEqual(descriptor.writable, true);
    assert.strictEqual(descriptor.enumerable, true);
    assert.strictEqual(descriptor.configurable, true);
    assert.strictEqual(Custom.prototype.constructor, Custom);
    assert.strictEqual(Custom.prototype.flag, true);
    assert.ok(new Custom() instanceof Error);
  });

  it('works when the super prototype has a non-writable property of the same name', function () {
    // Libraries that serialize errors sometimes install a read-only
    // `Error.prototype.toJSON`; assignment would then throw and take axios
    // down with it at load time (#6690).
    Object.defineProperty(Error.prototype, 'toJSON', {
      configurable: true,
      writable: false,
      enumerable: false,
      value: function () {
        return {inherited: true};
      }
    });

    function Custom() {}

    var toJSON = function () {
      return {own: true};
    };

    assert.doesNotThrow(function () {
      utils.inherits(Custom, Error, {toJSON: toJSON});
    });

    assert.strictEqual(Custom.prototype.toJSON, toJSON);
    assert.deepStrictEqual(new Custom().toJSON(), {own: true});
  });

  it('loads axios after another library installs a read-only Error serializer', function () {
    childProcess.execFileSync(process.execPath, ['-e',
      "Object.defineProperty(Error.prototype, 'toJSON', {value: function () { return {}; }});" +
      "var axios = require(" + JSON.stringify(path.resolve(__dirname, '../../..')) + ");" +
      "var error = new axios.AxiosError('example');" +
      "require('assert').strictEqual(error.toJSON().message, 'example');"
    ]);
  });

  it('shadows inherited constructor and setter properties without invoking the setter', function () {
    var writes = 0;
    function Parent() {}
    function Child() {}
    Object.defineProperty(Parent.prototype, 'constructor', {value: Parent, writable: false});
    Object.defineProperty(Parent.prototype, 'value', {set: function () { writes++; }});
    utils.inherits(Child, Parent, {value: 42});
    assert.strictEqual(Child.prototype.constructor, Child);
    assert.strictEqual(Child.prototype.value, 42);
    assert.strictEqual(writes, 0);
  });

  it('preserves enumerable symbol properties without copying non-enumerable ones', function () {
    var visible = Symbol('visible');
    var hidden = Symbol('hidden');
    var props = {};
    function Child() {}
    props[visible] = 42;
    Object.defineProperty(props, hidden, {value: 7});
    utils.inherits(Child, Error, props);
    assert.strictEqual(Child.prototype[visible], 42);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(Child.prototype, hidden), false);
  });

  it('updates a supplied writable constructor without changing its descriptor flags', function () {
    function Parent() {}
    function Child() {}

    utils.inherits(Child, Parent, undefined, {
      constructor: {value: Parent, writable: true}
    });

    assert.deepStrictEqual(Object.getOwnPropertyDescriptor(Child.prototype, 'constructor'), {
      value: Child,
      writable: true,
      enumerable: false,
      configurable: false
    });
  });

  it('assigns the constructor through a supplied accessor', function () {
    function Parent() {}
    function Child() {}
    var received;
    var receiver;
    var descriptor = {
      set: function (value) {
        received = value;
        receiver = this;
      },
      get: undefined,
      enumerable: false,
      configurable: true
    };

    utils.inherits(Child, Parent, undefined, {constructor: descriptor});

    assert.strictEqual(received, Child);
    assert.strictEqual(receiver, Child.prototype);
    assert.deepStrictEqual(Object.getOwnPropertyDescriptor(Child.prototype, 'constructor'), descriptor);
  });

  it('rejects assignment to a supplied read-only constructor', function () {
    function Parent() {}
    function Child() {}

    assert.throws(function () {
      utils.inherits(Child, Parent, undefined, {
        constructor: {value: Parent, writable: false, configurable: true}
      });
    }, TypeError);
  });

  ['value', Symbol('value')].forEach(function (key) {
    it('updates a writable own ' + typeof key + ' property without changing its descriptor flags', function () {
      function Child() {}
      var descriptors = {};
      var props = {};
      descriptors[key] = {value: 7, writable: true};
      props[key] = 42;

      utils.inherits(Child, Error, props, descriptors);

      assert.deepStrictEqual(Object.getOwnPropertyDescriptor(Child.prototype, key), {
        value: 42,
        writable: true,
        enumerable: false,
        configurable: false
      });
    });

    it('assigns a ' + typeof key + ' property through its own accessor', function () {
      function Child() {}
      var received;
      var receiver;
      var descriptors = {};
      var props = {};
      var descriptor = {
        set: function (value) {
          received = value;
          receiver = this;
        },
        get: undefined,
        enumerable: false,
        configurable: true
      };
      descriptors[key] = descriptor;
      props[key] = 42;

      utils.inherits(Child, Error, props, descriptors);

      assert.strictEqual(received, 42);
      assert.strictEqual(receiver, Child.prototype);
      assert.deepStrictEqual(Object.getOwnPropertyDescriptor(Child.prototype, key), descriptor);
    });

    it('rejects assignment to a read-only own ' + typeof key + ' property', function () {
      function Child() {}
      var descriptors = {};
      var props = {};
      descriptors[key] = {value: 7, writable: false, configurable: true};
      props[key] = 42;

      assert.throws(function () {
        utils.inherits(Child, Error, props, descriptors);
      }, TypeError);
    });
  });
});
