import transformData from '../../../lib/core/transformData'

describe('core::transformData', function () {
  it('should support a single transformer', function () {
    let data
    data = transformData(data, null, function (data) {
      data = 'foo'
      return data
    })

    expect(data).toEqual('foo')
  })

  it('should support an array of transformers', function () {
    let data = ''
    data = transformData(data, null, [function (data) {
      data += 'f'
      return data
    }, function (data) {
      data += 'o'
      return data
    }, function (data) {
      data += 'o'
      return data
    }])

    expect(data).toEqual('foo')
  })
})
