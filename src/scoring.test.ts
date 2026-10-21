import { describe, expect, it } from 'vitest'
import { lifetimeStats, standings, type Game, type ScoreEvent } from './scoring'

let n = 0
function ev(playerId: string, points: number, extra: Partial<ScoreEvent> = {}): ScoreEvent {
  return { id: String(n++), playerId, kind: 'sighting', label: '', multiplier: 1, points, at: n, ...extra }
}

function game(events: ScoreEvent[], endedAt?: number): Game {
  return {
    id: 'g',
    players: [
      { id: 'a', name: 'Ann' },
      { id: 'b', name: 'Ben' },
    ],
    events,
    startedAt: 0,
    endedAt,
  }
}

describe('standings', () => {
  it('sums points including negatives', () => {
    const s = standings(game([ev('a', 2), ev('a', -3, { kind: 'missed' }), ev('b', 1)]))
    expect(s.map((r) => [r.player.id, r.score])).toEqual([
      ['b', 1],
      ['a', -1],
    ])
  })

  it('breaks ties on combined whites, then white cars', () => {
    const s = standings(
      game([
        ev('a', 3, { color: 'white', vehicle: 'truck' }),
        ev('b', 2, { color: 'white', vehicle: 'car' }),
        ev('b', 1, { color: 'grey', vehicle: 'car' }),
      ]),
    )
    // both 3 points, both 1 white; Ben has the white car
    expect(s[0].player.id).toBe('b')
    expect(s[1].rank).toBe(2)
  })

  it('missed whites do not count toward tiebreakers', () => {
    const s = standings(game([ev('a', -2, { kind: 'missed', color: 'white', vehicle: 'car' })]))
    expect(s.find((r) => r.player.id === 'a')!.whiteCars).toBe(0)
  })

  it('shares rank on a full tie', () => {
    const s = standings(game([ev('a', 1), ev('b', 1)]))
    expect(s.map((r) => r.rank)).toEqual([1, 1])
  })
})

describe('lifetimeStats', () => {
  it('only counts ended games and merges by name', () => {
    const stats = lifetimeStats([game([ev('a', 5)], 1), game([ev('a', 2), ev('b', 9)], 2), game([ev('a', 100)])])
    const ann = stats.find((s) => s.name === 'Ann')!
    expect(ann).toMatchObject({ games: 2, wins: 1, points: 7, best: 5 })
  })
})
