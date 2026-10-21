import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import { results, type Game, type Player, type Result, type ScoreEvent } from './scoring'

export interface CustomSighting {
  id: string
  label: string
  points: number
}

export interface Profile {
  uid: string
  name: string
  customs: CustomSighting[]
}

/** Game document without its events (events live in a subcollection). */
export interface GameDoc extends Omit<Game, 'events'> {
  memberUids: string[]
  status: 'live' | 'ended'
  results?: Result[]
}

export type NewEvent = Omit<ScoreEvent, 'id' | 'at'>

const games = collection(db, 'games')
const users = collection(db, 'users')
const eventsOf = (gameId: string) => collection(db, 'games', gameId, 'events')

export const newId = () => doc(games).id

// Writes are fire-and-forget: Firestore applies them locally right away and
// syncs when there's signal. Awaiting them would hang while offline.
function bg(p: Promise<unknown>) {
  p.catch((e) => {
    console.error(e)
    alert('Could not save: ' + (e?.message ?? e))
  })
}

// ---------- Auth ----------

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(auth.currentUser ?? undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  return user
}

export async function signUp(name: string, email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await updateProfile(user, { displayName: name })
  await setDoc(doc(users, user.uid), { name, customs: [] })
}

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password)
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim())
export const signOut = () => fbSignOut(auth)

// ---------- Users ----------

function toProfile(uid: string, data: Record<string, unknown>): Profile {
  return { uid, name: String(data.name ?? 'Player'), customs: (data.customs as CustomSighting[]) ?? [] }
}

export function useUsers() {
  const [list, setList] = useState<Profile[]>([])
  useEffect(
    () =>
      onSnapshot(users, (snap) =>
        setList(
          snap.docs
            .map((d) => toProfile(d.id, d.data()))
            .sort((a, b) => a.name.localeCompare(b.name)),
        ),
      ),
    [],
  )
  return list
}

export function useProfile(uid: string) {
  const [profile, setProfile] = useState<Profile>()
  useEffect(
    () =>
      onSnapshot(doc(users, uid), (d) =>
        setProfile(d.exists() ? toProfile(uid, d.data()) : undefined),
      ),
    [uid],
  )
  return profile
}

export function saveCustoms(uid: string, customs: CustomSighting[]) {
  bg(setDoc(doc(users, uid), { customs: customs.slice(0, 16) }, { merge: true }))
}

// ---------- Games ----------

function toGameDoc(id: string, data: Record<string, unknown>): GameDoc {
  return { id, ...(data as Omit<GameDoc, 'id'>), endedAt: (data.endedAt as number | null) ?? undefined }
}

/** Every game I'm a member of, newest first. */
export function useMyGames(uid: string) {
  const [list, setList] = useState<GameDoc[]>()
  useEffect(
    () =>
      onSnapshot(query(games, where('memberUids', 'array-contains', uid)), (snap) =>
        setList(snap.docs.map((d) => toGameDoc(d.id, d.data())).sort((a, b) => b.startedAt - a.startedAt)),
      ),
    [uid],
  )
  return list
}

/** Every finished game in the app, for the friends leaderboard. */
export function useFinishedGames() {
  const [list, setList] = useState<GameDoc[]>([])
  useEffect(
    () => onSnapshot(query(games, where('status', '==', 'ended')), (snap) => setList(snap.docs.map((d) => toGameDoc(d.id, d.data())))),
    [],
  )
  return list
}

/** A single game with its events, live. */
export function useGame(id: string | undefined) {
  const [meta, setMeta] = useState<GameDoc | null>()
  const [events, setEvents] = useState<ScoreEvent[]>()
  useEffect(() => {
    if (!id) return
    setMeta(undefined)
    setEvents(undefined)
    const offGame = onSnapshot(doc(games, id), (d) => setMeta(d.exists() ? toGameDoc(d.id, d.data()) : null))
    const offEvents = onSnapshot(eventsOf(id), (snap) =>
      setEvents(snap.docs.map((d) => ({ ...(d.data() as ScoreEvent), id: d.id })).sort((a, b) => a.at - b.at)),
    )
    return () => {
      offGame()
      offEvents()
    }
  }, [id])
  if (meta === null) return null
  if (!id || meta === undefined || events === undefined) return undefined
  return { ...meta, events }
}

function memberUidsOf(players: Player[], me: string) {
  return [...new Set([me, ...players.flatMap((p) => (p.uid ? [p.uid] : []))])]
}

export function createGame(me: string, players: Player[], endOthers: GameDoc[]) {
  const id = newId()
  // Only one live game at a time: starting a new one ends the old ones.
  endOthers.forEach((g) =>
    bg(getDocs(eventsOf(g.id)).then((snap) => endGame({ ...g, events: snap.docs.map((d) => d.data() as ScoreEvent) }))),
  )
  const batch = writeBatch(db)
  batch.set(doc(games, id), {
    players: players.map(stripUndefined),
    memberUids: memberUidsOf(players, me),
    createdBy: me,
    startedAt: Date.now(),
    endedAt: null,
    status: 'live',
  })
  bg(batch.commit())
  return id
}

export function addEvents(gameId: string, me: string, events: NewEvent[]) {
  const at = Date.now()
  const batch = writeBatch(db)
  const ids = events.map((e) => {
    const ref = doc(eventsOf(gameId))
    batch.set(ref, { ...stripUndefined(e), at, by: me })
    return ref.id
  })
  bg(batch.commit())
  return ids
}

export function removeEvents(gameId: string, ids: string[]) {
  const batch = writeBatch(db)
  ids.forEach((id) => batch.delete(doc(eventsOf(gameId), id)))
  bg(batch.commit())
}

export function addPlayer(gameId: string, player: Player) {
  bg(
    updateDoc(doc(games, gameId), {
      players: arrayUnion(stripUndefined(player)),
      ...(player.uid ? { memberUids: arrayUnion(player.uid) } : {}),
    }),
  )
}

export function endGame(game: Game) {
  bg(updateDoc(doc(games, game.id), { status: 'ended', endedAt: game.endedAt ?? Date.now(), results: results(game) }))
}

/** Keeps the saved leaderboard summary in step when a finished game is edited. */
export function syncResults(game: Game) {
  bg(updateDoc(doc(games, game.id), { results: results(game) }))
}

export function deleteGame(game: Game) {
  const batch = writeBatch(db)
  game.events.forEach((e) => batch.delete(doc(eventsOf(game.id), e.id)))
  batch.delete(doc(games, game.id))
  bg(batch.commit())
}

function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}
