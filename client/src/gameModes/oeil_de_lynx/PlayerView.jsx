import React from 'react'
import ClassicQCMPlayerView from '../classic_qcm/PlayerView.jsx'

export default function OeilDeLynxPlayerView({ step, state, socket, myAnswer, hasAnswered }) {
  const status = state?.status

  // Pendant la vidéo initiale : regardez l'écran
  if (status === 'video_playing') {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4 px-2 rounded-2xl animate-pop_in"
        style={{ background: 'rgba(0,212,255,0.08)' }}>
        <p className="text-5xl">👁️</p>
        <p className="font-display text-2xl text-white">Regardez attentivement !</p>
        <p className="text-white/50 font-body text-sm">Observez chaque détail sur l'écran…</p>
        <p className="text-white/30 font-body text-xs">La question apparaîtra après la vidéo</p>
      </div>
    )
  }

  // Pendant le replay : la vidéo se rejoue sur le projecteur
  if (status === 'video_replay') {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4 px-2 rounded-2xl animate-pop_in"
        style={{ background: 'rgba(0,212,255,0.08)' }}>
        <p className="text-5xl">🎬</p>
        <p className="font-display text-2xl text-white">Replay en cours…</p>
        <p className="text-white/50 font-body text-sm">Regardez le projecteur</p>
        <p className="text-white/30 font-body text-xs">La question réapparaîtra après la vidéo</p>
      </div>
    )
  }

  // Après la vidéo : QCM classique
  return (
    <div className="space-y-3">
      {status === 'question_active' && (
        <div className="rounded-2xl p-3 text-center"
          style={{ background: 'rgba(0,212,255,0.08)' }}>
          <p className="font-display text-sm text-white/70">👁️ Qu'avez-vous remarqué ?</p>
        </div>
      )}
      <ClassicQCMPlayerView
        step={step}
        state={state}
        socket={socket}
        myAnswer={myAnswer}
        hasAnswered={hasAnswered}
      />
    </div>
  )
}
