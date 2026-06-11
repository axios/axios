"use strict";

var assert = require("assert");
var AxiosError = require("../../../lib/core/AxiosError");
var formDataToJSON = require("../../../lib/helpers/formDataToJSON");

function FormDataMock(entries) {
  this._entries = entries;
}

FormDataMock.prototype.append = function append() {};

FormDataMock.prototype.toString = function toString() {
  return "[object FormData]";
};

FormDataMock.prototype[Symbol.iterator] = function iterator() {
  var entries = this._entries;
  var index = 0;

  return {
    next: function next() {
      if (index < entries.length) {
        return {
          value: entries[index++],
          done: false,
        };
      }

      return { done: true };
    },
  };
};

FormDataMock.prototype.entries = FormDataMock.prototype[Symbol.iterator];

function nestedName(depth) {
  var name = "a";

  for (var i = 0; i < depth; i++) {
    name += "[x]";
  }

  return name;
}

describe("helpers::formDataToJSON", function () {
  it("should convert nested field names", function () {
    var form = new FormDataMock([["user[name]", "Jay"]]);

    assert.deepStrictEqual(formDataToJSON(form), {
      user: {
        name: "Jay",
      },
    });
  });

  it("should reject deeply nested field names before stack overflow", function () {
    var form = new FormDataMock([[nestedName(101), "value"]]);

    assert.throws(
      function () {
        formDataToJSON(form);
      },
      function (err) {
        return err && err.code === AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED;
      },
    );
  });
});
