import { useState } from 'react'
import { addFriendByCode, removeFriend, saveGuests, type Profile } from '../data'

interface Props {
  me: Profile
  friends: Profile[]
  codeError?: string
  onBack: () => void
}

export function Friends({ me, friends, codeError, onBack }: Props) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string>()

  async function add() {
    setBusy(true)
    setMsg(undefined)
    try {
      await addFriendByCode(me.uid, code)
      setCode('')
      setMsg('Friend added!')
    } catch (e) {
      const err = e as { code?: string; message: string }
      setMsg(err.code === 'unavailable' ? 'No connection. Try again when you have signal.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  function share() {
    const text = `Add me on Esla! My friend code is ${me.friendCode}\n${location.origin}${import.meta.env.BASE_URL}`
    if (navigator.share) navigator.share({ text }).catch(() => {})
    else navigator.clipboard?.writeText(text).then(() => setMsg('Copied!'))
  }

  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <h2>Friends</h2>
        <span />
      </header>

      <section className="code-box">
        <div className="muted small">Your friend code</div>
        <div className="code">{me.friendCode ?? '······'}</div>
        {codeError && !me.friendCode && <p className="neg small">{codeError}</p>}
        <button className="link" onClick={share} disabled={!me.friendCode}>
          Share
        </button>
      </section>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim().length === 6) add()
        }}
      >
        <input
          className="grow code-input"
          placeholder="Friend's code"
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect="off"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        />
        <button className="big primary narrow" type="submit" disabled={code.length !== 6 || busy}>
          Add
        </button>
      </form>
      {msg && <p className="center">{msg}</p>}

      <h3>Friends</h3>
      {friends.length === 0 && <p className="muted">No friends yet. Trade codes with whoever's in the car.</p>}
      <ul className="list">
        {friends.map((f) => (
          <li key={f.uid}>
            <span className="grow">{f.name}</span>
            <button className="link danger" onClick={() => confirm(`Remove ${f.name} as a friend?`) && removeFriend(me.uid, f.uid)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h3>Saved guests</h3>
      {me.guests.length === 0 && <p className="muted">Guests you add to a game are saved here for next time.</p>}
      <ul className="list">
        {me.guests.map((g) => (
          <li key={g.id}>
            <span className="grow">{g.name}</span>
            <button
              className="link"
              onClick={() => {
                const name = prompt('Rename guest', g.name)?.trim()
                if (name) saveGuests(me.uid, me.guests.map((x) => (x.id === g.id ? { ...x, name } : x)))
              }}
            >
              Rename
            </button>
            <button
              className="link danger"
              onClick={() => confirm(`Remove ${g.name} from your saved guests?`) && saveGuests(me.uid, me.guests.filter((x) => x.id !== g.id))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
