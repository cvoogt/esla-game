import { useState } from 'react'
import { actions, useStore } from '../store'

export function Setup({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const { names: known } = useStore()
  const [names, setNames] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const has = (n: string) => names.some((x) => x.toLowerCase() === n.toLowerCase())
  function add(name: string) {
    const n = name.trim()
    if (n && !has(n)) setNames([...names, n])
    setDraft('')
  }

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <h2>New Game</h2>
        <span />
      </header>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          add(draft)
        }}
      >
        <input
          className="grow"
          placeholder="Player name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <button className="big primary narrow" type="submit" disabled={!draft.trim()}>
          Add
        </button>
      </form>

      {known.filter((n) => !has(n)).length > 0 && (
        <div className="chips">
          {known
            .filter((n) => !has(n))
            .map((n) => (
              <button key={n} className="chip" onClick={() => add(n)}>
                + {n}
              </button>
            ))}
        </div>
      )}

      <ul className="list">
        {names.map((n, i) => (
          <li key={n}>
            <span>
              {i + 1}. {n}
            </span>
            <button className="link danger" onClick={() => setNames(names.filter((x) => x !== n))}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="footer">
        <button
          className="big primary"
          disabled={names.length === 0}
          onClick={() => {
            actions.startGame(names)
            onStart()
          }}
        >
          Start Game
        </button>
      </div>
    </div>
  )
}
