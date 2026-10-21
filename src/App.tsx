import { useEffect, useRef, useState } from 'react'
import {
  createGame,
  ensureFriendCode,
  saveStats,
  useAuth,
  useFriends,
  useGame,
  useMyGames,
  useProfile,
  type GameDoc,
  type Profile,
  type Stats,
} from './data'
import { lifetimeStats, type LifetimeStats } from './scoring'
import { Friends } from './screens/Friends'
import { Home, type BoardRow } from './screens/Home'
import { Log } from './screens/Log'
import { Play } from './screens/Play'
import { Results } from './screens/Results'
import { Setup } from './screens/Setup'
import { SignIn } from './screens/SignIn'

export function App() {
  const user = useAuth()
  if (user === undefined) return <Splash />
  if (user === null) return <SignIn />
  return <SignedIn uid={user.uid} fallbackName={user.displayName ?? 'Player'} />
}

function Splash() {
  return (
    <div className="screen">
      <div className="hero">
        <h1>Esla</h1>
      </div>
    </div>
  )
}

type View = 'home' | 'setup' | 'play' | 'log' | 'results' | 'friends'

const EMPTY: Stats = { games: 0, wins: 0, points: 0, whiteCars: 0, whiteTrucks: 0, best: null }

function toStats(s: LifetimeStats | undefined): Stats {
  if (!s) return EMPTY
  const { games, wins, points, whiteCars, whiteTrucks, best } = s
  return { games, wins, points, whiteCars, whiteTrucks, best }
}

/** Me (from my own games), my saved guests, and my friends (from their saved stats). */
function leaderboard(me: Profile, friends: Profile[], myGames: GameDoc[]): { mine: Stats; board: BoardRow[] } {
  const all = lifetimeStats(myGames.flatMap((g) => (g.status === 'ended' && g.results ? [g.results] : [])))
  const mine = toStats(all.find((s) => s.key === me.uid))
  const board: BoardRow[] = [
    { key: me.uid, name: me.name, kind: 'me', ...mine },
    ...friends.map((f) => ({ key: f.uid, name: f.name, kind: 'friend' as const, ...(f.stats ?? EMPTY) })),
    ...me.guests.map((g) => ({ key: 'guest:' + g.id, name: g.name, kind: 'guest' as const, ...toStats(all.find((s) => s.key === 'guest:' + g.id)) })),
  ]
  board.sort((a, b) => b.wins - a.wins || b.points - a.points || b.games - a.games)
  return { mine, board }
}

function SignedIn({ uid, fallbackName }: { uid: string; fallbackName: string }) {
  const profile = useProfile(uid)
  const friends = useFriends(uid)
  const myGames = useMyGames(uid)
  const [view, setView] = useState<View>('home')
  const [gameId, setGameId] = useState<string>()
  const game = useGame(gameId)

  // Jump into a live game when the app opens (or when a friend starts one),
  // until the user navigates somewhere themselves.
  const navigated = useRef(false)
  const live = myGames?.find((g) => g.status === 'live')
  useEffect(() => {
    if (!navigated.current && live && view === 'home') {
      setGameId(live.id)
      setView('play')
    }
  }, [live, view])

  // Accounts made before friend codes existed get one now.
  const needsCode = profile && !profile.friendCode
  useEffect(() => {
    if (needsCode) ensureFriendCode(uid).catch(console.error)
  }, [needsCode, uid])

  // The profile doc can lag right after sign-up.
  const me: Profile = profile ?? { uid, name: fallbackName, customs: [], guests: [] }
  const { mine, board } = leaderboard(me, friends, myGames ?? [])

  // Publish my lifetime stats so friends' leaderboards can show them.
  const minesJson = JSON.stringify(mine)
  useEffect(() => {
    if (profile && myGames && minesJson !== JSON.stringify(profile.stats ?? EMPTY)) saveStats(uid, JSON.parse(minesJson))
  }, [minesJson, profile, myGames, uid])

  function go(v: View, id?: string) {
    navigated.current = true
    if (id) setGameId(id)
    setView(v)
    window.scrollTo(0, 0)
  }

  if (!myGames) return <Splash />

  if (view === 'friends') return <Friends me={me} friends={friends} onBack={() => go('home')} />

  if (view === 'setup')
    return (
      <Setup
        me={me}
        friends={friends}
        onBack={() => go('home')}
        onStart={(players) => go('play', createGame(uid, players, myGames.filter((g) => g.status === 'live')))}
      />
    )

  if (view === 'home' || game === null)
    return (
      <Home
        me={me}
        board={board}
        myGames={myGames}
        onFriends={() => go('friends')}
        onNew={() => go('setup')}
        onOpen={(id) => go('play', id)}
        onResults={(id) => go('results', id)}
      />
    )

  if (!game) return <Splash />
  if (view === 'log') return <Log game={game} onBack={() => go('play')} />
  if (view === 'results') return <Results game={game} onHome={() => go('home')} onEdit={() => go('play')} />
  return <Play game={game} me={me} friends={friends} onHome={() => go('home')} onLog={() => go('log')} onEnd={() => go('results')} />
}
