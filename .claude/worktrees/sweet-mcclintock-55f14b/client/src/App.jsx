import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

import Landing from './pages/Landing.jsx'
import PlayerJoin from './pages/player/PlayerJoin.jsx'
import PlayerGame from './pages/player/PlayerGame.jsx'

import HostHome from './pages/host/HostHome.jsx'
import HostLobby from './pages/host/HostLobby.jsx'
import HostGame from './pages/host/HostGame.jsx'

import Display from './pages/display/Display.jsx'
import Backoffice from './pages/backoffice/Backoffice.jsx'

export default function App() {
  return (
    <ThemeProvider>
    <SocketProvider>
      <Routes>
        {/* Player */}
        <Route path="/" element={<Landing />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/play" element={<PlayerGame />} />

        {/* Host (animateur) */}
        <Route path="/host" element={<HostHome />} />
        <Route path="/host/:code/lobby" element={<HostLobby />} />
        <Route path="/host/:code/game" element={<HostGame />} />

        {/* Display (écran projecteur) */}
        <Route path="/display/:code" element={<Display />} />

        {/* Backoffice */}
        <Route path="/backoffice" element={<Backoffice />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
    </ThemeProvider>
  )
}
