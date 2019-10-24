var isURLSameOrigin = require('../../../lib/helpers/isURLSameOrigin');

describe('helpers::isURLSameOrigin', function () {
  it('should detect same origin', function () {
    expect(isURLSameOrigin(window.location.href)).toEqual(true);
  });

  it('should detect different origin', function () {
    expect(isURLSameOrigin('https://github.com/axios/axios')).toEqual(false);
  });

  it('should detect XSS scripts on a same origin request', function () {
    expect(function() {
      isURLSameOrigin('https://github.com/axios/axios?<script>alert("hello")</script>');
    }).toThrowError(Error, 'URL contains XSS injection attempt')
  });  
});
