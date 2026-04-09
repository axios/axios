import { describe, it, expect } from 'vitest'
import compose from '../../lib/helpers/compose.js';

describe('compose', () => {
  it('runs middleware in correct order', async () => {
    const calls = []

    const mw1 = async (ctx, next) => {
      calls.push('mw1 start')
      await next()
      calls.push('mw1 end')
    }

    const mw2 = async (ctx, next) => {
      calls.push('mw2 start')
      await next()
      calls.push('mw2 end')
    }

    const fn = compose([mw1, mw2])

    await fn({})

    expect(calls).toEqual([
      'mw1 start',
      'mw2 start',
      'mw2 end',
      'mw1 end'
    ])
  })

  it('passes context through middleware', async () => {
    const mw1 = async (ctx, next) => {
      ctx.a = 1
      await next()
    }

    const mw2 = async (ctx, next) => {
      ctx.b = 2
      await next()
    }

    const ctx = {}
    const fn = compose([mw1, mw2])

    await fn(ctx)

    expect(ctx).toEqual({ a: 1, b: 2 })
  })

  it('allows overriding context via next(arg)', async () => {
    const mw1 = async (ctx, next) => {
      await next({ value: 42 })
    }

    const mw2 = async (ctx, next) => {
      ctx.value += 1
      await next()
    }

    const fn = compose([mw1, mw2])

    const resultCtx = { value: 0 }
    await fn(resultCtx)

    expect(resultCtx.value).toBe(0) // original ctx не змінюється
  })

  it('uses overridden context in downstream middleware', async () => {
    let observed

    const mw1 = async (ctx, next) => {
      await next({ value: 10 })
    }

    const mw2 = async (ctx, next) => {
      observed = ctx.value
      await next()
    }

    const fn = compose([mw1, mw2])

    await fn({ value: 0 })

    expect(observed).toBe(10)
  })

  it('calls final next after pipeline', async () => {
    let called = false

    const mw1 = async (ctx, next) => {
      await next()
    }

    const fn = compose([mw1])

    await fn({}, async () => {
      called = true
    })

    expect(called).toBe(true)
  })

  it('works with empty pipeline', async () => {
    let called = false

    const fn = compose([])

    await fn({}, async () => {
      called = true
    })

    expect(called).toBe(true)
  })

  it('stops chain if middleware does not call next', async () => {
    const calls = []

    const mw1 = async (ctx, next) => {
      calls.push('mw1')
      // no next()
    }

    const mw2 = async (ctx, next) => {
      calls.push('mw2')
      await next()
    }

    const fn = compose([mw1, mw2])

    await fn({})

    expect(calls).toEqual(['mw1'])
  })

  it('propagates errors', async () => {
    const error = new Error('fail')

    const mw1 = async (ctx, next) => {
      await next()
    }

    const mw2 = async () => {
      throw error
    }

    const fn = compose([mw1, mw2])

    await expect(fn({})).rejects.toThrow('fail')
  })
})
