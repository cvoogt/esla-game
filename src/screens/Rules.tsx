import { Bonuses, CallRules, CarTable, Missed, TruckTable, Winning } from '../components/RuleBits'

export function Rules({ onBack, onTutorial }: { onBack: () => void; onTutorial: () => void }) {
  return (
    <div className="screen">
      <header className="bar">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <h2>Rules</h2>
        <span />
      </header>

      <p className="muted">Spot a Tesla, shout its name first, and score.</p>

      <h3>Calling</h3>
      <CallRules />

      <h3>Teslas</h3>
      <CarTable />

      <h3>Cybertrucks</h3>
      <TruckTable />

      <h3>Bonuses</h3>
      <Bonuses />

      <h3>Missed calls</h3>
      <Missed />

      <h3>Winning</h3>
      <Winning />

      <button className="big" onClick={onTutorial}>
        🎓 Watch the tutorial
      </button>
    </div>
  )
}
