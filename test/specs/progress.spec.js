describe('progress events', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add a download progress handler', function (done) {
    var progressSpy = jasmine.createSpy('progress');

    axios('/foo', { onDownloadProgress: progressSpy } );

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add a upload progress handler', function (done) {
    var progressSpy = jasmine.createSpy('progress');

    axios('/foo', { onUploadProgress: progressSpy } );

    getAjaxRequest().then(function (request) {
      // Jasmine AJAX doesn't trigger upload events. Waiting for upstream fix
      // expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add both upload and download progress handlers', function (done) {
    var downloadProgressSpy = jasmine.createSpy('downloadProgress');
    var uploadProgressSpy = jasmine.createSpy('uploadProgress');

    axios('/foo', { onDownloadProgress: downloadProgressSpy, onUploadProgress: uploadProgressSpy });

    getAjaxRequest().then(function (request) {
      // expect(uploadProgressSpy).toHaveBeenCalled();
      expect(downloadProgressSpy).not.toHaveBeenCalled();
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      expect(downloadProgressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add a download progress handler from instance config', function (done) {
    var progressSpy = jasmine.createSpy('progress');

    var instance = axios.create({
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

  it('should add a upload progress handler from instance config', function (done) {
    var progressSpy = jasmine.createSpy('progress');

    var instance = axios.create({
      onUploadProgress: progressSpy,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      // expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add upload and download progress handlers from instance config', function (done) {
    var downloadProgressSpy = jasmine.createSpy('downloadProgress');
    var uploadProgressSpy = jasmine.createSpy('uploadProgress');

    var instance = axios.create({
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      // expect(uploadProgressSpy).toHaveBeenCalled();
      expect(downloadProgressSpy).not.toHaveBeenCalled();
      request.respondWith({
        status: 200,
        responseText: '{"foo": "bar"}'
      });
      expect(downloadProgressSpy).toHaveBeenCalled();
      done();
    });
  });
});
