import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { SectionData } from '../../lib/types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/** Persists only the changed fields in one compact section patch. */
export function useAutosave(applicationId: string | undefined, section: string, data: SectionData, enabled = true) {
  const [state, setState] = useState<SaveState>('idle')
  const [message, setMessage] = useState('')
  const lastSaved = useRef<SectionData>(data)
  const pending = useRef<SectionData | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inFlight = useRef(false)
  const scope = useRef('')

  useEffect(() => {
    const nextScope = `${applicationId ?? ''}:${section}`
    if (scope.current !== nextScope) {
      scope.current = nextScope
      lastSaved.current = data
      pending.current = null
    }
  }, [applicationId, data, section])

  const save = useCallback(async (patch: SectionData) => {
    if (!applicationId || !Object.keys(patch).length) return
    inFlight.current = true
    setState('saving')
    setMessage('Saving…')
    let didSucceed = false
    try {
      const result = await api.updateApplication(applicationId, { section, data: patch })
      lastSaved.current = { ...lastSaved.current, ...patch }
      setState('saved')
      setMessage(`Saved just now${result.version ? ` · v${result.version}` : ''}`)
      didSucceed = true
    } catch (error) {
      pending.current = { ...(pending.current ?? {}), ...patch }
      setState('error')
      setMessage(error instanceof ApiError ? error.message : "We couldn't save your changes. Try again.")
    } finally {
      inFlight.current = false
      if (didSucceed && pending.current && Object.keys(pending.current).length) {
        const retryPatch = pending.current
        pending.current = null
        void save(retryPatch)
      }
    }
  }, [applicationId, section])

  const queue = useCallback((next: SectionData) => {
    if (!enabled || !applicationId) return
    const patch = Object.keys(next).reduce<SectionData>((result, key) => {
      if (next[key] !== lastSaved.current[key]) result[key] = next[key]
      return result
    }, {})
    if (!Object.keys(patch).length) return
    if (inFlight.current) {
      pending.current = { ...(pending.current ?? {}), ...patch }
      return
    }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = undefined
      void save(patch)
    }, 600)
    setState('saving')
    setMessage('Saving…')
  }, [applicationId, enabled, save])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const retry = useCallback(() => {
    if (!pending.current) return
    const retryPatch = pending.current
    pending.current = null
    void save(retryPatch)
  }, [save])

  return { state, message, queue, retry }
}
