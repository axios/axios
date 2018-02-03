const merge = require('../../../lib/utils').merge

describe('utils::merge', function () {
  it('should be immutable', function () {
    const a = {}
    const b = {foo: 123}
    const c = {bar: 456}

    merge(a, b, c)

    expect(typeof a.foo).toEqual('undefined')
    expect(typeof a.bar).toEqual('undefined')
    expect(typeof b.bar).toEqual('undefined')
    expect(typeof c.foo).toEqual('undefined')
  })

  it('should merge properties', function () {
    const a = {foo: 123}
    const b = {bar: 456}
    const c = {foo: 789}
    const d = merge(a, b, c)

    expect(d.foo).toEqual(789)
    expect(d.bar).toEqual(456)
  })

  it('should merge recursively', function () {
    const a = {foo: {bar: 123}}
    const b = {foo: {baz: 456}, bar: {qux: 789}}

    expect(merge(a, b)).toEqual({
      foo: {
        bar: 123,
        baz: 456
      },
      bar: {
        qux: 789
      }
    })
  })
})
