import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { SectionData } from '../../lib/types'
import { createAutosaveQueue, type AutosaveSnapshot } from './autosaveQueue'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function saveTime() {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date())
}

export function useAutosave(applicationId: string | undefined, section: string, data: SectionData, enabled = true, initialVersion?: number) {
  const [snapshot, setSnapshot] = useState<AutosaveSnapshot>({ state: 'idle', hasPending: false })
  const [message, setMessage] = useState('')
  // Preserve versions across sections, while isolating different applications.
  const version = useMemo(() => ({ current: initialVersion }), [applicationId])
  const controller = useMemo(() => createAutosaveQueue(data, async (patch) => {
    if (!applicationId) return
    const update = () => api.updateApplication(applicationId, { section, data: patch, ...(typeof version.current === 'number' ? { version: version.current } : {}) })
    let result
    try {
      result = await update()
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'VERSION_CONFLICT') throw error
      const latest = await api.getApplication(applicationId)
      version.current = latest.version
      result = await update()
    }
    version.current = result.version
  }), [applicationId, section, enabled, version])

  useEffect(() => {
    if (version.current === undefined) version.current = initialVersion
    controller.initialize(data)
  }, [controller, data, initialVersion, version])

  useEffect(() => {
    const unsubscribe = controller.subscribe((next) => {
      setSnapshot(next)
      setMessage(next.state === 'error'
        ? next.error instanceof ApiError ? next.error.message : "We couldn't save your changes. Try again."
        : next.state === 'saving' ? 'Saving changes…'
          : next.state === 'saved' ? `Saved at ${saveTime()} · v${version.current}` : '')
    })
    return () => {
      unsubscribe()
      // Old scopes own their pending requests and cannot mutate the new queue.
      void controller.flush()
    }
  }, [controller, version])

  const queue = useCallback((next: SectionData) => {
    if (enabled && applicationId) controller.queue(next)
  }, [applicationId, controller, enabled])
  const retry = useCallback(() => { void controller.flush() }, [controller])

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!controller.getSnapshot().hasPending) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [controller])

  return { state: snapshot.state, message, hasPending: snapshot.hasPending, queue, retry, flush: controller.flush }
}
