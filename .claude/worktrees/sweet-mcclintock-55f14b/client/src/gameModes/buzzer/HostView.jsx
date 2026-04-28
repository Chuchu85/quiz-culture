import React from 'react'

function AnswerBox({ step }) {
  if (!step?.correctAnswer) return null
  return (
    <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
      <p className="font-display text-xs uppercase tracking-wider mb-1" style={{ color: '#16a34a' }}>✅ Bonne réponse</p>
      <p className="font-display text-base" style={{ color: '#1e293b' }}>{step.correctAnswer}</p>
      {step.explanation && <p className="font-body text-xs mt-1" style={{ color: '#64748b' }}>{step.explanation}</p>}
    </div>
  )
}

export default function BuzzerHostView({ step, state, socket }) {
  const status = state?.status
  const buzzedBy = state?.buzzedBy

  if (status === 'buzzer_ready') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3 text-center"
          style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
          <p className="font-display text-sm" style={{ color: '#dc2626' }}>🔔 En attente qu'une équipe buzze…</p>
        </div>
        <AnswerBox step={step} />
      </div>
    )
  }

  if (status === 'buzzer_locked') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-4 text-center"
          style={{ background: '#fef2f2', border: '2px solid #dc2626' }}>
          <p className="font-body text-xs mb-1" style={{ color: '#9ca3af' }}>A buzzé en premier</p>
          <p className="font-display text-2xl" style={{ color: '#dc2626' }}>🔔 {buzzedBy?.name}</p>
        </div>
        <AnswerBox step={step} />
        <div className="flex gap-2">
          <button
            onClick={() => socket.emit('host:buzz-validate', { correct: true })}
            className="flex-1 rounded-xl py-3 font-display text-base transition-all active:scale-95"
            style={{ background: '#f0fdf4', border: '2px solid #16a34a', color: '#16a34a' }}>
            ✅ Bonne réponse
          </button>
          <button
            onClick={() => socket.emit('host:buzz-reopen')}
            className="flex-1 rounded-xl py-3 font-display text-base transition-all active:scale-95"
            style={{ background: '#fef2f2', border: '2px solid #dc2626', color: '#dc2626' }}>
            ❌ Mauvaise
          </button>
        </div>
        <button
          onClick={() => socket.emit('host:buzz-reopen')}
          className="w-full rounded-xl py-2 font-body text-sm transition-all active:scale-95"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
          🔁 Rouvrir le buzzer
        </button>
      </div>
    )
  }

  if (status === 'answer_revealed') {
    return (
      <div className="rounded-xl p-4" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
        <p className="font-display text-xs uppercase tracking-wider mb-1" style={{ color: '#16a34a' }}>✅ Bonne réponse</p>
        <p className="font-display text-xl" style={{ color: '#1e293b' }}>{step?.correctAnswer ?? '—'}</p>
        {step?.explanation && <p className="font-body text-sm mt-1" style={{ color: '#64748b' }}>{step.explanation}</p>}
      </div>
    )
  }

  return null
}
