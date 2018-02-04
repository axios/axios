/* global isOldIE */

import * as utils from '../../../lib/utils'
import * as Stream from 'stream'

describe('utils::isX', function a () {
  it('should validate ArrayBufferView', function b () {
    // ArrayBuffer doesn't exist in IE8/9
    if (isOldIE && typeof ArrayBuffer === 'undefined') {
      return
    }

    expect(utils.isArrayBufferView(new DataView(new ArrayBuffer(2)))).toEqual(true)
  })

  it('should validate FormData', function c () {
    // FormData doesn't exist in IE8/9
    if (isOldIE && typeof FormData === 'undefined') {
      return
    }

    expect(utils.isFormData(new FormData())).toEqual(true)
  })

  it('should validate Blob', function d () {
    // Blob doesn't exist in IE8/9
    if (isOldIE && typeof Blob === 'undefined') {
      return
    }

    expect(utils.isBlob(new Blob())).toEqual(true)
  })

  it('should validate Stream', function e () {
    expect(utils.isStream(new Stream.Readable())).toEqual(true)
    expect(utils.isStream({ foo: 'bar' })).toEqual(false)
  })

  it('should validate URLSearchParams', function f () {
    expect(utils.isURLSearchParams(new URLSearchParams())).toEqual(true)
    expect(utils.isURLSearchParams('foo=1&bar=2')).toEqual(false)
  })
})
