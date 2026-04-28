import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import Background from '../../components/Background.jsx'

export default function HostHome() {
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    fetch('/api/room').then(r => r.json()).then(setInfo).catch(() => {})
  }, [])

  useEffect(() => {
    socket.on('host:connected', ({ code }) => {
      sessionStorage.setItem('host_pwd', password.trim())
      navigate(`/host/${code}/lobby`)
    })
    socket.on('host:error', ({ message }) => {
      setLoading(false)
      setError(message)
    })
    return () => {
      socket.off('host:connected')
      socket.off('host:error')
    }
  }, [socket, navigate])

  function connect(e) {
    e.preventDefault()
    if (!password.trim()) return setError('Entre le mot de passe animateur')
    setLoading(true)
    setError(null)
    socket.emit('host:connect', { password: password.trim() })
  }

  return (
    <Background glowColor="green">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex justify-center mb-8 animate-pop_in">
            <img src="/logo.png" alt="Culture Mashup Quiz" className="h-24 object-contain drop-shadow-2xl" />
          </div>

          <div className="quiz-card p-8 animate-slide_up">
            <div className="text-center mb-6">
              <h1 className="font-display text-3xl text-white mb-1">Espace Animateur</h1>
              {info && (
                <p className="font-body text-white/40 text-sm">
                  {info.quizName} · {info.questionCount} questions
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400 text-red-200 text-sm font-body text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={connect} className="flex flex-col gap-4">
              <div>
                <label className="font-body text-white/60 text-sm block mb-2">
                  Mot de passe animateur
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  className="w-full rounded-2xl px-5 py-4 font-body text-xl text-center focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    caretColor: '#39ff14',
                    letterSpacing: '0.2em',
                  }}
                  onFocus={e => (e.target.style.border = '2px solid #39ff14')}
                  onBlur={e => (e.target.style.border = '2px solid rgba(255,255,255,0.3)')}
                  autoFocus
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn-green w-full text-xl py-5"
                disabled={loading || !password.trim()}
                style={{ opacity: loading || !password.trim() ? 0.5 : 1 }}
              >
                {loading ? 'Connexion…' : 'Accéder au contrôle'}
              </button>
            </form>

            <p className="text-center text-white/20 text-xs font-body mt-5">
              Mot de passe par défaut : <span className="text-white/40">animateur</span>
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full text-center text-white/30 hover:text-white/60 mt-6 font-body text-sm transition-colors"
          >
            ← Retour à l'accueil joueur
          </button>
        </div>
      </div>
    </Background>
  )
}
