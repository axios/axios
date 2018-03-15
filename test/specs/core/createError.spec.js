import createError from '../../../lib/core/createError'
import AxiosError from '../../../lib/core/AxiosError'

describe('core::createError', function () {
  it('should create an Error with message, config, code, request and response', function () {
    const request = { path: '/foo' }
    const response = { status: 200, data: { foo: 'bar' } }
    const error = createError('Boom!', { foo: 'bar' }, 'ESOMETHING', request, response)
    expect(error instanceof Error).toBe(true)
    expect(error instanceof AxiosError).toBe(true)
    expect(error.message).toBe('Boom!')
    expect(error.config).toEqual({ foo: 'bar' })
    expect(error.code).toBe('ESOMETHING')
    expect(error.request).toBe(request)
    expect(error.response).toBe(response)
  })
})
