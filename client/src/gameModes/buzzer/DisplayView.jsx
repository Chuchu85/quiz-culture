import React from 'react'

export default function BuzzerDisplayView({ step, state }) {
  const status = state?.status
  const buzzedBy = state?.buzzedBy

  const QuestionBlock = () => step?.question ? (
    <div className="w-full max-w-4xl rounded-3xl px-10 py-8 text-center"
      style={{ background: 'rgba(255,32,32,0.1)', boxShadow: '0 4px 24px rgba(255,32,32,0.12)' }}>
      <p className="font-body text-white/40 text-base uppercase tracking-widest mb-3">Question</p>
      <p className="font-display text-white leading-snug"
        style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
        {step.question}
      </p>
    </div>
  ) : null

  if (status === 'buzzer_ready') {
    return (
      <div className="flex flex-col items-center gap-8">
        <QuestionBlock />
        <div className="rounded-full flex items-center justify-center animate-pulse"
          style={{
            width: 180, height: 180,
            background: 'rgba(255,32,32,0.2)',
            border: '6px solid rgba(255,32,32,0.5)',
            fontSize: 72,
            boxShadow: '0 0 80px rgba(255,32,32,0.3)',
          }}>
          🔔
        </div>
        <p className="font-display text-3xl text-white animate-pulse_glow">Prêts à buzzer !</p>
        <p className="text-white/50 font-body text-xl">Le premier qui buzze répond…</p>
      </div>
    )
  }

  if (status === 'buzzer_locked') {
    return (
      <div className="flex flex-col items-center gap-6 animate-bounce_in">
        <QuestionBlock />
        <div className="rounded-full flex items-center justify-center"
          style={{
            width: 140, height: 140,
            background: 'rgba(255,32,32,0.9)',
            border: '6px solid #ff2020',
            fontSize: 56,
            boxShadow: '0 0 80px rgba(255,32,32,0.7)',
          }}>
          🔔
        </div>
        <p className="font-display text-5xl text-white">
          <span style={{ color: '#ff2020' }}>{buzzedBy?.name}</span> a buzzé !
        </p>
        <p className="text-white/50 font-body text-2xl">L'animateur valide la réponse…</p>
      </div>
    )
  }

  if (status === 'answer_revealed') {
    return (
      <div className="flex flex-col items-center gap-6 animate-pop_in text-center">
        <QuestionBlock />
        <p className="font-display text-3xl text-white/60 uppercase tracking-wider">Réponse</p>
        <p className="font-display text-6xl" style={{ color: '#39ff14' }}>{step?.correctAnswer}</p>
        {step?.explanation && (
          <p className="text-white/50 font-body text-xl max-w-2xl">{step.explanation}</p>
        )}
      </div>
    )
  }

  return null
}
