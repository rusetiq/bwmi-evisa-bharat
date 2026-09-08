import type { SectionData } from '../../lib/types'

export type AutosaveSnapshot = {
  state: 'idle' | 'saving' | 'saved' | 'error'
  hasPending: boolean
  error?: unknown
}

function copy(data: SectionData): SectionData {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]))
}

function difference(next: SectionData, saved: SectionData): SectionData {
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => {
    const previous = saved[key]
    return Array.isArray(value) && Array.isArray(previous)
      ? value.length !== previous.length || value.some((item, index) => item !== previous[index])
      : value !== previous
  }))
}

/** Keep the latest desired values, including reversions, until acknowledged. */
export function createAutosaveQueue(initial: SectionData, save: (patch: SectionData) => Promise<void>, delay = 600) {
  let saved = copy(initial)
  let desired = copy(initial)
  let edited = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let active: Promise<boolean> | undefined
  // A failed response may still have committed. Re-send these keys on retry.
  let uncertain: SectionData = {}
  let snapshot: AutosaveSnapshot = { state: 'idle', hasPending: false }
  const listeners = new Set<(snapshot: AutosaveSnapshot) => void>()
  const patch = () => ({ ...Object.fromEntries(Object.keys(uncertain).map((key) => [key, desired[key]])), ...difference(desired, saved) })
  const publish = (next: AutosaveSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener(next))
  }
  const cancelTimer = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }
  const flush = (): Promise<boolean> => {
    cancelTimer()
    if (active) return active
    if (!Object.keys(patch()).length) return Promise.resolve(true)
    active = Promise.resolve().then(async () => {
      while (Object.keys(patch()).length) {
        const sending = patch()
        publish({ state: 'saving', hasPending: true })
        try {
          await save(sending)
          saved = { ...saved, ...copy(sending) }
          uncertain = {}
        } catch (error) {
          uncertain = { ...uncertain, ...sending }
          cancelTimer()
          publish({ state: 'error', hasPending: true, error })
          return false
        }
      }
      cancelTimer()
      publish({ state: 'saved', hasPending: false })
      return true
    }).finally(() => { active = undefined })
    return active
  }
  return {
    flush,
    getSnapshot: () => snapshot,
    subscribe(listener: (snapshot: AutosaveSnapshot) => void) {
      listeners.add(listener)
      listener(snapshot)
      return () => { listeners.delete(listener) }
    },
    initialize(data: SectionData) {
      // Hydration and section changes can settle over more than one render.
      if (!edited) saved = desired = copy(data)
    },
    queue(next: SectionData) {
      edited = true
      desired = copy(next)
      cancelTimer()
      if (!active && !Object.keys(patch()).length) {
        publish({ state: 'idle', hasPending: false })
        return
      }
      publish({ state: 'saving', hasPending: true })
      timer = setTimeout(() => { void flush() }, delay)
    },
  }
}
