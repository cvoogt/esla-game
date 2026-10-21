import { useSyncExternalStore } from 'react'
import type { Game, Player, ScoreEvent } from './scoring'

export interface CustomSighting {
  id: string
  label: string
  points: number
}

export interface State {
  games: Game[]
  currentId?: string
  customs: CustomSighting[]
  names: string[]
  sound: boolean
}

const KEY = 'esla-game:v1'

function load(): State {
  const empty: State = { games: [], customs: [], names: [], sound: true }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

let state = load()
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable; keep going in memory
  }
  listeners.forEach((l) => l())
}

export function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const uid = () => crypto.randomUUID()

function updateGame(id: string, fn: (g: Game) => Game) {
  set({ ...state, games: state.games.map((g) => (g.id === id ? fn(g) : g)) })
}

export const actions = {
  startGame(names: string[]) {
    const players: Player[] = names.map((name) => ({ id: uid(), name }))
    const game: Game = { id: uid(), players, events: [], startedAt: Date.now() }
    const known = [...new Set([...names, ...state.names])].slice(0, 30)
    // Only one game is live at a time; starting a new one ends (and saves) the old one.
    const games = state.games.map((g) => (g.endedAt ? g : { ...g, endedAt: Date.now() }))
    set({ ...state, games: [game, ...games], currentId: game.id, names: known })
  },
  open(id: string | undefined) {
    set({ ...state, currentId: id })
  },
  addEvents(gameId: string, events: Omit<ScoreEvent, 'id' | 'at'>[]) {
    const at = Date.now()
    const added = events.map((e) => ({ ...e, id: uid(), at }))
    updateGame(gameId, (g) => ({ ...g, events: [...g.events, ...added] }))
    return added.map((e) => e.id)
  },
  removeEvent(gameId: string, eventId: string) {
    updateGame(gameId, (g) => ({ ...g, events: g.events.filter((e) => e.id !== eventId) }))
  },
  addPlayer(gameId: string, name: string) {
    updateGame(gameId, (g) => ({ ...g, players: [...g.players, { id: uid(), name }] }))
  },
  endGame(gameId: string) {
    updateGame(gameId, (g) => ({ ...g, endedAt: g.endedAt ?? Date.now() }))
  },
  reopenGame(gameId: string) {
    updateGame(gameId, (g) => ({ ...g, endedAt: undefined }))
  },
  deleteGame(gameId: string) {
    set({
      ...state,
      games: state.games.filter((g) => g.id !== gameId),
      currentId: state.currentId === gameId ? undefined : state.currentId,
    })
  },
  saveCustom(label: string, points: number) {
    const existing = state.customs.filter((c) => c.label.toLowerCase() !== label.toLowerCase())
    set({ ...state, customs: [{ id: uid(), label, points }, ...existing].slice(0, 12) })
  },
  removeCustom(id: string) {
    set({ ...state, customs: state.customs.filter((c) => c.id !== id) })
  },
  toggleSound() {
    set({ ...state, sound: !state.sound })
  },
}
