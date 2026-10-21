import { useState } from 'react'
import { PlayerPicker } from '../components/PlayerPicker'
import { newId, type Profile } from '../data'
import type { Player } from '../scoring'

interface Props {
  me: Profile
  friends: Profile[]
  onBack: () => void
  onStart: (players: Player[]) => void
}

export function Setup({ me, friends, onBack, onStart }: Props) {
  const [players, setPlayers] = useState<Player[]>([{ id: newId(), name: me.name, uid: me.uid }])

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <h2>New Game</h2>
        <span />
      </header>

      <ul className="list">
        {players.map((p, i) => (
          <li key={p.id}>
            <span className="grow">
              {i + 1}. {p.name} {!p.uid && <span className="muted small">guest</span>}
            </span>
            <button className="link danger" onClick={() => setPlayers(players.filter((x) => x.id !== p.id))}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h3>Add players</h3>
      <PlayerPicker me={me} friends={friends} taken={players} onPick={(p) => setPlayers([...players, p])} />
      <p className="muted small">Friends can score from their own phones. Add friends from the home screen.</p>

      <div className="footer">
        <button className="big primary" disabled={players.length === 0} onClick={() => onStart(players)}>
          Start Game
        </button>
      </div>
    </div>
  )
}
