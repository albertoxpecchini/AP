import { useState, useCallback } from 'react'
import Home from './components/Home.jsx'
import PercorsoLampo from './games/PercorsoLampo.jsx'

export default function App() {
  // Viste: 'home' | 'percorso-lampo'
  const [view, setView] = useState('home')
  // Modalità: 'libera' (parte dal livello 1) | 'sfida' (sfida del giorno, seed fisso)
  const [mode, setMode] = useState('libera')

  const goHome = useCallback(() => setView('home'), [])

  const startGame = useCallback((selectedMode) => {
    setMode(selectedMode)
    setView('percorso-lampo')
  }, [])

  return (
    <div className="app-shell">
      {view === 'home' && <Home onStart={startGame} />}
      {view === 'percorso-lampo' && (
        <PercorsoLampo mode={mode} onExit={goHome} />
      )}
    </div>
  )
}
