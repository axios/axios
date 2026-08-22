import { describe, it, afterEach } from 'vitest';
import assert from 'assert';
import utils from '../../../lib/utils.js';

describe('utils::inherits', () => {
  let savedDescriptor;

  afterEach(() => {
    // Restore Error.prototype.toJSON to whatever it was before the test.
    if (savedDescriptor !== undefined) {
      Object.defineProperty(Error.prototype, 'toJSON', savedDescriptor);
    } else if (Object.prototype.hasOwnProperty.call(Error.prototype, 'toJSON')) {
      delete Error.prototype.toJSON;
    }
    savedDescriptor = undefined;
  });

  it('should set up prototype chain and constructor reference', () => {
    function Parent() {}
    Parent.prototype.greet = function () {
      return 'hello';
    };

    function Child() {}
    utils.inherits(Child, Parent);

    assert.strictEqual(Child.prototype.constructor, Child);
    assert.strictEqual(Child.super, Parent.prototype);
    assert.strictEqual(new Child().greet(), 'hello');
  });

  it('should copy props onto the child prototype', () => {
    function Parent() {}
    function Child() {}
    utils.inherits(Child, Parent, {
      foo() {
        return 42;
      },
    });

    assert.strictEqual(new Child().foo(), 42);
  });

  it('should not throw when a non-writable inherited property shares a name with props', () => {
    // Simulate a third-party library freezing Error.prototype.toJSON as non-writable.
    // utils.inherits must use Object.defineProperty semantics (not [[Set]]) so it
    // can write directly to the child prototype without tripping over the inherited
    // non-writable descriptor.
    savedDescriptor = Object.getOwnPropertyDescriptor(Error.prototype, 'toJSON');

    Object.defineProperty(Error.prototype, 'toJSON', {
      configurable: true,
      writable: false,
      enumerable: false,
      value: function () {
        return {};
      },
    });

    function MyError(message) {
      this.message = message;
    }

    assert.doesNotThrow(() => {
      utils.inherits(MyError, Error, {
        toJSON() {
          return { message: this.message };
        },
      });
    }, 'inherits must not throw due to non-writable inherited toJSON');

    const err = new MyError('boom');
    assert.deepStrictEqual(
      err.toJSON(),
      { message: 'boom' },
      'own toJSON on child prototype should shadow the inherited non-writable one'
    );
  });
});
