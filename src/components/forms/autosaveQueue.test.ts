import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAutosaveQueue } from './autosaveQueue'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

afterEach(() => { vi.useRealTimers() })

describe('autosave queue', () => {
  it('drops a reverted edit before debounce without losing other changes', async () => {
    vi.useFakeTimers()
    const save = vi.fn(async () => {})
    const queue = createAutosaveQueue({ name: 'A', city: 'X' }, save)
    queue.queue({ name: 'B', city: 'X' })
    queue.queue({ name: 'A', city: 'X' })
    expect(queue.getSnapshot().hasPending).toBe(false)
    await vi.advanceTimersByTimeAsync(600)
    expect(save).not.toHaveBeenCalled()
    queue.queue({ name: 'B', city: 'Y' })
    queue.queue({ name: 'A', city: 'Y' })
    await vi.advanceTimersByTimeAsync(600)
    expect(save).toHaveBeenCalledExactlyOnceWith({ city: 'Y' })
  })

  it('flush waits for edits and reversions made during a request', async () => {
    const first = deferred()
    const second = deferred()
    const save = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const queue = createAutosaveQueue({ name: 'A' }, save)
    queue.queue({ name: 'B' })
    const flushing = queue.flush()
    await Promise.resolve()
    queue.queue({ name: 'A', city: 'Y' })
    expect(queue.flush()).toBe(flushing)
    first.resolve()
    await Promise.resolve()
    expect(save).toHaveBeenNthCalledWith(2, { name: 'A', city: 'Y' })
    expect(queue.getSnapshot().hasPending).toBe(true)
    second.resolve()
    expect(await flushing).toBe(true)
    expect(queue.getSnapshot()).toEqual({ state: 'saved', hasPending: false })
  })

  it('retains latest values on failure and retries ambiguous writes after reversion', async () => {
    const first = deferred()
    const save = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue(undefined)
    const queue = createAutosaveQueue({ name: 'A' }, save)
    queue.queue({ name: 'B' })
    const flushing = queue.flush()
    await Promise.resolve()
    queue.queue({ name: 'A' })
    const concurrent = queue.flush()
    first.reject(new Error('offline'))
    expect(await flushing).toBe(false)
    expect(await concurrent).toBe(false)
    expect(queue.getSnapshot().state).toBe('error')
    expect(queue.getSnapshot().hasPending).toBe(true)
    expect(await queue.flush()).toBe(true)
    expect(save).toHaveBeenNthCalledWith(2, { name: 'A' })
  })

  it('does not let hydration replace a pending edit and compares arrays by value', async () => {
    const save = vi.fn(async () => {})
    const queue = createAutosaveQueue({}, save)
    queue.initialize({ name: 'A', visits: ['IN'] })
    queue.queue({ name: 'B', visits: ['IN'] })
    queue.initialize({ name: 'B', visits: ['IN'] })
    await queue.flush()
    expect(save).toHaveBeenCalledExactlyOnceWith({ name: 'B' })
  })
})
