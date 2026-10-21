import { lifetimeStats, standings } from '../scoring'
import { useStore } from '../store'

export function Home({ onNew, onOpen, onResults }: { onNew: () => void; onOpen: (id: string) => void; onResults: (id: string) => void }) {
  const { games } = useStore()
  const live = games.find((g) => !g.endedAt)
  const finished = games.filter((g) => g.endedAt)
  const stats = lifetimeStats(games)

  return (
    <div className="screen">
      <div className="hero">
        <h1>Esla</h1>
        <p className="muted">Spot it. Call it. Score it.</p>
      </div>

      {live && (
        <button className="big primary" onClick={() => onOpen(live.id)}>
          ▶ Resume game ({live.players.map((p) => p.name).join(', ')})
        </button>
      )}
      <button
        className={`big ${live ? '' : 'primary'}`}
        onClick={() => {
          if (!live || confirm('A game is still in progress. End it and start a new one?')) onNew()
        }}
      >
        ＋ New game
      </button>

      {stats.length > 0 && (
        <section>
          <h3>Leaderboard</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Wins</th>
                <th>Games</th>
                <th>Pts</th>
                <th>Best</th>
                <th title="White Teslas / White Cybertrucks">⚪/⬜</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.wins}</td>
                  <td>{s.games}</td>
                  <td>{s.points}</td>
                  <td>{s.best}</td>
                  <td>
                    {s.whiteCars}/{s.whiteTrucks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h3>Past games</h3>
          <ul className="list">
            {finished.map((g) => {
              const top = standings(g).filter((r) => r.rank === 1)
              return (
                <li key={g.id} onClick={() => onResults(g.id)} className="tap">
                  <span className="grow">
                    {new Date(g.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} ·{' '}
                    {g.players.length} players
                  </span>
                  <span>
                    🏆 {top.map((r) => r.player.name).join(' & ')} ({top[0]?.score ?? 0})
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <p className="muted center small">Saved on this phone. Accounts and shared games are coming next.</p>
    </div>
  )
}
