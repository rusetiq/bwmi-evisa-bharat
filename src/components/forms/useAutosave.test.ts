// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from '../../lib/api'
import type { Application } from '../../lib/types'
import { useAutosave } from './useAutosave'

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })

describe('useAutosave', () => {
  it('hydrates the baseline and does not save an A to B to A edit', async () => {
    vi.useFakeTimers()
    const update = vi.spyOn(api, 'updateApplication').mockResolvedValue({ version: 2, updatedAt: '' })
    const { result, rerender } = renderHook(({ data, enabled }) => useAutosave('app', 'personal', data, enabled, 1), { initialProps: { data: {} as Record<string, string>, enabled: false } })
    rerender({ data: { name: 'A' }, enabled: true })
    act(() => { result.current.queue({ name: 'B' }); result.current.queue({ name: 'A' }) })
    await act(async () => { await vi.advanceTimersByTimeAsync(600) })
    expect(update).not.toHaveBeenCalled()
    expect(result.current.hasPending).toBe(false)
  })

  it('retries version conflicts and carries the new version across navigation', async () => {
    const update = vi.spyOn(api, 'updateApplication')
      .mockRejectedValueOnce(new ApiError('conflict', 409, undefined, 'VERSION_CONFLICT'))
      .mockResolvedValueOnce({ version: 5, updatedAt: '' })
      .mockResolvedValueOnce({ version: 6, updatedAt: '' })
    vi.spyOn(api, 'getApplication').mockResolvedValue({ version: 4 } as Application)
    const { result, rerender } = renderHook(({ section, data }) => useAutosave('app', section, data, true, 1), { initialProps: { section: 'personal', data: { name: 'A' } } })
    act(() => { result.current.queue({ name: 'B' }) })
    await act(async () => { expect(await result.current.flush()).toBe(true) })
    expect(update).toHaveBeenNthCalledWith(2, 'app', { section: 'personal', data: { name: 'B' }, version: 4 })
    rerender({ section: 'family', data: { name: 'C' } })
    act(() => { result.current.queue({ name: 'D' }) })
    await act(async () => { await result.current.flush() })
    expect(update).toHaveBeenNthCalledWith(3, 'app', { section: 'family', data: { name: 'D' }, version: 5 })
  })

  it('keeps an old application request isolated when its completion arrives late', async () => {
    let complete!: (value: { version: number; updatedAt: string }) => void
    const update = vi.spyOn(api, 'updateApplication')
      .mockImplementationOnce(() => new Promise((resolve) => { complete = resolve }))
      .mockResolvedValue({ version: 2, updatedAt: '' })
    const { result, rerender } = renderHook(({ id }) => useAutosave(id, 'personal', { name: 'A' }, true, 1), { initialProps: { id: 'old' } })
    act(() => { result.current.queue({ name: 'B' }) })
    let saving!: Promise<boolean>
    await act(async () => { saving = result.current.flush(); await Promise.resolve() })
    rerender({ id: 'new' })
    await act(async () => { complete({ version: 99, updatedAt: '' }); await saving })
    expect(result.current.state).toBe('idle')
    act(() => { result.current.queue({ name: 'C' }) })
    await act(async () => { await result.current.flush() })
    expect(update).toHaveBeenLastCalledWith('new', { section: 'personal', data: { name: 'C' }, version: 1 })
  })

  it('flushes pending work on unmount and warns while a request is pending', async () => {
    const update = vi.spyOn(api, 'updateApplication').mockResolvedValue({ version: 2, updatedAt: '' })
    const { result, unmount } = renderHook(() => useAutosave('app', 'personal', { name: 'A' }, true, 1))
    act(() => { result.current.queue({ name: 'B' }) })
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    unmount()
    await act(async () => { await Promise.resolve() })
    expect(update).toHaveBeenCalledExactlyOnceWith('app', { section: 'personal', data: { name: 'B' }, version: 1 })
  })

  it('blocks navigation on failed flush and retries the latest draft', async () => {
    const update = vi.spyOn(api, 'updateApplication')
      .mockRejectedValueOnce(new ApiError('offline', 503))
      .mockResolvedValue({ version: 2, updatedAt: '' })
    const { result } = renderHook(() => useAutosave('app', 'personal', { name: 'A' }, true, 1))
    act(() => { result.current.queue({ name: 'B' }) })
    await act(async () => { expect(await result.current.flush()).toBe(false) })
    expect(result.current.state).toBe('error')
    expect(result.current.message).toBe('offline')
    expect(result.current.hasPending).toBe(true)
    act(() => { result.current.queue({ name: 'C' }); result.current.retry() })
    await act(async () => { expect(await result.current.flush()).toBe(true) })
    expect(update).toHaveBeenLastCalledWith('app', { section: 'personal', data: { name: 'C' }, version: 1 })
    expect(result.current.state).toBe('saved')
    expect(result.current.hasPending).toBe(false)
  })
})
