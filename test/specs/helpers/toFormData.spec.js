var toFormData = require("../../../lib/helpers/toFormData");

describe("toFormData", function () {
  it("Convert nested data object to FormDAta", function () {
    var o = {
      val: 123,
      nested: {
        arr: ["hello", "world"],
      },
    };

    convertedVal = toFormData(o);
    expect(convertedVal instanceof FormData).toEqual(true);
    expect(Array.from(convertedVal.keys()).length).toEqual(3);
    expect(convertedVal.get("val")).toEqual("123")
    expect(convertedVal.get("nested.arr.0")).toEqual("hello")
  });
});
