import { useState } from 'react'
import { newId, type Profile } from '../data'
import type { Player } from '../scoring'

interface Props {
  users: Profile[]
  taken: Player[]
  onPick: (player: Player) => void
}

/** Add an account holder with one tap, or type a guest's name. */
export function PlayerPicker({ users, taken, onPick }: Props) {
  const [draft, setDraft] = useState('')
  const takenUids = new Set(taken.flatMap((p) => (p.uid ? [p.uid] : [])))
  const takenNames = new Set(taken.map((p) => p.name.toLowerCase()))
  const friends = users.filter((u) => !takenUids.has(u.uid))

  function addGuest() {
    const name = draft.trim()
    if (!name || takenNames.has(name.toLowerCase())) return
    onPick({ id: newId(), name })
    setDraft('')
  }

  return (
    <>
      {friends.length > 0 && (
        <div className="chips">
          {friends.map((u) => (
            <button key={u.uid} className="chip" onClick={() => onPick({ id: newId(), name: u.name, uid: u.uid })}>
              + {u.name}
            </button>
          ))}
        </div>
      )}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          addGuest()
        }}
      >
        <input className="grow" placeholder="Guest name (no account)" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="big primary narrow" type="submit" disabled={!draft.trim()}>
          Add
        </button>
      </form>
    </>
  )
}
