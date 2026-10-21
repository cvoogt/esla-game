import { useState } from 'react'
import { newId, saveGuests, type Profile } from '../data'
import type { Player } from '../scoring'

interface Props {
  me: Profile
  friends: Profile[]
  taken: Player[]
  onPick: (player: Player) => void
}

/** Add a friend or a saved guest with one tap, or type a new guest (saved for next time). */
export function PlayerPicker({ me, friends, taken, onPick }: Props) {
  const [draft, setDraft] = useState('')
  const takenUids = new Set(taken.flatMap((p) => (p.uid ? [p.uid] : [])))
  const takenGuests = new Set(taken.flatMap((p) => (p.guestId ? [p.guestId] : [])))
  const takenNames = new Set(taken.map((p) => p.name.toLowerCase()))
  const freeFriends = friends.filter((f) => !takenUids.has(f.uid))
  const freeGuests = me.guests.filter((g) => !takenGuests.has(g.id))

  function addGuest() {
    const name = draft.trim()
    if (!name || takenNames.has(name.toLowerCase())) return
    const existing = me.guests.find((g) => g.name.toLowerCase() === name.toLowerCase())
    const guest = existing ?? { id: newId(), name }
    if (!existing) saveGuests(me.uid, [...me.guests, guest])
    onPick({ id: newId(), name: guest.name, guestId: guest.id })
    setDraft('')
  }

  return (
    <>
      {freeFriends.length > 0 && (
        <div className="chips">
          {freeFriends.map((f) => (
            <button key={f.uid} className="chip" onClick={() => onPick({ id: newId(), name: f.name, uid: f.uid })}>
              + {f.name}
            </button>
          ))}
        </div>
      )}
      {freeGuests.length > 0 && (
        <div className="chips">
          {freeGuests.map((g) => (
            <button key={g.id} className="chip guest" onClick={() => onPick({ id: newId(), name: g.name, guestId: g.id })}>
              + {g.name} <span className="muted small">guest</span>
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
        <input className="grow" placeholder="New guest name" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="big primary narrow" type="submit" disabled={!draft.trim()}>
          Add
        </button>
      </form>
    </>
  )
}
