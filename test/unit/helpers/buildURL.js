"use strict";

var assert = require("assert");
var buildURL = require("../../../lib/helpers/buildURL");

describe("helpers::buildURL", function () {
  afterEach(function () {
    delete Object.prototype.encode;
    delete Object.prototype.serialize;
  });

  it("should ignore inherited params serializer options", function () {
    Object.defineProperty(Object.prototype, "encode", {
      value: function () {
        return "polluted";
      },
      configurable: true,
    });
    Object.defineProperty(Object.prototype, "serialize", {
      value: function () {
        return "polluted=1";
      },
      configurable: true,
    });

    assert.strictEqual(buildURL("/foo", { a: "b c" }, {}), "/foo?a=b+c");
  });
});
