import { useEffect, useRef, useState } from 'react'
import { PlayerPicker } from '../components/PlayerPicker'
import { ScoreSheet } from '../components/ScoreSheet'
import { addEvents, addPlayer, endGame, removeEvents, saveCustoms, syncResults, type NewEvent, type Profile } from '../data'
import { feedback, keepAwake } from '../feedback'
import { results, standings, type Game } from '../scoring'
import { toggleSound, usePrefs } from '../store'

interface Toast {
  ids: string[]
  text: string
  points: number
}

interface Props {
  game: Game
  me: Profile
  friends: Profile[]
  onHome: () => void
  onLog: () => void
  onEnd: () => void
}

export function Play({ game, me, friends, onHome, onLog, onEnd }: Props) {
  const { sound } = usePrefs()
  const [active, setActive] = useState<string>()
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<Toast>()
  const [flash, setFlash] = useState<Record<string, { good: boolean; n: number }>>({})
  const timer = useRef<number>(undefined)
  const seen = useRef<Set<string>>(undefined)

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

  // Flash the card when anyone (on any phone) scores for a player.
  useEffect(() => {
    const ids = new Set(game.events.map((e) => e.id))
    if (seen.current) {
      const fresh = game.events.filter((e) => !seen.current!.has(e.id))
      if (fresh.length) {
        const n = Date.now()
        setFlash((f) => ({ ...f, ...Object.fromEntries(fresh.map((e) => [e.playerId, { good: e.points >= 0, n }])) }))
      }
    }
    seen.current = ids
  }, [game.events])

  // Editing a finished game keeps its saved leaderboard results in step.
  const summary = JSON.stringify(results(game))
  const lastSummary = useRef(summary)
  useEffect(() => {
    if (game.endedAt && summary !== lastSummary.current) syncResults(game)
    lastSummary.current = summary
  }, [summary, game])

  const rows = standings(game)

  function score(events: NewEvent[]) {
    const ids = addEvents(game.id, me.uid, events)
    setActive(undefined)
    const names = events.map((e) => game.players.find((p) => p.id === e.playerId)?.name).join(' & ')
    const points = events[0].points
    setToast({ ids, text: `${names}: ${events[0].label} ${points > 0 ? '+' : ''}${points}`, points })
    feedback(points, sound)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(undefined), 4000)
  }

  function undo() {
    if (toast) removeEvents(game.id, toast.ids)
    setToast(undefined)
  }

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onHome}>
          ← Home
        </button>
        <h2>Esla</h2>
        <button className="link" onClick={toggleSound} aria-label="Toggle sound">
          {sound ? '🔊' : '🔇'}
        </button>
      </header>

      {game.endedAt && <div className="banner">Editing a finished game</div>}

      <div className="cards">
        {rows.map((r) => {
          const f = flash[r.player.id]
          return (
            <button
              key={`${r.player.id}-${f?.n ?? ''}`}
              className={`card ${f ? (f.good ? 'flash-good' : 'flash-bad') : ''}`}
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
          )
        })}
        <button className="link add-player" onClick={() => setAdding(true)}>
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
            if (game.endedAt) return onEnd()
            if (confirm('End the game for everyone and see final standings?')) {
              endGame(game)
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

      {active && (
        <ScoreSheet
          game={game}
          playerId={active}
          customs={me.customs}
          onCustoms={(c) => saveCustoms(me.uid, c)}
          onScore={score}
          onClose={() => setActive(undefined)}
        />
      )}

      {adding && (
        <div className="sheet-backdrop" onClick={() => setAdding(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3>Add player</h3>
            <PlayerPicker
              me={me}
              friends={friends}
              taken={game.players}
              onPick={(p) => {
                addPlayer(game.id, p)
                setAdding(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
