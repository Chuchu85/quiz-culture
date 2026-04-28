import React from 'react'

export default function InfoOuBluffHostView({ step, state, socket }) {
  const status = state?.status
  const options = state?.mixedOptions || []

  if (status === 'bluff_input') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
          <p className="font-display text-sm mb-1" style={{ color: '#ea580c' }}>🃏 Phase 1 — Collecte des bluffs</p>
          <p className="font-body text-sm" style={{ color: '#64748b' }}>Les équipes écrivent leur fausse réponse crédible.</p>
          <p className="font-display text-lg mt-2" style={{ color: '#ea580c' }}>
            {state?.bluffsCount ?? 0} / {state?.answersCount?.total ?? 0} bluffs reçus
          </p>
        </div>
      </div>
    )
  }

  if (status === 'vote_phase') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
          <p className="font-display text-sm mb-1" style={{ color: '#ea580c' }}>🗳️ Phase 2 — Vote en cours</p>
          <p className="font-display text-lg" style={{ color: '#ea580c' }}>
            {state?.votesCount ?? 0} / {state?.answersCount?.total ?? 0} votes reçus
          </p>
        </div>
        <div className="space-y-1">
          {options.map((opt, i) => (
            <div key={opt.id} className="rounded-lg px-3 py-2 flex items-center gap-2"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span className="font-display text-xs w-4" style={{ color: '#94a3b8' }}>{i + 1}.</span>
              <span className="font-body text-sm" style={{ color: '#1e293b' }}>{opt.text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'answer_revealed') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3" style={{ background: '#f0fdf4', border: '1.5px solid #16a34a' }}>
          <p className="font-display text-xs uppercase tracking-wider mb-1" style={{ color: '#16a34a' }}>✅ Vraie réponse</p>
          <p className="font-display text-lg" style={{ color: '#1e293b' }}>{step?.correctAnswer}</p>
          {step?.explanation && <p className="font-body text-sm mt-1" style={{ color: '#64748b' }}>{step.explanation}</p>}
        </div>
        <div className="space-y-1">
          {options.map((opt, i) => (
            <div key={opt.id} className="rounded-lg px-3 py-2 flex items-center gap-2"
              style={{
                background: opt.isReal ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${opt.isReal ? '#16a34a' : '#e2e8f0'}`,
              }}>
              <span className="font-display text-xs w-4" style={{ color: '#94a3b8' }}>{i + 1}.</span>
              <span className="font-body text-sm flex-1" style={{ color: '#1e293b' }}>{opt.text}</span>
              {opt.isReal && <span className="text-xs font-display" style={{ color: '#16a34a' }}>✓ VRAIE</span>}
              {!opt.isReal && opt.authorId && <span className="text-xs font-body" style={{ color: '#94a3b8' }}>Bluff</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'question_closed') {
    return (
      <div className="rounded-xl p-3" style={{ background: '#fffbeb', border: '1.5px solid #fbbf24' }}>
        <p className="font-display text-sm" style={{ color: '#d97706' }}>⏹ Révélez la réponse pour voir les scores</p>
      </div>
    )
  }

  return null
}
