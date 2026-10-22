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
  deleteDoc,
  doc,
  getDoc,
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
import { results, type Game, type Player, type Result, type ScoreEvent, type Tally } from './scoring'

export interface CustomSighting {
  id: string
  label: string
  points: number
}

export interface Guest {
  id: string
  name: string
}

export interface Stats {
  games: number
  wins: number
  points: number
  whiteCars: number
  whiteTrucks: number
  best: number | null
  tally?: Tally
}

export interface Profile {
  uid: string
  name: string
  customs: CustomSighting[]
  guests: Guest[]
  friendCode?: string
  stats?: Stats
  tutorialSeen?: boolean
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
const friendCodes = collection(db, 'friendCodes')
const friendships = collection(db, 'friendships')
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
  await setDoc(doc(users, user.uid), { name, customs: [], guests: [] })
}

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password)
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim())
export const signOut = () => fbSignOut(auth)

// ---------- Users ----------

function toProfile(uid: string, data: Record<string, unknown>): Profile {
  return {
    uid,
    name: String(data.name ?? 'Player'),
    customs: (data.customs as CustomSighting[]) ?? [],
    guests: (data.guests as Guest[]) ?? [],
    friendCode: data.friendCode as string | undefined,
    stats: data.stats as Stats | undefined,
    tutorialSeen: data.tutorialSeen === true,
  }
}

export function useProfile(uid: string) {
  const [profile, setProfile] = useState<Profile>()
  useEffect(() => onSnapshot(doc(users, uid), (d) => setProfile(d.exists() ? toProfile(uid, d.data()) : undefined)), [uid])
  return profile
}

export function saveCustoms(uid: string, customs: CustomSighting[]) {
  bg(setDoc(doc(users, uid), { customs: customs.slice(0, 16) }, { merge: true }))
}

export function saveGuests(uid: string, guests: Guest[]) {
  bg(setDoc(doc(users, uid), { guests }, { merge: true }))
}

export function markTutorialSeen(uid: string) {
  bg(setDoc(doc(users, uid), { tutorialSeen: true }, { merge: true }))
}

export function saveStats(uid: string, stats: Stats) {
  bg(setDoc(doc(users, uid), { stats }, { merge: true }))
}

// ---------- Friends ----------

// No 0/O or 1/I/L, so codes are easy to read out loud in the car.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const randomCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')

export const pairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`)

/** Gives an account its friend code the first time it's needed. */
export async function ensureFriendCode(uid: string) {
  for (let tries = 0; tries < 3; tries++) {
    const code = randomCode()
    const batch = writeBatch(db)
    batch.set(doc(friendCodes, code), { uid })
    batch.set(doc(users, uid), { friendCode: code }, { merge: true })
    try {
      await batch.commit()
      return
    } catch (e) {
      // Code already taken by someone else; try another.
      if ((e as { code?: string }).code !== 'permission-denied') throw e
    }
  }
  // Three taken codes in a row is near impossible; the database rules are refusing it.
  throw new Error("Couldn't create your friend code. The database rules may be out of date.")
}

export async function addFriendByCode(me: string, raw: string) {
  const code = raw.trim().toUpperCase()
  const hit = await getDoc(doc(friendCodes, code))
  const uid = hit.data()?.uid as string | undefined
  if (!uid) throw new Error('No one has that friend code.')
  if (uid === me) throw new Error("That's your own code.")
  await setDoc(doc(friendships, pairId(me, uid)), { members: [me, uid].sort(), code, createdAt: Date.now() })
}

export function removeFriend(me: string, uid: string) {
  bg(deleteDoc(doc(friendships, pairId(me, uid))))
}

/** My friends' profiles, live. */
export function useFriends(uid: string) {
  const [ids, setIds] = useState<string[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  useEffect(
    () =>
      // Wait for the server to confirm a new friendship; reading their profile before that is refused.
      onSnapshot(query(friendships, where('members', 'array-contains', uid)), { includeMetadataChanges: true }, (snap) =>
        setIds(
          snap.docs
            .filter((d) => !d.metadata.hasPendingWrites)
            .map((d) => (d.data().members as string[]).find((m) => m !== uid)!)
            .filter(Boolean),
        ),
      ),
    [uid],
  )
  const key = ids.join(',')
  useEffect(() => {
    const offs = ids.map((id) =>
      onSnapshot(
        doc(users, id),
        (d) => d.exists() && setProfiles((p) => ({ ...p, [id]: toProfile(id, d.data()) })),
        () => {}, // friendship just removed; access is gone
      ),
    )
    return () => offs.forEach((off) => off())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return ids
    .map((id) => profiles[id])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
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

/**
 * onSnapshot that re-subscribes when refused. A brand-new game is listened to
 * before the server has saved it, and the privacy rules refuse that first read.
 */
function retrySnapshot(subscribe: (onError: (e: unknown) => void) => () => void) {
  let off = () => {}
  let timer: number | undefined
  let tries = 0
  const start = () => {
    off = subscribe((e) => {
      console.warn('listener refused, retrying', e)
      if (tries++ < 10) timer = window.setTimeout(start, 500 * tries)
    })
  }
  start()
  return () => {
    window.clearTimeout(timer)
    off()
  }
}

/** A single game with its events, live. */
export function useGame(id: string | undefined) {
  const [meta, setMeta] = useState<GameDoc | null>()
  const [events, setEvents] = useState<ScoreEvent[]>()
  useEffect(() => {
    if (!id) return
    setMeta(undefined)
    setEvents(undefined)
    const offGame = retrySnapshot((onError) =>
      onSnapshot(doc(games, id), (d) => setMeta(d.exists() ? toGameDoc(d.id, d.data()) : null), onError),
    )
    const offEvents = retrySnapshot((onError) =>
      onSnapshot(
        eventsOf(id),
        (snap) => setEvents(snap.docs.map((d) => ({ ...(d.data() as ScoreEvent), id: d.id })).sort((a, b) => a.at - b.at)),
        onError,
      ),
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

/** Games finished before call counts existed get them from their event log. */
export async function backfillResults(game: GameDoc) {
  const snap = await getDocs(eventsOf(game.id))
  syncResults({ ...game, events: snap.docs.map((d) => ({ ...(d.data() as ScoreEvent), id: d.id })) })
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
