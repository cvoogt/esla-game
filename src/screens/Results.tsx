import { TallyTable } from '../components/TallyTable'
import { standings, tally, type Game } from '../scoring'
import { deleteGame } from '../data'

const MEDAL = ['🥇', '🥈', '🥉']

export function Results({ game, onHome, onEdit }: { game: Game; onHome: () => void; onEdit: () => void }) {
  const rows = standings(game)
  const tiedOnScore = rows.length > 1 && rows[0].score === rows[1].score

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onHome}>
          ← Home
        </button>
        <h2>Final</h2>
        <span />
      </header>
      <p className="muted center">{new Date(game.startedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>

      {rows[0] && (
        <div className="winner">
          <div className="trophy">🏆</div>
          <div className="name">{rows.filter((r) => r.rank === 1).map((r) => r.player.name).join(' & ')}</div>
          {tiedOnScore && rows[0].rank !== rows[1].rank && <div className="muted">Won on the white tiebreaker</div>}
        </div>
      )}

      <div className="cards">
        {rows.map((r) => (
          <div key={r.player.id} className="card static">
            <span className="rank">{MEDAL[r.rank - 1] ?? r.rank}</span>
            <span className="name">{r.player.name}</span>
            <span className="whites">
              <span>⚪ {r.whiteCars}</span>
              <span>⬜ {r.whiteTrucks}</span>
            </span>
            <span className="score">{r.score}</span>
          </div>
        ))}
      </div>

      <h3>Who called what</h3>
      <TallyTable
        columns={rows.map((r) => ({
          key: r.player.id,
          name: r.player.name,
          tally: tally(game.events.filter((e) => e.playerId === r.player.id)),
        }))}
      />

      <div className="footer row">
        <button
          className="big danger"
          onClick={() => {
            if (confirm('Delete this game for everyone? It will also be removed from the leaderboard.')) {
              deleteGame(game)
              onHome()
            }
          }}
        >
          Delete
        </button>
        <button className="big" onClick={onEdit}>
          ✏️ Edit scores
        </button>
      </div>
    </div>
  )
}
