import { TallyTable } from '../components/TallyTable'
import type { Stats } from '../data'
import { ALL_SIGHTINGS } from '../rules'
import { emptyTally } from '../scoring'

interface Props {
  name: string
  kind: 'me' | 'friend' | 'guest'
  stats: Stats
  onBack: () => void
}

export function PlayerStats({ name, kind, stats, onBack }: Props) {
  const t = stats.tally ?? emptyTally()
  const totalCalls = Object.values(t.calls).reduce((a, b) => a + b, 0)
  const favorite = Object.entries(t.calls).sort((a, b) => b[1] - a[1])[0]
  const found = ALL_SIGHTINGS.filter((s) => (t.calls[s.call] ?? 0) > 0).length
  const pct = (n: number) => (stats.games ? Math.round((n / stats.games) * 100) + '%' : '–')
  const avg = stats.games ? (stats.points / stats.games).toFixed(1) : '–'

  const tiles: [string, string | number][] = [
    ['Games', stats.games],
    ['Wins', stats.wins],
    ['Win rate', pct(stats.wins)],
    ['Points', stats.points],
    ['Avg / game', avg],
    ['Best game', stats.best ?? '–'],
    ['⚪ White Teslas', stats.whiteCars],
    ['⬜ White trucks', stats.whiteTrucks],
    ['Calls', totalCalls],
  ]

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <h2>{kind === 'me' ? 'My stats' : name}</h2>
        <span />
      </header>

      {kind === 'guest' && <p className="muted center small">Guest · stats from games you played with them</p>}

      <div className="stat-grid">
        {tiles.map(([label, value]) => (
          <div key={label} className="stat">
            <div className="value">{value}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {favorite && (
        <p className="center">
          Favorite call: <b>{favorite[0]}</b> ({favorite[1]}×)
        </p>
      )}

      <h3>
        Call collection · {found}/{ALL_SIGHTINGS.length}
      </h3>
      <TallyTable columns={[{ key: 'me', name, tally: t }]} showAll />
      {stats.games > 0 && !stats.tally && (
        <p className="muted small">Call counts appear here once {kind === 'me' ? 'you open' : 'they open'} the updated app.</p>
      )}
    </div>
  )
}
