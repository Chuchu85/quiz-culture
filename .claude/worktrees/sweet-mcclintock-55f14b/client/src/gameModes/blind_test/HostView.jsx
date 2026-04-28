import React from 'react'

export default function BlindTestHostView({ step, state, socket }) {
  const status = state?.status

  return (
    <div className="space-y-3">

      {/* Audio player */}
      {step?.audio ? (
        <div className="rounded-xl p-3" style={{ background: '#faf5ff', border: '1.5px solid #e9d5ff' }}>
          <p className="font-body text-xs mb-2" style={{ color: '#7c3aed' }}>🎵 Extrait musical</p>
          <audio controls autoPlay src={step.audio} style={{ width: '100%', height: 36 }} />
        </div>
      ) : (
        <div className="rounded-xl p-3 text-center" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <p className="font-body text-sm" style={{ color: '#94a3b8' }}>🎵 Aucun audio importé</p>
        </div>
      )}

      {/* Correct answer — always visible for the host */}
      <div className="rounded-xl p-4" style={{ background: '#f0fdf4', border: '2px solid #16a34a' }}>
        <p className="font-body text-xs uppercase tracking-wider mb-1" style={{ color: '#16a34a' }}>✅ Bonne réponse</p>
        <p className="font-display text-xl" style={{ color: '#1e293b' }}>
          {step?.correctAnswer ?? step?.acceptedAnswers?.[0] ?? '—'}
        </p>
        {step?.acceptedAnswers?.length > 1 && (
          <p className="font-body text-xs mt-1" style={{ color: '#64748b' }}>
            Accepté aussi : {step.acceptedAnswers.slice(1).join(', ')}
          </p>
        )}
        {step?.explanation && (
          <p className="font-body text-sm mt-2" style={{ color: '#64748b' }}>{step.explanation}</p>
        )}
      </div>

      {/* Instructions */}
      {status === 'question_active' && (
        <div className="rounded-xl p-3 text-center" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p className="font-body text-xs" style={{ color: '#d97706' }}>
            🤖 Les réponses sont validées automatiquement à la révélation
          </p>
        </div>
      )}
    </div>
  )
}
