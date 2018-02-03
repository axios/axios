import __btoa from '../../../lib/helpers/btoa'

describe('btoa polyfill', function () {
  it('should behave the same as native window.btoa', function () {
    // btoa doesn't exist in IE8/9
    if (isOldIE && typeof Int8Array === 'undefined') {
      return
    }

    const data = 'Hello, world'
    expect(__btoa(data)).toEqual(window.btoa(data))
  })

  it('should throw an error if char is out of range 0xFF', function () {
    let err
    const data = 'I ♡ Unicode!'

    try {
      __btoa(data)
    } catch (e) {
      err = e
    }

    validateInvalidCharacterError(err)
  })
})
