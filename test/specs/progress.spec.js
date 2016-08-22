describe('progress events', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should add a download progress handler', function (done) {
    function progressHandler(event) {};

    axios('/foo', { progressDownload: progressHandler } );

    getAjaxRequest().then(function (request) {
      // Not sure of the best way to test this, so just test that the new listener is present
      expect(request.eventBus.eventList.progress.length).toEqual(2);
      done();
    });
  });

  it('should add a upload progress handler', function (done) {
    function progressHandler(event) {};

    axios('/foo', { progressUpload: progressHandler } );

    getAjaxRequest().then(function (request) {
      // Jasmine-Ajax fake XHR upload events are broken, so for now just test that nothing breaks/crashes
      // expect(request.upload.eventBus.eventList.progress.length).toEqual(2);
      done();
    });
  });

  it('should add both upload and download progress handlers', function (done) {
    function progressHandler(event) {};

    axios('/foo', { progressDownload: progressHandler, progressUpload: progressHandler });

    getAjaxRequest().then(function (request) {
      expect(request.eventBus.eventList.progress.length).toEqual(2);
      // Jasmine-Ajax fake XHR upload events are broken, so for now just test that nothing breaks/crashes
      // expect(request.upload.eventBus.eventList.progress.length).toEqual(2);
      done();
    });
  });

  it('should add a download progress handler from instance config', function (done) {
    function progressHandler(event) {};

    var instance = axios.create({
      progressDownload: progressHandler,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      expect(request.eventBus.eventList.progress.length).toEqual(2);
      done();
    });
  });

  it('should add a upload progress handler from instance config', function (done) {
    function progressHandler(event) {};

    var instance = axios.create({
      progressUpload: progressHandler,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      // Jasmine-Ajax fake XHR upload events are broken, so for now just test that nothing breaks/crashes
      // expect(request.upload.eventBus.eventList.progress.length).toEqual(2);
      done();
    });
  });

  it('should add upload and download progress handlers from instance config', function (done) {
    function progressHandler(event) {};

    var instance = axios.create({
      progressDownload: progressHandler,
      progressUpload: progressHandler,
    });

    instance.get('/foo');

    getAjaxRequest().then(function (request) {
      // Jasmine-Ajax fake XHR upload events are broken, so for now just test that nothing breaks/crashes
      // expect(request.upload.eventBus.eventList.progress.length).toEqual(2);
      done();
    });
  });
});
