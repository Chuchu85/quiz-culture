import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import Background from '../../components/Background.jsx'
import TeamList from '../../components/TeamList.jsx'
import { QRCodeSVG } from 'qrcode.react'
import FaucheLogo from '../../components/FaucheLogo.jsx'

export default function HostLobby() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { refreshTheme } = useTheme()
  const [players, setPlayers] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(false)

  const onStateRef = useRef(null)

  // Synchronise le fond/thème du quiz actif dès l'ouverture du lobby
  useEffect(() => { refreshTheme() }, [])

  useEffect(() => {
    onStateRef.current = (s) => {
      setPlayers(s.players ?? [])
      setStatus(s.status)
      if (s.status && s.status !== 'idle' && s.status !== 'lobby') {
        navigate(`/host/${code}/game`)
      }
    }
    socket.on('game:state', onStateRef.current)
    socket.on('error', ({ message }) => setError(message))
    return () => {
      if (onStateRef.current) socket.off('game:state', onStateRef.current)
      socket.off('error')
    }
  }, [socket, code, navigate])

  // Reconnexion auto + réinitialisation complète si le socket se reconnecte
  useEffect(() => {
    function onReconnect() {
      const pwd = sessionStorage.getItem('host_pwd')
      if (pwd) {
        socket.emit('host:connect', { password: pwd })
        setTimeout(() => socket.emit('host:start-game'), 200)
      } else {
        socket.emit('host:request-state')
      }
    }
    socket.on('connect', onReconnect)
    return () => socket.off('connect', onReconnect)
  }, [socket])

  // Au montage : ouvrir le lobby et demander l'état courant
  useEffect(() => {
    socket.emit('host:start-game')
    socket.emit('host:request-state')

    // Polling de secours toutes les 3s (si les événements socket sont perdus)
    const interval = setInterval(() => {
      socket.emit('host:request-state')
    }, 3000)
    return () => clearInterval(interval)
  }, [socket])

  const [clientLogo, setClientLogo] = useState(null)
  useEffect(() => {
    fetch('/api/room').then(r => r.json()).then(d => setClientLogo(d.clientLogo)).catch(() => {})
  }, [])

  const joinUrl = `${window.location.origin}/join`
  const displayUrl = `${window.location.origin}/display/${code}`

  function startGame() {
    setStarting(true)
    socket.emit('host:launch-question')
    navigate(`/host/${code}/game`)
  }

  return (
    <Background glowColor="green">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-xl">

          {/* Logos */}
          <div className="flex justify-center items-center gap-6 mb-8">
            <img src="/logo.png" alt="Culture Mashup Quiz" className="object-contain drop-shadow-2xl" style={{ height: 90 }} />
            <div style={{ width: 2, height: 60, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.35), transparent)', borderRadius: 2 }} />
            <FaucheLogo src={clientLogo} size={84} />
          </div>

          <div className="mb-8" />

          {/* Join link + QR */}
          <div className="rounded-3xl p-8 mb-8 animate-pop_in"
            style={{ background: 'rgba(57,255,20,0.1)', border: '3px solid #39ff14', boxShadow: '0 0 40px rgba(57,255,20,0.25)' }}>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 rounded-2xl overflow-hidden p-2"
                style={{ background: 'white' }}>
                <QRCodeSVG value={joinUrl} size={100} bgColor="#ffffff" fgColor="#111827" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-quiz-green text-sm uppercase tracking-widest mb-2">
                  Lien à partager
                </p>
                <p className="font-body font-extrabold text-white text-lg break-all"
                  style={{ textShadow: '0 0 15px rgba(57,255,20,0.5)' }}>
                  {joinUrl}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(joinUrl)}
                  className="mt-3 font-body text-sm px-5 py-2 rounded-full transition-colors"
                  style={{ background: 'rgba(57,255,20,0.2)', border: '1px solid #39ff14', color: '#39ff14' }}>
                  Copier
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400 text-red-200 text-sm font-body">
              {error}
            </div>
          )}

          {/* Players */}
          <div className="quiz-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-white">Équipes connectées</h2>
              <span className="font-display text-2xl" style={{ color: '#39ff14' }}>{players.length}</span>
            </div>
            <TeamList players={players} />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              className="btn-outline flex-1"
              onClick={() => window.open(displayUrl, '_blank', 'noopener')}>
              Ouvrir l'écran projecteur
            </button>
            <button
              className="btn-green flex-1"
              onClick={startGame}
              disabled={players.length === 0 || starting}
              style={{ opacity: players.length === 0 ? 0.5 : 1 }}>
              {starting ? 'Lancement…' : '▶ Lancer la partie'}
            </button>
          </div>

          <p className="text-center text-white/30 text-xs font-body mt-4">
            {players.length === 0
              ? "En attente d'au moins une équipe"
              : `${players.length} équipe${players.length > 1 ? 's' : ''} prête${players.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    </Background>
  )
}
