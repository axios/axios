var axios = require('../../index');

describe('requests', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should treat single string arg as url', function (done) {
    var request;

    axios('/foo');

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      expect(request.method).toBe('GET');
      done();
    }, 0);
  });

  it('should allow string arg as url, and config arg', function (done) {
    var request;

    axios('/foo', {
      method: 'POST'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      expect(request.method).toBe('POST');
      done();
    }, 0);
  });

  it('should make an http request', function (done) {
    var request;

    axios({
      url: '/foo'
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      expect(request.url).toBe('/foo');
      done();
    }, 0);
  });

  it('should make cross domian http request', function (done) {
    var request, response;

    axios({
      method: 'post',
      url: 'www.someurl.com/foo'
    }).then(function(res){
      response = res;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();
      request.respondWith({
        status: 200,
        statusText: 'OK',
        responseText: '{"foo": "bar"}',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setTimeout(function () {
        expect(response.data.foo).toEqual('bar');
        expect(response.status).toEqual(200);
        expect(response.statusText).toEqual('OK');
        expect(response.headers['content-type']).toEqual('application/json');
        done();
      }, 0);

    }, 0);

  });


  it('should supply correct response', function (done) {
    var request, response;

    axios({
      method: 'post',
      url: '/foo'
    }).then(function (res) {
      response = res;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        statusText: 'OK',
        responseText: '{"foo": "bar"}',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setTimeout(function () {
        expect(response.data.foo).toEqual('bar');
        expect(response.status).toEqual(200);
        expect(response.statusText).toEqual('OK');
        expect(response.headers['content-type']).toEqual('application/json');
        done();
      }, 0);
    }, 0);
  });

  it('should allow overriding Content-Type header case-insensitive', function (done) {
    var request, response;
    var contentType = 'application/vnd.myapp.type+json';

    axios({
      url: '/foo',
      method: 'post',
      data: { prop: 'value' },
      headers: {
        'content-type': contentType
      }
    }).then(function (res) {
      response = res;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();
      
      expect(request.requestHeaders['Content-Type']).toEqual(contentType);
      done();
    });
  });

  it('should support binary data as array buffer', function (done) {
    var request;
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios({
      method: 'post',
      url: '/foo',
      data: input.buffer
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      var output = new Int8Array(request.params.buffer);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    }, 0);
  });

  it('should support binary data as array buffer view', function (done) {
    var request;
    var input = new Int8Array(2);
    input[0] = 1;
    input[1] = 2;

    axios({
      method: 'post',
      url: '/foo',
      data: input
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      var output = new Int8Array(request.params.buffer);
      expect(output.length).toEqual(2);
      expect(output[0]).toEqual(1);
      expect(output[1]).toEqual(2);
      done();
    }, 0);
  });

  it('should support array buffer response', function (done) {
    var request, response;

    function str2ab(str) {
      var buff = new ArrayBuffer(str.length * 2);
      var view = new Uint16Array(buff);
      for ( var i=0, l=str.length; i<l; i++) {
        view[i] = str.charCodeAt(i);
      }
      return buff;
    }

    axios({
      url: '/foo',
      responseType: 'arraybuffer'
    }).then(function (data) {
      response = data;
    });

    setTimeout(function () {
      request = jasmine.Ajax.requests.mostRecent();

      request.respondWith({
        status: 200,
        response: str2ab('Hello world')
      });

      setTimeout(function () {
        expect(response.data.byteLength).toBe(22);
        done();
      }, 0);
    }, 0);
  });

});
