import type { ColorKey, Vehicle } from './rules'

export interface Player {
  id: string
  name: string
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
}

export interface Game {
  id: string
  players: Player[]
  events: ScoreEvent[]
  startedAt: number
  endedAt?: number
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

export interface LifetimeStats {
  name: string
  games: number
  wins: number
  points: number
  whiteCars: number
  whiteTrucks: number
  best: number
}

export function lifetimeStats(games: Game[]): LifetimeStats[] {
  const byName = new Map<string, LifetimeStats>()
  for (const game of games.filter((g) => g.endedAt)) {
    for (const s of standings(game)) {
      const key = s.player.name.trim().toLowerCase()
      const st = byName.get(key) ?? {
        name: s.player.name.trim(),
        games: 0,
        wins: 0,
        points: 0,
        whiteCars: 0,
        whiteTrucks: 0,
        best: -Infinity,
      }
      st.games++
      if (s.rank === 1) st.wins++
      st.points += s.score
      st.whiteCars += s.whiteCars
      st.whiteTrucks += s.whiteTrucks
      st.best = Math.max(st.best, s.score)
      byName.set(key, st)
    }
  }
  return [...byName.values()].sort((a, b) => b.wins - a.wins || b.points - a.points)
}
