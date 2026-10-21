import { signOut, type GameDoc, type Profile, type Stats } from '../data'

export interface BoardRow extends Stats {
  key: string
  name: string
  kind: 'me' | 'friend' | 'guest'
}

interface Props {
  me: Profile
  board: BoardRow[]
  myGames: GameDoc[]
  onFriends: () => void
  onRules: () => void
  onTutorial: () => void
  onNew: () => void
  onOpen: (id: string) => void
  onResults: (id: string) => void
}

export function Home({ me, board, myGames, onFriends, onRules, onTutorial, onNew, onOpen, onResults }: Props) {
  const live = myGames.find((g) => g.status === 'live')
  const past = myGames.filter((g) => g.status === 'ended')

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

      <div className="tiles">
        <button onClick={onRules}>
          <span>📖</span>Rules
        </button>
        <button onClick={onTutorial}>
          <span>🎓</span>Tutorial
        </button>
        <button onClick={onFriends}>
          <span>👥</span>Friends
        </button>
      </div>

      {board.some((r) => r.games > 0) && (
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
              {board.map((s) => (
                <tr key={s.key} className={s.kind === 'me' ? 'me' : ''}>
                  <td>
                    {s.name}
                    {s.kind === 'guest' && <span className="muted small"> guest</span>}
                  </td>
                  <td>{s.wins}</td>
                  <td>{s.games}</td>
                  <td>{s.points}</td>
                  <td>{s.best ?? '–'}</td>
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
