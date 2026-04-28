import React from 'react'

export default function PareilLaQuestionHostView({ step, state }) {
  const status = state?.status

  return (
    <div className="space-y-3">
      {step?.correctAnswer && (
        <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
          <p className="font-display text-xs uppercase tracking-wider mb-1" style={{ color: '#16a34a' }}>✅ Bonne réponse</p>
          <p className="font-display text-lg" style={{ color: '#1e293b' }}>{step.correctAnswer}</p>
          {step.explanation && (
            <p className="font-body text-sm mt-1" style={{ color: '#64748b' }}>{step.explanation}</p>
          )}
        </div>
      )}
      {status === 'question_active' && (
        <div className="rounded-xl p-3 text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p className="font-body text-sm" style={{ color: '#2563eb' }}>
            💬 Question affichée sur tous les écrans — réponse orale
          </p>
        </div>
      )}
    </div>
  )
}
