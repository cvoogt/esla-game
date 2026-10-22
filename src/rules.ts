export type Vehicle = 'car' | 'truck'

export type ColorKey = 'white' | 'grey' | 'black' | 'blue' | 'silver' | 'red' | 'pink' | 'purple'

export interface Sighting {
  vehicle: Vehicle
  color: ColorKey
  call: string
  points: number
}

export const SWATCH: Record<ColorKey, string> = {
  white: '#f5f5f5',
  grey: '#7d828a',
  black: '#151515',
  blue: '#2563eb',
  silver: '#c0c4c9',
  red: '#dc2626',
  pink: '#f472b6',
  purple: '#8b5cf6',
}

export const CARS: Sighting[] = [
  { vehicle: 'car', color: 'white', call: 'Wesla', points: 2 },
  { vehicle: 'car', color: 'grey', call: 'Gresla', points: 1 },
  { vehicle: 'car', color: 'black', call: 'Blesla', points: 1 },
  { vehicle: 'car', color: 'blue', call: 'Blusla', points: 1 },
  { vehicle: 'car', color: 'silver', call: 'Sesla', points: 1 },
  { vehicle: 'car', color: 'red', call: 'Resla', points: 1 },
  { vehicle: 'car', color: 'pink', call: 'Pesla', points: 1 },
  { vehicle: 'car', color: 'purple', call: 'Puresla', points: 1 },
]

export const TRUCKS: Sighting[] = [
  { vehicle: 'truck', color: 'white', call: 'Whuck', points: 3 },
  { vehicle: 'truck', color: 'grey', call: 'Gruck', points: 2 },
  { vehicle: 'truck', color: 'black', call: 'Bluck', points: 2 },
  { vehicle: 'truck', color: 'blue', call: 'Blueck', points: 2 },
  { vehicle: 'truck', color: 'silver', call: 'Suck', points: 2 },
  { vehicle: 'truck', color: 'red', call: 'Ruck', points: 2 },
  { vehicle: 'truck', color: 'pink', call: 'Puck', points: 2 },
  { vehicle: 'truck', color: 'purple', call: 'Puruck', points: 2 },
]

export const DEALERSHIP_POINTS = 50
export const GAS_STATION_MULTIPLIER = 2

export const ALL_SIGHTINGS = [...CARS, ...TRUCKS]

export function sightingFor(vehicle: Vehicle, color: ColorKey) {
  return ALL_SIGHTINGS.find((s) => s.vehicle === vehicle && s.color === color)
}
