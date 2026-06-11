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
});
