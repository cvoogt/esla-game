import { useState } from 'react'
import { CARS, DEALERSHIP_POINTS, GAS_STATION_MULTIPLIER, SWATCH, TRUCKS, type Sighting, type Vehicle } from '../rules'
import { newId, type CustomSighting, type NewEvent } from '../data'
import type { Game } from '../scoring'

interface Props {
  game: Game
  playerId: string
  customs: CustomSighting[]
  onCustoms: (customs: CustomSighting[]) => void
  onScore: (events: NewEvent[]) => void
  onClose: () => void
}

type Panel = 'main' | 'custom' | 'adjust'

export function ScoreSheet({ game, playerId, customs, onCustoms, onScore, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([playerId])
  const [missed, setMissed] = useState(false)
  const [vehicle, setVehicle] = useState<Vehicle>('car')
  const [gas, setGas] = useState(false)
  const [panel, setPanel] = useState<Panel>('main')
  const [customLabel, setCustomLabel] = useState('')
  const [customPoints, setCustomPoints] = useState('')
  const [adjust, setAdjust] = useState('')

  const mult = gas ? GAS_STATION_MULTIPLIER : 1
  const sign = missed ? -1 : 1
  const kind = missed ? 'missed' : 'sighting'

  function togglePlayer(id: string) {
    setSelected((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]))
  }

  function emit(e: Omit<NewEvent, 'playerId'>) {
    onScore(selected.map((playerId) => ({ ...e, playerId })))
  }

  function scoreSighting(s: Sighting) {
    emit({
      kind,
      label: (missed ? 'Missed ' : '') + s.call + (gas ? ' ⛽' : ''),
      vehicle: s.vehicle,
      color: s.color,
      multiplier: mult,
      points: sign * s.points * mult,
    })
  }

  function scoreCustom(label: string, points: number) {
    emit({
      kind,
      label: (missed ? 'Missed ' : '') + label + (gas ? ' ⛽' : ''),
      multiplier: mult,
      points: sign * points * mult,
    })
  }

  function scoreDealership() {
    emit({
      kind: missed ? 'missed' : 'dealership',
      label: (missed ? 'Missed ' : '') + 'Dealership',
      multiplier: 1,
      points: sign * DEALERSHIP_POINTS,
    })
  }

  function submitCustom() {
    const label = customLabel.trim() || 'Custom'
    const points = Math.abs(parseInt(customPoints, 10))
    if (!points) return
    if (customLabel.trim())
      onCustoms([{ id: newId(), label, points }, ...customs.filter((c) => c.label.toLowerCase() !== label.toLowerCase())])
    scoreCustom(label, points)
  }

  function submitAdjust(value: number) {
    if (!value) return
    emit({ kind: 'adjust', label: 'Adjustment', multiplier: 1, points: value })
  }

  const list = vehicle === 'car' ? CARS : TRUCKS
  const fmt = (p: number) => (p > 0 ? `+${p}` : `${p}`)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${missed ? 'is-missed' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="chips">
          {game.players.map((p) => (
            <button
              key={p.id}
              className={`chip ${selected.includes(p.id) ? 'on' : ''}`}
              onClick={() => togglePlayer(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {panel !== 'adjust' && (
          <div className="seg">
            <button className={!missed ? 'on' : ''} onClick={() => setMissed(false)}>
              ✓ Called
            </button>
            <button className={missed ? 'on danger' : ''} onClick={() => setMissed(true)}>
              ✗ Missed
            </button>
          </div>
        )}

        {panel === 'main' && (
          <>
            <div className="row">
              <div className="seg grow">
                <button className={vehicle === 'car' ? 'on' : ''} onClick={() => setVehicle('car')}>
                  Tesla
                </button>
                <button className={vehicle === 'truck' ? 'on' : ''} onClick={() => setVehicle('truck')}>
                  Cybertruck
                </button>
              </div>
              <button className={`toggle ${gas ? 'on' : ''}`} onClick={() => setGas(!gas)}>
                ⛽ ×2
              </button>
            </div>

            <div className="grid">
              {list.map((s) => (
                <button key={s.call} className="color-btn" onClick={() => scoreSighting(s)}>
                  <span
                    className={`swatch ${s.vehicle === 'truck' ? 'square' : ''}`}
                    style={{ background: SWATCH[s.color] }}
                  />
                  <span className="call">{s.call}</span>
                  <span className="pts">{fmt(sign * s.points * mult)}</span>
                </button>
              ))}
            </div>

            <div className="row">
              <button className="big special" onClick={scoreDealership}>
                🏢 Dealership <b>{fmt(sign * DEALERSHIP_POINTS)}</b>
              </button>
            </div>
            <div className="row">
              <button className="big" onClick={() => setPanel('custom')}>
                ✨ Custom
              </button>
              <button className="big" onClick={() => setPanel('adjust')}>
                ± Adjust
              </button>
            </div>
          </>
        )}

        {panel === 'custom' && (
          <>
            <div className="row">
              <button className={`toggle ${gas ? 'on' : ''}`} onClick={() => setGas(!gas)}>
                ⛽ ×2
              </button>
            </div>
            {customs.length > 0 && (
              <div className="grid">
                {customs.map((c) => (
                  <button key={c.id} className="color-btn" onClick={() => scoreCustom(c.label, c.points)}>
                    <span className="call">{c.label}</span>
                    <span className="pts">{fmt(sign * c.points * mult)}</span>
                    <span
                      className="remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCustoms(customs.filter((x) => x.id !== c.id))
                      }}
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="row">
              <input
                className="grow"
                placeholder="Name (e.g. Green wrap)"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
              />
              <input
                className="num"
                inputMode="numeric"
                placeholder="Pts"
                value={customPoints}
                onChange={(e) => setCustomPoints(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="row">
              <button className="big" onClick={() => setPanel('main')}>
                ← Back
              </button>
              <button className="big primary" onClick={submitCustom} disabled={!parseInt(customPoints, 10)}>
                {missed ? 'Subtract' : 'Add'}
              </button>
            </div>
          </>
        )}

        {panel === 'adjust' && (
          <>
            <div className="grid four">
              {[-5, -1, 1, 5].map((v) => (
                <button key={v} className="color-btn" onClick={() => submitAdjust(v)}>
                  <span className="pts">{fmt(v)}</span>
                </button>
              ))}
            </div>
            <div className="row">
              <input
                className="grow"
                inputMode="numeric"
                placeholder="Amount, e.g. 10 or -10"
                value={adjust}
                onChange={(e) => setAdjust(e.target.value.replace(/[^\d-]/g, ''))}
              />
            </div>
            <div className="row">
              <button className="big" onClick={() => setPanel('main')}>
                ← Back
              </button>
              <button className="big danger" onClick={() => submitAdjust(-Math.abs(parseInt(adjust, 10) || 0))}>
                −
              </button>
              <button className="big primary" onClick={() => submitAdjust(Math.abs(parseInt(adjust, 10) || 0))}>
                +
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
