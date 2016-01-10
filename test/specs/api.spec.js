describe('static api', function () {
  it('should have request method helpers', function () {
    expect(typeof axios.get).toEqual('function');
    expect(typeof axios.head).toEqual('function');
    expect(typeof axios.delete).toEqual('function');
    expect(typeof axios.post).toEqual('function');
    expect(typeof axios.put).toEqual('function');
    expect(typeof axios.patch).toEqual('function');
  });

  it('should have promise method helpers', function () {
    var promise = axios();

    expect(typeof promise.then).toEqual('function');
    expect(typeof promise.catch).toEqual('function');
  });

  it('should have defaults', function () {
    expect(typeof axios.defaults).toEqual('object');
    expect(typeof axios.defaults.headers).toEqual('object');
  });

  it('should have interceptors', function () {
    expect(typeof axios.interceptors.request).toEqual('object');
    expect(typeof axios.interceptors.response).toEqual('object');
  });

  it('should have all/spread helpers', function () {
    expect(typeof axios.all).toEqual('function');
    expect(typeof axios.spread).toEqual('function');
  });

  it('should have factory method', function () {
    expect(typeof axios.create).toEqual('function');
  });
});

describe('instance api', function () {
  var instance = axios.create({
    httpVerbs: [
      { name: 'LOCK' },
      { name: 'LINK', with_body: true },
      { name: 'UNLOCK', with_body: false }
    ]
  });

  it('should have request methods', function () {
    expect(typeof instance.request).toEqual('function');
    expect(typeof instance.get).toEqual('function');
    expect(typeof instance.head).toEqual('function');
    expect(typeof instance.delete).toEqual('function');
    expect(typeof instance.post).toEqual('function');
    expect(typeof instance.put).toEqual('function');
    expect(typeof instance.patch).toEqual('function');
  });

  it('should have interceptors', function () {
    expect(typeof instance.interceptors.request).toEqual('object');
    expect(typeof instance.interceptors.response).toEqual('object');
  });

  it('should have custom method helpers', function () {
    expect(typeof instance.lock).toEqual('function');
    expect(typeof instance.link).toEqual('function');
    expect(typeof instance.unlock).toEqual('function');
  });

  it('should differ between methods accepting a body and methods that don\'t', function () {
    expect(instance.lock.length).toEqual(2);
    expect(instance.link.length).toEqual(3);
    expect(instance.unlock.length).toEqual(2);
  });
});
