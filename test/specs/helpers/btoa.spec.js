var __btoa = require('../../../lib/helpers/btoa');

describe('btoa polyfill', function () {
  it('should behave the same as native window.btoa', function () {
    var data = 'Hello, world';
    expect(__btoa(data)).toEqual(window.btoa(data));
  });

  it('should throw an error if char is out of range 0xFF', function () {
    var err1, err2;
    var data = 'I ♡ Unicode!';
    
    try {
      window.btoa(data);
    } catch (e) {
      err1 = e;
    }

    try {
      __btoa(data);
    } catch (e) {
      err2 = e;
    }

    expect(err1.message).toEqual(err2.message);
  });
});
