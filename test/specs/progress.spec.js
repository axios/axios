describe('progress events', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add a download progress handler', function (done) {
    const progressSpy = jasmine.createSpy('progress');

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
    const progressSpy = jasmine.createSpy('progress');

    axios('/foo', { onUploadProgress: progressSpy } );

    getAjaxRequest().then(function (request) {
      // Jasmine AJAX doesn't trigger upload events. Waiting for upstream fix
      // expect(progressSpy).toHaveBeenCalled();
      done();
    });
  });

  it('should add both upload and download progress handlers', function (done) {
    const downloadProgressSpy = jasmine.createSpy('downloadProgress');
    const uploadProgressSpy = jasmine.createSpy('uploadProgress');

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

  it('should throttle the progress handlers based on the progress update interval', function (done) {
    const downloadProgressSpy = jasmine.createSpy('downloadProgress');
    const uploadProgressSpy = jasmine.createSpy('uploadProgress');

    axios('/foo', {
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy,
      progressUpdateIntervalMs: 100
    });


    getAjaxRequest().then(function (request) {
      jasmine.clock().install();

      request.eventBus.trigger('progress');
      request.eventBus.trigger('progress');
      expect(downloadProgressSpy).toHaveBeenCalledTimes(1);
      // expect(uploadProgressSpy).toHaveBeenCalledTimes(1);
      jasmine.clock().tick(99);
      expect(downloadProgressSpy).toHaveBeenCalledTimes(1);
      // expect(uploadProgressSpy).toHaveBeenCalledTimes(1);
      jasmine.clock().tick(1);
      expect(downloadProgressSpy).toHaveBeenCalledTimes(2);
      // expect(uploadProgressSpy).toHaveBeenCalledTimes(2);

      jasmine.clock().uninstall();
      done();
    });
  });

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

  it('should add a upload progress handler from instance config', function (done) {
    const progressSpy = jasmine.createSpy('progress');

    const instance = axios.create({
      onUploadProgress: progressSpy,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      // expect(progressSpy).toHaveBeenCalled();
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

  it('should throttle the progress handlers based on the progress update interval from an instance config', function (done) {
    const downloadProgressSpy = jasmine.createSpy('downloadProgress');
    const uploadProgressSpy = jasmine.createSpy('uploadProgress');
    const instance = axios.create({
      onDownloadProgress: downloadProgressSpy,
      onUploadProgress: uploadProgressSpy,
      progressUpdateIntervalMs: 100
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      jasmine.clock().install();

      request.eventBus.trigger('progress');
      request.eventBus.trigger('progress');
      expect(downloadProgressSpy).toHaveBeenCalledTimes(1);
      // expect(uploadProgressSpy).toHaveBeenCalledTimes(1);
      jasmine.clock().tick(99);
      expect(downloadProgressSpy).toHaveBeenCalledTimes(1);
      // expect(uploadProgressSpy).toHaveBeenCalledTimes(1);
      jasmine.clock().tick(1);
      expect(downloadProgressSpy).toHaveBeenCalledTimes(2);
      // expect(uploadProgressSpy).toHaveBeenCalledTimes(2);

      jasmine.clock().uninstall();
      done();
    });
  });
});
