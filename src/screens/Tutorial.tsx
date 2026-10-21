import { useRef, useState, type ReactNode } from 'react'
import { Bonuses, CallRules, CarTable, Missed, TruckTable, Winning } from '../components/RuleBits'
import { SWATCH } from '../rules'

interface Step {
  icon: string
  title: string
  body: ReactNode
}

const STEPS: Step[] = [
  {
    icon: '🚗',
    title: 'Welcome to Esla',
    body: (
      <>
        <p>A game for the car. Spot Teslas on the road, shout out the right name first, and rack up points.</p>
        <p className="muted">This takes about a minute. You can skip it and watch it again from the home screen anytime.</p>
      </>
    ),
  },
  { icon: '📣', title: 'Calling', body: <CallRules /> },
  {
    icon: '⚪',
    title: 'Teslas',
    body: (
      <>
        <p>
          White is the big one: a <b>Wesla</b> is worth 2. Every other color is 1.
        </p>
        <CarTable />
      </>
    ),
  },
  {
    icon: '⬜',
    title: 'Cybertrucks',
    body: (
      <>
        <p>
          Worth more. A white <b>Whuck</b> is 3, and every other truck is 2, including the bare stainless <b>Suck</b>.
        </p>
        <TruckTable />
      </>
    ),
  },
  { icon: '⛽', title: 'Bonuses', body: <Bonuses /> },
  { icon: '✗', title: 'Missed calls', body: <Missed /> },
  { icon: '🏆', title: 'Winning', body: <Winning /> },
  {
    icon: '👆',
    title: 'Scoring in the app',
    body: (
      <>
        <p>
          <b>1.</b> Tap the player who called it.
        </p>
        <div className="card static demo">
          <span className="rank">1</span>
          <span className="name">Sam</span>
          <span className="whites">
            <span>⚪ 1</span>
            <span>⬜ 0</span>
          </span>
          <span className="score">5</span>
        </div>
        <p>
          <b>2.</b> Pick <b>Tesla</b> or <b>Cybertruck</b>, turn on <b>⛽ ×2</b> if it's at a gas station, then tap the color.
        </p>
        <div className="grid demo">
          <div className="color-btn">
            <span className="swatch" style={{ background: SWATCH.white }} />
            <span className="call">Wesla</span>
            <span className="pts">+2</span>
          </div>
          <div className="color-btn">
            <span className="swatch" style={{ background: SWATCH.red }} />
            <span className="call">Resla</span>
            <span className="pts">+1</span>
          </div>
        </div>
        <p className="muted small">Two people called it? Tap both names at the top of the panel.</p>
      </>
    ),
  },
  {
    icon: '↩︎',
    title: 'Fixing mistakes',
    body: (
      <ul className="rule-list">
        <li>
          Switch the panel to <b>✗ Missed</b> to take points off.
        </li>
        <li>
          <b>Undo</b> pops up after every score. Tap it if you hit the wrong button.
        </li>
        <li>
          <b>📜 Log</b> lists every call; delete any of them.
        </li>
        <li>
          <b>± Adjust</b> adds or takes off any number of points.
        </li>
      </ul>
    ),
  },
  {
    icon: '👥',
    title: 'Playing together',
    body: (
      <ul className="rule-list">
        <li>
          Trade <b>friend codes</b> under 👥 Friends. Friends in your game can score from their own phones, live.
        </li>
        <li>
          No account? Add them as a <b>guest</b>. Guests are saved to your account for next time.
        </li>
        <li>Your wins, points and best games add up on the leaderboard.</li>
        <li>No signal? Keep playing. Scores sync when you're back in range.</li>
      </ul>
    ),
  },
  {
    icon: '🏁',
    title: "You're ready",
    body: (
      <>
        <p>
          Start a game with <b>＋ New game</b>. The rules are always one tap away under <b>📖 Rules</b>.
        </p>
        <p className="muted">Eyes on the road if you're driving. Let a passenger do the tapping.</p>
      </>
    ),
  },
]

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const touch = useRef<number>(undefined)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  const go = (n: number) => {
    setI(Math.max(0, Math.min(STEPS.length - 1, n)))
    window.scrollTo(0, 0)
  }

  return (
    <div
      className="screen tutorial"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === undefined) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (dx < -60) go(i + 1)
        if (dx > 60) go(i - 1)
        touch.current = undefined
      }}
    >
      <header className="bar">
        <span className="muted small">
          {i + 1} / {STEPS.length}
        </span>
        <span />
        <button className="link" onClick={onDone}>
          {last ? 'Close' : 'Skip'}
        </button>
      </header>

      <div className="step" key={i}>
        <div className="step-icon">{step.icon}</div>
        <h2>{step.title}</h2>
        {step.body}
      </div>

      <div className="dots">
        {STEPS.map((_, n) => (
          <button key={n} className={n === i ? 'on' : ''} onClick={() => go(n)} aria-label={`Step ${n + 1}`} />
        ))}
      </div>

      <div className="footer row">
        {i > 0 && (
          <button className="big" onClick={() => go(i - 1)}>
            ← Back
          </button>
        )}
        <button className="big primary" onClick={() => (last ? onDone() : go(i + 1))}>
          {last ? "Let's play" : i === 0 ? 'Show me how' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
