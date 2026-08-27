"use strict";

var assert = require("assert");
var FormData = require("form-data");
var toFormData = require("../../../lib/helpers/toFormData");
var AxiosError = require("../../../lib/core/AxiosError");

function buildDeep(depth) {
  var head = {};
  var cur = head;

  for (var i = 0; i < depth; i++) {
    cur.x = {};
    cur = cur.x;
  }

  return head;
}

describe("helpers::toFormData", function () {
  describe("depth limit", function () {
    it("should throw a bounded error for deeply nested payloads instead of overflowing the stack", function () {
      var payload = { leaf: 1 };
      for (var i = 0; i < 2500; i++) {
        payload = { a: payload };
      }

      assert.throws(
        function () {
          toFormData(payload, new FormData());
        },
        function (err) {
          return err && /Maximum object depth/.test(err.message);
        },
      );
    });

    it("should depth-check objects stringified by the meta token", function () {
      assert.throws(
        function () {
          toFormData({ "evil{}": buildDeep(10000) }, new FormData());
        },
        function (err) {
          return err && err.code === AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED;
        },
      );
    });

    it("should accept payloads well under the depth cap", function () {
      var payload = { leaf: 1 };
      for (var i = 0; i < 50; i++) {
        payload = { a: payload };
      }

      assert.doesNotThrow(function () {
        toFormData(payload, new FormData());
      });
    });
  });

  describe("inherited option properties", function () {
    function clearPollution() {
      delete Object.prototype.visitor;
      delete Object.prototype.maxDepth;
      delete Object.prototype.dots;
      delete Object.prototype.indexes;
      delete Object.prototype.metaTokens;
      delete Object.prototype.Blob;
    }

    function recorder() {
      var keys = [];

      return {
        keys: keys,
        append: function append(key) {
          keys.push(key);
        }
      };
    }

    // toFormData only considers a Blob implementation at all when the target
    // looks like a spec-compliant FormData, so the Blob test needs one.
    function specCompliantRecorder() {
      var form = recorder();

      form[Symbol.toStringTag] = "FormData";
      form[Symbol.iterator] = function values() {
        return form.keys[Symbol.iterator]();
      };

      return form;
    }

    beforeEach(clearPollution);
    afterEach(clearPollution);

    it("should not use an inherited visitor", function () {
      var seen = [];

      Object.prototype.visitor = function pollutedVisitor(value, key, path, helpers) {
        seen.push(key);
        return helpers.defaultVisitor.call(this, value, key, path);
      };

      toFormData({ user: "john", secret: "s3cr3t" }, recorder());

      assert.deepStrictEqual(seen, []);
    });

    it("should not use an inherited maxDepth", function () {
      Object.prototype.maxDepth = 1;

      assert.doesNotThrow(function () {
        toFormData({ a: { b: { c: "value" } } }, recorder());
      });
    });

    it("should still honour an explicit maxDepth", function () {
      Object.prototype.maxDepth = 100;

      assert.throws(
        function () {
          toFormData({ a: { b: { c: "value" } } }, recorder(), { maxDepth: 1 });
        },
        function (error) {
          return error instanceof AxiosError &&
            error.code === AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED;
        }
      );
    });

    it("should not use an inherited Blob implementation", function () {
      // The Blob option is only ever read as a truthiness gate, so the polluted
      // constructor is never called and cannot be observed directly. What it
      // does change is whether the serializer runs in Blob mode, and that
      // decides whether a Blob value is rejected.
      //
      // The bare global Blob has to be taken out of the picture first, and
      // deleting it is not enough: the global object inherits from
      // Object.prototype too, so the pollution would simply resurface there.
      // Shadow it with an own undefined property instead, which leaves the
      // option lookup as the only possible source of a Blob implementation.
      var globalBlob = Object.getOwnPropertyDescriptor(global, "Blob");

      Object.defineProperty(global, "Blob", {
        value: undefined,
        writable: true,
        enumerable: false,
        configurable: true
      });

      try {
        Object.prototype.Blob = function PollutedBlob() {};

        assert.strictEqual(
          typeof Blob,
          "undefined",
          "the global Blob must be out of reach for this test to prove anything"
        );

        var form = specCompliantRecorder();
        var blobLike = {};
        blobLike[Symbol.toStringTag] = "Blob";

        // The caller passes an options object that says nothing about Blob, so
        // the only place a Blob implementation could come from is the prototype.
        assert.throws(
          function () {
            toFormData({ file: blobLike }, form, {});
          },
          function (error) {
            return error instanceof AxiosError &&
              /Blob is not supported/.test(error.message);
          }
        );

        assert.deepStrictEqual(form.keys, []);
      } finally {
        if (globalBlob) {
          Object.defineProperty(global, "Blob", globalBlob);
        } else {
          delete global.Blob;
        }
      }
    });

    it("should not let a polluted key mask a caller option", function () {
      // Merging the options onto a plain object used a plain object as its
      // "already copied" cache too, so any truthy inherited value made the
      // caller's own option look like it had been copied already and the
      // serializer silently fell back to the default key format.
      Object.prototype.dots = "polluted";

      var form = recorder();
      toFormData({ a: { b: "c" } }, form, { dots: true });

      assert.deepStrictEqual(form.keys, ["a.b"]);
    });

    it("should keep default key formatting when a format flag is polluted", function () {
      Object.prototype.dots = true;
      Object.prototype.indexes = true;

      var form = recorder();
      toFormData({ a: { b: "c" } }, form);

      assert.deepStrictEqual(form.keys, ["a[b]"]);
    });
  });
});
