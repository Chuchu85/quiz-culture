import React from 'react'

export default function InfoOuBluffDisplayView({ step, state }) {
  const status = state?.status
  const options = state?.mixedOptions || []
  const answersCount = state?.answersCount

  // Question block — affiché dans toutes les phases
  const QuestionBlock = () => (
    <div className="rounded-3xl px-8 py-6 text-center"
      style={{ background: 'rgba(255,107,53,0.12)', boxShadow: '0 4px 24px rgba(255,107,53,0.12)' }}>
      <p className="font-body text-white/50 text-sm uppercase tracking-widest mb-2">Question</p>
      <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
        {step?.question}
      </p>
    </div>
  )

  // ── Phase 1 : les équipes inventent un bluff ──────────────────────────────
  if (status === 'bluff_input') {
    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
        <QuestionBlock />

        <div className="flex items-center gap-6">
          {/* Badge phase */}
          <div className="flex-1 rounded-2xl p-5 text-center"
            style={{ background: 'rgba(255,107,53,0.15)' }}>
            <p className="font-display text-2xl mb-1" style={{ color: '#ff6b35' }}>🃏 Phase 1 — Bluff</p>
            <p className="font-body text-white/60 text-base">
              Chaque équipe invente une fausse réponse crédible sur son téléphone
            </p>
          </div>

          {/* Compteur */}
          <div className="rounded-2xl p-5 text-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)', minWidth: 140 }}>
            <p className="font-body text-white/50 text-sm mb-1">Bluffs reçus</p>
            <p className="font-display text-5xl" style={{ color: '#ff6b35' }}>
              {state?.bluffsCount ?? 0}
            </p>
            <p className="font-body text-white/30 text-sm">/ {answersCount?.total ?? 0}</p>
          </div>
        </div>

        <div className="rounded-2xl px-6 py-3 text-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <p className="font-body text-white/40 text-base">⏳ En attente des réponses sur les téléphones…</p>
        </div>
      </div>
    )
  }

  // ── Phase 2 : vote ────────────────────────────────────────────────────────
  if (status === 'vote_phase') {
    return (
      <div className="flex flex-col gap-5 w-full max-w-3xl mx-auto">
        <QuestionBlock />

        <div className="text-center">
          <p className="font-display text-3xl" style={{ color: '#ff6b35' }}>🗳️ Phase 2 — Votez !</p>
          <p className="text-white/50 font-body text-lg mt-1">Quelle est la vraie réponse parmi celles-ci ?</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((opt, i) => (
            <div key={opt.id} className="rounded-2xl px-6 py-4"
              style={{
                background: 'rgba(255,107,53,0.1)',
                borderLeft: '4px solid #ff6b35',
              }}>
              <span className="font-display text-xl mr-4" style={{ color: '#ff6b35' }}>{i + 1}.</span>
              <span className="font-body text-white text-xl">{opt.text}</span>
            </div>
          ))}
        </div>

        {answersCount && (
          <div className="flex justify-center">
            <div className="flex items-center gap-3 rounded-full px-6 py-3"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#ff6b35' }} />
              <span className="font-display text-white text-xl">
                {state?.votesCount ?? 0} / {answersCount.total} ont voté
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Révélation ────────────────────────────────────────────────────────────
  if (status === 'answer_revealed') {
    return (
      <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto animate-pop_in">
        {/* Vraie réponse en vedette */}
        <div className="rounded-3xl p-6 text-center"
          style={{ background: 'rgba(57,255,20,0.15)', boxShadow: '0 0 40px rgba(57,255,20,0.3)' }}>
          <p className="font-display text-white/60 text-lg uppercase tracking-wider mb-2">✅ Vraie réponse</p>
          <p className="font-display text-4xl" style={{ color: '#39ff14' }}>{step?.correctAnswer}</p>
          {step?.explanation && (
            <p className="text-white/50 text-base font-body mt-3">{step.explanation}</p>
          )}
        </div>

        {/* Toutes les options avec tag vrai/bluff */}
        <div className="grid grid-cols-1 gap-2">
          {options.map((opt, i) => (
            <div key={opt.id} className="rounded-2xl px-6 py-4 flex items-center gap-4 transition-all"
              style={{
                background: opt.isReal ? 'rgba(57,255,20,0.12)' : 'rgba(255,255,255,0.05)',
              }}>
              <span className="font-display text-white/40 w-6">{i + 1}.</span>
              <span className="font-body text-white text-lg flex-1">{opt.text}</span>
              {opt.isReal
                ? <span className="font-display text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(57,255,20,0.2)', color: '#39ff14' }}>✓ VRAIE</span>
                : <span className="font-display text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(255,107,53,0.15)', color: 'rgba(255,107,53,0.7)' }}>🃏 Bluff</span>
              }
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
