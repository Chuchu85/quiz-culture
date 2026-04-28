import React from 'react'
import ClassicQCMHostView from '../classic_qcm/HostView.jsx'

export default function OeilDeLynxHostView({ step, state, socket }) {
  const status = state?.status

  if (status === 'video_playing') {
    return (
      <div className="space-y-3">
        {step?.videoUrl ? (
          <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #bfdbfe' }}>
            <video src={step.videoUrl} muted playsInline style={{ width: '100%', maxHeight: 180 }} />
          </div>
        ) : (
          <div className="rounded-xl p-3 text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p className="font-body text-sm" style={{ color: '#94a3b8' }}>🎬 Aucune vidéo</p>
          </div>
        )}
        <div className="rounded-xl p-3 text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p className="font-body text-xs" style={{ color: '#64748b' }}>Vidéo en cours sur le projecteur</p>
        </div>
        <button
          onClick={() => socket.emit('host:stop-video')}
          className="w-full py-3 rounded-xl font-display text-base transition-all active:scale-95"
          style={{ background: '#2563eb', color: 'white', border: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          ✂️ Couper — afficher la question
        </button>
      </div>
    )
  }

  if (status === 'video_replay') {
    return (
      <div className="space-y-3">
        {step?.videoUrl ? (
          <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #bfdbfe' }}>
            <video src={step.videoUrl} playsInline style={{ width: '100%', maxHeight: 180 }} />
          </div>
        ) : null}
        <div className="rounded-xl p-3 text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p className="font-body text-xs" style={{ color: '#2563eb' }}>🎬 Replay en cours sur le projecteur (avec son)</p>
        </div>
        <button
          onClick={() => socket.emit('host:stop-video')}
          className="w-full py-3 rounded-xl font-display text-base transition-all active:scale-95"
          style={{ background: '#2563eb', color: 'white', border: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          ✂️ Arrêter le replay — revenir à la réponse
        </button>
      </div>
    )
  }

  return <ClassicQCMHostView step={step} state={state} socket={socket} />
}
