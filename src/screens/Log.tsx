import type { Game } from '../scoring'
import { actions } from '../store'

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function Log({ game, onBack }: { game: Game; onBack: () => void }) {
  const name = (id: string) => game.players.find((p) => p.id === id)?.name ?? '?'
  const events = [...game.events].reverse()

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <h2>Log</h2>
        <span />
      </header>
      {events.length === 0 && <p className="muted center">No calls yet.</p>}
      <ul className="list">
        {events.map((e) => (
          <li key={e.id}>
            <span className="log-time">{time(e.at)}</span>
            <span className="grow">
              <b>{name(e.playerId)}</b> {e.label}
            </span>
            <span className={e.points < 0 ? 'neg' : 'pos'}>
              {e.points > 0 ? '+' : ''}
              {e.points}
            </span>
            <button
              className="link danger"
              aria-label="Delete"
              onClick={() => confirm(`Delete "${e.label}" for ${name(e.playerId)}?`) && actions.removeEvent(game.id, e.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
