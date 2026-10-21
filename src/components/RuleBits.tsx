import { CARS, DEALERSHIP_POINTS, GAS_STATION_MULTIPLIER, SWATCH, TRUCKS, type Sighting } from '../rules'

/** Point table built straight from rules.ts, so it can't drift from the scoring. */
export function PointTable({ list, title }: { list: Sighting[]; title: string }) {
  return (
    <table className="table points-table">
      <thead>
        <tr>
          <th>{title}</th>
          <th>Pts</th>
          <th>⛽ ×{GAS_STATION_MULTIPLIER}</th>
        </tr>
      </thead>
      <tbody>
        {list.map((s) => (
          <tr key={s.call}>
            <td>
              <span className={`swatch inline ${s.vehicle === 'truck' ? 'square' : ''}`} style={{ background: SWATCH[s.color] }} />
              <b>{s.call}</b> <span className="muted small">{s.color === 'silver' && s.vehicle === 'truck' ? 'stainless' : s.color}</span>
            </td>
            <td>{s.points}</td>
            <td>{s.points * GAS_STATION_MULTIPLIER}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const CarTable = () => <PointTable list={CARS} title="Tesla" />
export const TruckTable = () => <PointTable list={TRUCKS} title="Cybertruck" />

export function Bonuses() {
  return (
    <ul className="rule-list">
      <li>
        <b>⛽ Gas station ×{GAS_STATION_MULTIPLIER}</b>: a Tesla or Cybertruck at a gas station is worth double. Custom calls double
        too.
      </li>
      <li>
        <b>🏢 Dealership +{DEALERSHIP_POINTS}</b>: spot a Tesla dealership. Never doubled.
      </li>
      <li>
        <b>✨ Custom</b>: wraps and colors not on the list. Agree on the points and add it as a custom call.
      </li>
    </ul>
  )
}

export function Missed() {
  return (
    <ul className="rule-list">
      <li>
        <b>✗ Missed call</b>: miss a call and you <b>lose</b> what that car is worth. A missed Whuck is −3; at a gas station
        it's −6.
      </li>
      <li>You can win the points back by calling it correctly.</li>
      <li>Missed calls never count toward the white tiebreaker.</li>
    </ul>
  )
}

export function CallRules() {
  return (
    <ul className="rule-list">
      <li>
        Say the name <b>out loud</b> to claim it.
      </li>
      <li>
        Two people call it at the same time? <b>Both</b> get the points.
      </li>
      <li>
        The same car can only be called <b>once</b>.
      </li>
      <li>
        <b>Parked</b> cars count.
      </li>
    </ul>
  )
}

export function Winning() {
  return (
    <ul className="rule-list">
      <li>The game usually ends when you arrive. Anyone can tap End Game.</li>
      <li>Most points wins. Ties are broken by:</li>
      <li className="sub">1. most white Teslas + white Cybertrucks combined</li>
      <li className="sub">2. then most white Teslas</li>
      <li className="sub">3. then most white Cybertrucks</li>
    </ul>
  )
}
