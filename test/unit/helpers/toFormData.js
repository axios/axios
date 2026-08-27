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
      var used = false;

      Object.prototype.Blob = function PollutedBlob() {
        used = true;
      };

      toFormData({ a: "b" }, recorder());

      assert.strictEqual(used, false);
    });

    it("should keep caller options when the same key is polluted", function () {
      Object.prototype.dots = true;

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
