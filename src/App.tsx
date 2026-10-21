import { useEffect, useRef, useState } from 'react'
import { createGame, useAuth, useFinishedGames, useGame, useMyGames, useProfile, useUsers, type Profile } from './data'
import { Home } from './screens/Home'
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

type View = 'home' | 'setup' | 'play' | 'log' | 'results'

function SignedIn({ uid, fallbackName }: { uid: string; fallbackName: string }) {
  const profile = useProfile(uid)
  const users = useUsers()
  const myGames = useMyGames(uid)
  const finished = useFinishedGames()
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

  // The profile doc can lag right after sign-up.
  const me: Profile = profile ?? { uid, name: fallbackName, customs: [] }
  const others = users.filter((u) => u.uid !== uid)

  function go(v: View, id?: string) {
    navigated.current = true
    if (id) setGameId(id)
    setView(v)
    window.scrollTo(0, 0)
  }

  if (!myGames) return <Splash />

  if (view === 'setup')
    return (
      <Setup
        me={me}
        users={others}
        onBack={() => go('home')}
        onStart={(players) =>
          go('play', createGame(uid, players, myGames.filter((g) => g.status === 'live')))
        }
      />
    )

  if (view === 'home' || game === null)
    return (
      <Home
        me={me}
        users={users}
        myGames={myGames}
        finished={finished}
        onNew={() => go('setup')}
        onOpen={(id) => go('play', id)}
        onResults={(id) => go('results', id)}
      />
    )

  if (!game) return <Splash />
  if (view === 'log') return <Log game={game} onBack={() => go('play')} />
  if (view === 'results') return <Results game={game} onHome={() => go('home')} onEdit={() => go('play')} />
  return (
    <Play
      game={game}
      me={me}
      users={others}
      onHome={() => go('home')}
      onLog={() => go('log')}
      onEnd={() => go('results')}
    />
  )
}
