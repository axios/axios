import transformData from '../../../lib/core/transformData'

describe('core::transformData', function () {
  it('should support a single transformer', function () {
    const result = transformData(undefined, null, function (data) {
      return 'foo'
    })

    expect(result).toEqual('foo')
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
