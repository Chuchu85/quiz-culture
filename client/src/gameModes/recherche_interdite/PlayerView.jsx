import React from 'react'

const COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map(text => ({ id: text, text }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id }))
}

function GoogleG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function RechercheInterditePlayerView({ step, state, socket, myAnswer, hasAnswered }) {
  const choices = normalizeChoices(step?.choices)
  const status = state?.status
  const searchPrefix = step?.searchPrefix || step?.question || ''

  function handleChoice(id) {
    if (hasAnswered) return
    socket.emit('player:answer', { answer: id })
  }

  // Barre Google — affichée dans tous les états
  const SearchBar = ({ completion = null }) => (
    <div className="rounded-2xl flex items-center gap-2 px-4 py-3"
      style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
      <GoogleG size={16} />
      <div className="flex-1 flex items-baseline overflow-hidden">
        <span style={{ color: '#202124', fontSize: '0.95rem', fontFamily: 'arial,sans-serif', whiteSpace: 'nowrap' }}>
          {searchPrefix}
        </span>
        {completion && (
          <span style={{ color: '#202124', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'arial,sans-serif' }}>&nbsp;{completion}</span>
        )}
      </div>
    </div>
  )

  // ── Révélation ──────────────────────────────────────────────────────────────
  if (status === 'answer_revealed') {
    const correctAnswer = step?.correctAnswer
    return (
      <div className="space-y-3 animate-pop_in">
        <SearchBar completion={correctAnswer} />
        {choices.map((c) => {
          const isCorrect = c.id === correctAnswer || c.text === correctAnswer
          const isMine = c.id === myAnswer || c.text === myAnswer
          return (
            <div key={c.id} className="rounded-2xl px-5 py-4 font-body text-base transition-all"
              style={{
                background: isCorrect ? 'rgba(57,255,20,0.15)' : isMine && !isCorrect ? 'rgba(255,50,50,0.12)' : 'rgba(255,255,255,0.07)',
                color: 'white',
              }}>
              {c.text}
              {isCorrect && <span className="ml-2" style={{ color: '#39ff14' }}>✓</span>}
              {isMine && !isCorrect && <span className="ml-2" style={{ color: '#ff8080' }}>✗</span>}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Réponse envoyée ──────────────────────────────────────────────────────────
  if (hasAnswered) {
    return (
      <div className="space-y-3">
        <SearchBar completion={myAnswer} />
        <div className="rounded-2xl p-5 text-center animate-bounce_in"
          style={{ background: 'rgba(66,133,244,0.1)' }}>
          <p className="font-display text-white text-lg">Réponse envoyée !</p>
          <p className="text-white/40 font-body text-sm mt-1">En attente de la révélation…</p>
        </div>
      </div>
    )
  }

  // ── Question active ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <SearchBar />
      <div className="flex flex-col gap-2">
        {choices.map((c, i) => (
          <button key={c.id} onClick={() => handleChoice(c.id)}
            className="w-full text-left rounded-2xl px-5 py-4 font-body text-base transition-all active:scale-95"
            style={{
              background: `${COLORS[i]}18`,
              color: 'white',
            }}>
            {c.text}
          </button>
        ))}
      </div>
    </div>
  )
}
