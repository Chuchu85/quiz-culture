import React, { useState, useEffect } from 'react'

export default function BuzzerPlayerView({ step, state, socket, myAnswer, hasAnswered }) {
  const status = state?.status
  const buzzedBy = state?.buzzedBy
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (status === 'buzzer_ready') setPressed(false)
  }, [status])

  const QuestionBlock = () => step?.question ? (
    <div className="rounded-2xl px-4 py-4 text-center w-full"
      style={{ background: 'rgba(255,32,32,0.08)' }}>
      <p className="font-body text-white/40 text-xs uppercase tracking-widest mb-2">Question</p>
      <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1.2rem, 5vw, 1.6rem)' }}>{step.question}</p>
    </div>
  ) : null

  if (status === 'buzzer_ready') {
    return (
      <div className="flex flex-col items-center gap-5">
        <QuestionBlock />
        <button
          onClick={() => { if (!pressed) { setPressed(true); socket.emit('player:buzz') } }}
          disabled={pressed}
          className="rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center font-display text-4xl"
          style={{
            width: 200, height: 200,
            background: pressed ? 'rgba(255,32,32,0.3)' : 'rgba(255,32,32,0.9)',
            color: 'white',
            boxShadow: pressed ? '0 0 20px rgba(255,32,32,0.3)' : '0 0 60px rgba(255,32,32,0.7), inset 0 -6px 20px rgba(0,0,0,0.4)',
            cursor: pressed ? 'not-allowed' : 'pointer',
          }}>
          🔔
        </button>
        {pressed && (
          <p className="font-display text-white/60 text-lg animate-bounce_in">Buzz envoyé…</p>
        )}
      </div>
    )
  }

  if (status === 'buzzer_locked') {
    return (
      <div className="flex flex-col items-center gap-4 text-center animate-bounce_in">
        <QuestionBlock />
        <p className="text-5xl">🔔</p>
        <p className="font-display text-2xl text-white">
          {buzzedBy ? <><span style={{ color: '#ff2020' }}>{buzzedBy.name}</span> a buzzé !</> : 'Buzzer activé'}
        </p>
        <p className="text-white/40 font-body text-sm">En attente de l'animateur…</p>
      </div>
    )
  }

  if (status === 'answer_revealed') {
    return (
      <div className="text-center animate-bounce_in">
        <QuestionBlock />
        <p className="font-display text-lg text-white/60 mt-4">Réponse révélée</p>
        {step?.correctAnswer && (
          <p className="font-display text-2xl mt-2" style={{ color: '#39ff14' }}>{step.correctAnswer}</p>
        )}
      </div>
    )
  }

  if (status === 'question_closed') {
    return (
      <div className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,32,32,0.08)' }}>
        <p className="font-display text-xl text-white">Temps écoulé !</p>
        <p className="text-white/40 text-sm font-body mt-2">En attente de la révélation…</p>
      </div>
    )
  }

  return null
}
