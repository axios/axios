
describe('FormData', function() {
  it('should allow FormData posting', function (done) {
    return axios.postForm('http://httpbin.org/post', {
      a: 'foo',
      b: 'bar'
    }).then(({data}) => {
      expect(data.form).toEqual({
        a: 'foo',
        b: 'bar'
      });
      done();
    });
  });
})
