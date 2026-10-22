import { describe, expect, it } from 'vitest'
import { lifetimeStats, results, standings, tally, type Game, type ScoreEvent } from './scoring'

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
  it('sums across games and groups guests by name', () => {
    const stats = lifetimeStats([results(game([ev('a', 5)])), results(game([ev('a', 2), ev('b', 9)]))])
    const ann = stats.find((s) => s.name === 'Ann')!
    expect(ann).toMatchObject({ games: 2, wins: 1, points: 7, best: 5 })
  })

  it('groups accounts by uid and uses their current name', () => {
    const g1 = results(game([ev('a', 3)])).map((r) => (r.playerId === 'a' ? { ...r, uid: 'u1', name: 'Old' } : r))
    const g2 = results(game([ev('a', 1)])).map((r) => (r.playerId === 'a' ? { ...r, uid: 'u1', name: 'Ann' } : r))
    const stats = lifetimeStats([g1, g2], { u1: 'Annie' })
    expect(stats.filter((s) => s.uid === 'u1')).toEqual([expect.objectContaining({ name: 'Annie', games: 2, points: 4 })])
  })
  it('keeps saved guests apart even with the same name', () => {
    const g = results(game([ev('a', 2), ev('b', 4)])).map((r) => ({ ...r, name: 'Kid', guestId: r.playerId }))
    expect(lifetimeStats([g]).map((s) => s.key)).toEqual(['guest:b', 'guest:a'])
  })
})

describe('tally', () => {
  it('counts calls by name, gas doubles, customs, misses and specials', () => {
    const t = tally([
      ev('a', 2, { color: 'white', vehicle: 'car', label: 'Wesla' }),
      ev('a', 6, { color: 'white', vehicle: 'truck', label: 'Whuck ⛽', multiplier: 2 }),
      ev('a', 2, { color: 'white', vehicle: 'car', label: 'Wesla' }),
      ev('a', 3, { label: 'Green wrap ⛽', multiplier: 2 }),
      ev('a', -2, { kind: 'missed', color: 'grey', vehicle: 'truck', label: 'Missed Gruck' }),
      ev('a', 50, { kind: 'dealership', label: 'Dealership' }),
      ev('a', -5, { kind: 'adjust', label: 'Adjustment' }),
    ])
    expect(t).toEqual({
      calls: { Wesla: 2, Whuck: 1, 'Green wrap': 1 },
      gas: 2,
      dealerships: 1,
      customs: 1,
      missed: 1,
      missedPoints: 2,
      adjust: -5,
    })
  })

  it('adds up across games in lifetime stats', () => {
    const g = () => results(game([ev('a', 2, { color: 'white', vehicle: 'car' })]))
    expect(lifetimeStats([g(), g()]).find((s) => s.name === 'Ann')!.tally.calls).toEqual({ Wesla: 2 })
  })
})
