import { useSyncExternalStore } from 'react'

// Per-phone preferences. Everything shared lives in Firestore (see data.ts).
interface Prefs {
  sound: boolean
}

const KEY = 'esla-game:prefs'

function load(): Prefs {
  try {
    return { sound: true, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { sound: true }
  }
}

let prefs = load()
const listeners = new Set<() => void>()

export function usePrefs() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => prefs,
  )
}

export function toggleSound() {
  prefs = { ...prefs, sound: !prefs.sound }
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    // storage unavailable; keep it in memory
  }
  listeners.forEach((l) => l())
}
