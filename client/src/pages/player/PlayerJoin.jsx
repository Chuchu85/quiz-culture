import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import Background from '../../components/Background.jsx'
import FaucheLogo from '../../components/FaucheLogo.jsx'

export default function PlayerJoin() {
  const navigate = useNavigate()
  const { socket, connected } = useSocket()
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [clientLogo, setClientLogo] = useState(null)
  const [quizLogo, setQuizLogo] = useState(null)
  const joinTimeoutRef = useRef(null)

  useEffect(() => {
    fetch('/api/room').then(r => r.json()).then(d => {
      setClientLogo(d.clientLogo)
      setQuizLogo(d.logo || null)
    }).catch(() => {})
  }, [])

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [photo, setPhoto] = useState(null) // base64 data URL
  const [cameraError, setCameraError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const pendingPhotoRef = useRef(null)

  useEffect(() => {
    const onJoined = ({ teamName: name }) => {
      console.log('[PlayerJoin] player:joined reçu :', name)
      clearTimeout(joinTimeoutRef.current)
      if (pendingPhotoRef.current) {
        socket.emit('player:photo', { photo: pendingPhotoRef.current })
      }
      navigate('/play', { state: { teamName: name, photo: pendingPhotoRef.current } })
    }
    const onError = ({ message }) => {
      clearTimeout(joinTimeoutRef.current)
      setLoading(false)
      setError(message)
    }
    const onDisconnect = () => {
      clearTimeout(joinTimeoutRef.current)
      setLoading(false)
      setError('Connexion perdue, réessaie.')
    }
    socket.on('player:joined', onJoined)
    socket.on('player:error', onError)
    socket.on('disconnect', onDisconnect)
    return () => {
      clearTimeout(joinTimeoutRef.current)
      socket.off('player:joined', onJoined)
      socket.off('player:error', onError)
      socket.off('disconnect', onDisconnect)
      stopCamera()
    }
  }, [socket, navigate])

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function openCamera() {
    setCameraError(null)
    setCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 320 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (e) {
      setCameraError('Caméra non disponible')
      setCameraOpen(false)
    }
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = 80
    canvas.height = 80
    const ctx = canvas.getContext('2d')
    // Crop to square from center
    const size = Math.min(video.videoWidth, video.videoHeight)
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 80, 80)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.65)
    setPhoto(dataUrl)
    pendingPhotoRef.current = dataUrl
    stopCamera()
    setCameraOpen(false)
  }

  function retakePhoto() {
    setPhoto(null)
    pendingPhotoRef.current = null
    openCamera()
  }

  function join(e) {
    e.preventDefault()
    const trimName = teamName.trim()
    if (!trimName) return setError("Entre un nom d'équipe !")
    if (!connected) return setError('Pas de connexion au serveur — réessaie dans quelques secondes.')
    setLoading(true)
    setError(null)
    console.log('[PlayerJoin] Envoi player:join, socket.id =', socket.id, 'connecté =', connected)
    socket.emit('player:join', { teamName: trimName })
    joinTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError('Le serveur ne répond pas — vérifie ta connexion et réessaie.')
      console.log('[PlayerJoin] Timeout : pas de réponse du serveur')
    }, 8000)
  }

  return (
    <Background>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="flex flex-col items-center gap-4 mb-8 animate-pop_in">
            {/* Logo Culture Mashup */}
            <img
              src={quizLogo ? `${quizLogo}?t=${Date.now()}` : '/logo.png'}
              alt="Culture Mashup Quiz"
              className="drop-shadow-2xl"
              style={{ maxHeight: 110, objectFit: 'contain' }}
            />
            {/* Séparateur + logo client */}
            <div className="flex items-center gap-4">
              <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35))' }} />
              <FaucheLogo src={clientLogo} size={56} />
              <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0.35), transparent)' }} />
            </div>
          </div>

          {/* Camera section */}
          <div className="quiz-card p-6 mb-4 animate-slide_up flex flex-col items-center gap-4">
            <p className="text-white/60 font-body text-sm text-center">
              {photo ? 'Ta photo est prête' : 'Prends une photo pour apparaître sur le tableau'}
            </p>

            {/* Live camera preview */}
            {cameraOpen && !photo && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ width: 200, height: 200, border: '3px solid #ff1ee8', boxShadow: '0 0 20px rgba(255,30,232,0.4)' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full font-display text-2xl transition-all active:scale-90"
                  style={{ background: 'rgba(255,30,232,0.3)', color: 'white', boxShadow: '0 0 20px rgba(255,30,232,0.5)' }}>
                  ◉
                </button>
              </div>
            )}

            {/* Photo taken preview */}
            {photo && (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full overflow-hidden"
                  style={{ width: 96, height: 96, boxShadow: '0 0 20px rgba(57,255,20,0.5)' }}>
                  <img src={photo} alt="ta photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button type="button" onClick={retakePhoto}
                  className="font-body text-xs px-4 py-2 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  Reprendre
                </button>
              </div>
            )}

            {/* Open camera button */}
            {!cameraOpen && !photo && (
              <button type="button" onClick={openCamera}
                className="font-body text-sm px-6 py-3 rounded-full transition-all"
                style={{ background: 'rgba(255,30,232,0.2)', color: '#ff6ef7' }}>
                Ouvrir la caméra
              </button>
            )}

            {cameraError && (
              <p className="text-red-400 text-xs font-body text-center">{cameraError}</p>
            )}
          </div>

          <div className="quiz-card p-8 animate-slide_up">
            <p className="text-white/60 text-center font-body mb-6 text-lg">
              Quel est le nom de ton équipe ?
            </p>

            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400 text-red-200 text-sm font-body text-center animate-shake">
                {error}
              </div>
            )}

            <form onSubmit={join} className="flex flex-col gap-5">
              <input
                type="text"
                value={teamName}
                onChange={e => { setTeamName(e.target.value); setError(null) }}
                maxLength={24}
                placeholder="Les Champions"
                className="w-full rounded-2xl px-5 py-5 font-body font-extrabold text-2xl text-center focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white', caretColor: '#ff1ee8',
                }}
                autoComplete="off" spellCheck={false}
              />
              <button
                type="submit"
                className="btn-green w-full text-2xl py-5"
                disabled={loading || !teamName.trim()}
                style={{ opacity: loading || !teamName.trim() ? 0.5 : 1 }}
              >
                {loading ? 'Connexion…' : "C'est parti !"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </Background>
  )
}
