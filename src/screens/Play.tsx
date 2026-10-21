import { useEffect, useRef, useState } from 'react'
import { ScoreSheet } from '../components/ScoreSheet'
import { feedback, keepAwake } from '../feedback'
import { standings, type Game, type ScoreEvent } from '../scoring'
import { actions, useStore } from '../store'

interface Toast {
  ids: string[]
  text: string
  points: number
}

export function Play({ game, onHome, onLog, onEnd }: { game: Game; onHome: () => void; onLog: () => void; onEnd: () => void }) {
  const { sound } = useStore()
  const [active, setActive] = useState<string>()
  const [toast, setToast] = useState<Toast>()
  const [flash, setFlash] = useState<{ id: string; good: boolean; n: number }>()
  const timer = useRef<number>(undefined)

  useEffect(() => {
    let release = () => {}
    const acquire = async () => {
      if (document.visibilityState === 'visible') release = await keepAwake()
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      document.removeEventListener('visibilitychange', acquire)
      release()
    }
  }, [])

  const rows = standings(game)

  function score(events: Omit<ScoreEvent, 'id' | 'at'>[]) {
    const ids = actions.addEvents(game.id, events)
    setActive(undefined)
    const names = events.map((e) => game.players.find((p) => p.id === e.playerId)?.name).join(' & ')
    const points = events[0].points
    setToast({ ids, text: `${names}: ${events[0].label} ${points > 0 ? '+' : ''}${points}`, points })
    setFlash({ id: events[0].playerId, good: points >= 0, n: Date.now() })
    feedback(points, sound)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(undefined), 4000)
  }

  function undo() {
    toast?.ids.forEach((id) => actions.removeEvent(game.id, id))
    setToast(undefined)
  }

  function addPlayer() {
    const name = prompt('Player name')?.trim()
    if (name) actions.addPlayer(game.id, name)
  }

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onHome}>
          ← Home
        </button>
        <h2>Esla</h2>
        <button className="link" onClick={actions.toggleSound} aria-label="Toggle sound">
          {sound ? '🔊' : '🔇'}
        </button>
      </header>

      {game.endedAt && <div className="banner">Editing a finished game</div>}

      <div className="cards">
        {rows.map((r) => (
          <button
            key={`${r.player.id}-${flash?.id === r.player.id ? flash.n : ''}`}
            className={`card ${flash?.id === r.player.id ? (flash.good ? 'flash-good' : 'flash-bad') : ''}`}
            onClick={() => setActive(r.player.id)}
          >
            <span className="rank">{r.rank}</span>
            <span className="name">{r.player.name}</span>
            <span className="whites">
              <span title="White Teslas">⚪ {r.whiteCars}</span>
              <span title="White Cybertrucks">⬜ {r.whiteTrucks}</span>
            </span>
            <span className="score">{r.score}</span>
          </button>
        ))}
        <button className="link add-player" onClick={addPlayer}>
          + Add player
        </button>
      </div>

      <div className="footer row">
        <button className="big" onClick={onLog}>
          📜 Log ({game.events.length})
        </button>
        <button
          className="big primary"
          onClick={() => {
            if (game.endedAt || confirm('End the game and see final standings?')) {
              actions.endGame(game.id)
              onEnd()
            }
          }}
        >
          🏁 {game.endedAt ? 'Done' : 'End Game'}
        </button>
      </div>

      {toast && (
        <div className={`toast ${toast.points < 0 ? 'bad' : ''}`}>
          <span>{toast.text}</span>
          <button className="link" onClick={undo}>
            Undo
          </button>
        </div>
      )}

      {active && <ScoreSheet game={game} playerId={active} onScore={score} onClose={() => setActive(undefined)} />}
    </div>
  )
}

