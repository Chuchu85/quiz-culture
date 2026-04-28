import React from 'react'

export default function PareilLaQuestionPlayerView({ step, state }) {
  const status = state?.status

  if (status === 'answer_revealed') {
    return (
      <div className="space-y-4 animate-pop_in">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(57,255,20,0.12)' }}>
          <p className="text-white/60 text-xs font-body mb-1">Bonne réponse</p>
          <p className="font-display text-xl" style={{ color: '#39ff14' }}>{step?.correctAnswer}</p>
          {step?.explanation && (
            <p className="text-white/50 font-body text-sm mt-2">{step.explanation}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center py-6 px-2 rounded-2xl"
      style={{ background: 'rgba(255,30,232,0.08)' }}>
      <p className="text-4xl">💬</p>
      <p className="font-display text-xl text-white">Question ouverte</p>
      <p className="text-white/50 font-body text-sm">Répondez à l'animateur à voix haute</p>
      <p className="text-white/30 font-body text-xs">La bonne réponse sera révélée par l'animateur</p>
    </div>
  )
}
