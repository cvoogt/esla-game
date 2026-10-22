import { ALL_SIGHTINGS, SWATCH } from '../rules'
import type { Tally } from '../scoring'

interface Column {
  key: string
  name: string
  tally: Tally
}

interface Props {
  columns: Column[]
  /** Show every call, even ones nobody has made yet (for lifetime collections). */
  showAll?: boolean
}

const short = (name: string) => (name.length > 7 ? name.slice(0, 6) + '…' : name)

/** Rows are calls, columns are players. The leader in each row is highlighted. */
export function TallyTable({ columns, showAll }: Props) {
  const count = (t: Tally, call: string) => t.calls[call] ?? 0
  const known = ALL_SIGHTINGS.filter((s) => showAll || columns.some((c) => count(c.tally, s.call) > 0))
  const knownNames = new Set(ALL_SIGHTINGS.map((s) => s.call))
  const customs = [...new Set(columns.flatMap((c) => Object.keys(c.tally.calls)))].filter((k) => !knownNames.has(k)).sort()

  const extras: { label: string; value: (t: Tally) => number; bad?: boolean }[] = [
    { label: '⛽ Gas station', value: (t) => t.gas },
    { label: '🏢 Dealership', value: (t) => t.dealerships },
    { label: '✗ Missed', value: (t) => t.missed, bad: true },
    { label: '✗ Pts lost', value: (t) => t.missedPoints, bad: true },
    { label: '± Adjusted', value: (t) => t.adjust },
  ]

  const cells = (values: number[], bad?: boolean) => {
    const top = Math.max(...values)
    return values.map((v, i) => (
      <td key={columns[i].key} className={v === 0 ? 'zero' : columns.length > 1 && v === top && !bad ? 'lead' : ''}>
        {v}
      </td>
    ))
  }

  const empty = known.length === 0 && customs.length === 0 && columns.every((c) => extras.every((x) => x.value(c.tally) === 0))
  if (empty) return <p className="muted">No calls yet.</p>

  return (
    <table className="table tally">
      {columns.length > 1 && (
        <thead>
          <tr>
            <th />
            {columns.map((c) => (
              <th key={c.key}>{short(c.name)}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {known.map((s) => (
          <tr key={s.call}>
            <td>
              <span className={`swatch inline ${s.vehicle === 'truck' ? 'square' : ''}`} style={{ background: SWATCH[s.color] }} />
              {s.call}
            </td>
            {cells(columns.map((c) => count(c.tally, s.call)))}
          </tr>
        ))}
        {customs.map((name) => (
          <tr key={'c:' + name}>
            <td>✨ {name}</td>
            {cells(columns.map((c) => count(c.tally, name)))}
          </tr>
        ))}
        {extras
          .filter((x) => columns.some((c) => x.value(c.tally) !== 0))
          .map((x) => (
            <tr key={x.label} className="extra">
              <td>{x.label}</td>
              {cells(
                columns.map((c) => x.value(c.tally)),
                x.bad,
              )}
            </tr>
          ))}
      </tbody>
    </table>
  )
}
