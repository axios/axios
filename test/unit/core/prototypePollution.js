"use strict";

var assert = require('assert');
var utils = require('../../../lib/utils');
var mergeConfig = require('../../../lib/core/mergeConfig');

describe("Prototype Pollution Protection", function () {
  function clearPollution() {
    delete Object.prototype.polluted;
    delete Object.prototype.transport;
    delete Object.prototype.transformRequest;
    delete Object.prototype.transformResponse;
    delete Object.prototype.formSerializer;
    delete Object.prototype.env;
    delete Object.prototype.parseReviver;
    delete Object.prototype.auth;
    delete Object.prototype.username;
    delete Object.prototype.password;
    delete Object.prototype.common;
    delete Object.prototype.get;
    delete Object.prototype.post;
    delete Object.prototype.set;
  }

  // Defensive: clear before and after each test so pollution leaking from
  // another suite cannot poison the first test here, and a failure mid-test
  // cannot poison the next one.
  beforeEach(clearPollution);
  afterEach(clearPollution);

  describe("utils.merge", function () {
    it("should filter __proto__ key at top level", function () {
      const result = utils.merge(
        {},
        { __proto__: { polluted: "yes" }, safe: "value" },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.safe, "value");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "__proto__"), false);
    });

    it("should filter constructor key at top level", function () {
      const result = utils.merge(
        {},
        { constructor: { polluted: "yes" }, safe: "value" },
      );

      assert.strictEqual(result.safe, "value");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "constructor"), false);
    });

    it("should filter prototype key at top level", function () {
      const result = utils.merge(
        {},
        { prototype: { polluted: "yes" }, safe: "value" },
      );

      assert.strictEqual(result.safe, "value");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "prototype"), false);
    });

    it("should filter __proto__ key in nested objects", function () {
      const result = utils.merge(
        {},
        {
          headers: {
            __proto__: { polluted: "nested" },
            "Content-Type": "application/json",
          },
        },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers["Content-Type"], "application/json");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result.headers, "__proto__"), false);
    });

    it("should filter constructor key in nested objects", function () {
      const result = utils.merge(
        {},
        {
          headers: {
            constructor: { prototype: { polluted: "nested" } },
            "Content-Type": "application/json",
          },
        },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers["Content-Type"], "application/json");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result.headers, "constructor"), false);
    });

    it("should filter prototype key in nested objects", function () {
      const result = utils.merge(
        {},
        {
          headers: {
            prototype: { polluted: "nested" },
            "Content-Type": "application/json",
          },
        },
      );

      assert.strictEqual(result.headers["Content-Type"], "application/json");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result.headers, "prototype"), false);
    });

    it("should filter dangerous keys in deeply nested objects", function () {
      const result = utils.merge(
        {},
        {
          level1: {
            level2: {
              __proto__: { polluted: "deep" },
              prototype: { polluted: "deep" },
              safe: "value",
            },
          },
        },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.level1.level2.safe, "value");
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(result.level1.level2, "__proto__"),
        false,
      );
    });

    it("should still merge regular properties correctly", function () {
      const result = utils.merge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 });

      assert.strictEqual(result.a, 1);
      assert.strictEqual(result.b.c, 2);
      assert.strictEqual(result.b.d, 3);
      assert.strictEqual(result.e, 4);
    });

    it("should handle JSON.parse payloads safely", function () {
      const malicious = JSON.parse('{"__proto__": {"polluted": "yes"}}');
      const result = utils.merge({}, malicious);

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result, "__proto__"), false);
    });

    it("should handle nested JSON.parse payloads safely", function () {
      const malicious = JSON.parse(
        '{"headers": {"constructor": {"prototype": {"polluted": "yes"}}}}',
      );
      const result = utils.merge({}, malicious);

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result.headers, "constructor"), false);
    });

    it("should create nested plain objects that do not inherit proxy credentials", function () {
      Object.prototype.auth = "polluted";
      Object.prototype.username = "polluted-user";
      Object.prototype.password = "polluted-pass";

      const result = utils.merge({}, {
        proxy: {
          host: "localhost",
          nested: {
            enabled: true,
          },
        },
      });

      assert.strictEqual(Object.getPrototypeOf(result.proxy), null);
      assert.strictEqual(Object.getPrototypeOf(result.proxy.nested), null);
      assert.strictEqual(result.proxy.auth, undefined);
      assert.strictEqual(result.proxy.username, undefined);
      assert.strictEqual(result.proxy.password, undefined);
      assert.strictEqual(result.proxy.nested.auth, undefined);
    });

    it("should not copy polluted inherited header buckets into nested headers", function () {
      Object.prototype.common = { "x-polluted-common": "yes" };
      Object.prototype.get = { "x-polluted-get": "yes" };

      const result = utils.merge({}, {
        headers: {
          common: {
            Accept: "application/json",
          },
          get: {
            "x-own-get": "yes",
          },
        },
      });

      assert.strictEqual(result.headers.common.Accept, "application/json");
      assert.strictEqual(result.headers.get["x-own-get"], "yes");
      assert.strictEqual(result.headers.common["x-polluted-common"], undefined);
      assert.strictEqual(result.headers.get["x-polluted-get"], undefined);
      assert.strictEqual(Object.getPrototypeOf(result.headers), null);
      assert.strictEqual(Object.getPrototypeOf(result.headers.common), null);
      assert.strictEqual(Object.getPrototypeOf(result.headers.get), null);
    });
  });

  describe("mergeConfig", function () {
    it("should filter dangerous keys at top level", function () {
      const result = mergeConfig(
        {},
        {
          __proto__: { polluted: "yes" },
          constructor: { polluted: "yes" },
          prototype: { polluted: "yes" },
          url: "/api/test",
        },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.url, "/api/test");
      var hasOwn = Object.prototype.hasOwnProperty;
      assert.strictEqual(hasOwn.call(result, "__proto__"), false);
      assert.strictEqual(hasOwn.call(result, "constructor"), false);
      assert.strictEqual(hasOwn.call(result, "prototype"), false);
    });

    it("should filter dangerous keys in headers", function () {
      const result = mergeConfig(
        {},
        {
          headers: {
            __proto__: { polluted: "yes" },
            "Content-Type": "application/json",
          },
        },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.headers["Content-Type"], "application/json");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result.headers, "__proto__"), false);
    });

    it("should filter dangerous keys in custom config properties", function () {
      const result = mergeConfig(
        {},
        {
          customProp: {
            __proto__: { polluted: "yes" },
            safe: "value",
          },
        },
      );

      assert.strictEqual(Object.prototype.polluted, undefined);
      assert.strictEqual(result.customProp.safe, "value");
      assert.strictEqual(Object.prototype.hasOwnProperty.call(result.customProp, "__proto__"), false);
    });

    it("should create nested plain config objects that do not inherit proxy credentials", function () {
      Object.prototype.auth = "polluted";
      Object.prototype.username = "polluted-user";
      Object.prototype.password = "polluted-pass";

      const result = mergeConfig({}, {
        proxy: {
          host: "localhost",
          port: 4000,
        },
      });

      assert.strictEqual(Object.getPrototypeOf(result.proxy), null);
      assert.strictEqual(result.proxy.auth, undefined);
      assert.strictEqual(result.proxy.username, undefined);
      assert.strictEqual(result.proxy.password, undefined);
    });

    it("should not inherit transport from Object.prototype", function () {
      var polluted = { request: function () {} };
      Object.prototype.transport = polluted;
      const result = mergeConfig({}, { url: "/a" });
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(result, "transport"),
        false
      );
      // Reading via the prototype chain must not surface the polluted value.
      assert.strictEqual(result.transport, undefined);
      assert.notStrictEqual(result.transport, polluted);
    });

    it("should not inherit transformRequest from Object.prototype", function () {
      var polluted = function () { return "hijacked"; };
      Object.prototype.transformRequest = polluted;
      const result = mergeConfig({}, { url: "/a" });
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(result, "transformRequest"),
        false
      );
      assert.strictEqual(result.transformRequest, undefined);
      assert.notStrictEqual(result.transformRequest, polluted);
    });

    it("should not inherit transformResponse from Object.prototype", function () {
      var polluted = function () { return "hijacked"; };
      Object.prototype.transformResponse = polluted;
      const result = mergeConfig({}, { url: "/a" });
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(result, "transformResponse"),
        false
      );
      assert.strictEqual(result.transformResponse, undefined);
      assert.notStrictEqual(result.transformResponse, polluted);
    });

    it("should not inherit adapter from Object.prototype", function () {
      var polluted = function () { return "hijacked"; };
      Object.prototype.adapter = polluted;
      try {
        const result = mergeConfig({}, { url: "/a" });
        assert.strictEqual(
          Object.prototype.hasOwnProperty.call(result, "adapter"),
          false
        );
        assert.strictEqual(result.adapter, undefined);
        assert.notStrictEqual(result.adapter, polluted);
      } finally {
        delete Object.prototype.adapter;
      }
    });

    it("should not inherit arbitrary keys from Object.prototype", function () {
      Object.prototype.polluted = "yes";
      const result = mergeConfig({}, { url: "/a" });
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(result, "polluted"),
        false
      );
      assert.strictEqual(result.polluted, undefined);
    });

    it("should still merge configs correctly", function () {
      const config1 = {
        baseURL: "https://api.example.com",
        timeout: 1000,
        headers: {
          common: {
            Accept: "application/json",
          },
        },
      };

      const config2 = {
        url: "/users",
        timeout: 5000,
        headers: {
          common: {
            "Content-Type": "application/json",
          },
        },
      };

      const result = mergeConfig(config1, config2);

      assert.strictEqual(result.baseURL, "https://api.example.com");
      assert.strictEqual(result.url, "/users");
      assert.strictEqual(result.timeout, 5000);
      assert.strictEqual(result.headers.common.Accept, "application/json");
      assert.strictEqual(
        result.headers.common["Content-Type"],
        "application/json",
      );
    });

    it("should not throw when Object.prototype get and set are polluted", function () {
      Object.prototype.get = function () {};
      Object.prototype.set = function () {};

      assert.doesNotThrow(function () {
        mergeConfig({}, {
          url: "/users",
          headers: {
            common: {
              Accept: "application/json",
            },
          },
        });
      });
    });

    it("should prepare request headers without descriptor errors when get and set are polluted", function (done) {
      var axios = require("../../../index");

      Object.prototype.get = function () {};
      Object.prototype.set = function () {};

      var instance = axios.create({
        adapter: function adapter(config) {
          assert.strictEqual(config.headers.Accept, "application/json");
          return Promise.resolve({
            data: null,
            status: 200,
            statusText: "OK",
            headers: {},
            config: config,
          });
        },
        headers: {
          common: {
            Accept: "application/json",
          },
        },
      });

      instance.get("/users").then(function () {
        done();
      }).catch(done);
    });

    it("should define AxiosError descriptors without inherited getter or setter keys", function () {
      Object.prototype.get = function () {};
      Object.prototype.set = function () {};

      assert.doesNotThrow(function () {
        var axiosErrorPath = require.resolve("../../../lib/core/AxiosError");
        delete require.cache[axiosErrorPath];
        require("../../../lib/core/AxiosError");
      });
    });
  });
});
