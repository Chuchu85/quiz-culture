import React from 'react'

const COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map(text => ({ id: text, text }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id }))
}

function GoogleG({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function RechercheInterditeDisplayView({ step, state }) {
  const choices = normalizeChoices(step?.choices)
  const status = state?.status
  const searchPrefix = step?.searchPrefix || step?.question || ''
  const answersCount = state?.answersCount
  const isRevealed = status === 'answer_revealed'

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">

      {/* Question */}
      {step?.question && (
        <div className="rounded-3xl px-8 py-5 text-center"
          style={{ background: 'rgba(77,159,255,0.1)' }}>
          <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)' }}>
            {step.question}
          </p>
        </div>
      )}

      {/* ── Barre de recherche Google ── */}
      <div style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))' }}>
        <div className="rounded-3xl flex items-center gap-3 px-6 py-4" style={{ background: 'white', maxWidth: 680 }}>
          <GoogleG size={24} />
          <div className="flex-1 flex items-baseline overflow-hidden">
            <span style={{ color: '#202124', fontSize: '1.4rem', fontFamily: 'arial,sans-serif', whiteSpace: 'nowrap' }}>
              {searchPrefix}
            </span>
            {isRevealed && (
              <span style={{ color: '#202124', fontSize: '1.4rem', fontFamily: 'arial,sans-serif', fontWeight: 700 }}>
                &nbsp;{step?.correctAnswer}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Réponses normales ── */}
      <div className="flex flex-col gap-3">
        {choices.map((c, i) => {
          const isCorrect = isRevealed && (c.id === step?.correctAnswer || c.text === step?.correctAnswer)
          return (
            <div key={c.id}
              className="rounded-2xl px-6 py-5 font-display text-xl transition-all duration-500"
              style={{
                background: isCorrect ? 'rgba(57,255,20,0.18)' : `${COLORS[i]}15`,
                color: isCorrect ? '#39ff14' : 'white',
                transform: isCorrect ? 'scale(1.02)' : 'none',
                boxShadow: isCorrect ? '0 0 30px rgba(57,255,20,0.3)' : 'none',
              }}>
              {c.text}
              {isCorrect && <span className="ml-3 text-base">✓</span>}
            </div>
          )
        })}
      </div>

      {/* Compteur */}
      {status === 'question_active' && answersCount && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 rounded-full px-6 py-3"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#4d9fff' }} />
            <span className="font-display text-white text-xl">
              {answersCount.count} / {answersCount.total} ont répondu
            </span>
          </div>
        </div>
      )}

      {isRevealed && step?.explanation && (
        <div className="rounded-2xl p-4 text-center animate-slide_up"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-white/60 font-body text-lg">{step.explanation}</p>
        </div>
      )}
    </div>
  )
}
