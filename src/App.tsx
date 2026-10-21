import { useState } from 'react'
import { Home } from './screens/Home'
import { Log } from './screens/Log'
import { Play } from './screens/Play'
import { Results } from './screens/Results'
import { Setup } from './screens/Setup'
import { actions, useStore } from './store'

type View = 'home' | 'setup' | 'play' | 'log' | 'results'

export function App() {
  const { games, currentId } = useStore()
  const game = games.find((g) => g.id === currentId)
  const [view, setView] = useState<View>(game && !game.endedAt ? 'play' : 'home')

  const go = (v: View, id?: string) => {
    if (id) actions.open(id)
    setView(v)
  }

  if (view === 'setup') return <Setup onBack={() => go('home')} onStart={() => go('play')} />
  if (!game || view === 'home')
    return <Home onNew={() => go('setup')} onOpen={(id) => go('play', id)} onResults={(id) => go('results', id)} />
  if (view === 'log') return <Log game={game} onBack={() => go('play')} />
  if (view === 'results')
    return (
      <Results
        game={game}
        onHome={() => go('home')}
        onEdit={() => go('play')}
      />
    )
  return <Play game={game} onHome={() => go('home')} onLog={() => go('log')} onEnd={() => go('results')} />
}
