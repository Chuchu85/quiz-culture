import React, { useRef, useEffect } from 'react'
import ClassicQCMDisplayView from '../classic_qcm/DisplayView.jsx'

export default function OeilDeLynxDisplayView({ step, state, socket }) {
  const status = state?.status
  const videoRef = useRef(null)

  // Lance/arrête la vidéo selon le statut (initial + replay)
  useEffect(() => {
    const isVideoStatus = status === 'video_playing' || status === 'video_replay'
    if (isVideoStatus && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
    if (!isVideoStatus && videoRef.current) {
      videoRef.current.pause()
    }
  }, [status])

  // Phase vidéo initiale — avec son et contrôles
  if (status === 'video_playing') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        {step?.videoUrl ? (
          <div className="w-full rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(0,212,255,0.4)', maxWidth: 900 }}>
            <video
              ref={videoRef}
              src={step.videoUrl}
              playsInline
              controls
              style={{ width: '100%', display: 'block' }}
              onEnded={() => socket?.emit('display:video-ended')}
            />
          </div>
        ) : (
          <div className="rounded-3xl p-16 flex flex-col items-center gap-4"
            style={{ background: 'rgba(0,212,255,0.1)', boxShadow: '0 4px 32px rgba(0,212,255,0.1)' }}>
            <p className="text-6xl">🎬</p>
            <p className="font-display text-3xl text-white">Aucune vidéo importée</p>
          </div>
        )}
        <p className="font-display text-2xl text-white/50 animate-pulse">
          👁️ Regardez attentivement…
        </p>
      </div>
    )
  }

  // Replay après révélation — avec audio activé
  if (status === 'video_replay') {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        {step?.videoUrl ? (
          <div className="w-full rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(0,212,255,0.6)', maxWidth: 900 }}>
            <video
              ref={videoRef}
              src={step.videoUrl}
              playsInline
              controls
              style={{ width: '100%', display: 'block' }}
              onEnded={() => socket?.emit('display:video-ended')}
            />
          </div>
        ) : null}
        <p className="font-display text-2xl" style={{ color: '#00d4ff' }}>
          🎬 Replay — La réponse va s'afficher après la vidéo
        </p>
      </div>
    )
  }

  // Phase question — QCM standard
  return <ClassicQCMDisplayView step={step} state={state} />
}
