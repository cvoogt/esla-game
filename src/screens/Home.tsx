import { signOut, type GameDoc, type Profile } from '../data'
import { lifetimeStats } from '../scoring'

interface Props {
  me: Profile
  users: Profile[]
  myGames: GameDoc[]
  finished: GameDoc[]
  onNew: () => void
  onOpen: (id: string) => void
  onResults: (id: string) => void
}

export function Home({ me, users, myGames, finished, onNew, onOpen, onResults }: Props) {
  const live = myGames.find((g) => g.status === 'live')
  const past = myGames.filter((g) => g.status === 'ended')
  const names = Object.fromEntries(users.map((u) => [u.uid, u.name]))
  const stats = lifetimeStats(finished.flatMap((g) => (g.results ? [g.results] : [])), names)

  return (
    <div className="screen">
      <header className="bar">
        <span className="muted">Hi, {me.name}</span>
        <span />
        <button
          className="link"
          onClick={() => confirm('Sign out of Esla on this phone?') && signOut()}
        >
          Sign out
        </button>
      </header>

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
                <tr key={s.key} className={s.uid === me.uid ? 'me' : ''}>
                  <td>
                    {s.name}
                    {!s.uid && <span className="muted small"> guest</span>}
                  </td>
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

      {past.length > 0 && (
        <section>
          <h3>My past games</h3>
          <ul className="list">
            {past.map((g) => {
              const top = (g.results ?? []).filter((r) => r.rank === 1)
              return (
                <li key={g.id} onClick={() => onResults(g.id)} className="tap">
                  <span className="grow">
                    {new Date(g.startedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {g.players.length} players
                  </span>
                  <span>
                    🏆 {top.map((r) => r.name).join(' & ') || '—'} {top[0] && `(${top[0].score})`}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
