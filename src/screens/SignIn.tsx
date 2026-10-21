import { useState } from 'react'
import { resetPassword, signIn, signUp } from '../data'

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Password needs at least 6 characters.',
  'auth/invalid-email': "That email doesn't look right.",
  'auth/network-request-failed': 'No connection. Try again when you have signal.',
  'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
}

export function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string>()

  async function submit() {
    setBusy(true)
    setMsg(undefined)
    try {
      if (mode === 'up') await signUp(name.trim(), email, password)
      else await signIn(email, password)
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      setMsg(MESSAGES[code] ?? (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    if (!email.trim()) return setMsg('Enter your email first.')
    try {
      await resetPassword(email)
      setMsg('Password reset email sent.')
    } catch (e) {
      setMsg(MESSAGES[(e as { code?: string }).code ?? ''] ?? (e as Error).message)
    }
  }

  const ready = email.trim() && password && (mode === 'in' || name.trim())

  return (
    <div className="screen">
      <div className="hero">
        <h1>Esla</h1>
        <p className="muted">Spot it. Call it. Score it.</p>
      </div>

      <div className="seg">
        <button className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>
          Sign in
        </button>
        <button className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>
          Create account
        </button>
      </div>

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) submit()
        }}
      >
        {mode === 'up' && <input placeholder="Your name" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} />}
        <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Password"
          autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="big primary" type="submit" disabled={!ready || busy}>
          {busy ? '…' : mode === 'up' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {msg && <p className="center">{msg}</p>}
      {mode === 'in' && (
        <button className="link" onClick={forgot}>
          Forgot password?
        </button>
      )}
    </div>
  )
}
