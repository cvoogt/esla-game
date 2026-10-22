import { sightingFor, type ColorKey, type Vehicle } from './rules'

export interface Player {
  id: string
  name: string
  /** Set when the player has an account. */
  uid?: string
  /** Set for a guest saved to someone's account, so their stats add up across games. */
  guestId?: string
}

/**
 * Every score change is an event; totals are always derived from the event list,
 * so undo is just removing an event.
 *
 * kind:
 *  - sighting: a called Tesla/Cybertruck (or a custom one)
 *  - missed: a missed call, points are negative
 *  - dealership: +50
 *  - adjust: manual correction
 */
export type EventKind = 'sighting' | 'missed' | 'dealership' | 'adjust'

export interface ScoreEvent {
  id: string
  playerId: string
  kind: EventKind
  label: string
  vehicle?: Vehicle
  color?: ColorKey
  multiplier: number
  points: number
  at: number
  by?: string
}

export interface Game {
  id: string
  players: Player[]
  events: ScoreEvent[]
  startedAt: number
  endedAt?: number
  createdBy?: string
}

export interface Standing {
  player: Player
  score: number
  whiteCars: number
  whiteTrucks: number
  rank: number
}

function isWhite(e: ScoreEvent, vehicle: Vehicle) {
  return e.kind === 'sighting' && e.color === 'white' && e.vehicle === vehicle
}

export function standings(game: Game): Standing[] {
  const rows = game.players.map((player) => {
    const evs = game.events.filter((e) => e.playerId === player.id)
    return {
      player,
      score: evs.reduce((s, e) => s + e.points, 0),
      whiteCars: evs.filter((e) => isWhite(e, 'car')).length,
      whiteTrucks: evs.filter((e) => isWhite(e, 'truck')).length,
      rank: 0,
    }
  })
  rows.sort(compare)
  rows.forEach((r, i) => {
    r.rank = i > 0 && compare(rows[i - 1], r) === 0 ? rows[i - 1].rank : i + 1
  })
  return rows
}

// Score, then tiebreakers: white cars + white trucks, then white cars, then white trucks.
function compare(a: Standing, b: Standing) {
  return (
    b.score - a.score ||
    b.whiteCars + b.whiteTrucks - (a.whiteCars + a.whiteTrucks) ||
    b.whiteCars - a.whiteCars ||
    b.whiteTrucks - a.whiteTrucks
  )
}

/** Per-player summary saved on a finished game; the leaderboard reads only these. */
export interface Result {
  playerId: string
  uid: string | null
  guestId?: string | null
  name: string
  score: number
  whiteCars: number
  whiteTrucks: number
  rank: number
  tally?: Tally
}

/** What a player called, counted. Calls are keyed by call name (Wesla, Whuck, or a custom label). */
export interface Tally {
  calls: Record<string, number>
  gas: number
  dealerships: number
  customs: number
  missed: number
  missedPoints: number
  adjust: number
}

export const emptyTally = (): Tally => ({ calls: {}, gas: 0, dealerships: 0, customs: 0, missed: 0, missedPoints: 0, adjust: 0 })

const stripGas = (label: string) => label.replace(/\s*⛽\s*$/, '').trim()

export function tally(events: ScoreEvent[]): Tally {
  const t = emptyTally()
  for (const e of events) {
    if (e.kind === 'sighting') {
      const known = e.vehicle && e.color ? sightingFor(e.vehicle, e.color) : undefined
      const name = known?.call ?? stripGas(e.label)
      if (!known) t.customs++
      t.calls[name] = (t.calls[name] ?? 0) + 1
      if (e.multiplier > 1) t.gas++
    } else if (e.kind === 'dealership') t.dealerships++
    else if (e.kind === 'missed') {
      t.missed++
      t.missedPoints -= e.points
    } else if (e.kind === 'adjust') t.adjust += e.points
  }
  return t
}

export function addTally(a: Tally, b: Tally): Tally {
  const calls = { ...a.calls }
  for (const [k, v] of Object.entries(b.calls)) calls[k] = (calls[k] ?? 0) + v
  return {
    calls,
    gas: a.gas + b.gas,
    dealerships: a.dealerships + b.dealerships,
    customs: a.customs + b.customs,
    missed: a.missed + b.missed,
    missedPoints: a.missedPoints + b.missedPoints,
    adjust: a.adjust + b.adjust,
  }
}

export function results(game: Game): Result[] {
  return standings(game).map((s) => ({
    playerId: s.player.id,
    uid: s.player.uid ?? null,
    guestId: s.player.guestId ?? null,
    name: s.player.name,
    score: s.score,
    whiteCars: s.whiteCars,
    whiteTrucks: s.whiteTrucks,
    rank: s.rank,
    tally: tally(game.events.filter((e) => e.playerId === s.player.id)),
  }))
}

export interface LifetimeStats {
  key: string
  uid: string | null
  name: string
  games: number
  wins: number
  points: number
  whiteCars: number
  whiteTrucks: number
  best: number
  tally: Tally
}

export function statKey(r: { uid?: string | null; guestId?: string | null; name: string }) {
  return r.uid ?? (r.guestId ? 'guest:' + r.guestId : 'name:' + r.name.trim().toLowerCase())
}

/** Accounts are grouped by uid, saved guests by guest id, anyone else by name. */
export function lifetimeStats(games: Result[][], names: Record<string, string> = {}): LifetimeStats[] {
  const byKey = new Map<string, LifetimeStats>()
  for (const game of games) {
    for (const r of game) {
      const key = statKey(r)
      const st = byKey.get(key) ?? {
        key,
        uid: r.uid,
        name: (r.uid && names[r.uid]) || r.name.trim(),
        games: 0,
        wins: 0,
        points: 0,
        whiteCars: 0,
        whiteTrucks: 0,
        best: -Infinity,
        tally: emptyTally(),
      }
      st.games++
      if (r.rank === 1) st.wins++
      st.points += r.score
      st.whiteCars += r.whiteCars
      st.whiteTrucks += r.whiteTrucks
      st.best = Math.max(st.best, r.score)
      if (r.tally) st.tally = addTally(st.tally, r.tally)
      byKey.set(key, st)
    }
  }
  return [...byKey.values()].sort((a, b) => b.wins - a.wins || b.points - a.points)
}
