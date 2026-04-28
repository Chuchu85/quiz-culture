import React from 'react'

const CHOICE_COLORS = [
  { bg: '#fdf4ff', border: '#e879f9', text: '#a21caf' },
  { bg: '#f0fdf4', border: '#4ade80', text: '#16a34a' },
  { bg: '#fefce8', border: '#fbbf24', text: '#d97706' },
  { bg: '#f5f3ff', border: '#a78bfa', text: '#7c3aed' },
]

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map((text) => ({ id: text, text }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id }))
}

export default function ClassicQCMHostView({ step, state }) {
  const choices = normalizeChoices(step?.choices)
  const status = state?.status

  return (
    <div className="space-y-3">
      {/* Image (qui_se_cache) */}
      {step?.image && ['qui_se_cache', 'celebrity_mix'].includes(step?.gameMode) && (
        <div className="flex items-center gap-3">
          <img src={step.image} alt="" className="rounded-xl"
            style={{ width: 80, height: 80, objectFit: 'cover', border: '2px solid #e2e8f0' }} />
          <span className="text-xs font-body" style={{ color: '#94a3b8' }}>Image célébrités</span>
        </div>
      )}

      {/* Audio (blind_test) */}
      {step?.audio && step?.gameMode === 'blind_test' && (
        <div className="rounded-xl p-3" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <audio controls src={step.audio} style={{ width: '100%', height: 36 }} />
        </div>
      )}

      {/* Choices grid */}
      {/* Bonne réponse — toujours visible pour l'animateur, dès le début */}
      {(step?.correctAnswer || step?.acceptedAnswers?.length > 0) && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: '#f0fdf4', border: '2px solid #16a34a' }}>
          <span className="text-xl flex-shrink-0">✅</span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs uppercase tracking-wider mb-0.5" style={{ color: '#16a34a' }}>Bonne réponse</p>
            <p className="font-display text-lg leading-tight" style={{ color: '#1e293b' }}>
              {step?.correctAnswer ?? step?.acceptedAnswers?.[0] ?? '—'}
            </p>
            {step?.acceptedAnswers?.length > 1 && (
              <p className="font-body text-xs mt-0.5" style={{ color: '#64748b' }}>
                Aussi accepté : {step.acceptedAnswers.slice(1).join(', ')}
              </p>
            )}
          </div>
          {step?.explanation && (
            <p className="font-body text-xs max-w-[40%] text-right" style={{ color: '#64748b' }}>{step.explanation}</p>
          )}
        </div>
      )}

      {choices.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {choices.map((c, i) => {
            // Pour l'animateur : montrer la bonne réponse dès que la question est lancée
            const isCorrect = c.id === step?.correctAnswer || c.text === step?.correctAnswer
            const col = isCorrect
              ? { bg: '#f0fdf4', border: '#16a34a', text: '#16a34a' }
              : CHOICE_COLORS[i % CHOICE_COLORS.length]
            return (
              <div key={c.id} className="rounded-xl px-3 py-2 font-body text-sm"
                style={{ background: col.bg, border: `1.5px solid ${col.border}`, color: '#1e293b',
                  fontWeight: isCorrect ? 700 : 400 }}>
                <span className="font-display mr-1" style={{ color: col.text }}>
                  {String.fromCharCode(65 + i)})
                </span>
                {c.text}
                {isCorrect && ' ✅'}
              </div>
            )
          })}
        </div>
      )}

      {/* Closed */}
      {status === 'question_closed' && (
        <div className="rounded-xl p-3" style={{ background: '#fffbeb', border: '1.5px solid #fbbf24' }}>
          <p className="font-display text-sm" style={{ color: '#d97706' }}>⏹ Temps écoulé — révélez la réponse</p>
        </div>
      )}
    </div>
  )
}
