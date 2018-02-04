/* global getAjaxRequest */
import axios from '../../lib/axios'

describe('promise', function () {
  beforeEach(function () {
    jasmine.Ajax.install()
  })

  afterEach(function () {
    jasmine.Ajax.uninstall()
  })

  it('should provide succinct object to then', function (done) {
    let response

    axios.get('/foo').then(function (r) {
      response = r
    })

    getAjaxRequest().then(function (request) {
      request.respondWith({
        status: 200,
        responseText: '{"hello":"world"}'
      })

      setTimeout(function () {
        expect(typeof response).toEqual('object')
        expect(response.data.hello).toEqual('world')
        expect(response.status).toEqual(200)
        expect(response.headers['content-type']).toEqual('application/json')
        expect(response.config.url).toEqual('/foo')
        done()
      }, 100)
    })
  })
})
