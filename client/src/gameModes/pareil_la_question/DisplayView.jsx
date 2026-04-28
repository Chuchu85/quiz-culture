import React from 'react'

export default function PareilLaQuestionDisplayView({ step, state }) {
  const status = state?.status

  if (status === 'answer_revealed') {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
        <div className="rounded-3xl px-8 py-6 text-center w-full"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="font-body text-white/50 text-sm uppercase tracking-widest mb-2">Question</p>
          <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
            {step?.question}
          </p>
        </div>
        <div className="rounded-3xl p-8 text-center w-full"
          style={{ background: 'rgba(57,255,20,0.15)', boxShadow: '0 0 40px rgba(57,255,20,0.3)' }}>
          <p className="font-display text-white/60 text-lg uppercase tracking-wider mb-3">✅ Bonne réponse</p>
          <p className="font-display text-5xl" style={{ color: '#39ff14' }}>{step?.correctAnswer}</p>
          {step?.explanation && (
            <p className="text-white/50 font-body mt-4 text-lg">{step.explanation}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-3xl mx-auto">
      <div className="rounded-3xl px-8 py-10 text-center w-full"
        style={{ background: 'rgba(255,30,232,0.10)', boxShadow: '0 4px 32px rgba(255,30,232,0.15)', border: '1.5px solid rgba(255,30,232,0.25)' }}>
        <p className="font-body text-white/50 text-sm uppercase tracking-widest mb-4">Question</p>
        <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)' }}>
          {step?.question}
        </p>
      </div>
      {status === 'question_active' && (
        <p className="font-body text-white/30 text-lg animate-pulse">
          Répondez à l'animateur…
        </p>
      )}
    </div>
  )
}
