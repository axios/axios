describe('progress events', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add a download progress handler', function (done) {
    const progressSpy = jasmine.createSpy('progress');

    axios('/foo', { onDownloadProgress: progressSpy });

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add an upload progress handler', function (done) {
    const progressSpy = jasmine.createSpy('progress');

    // Simulate an upload request
    axios.put('/foo', {}, { onUploadProgress: progressSpy });

    getAjaxRequest().then(function (request) {
      // Simulate upload progress
      request.upload = { onprogress: function (callback) { callback({ loaded: 50, total: 100 }); } };
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });

      // Check if upload progress handler was called
      expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add both upload and download progress handlers', function (done) {
    const downloadProgressSpy = jasmine.createSpy('downloadProgress');
    const uploadProgressSpy = jasmine.createSpy('uploadProgress');

    axios.put('/foo', {}, {
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy
    });

    getAjaxRequest().then(function (request) {
      request.upload = { onprogress: function (callback) { callback({ loaded: 50, total: 100 }); } };
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });

      expect(uploadProgressSpy).toHaveBeenCalled();
      expect(downloadProgressSpy).not.toHaveBeenCalled();
      done();
    });
  });

  // Other tests remain unchanged...

  it('should add a download progress handler from instance config', function (done) {
    const progressSpy = jasmine.createSpy('progress');

    const instance = axios.create({
      onDownloadProgress: progressSpy,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add an upload progress handler from instance config', function (done) {
    const progressSpy = jasmine.createSpy('progress');

    const instance = axios.create({
      onUploadProgress: progressSpy,
    });

    instance.put('/foo', {});

    getAjaxRequest().then(function (request) {
      request.upload = { onprogress: function (callback) { callback({ loaded: 50, total: 100 }); } };
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add upload and download progress handlers from instance config', function (done) {
    const downloadProgressSpy = jasmine.createSpy('downloadProgress');
    const uploadProgressSpy = jasmine.createSpy('uploadProgress');

    const instance = axios.create({
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy,
    });

    instance.put('/foo', {});

    getAjaxRequest().then(function (request) {
      request.upload = { onprogress: function (callback) { callback({ loaded: 50, total: 100 }); } };
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });

      expect(uploadProgressSpy).toHaveBeenCalled();
      expect(downloadProgressSpy).not.toHaveBeenCalled();
      done();
    });
  });
});

