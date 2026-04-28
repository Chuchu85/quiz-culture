import React from 'react'

const COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map((text) => ({ id: text, text }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id }))
}

export default function BlindTestPlayerView({ step, state, socket, myAnswer, hasAnswered, onAnswer }) {
  const choices = normalizeChoices(step?.choices)
  const hasChoices = choices.length > 0
  const status = state?.status

  function handleChoice(id) {
    if (hasAnswered) return
    if (onAnswer) onAnswer(id)
    else socket?.emit('player:answer', { answer: id })
  }

  // Reveal state
  if (status === 'answer_revealed') {
    const correctAnswer = step?.correctAnswer ?? step?.acceptedAnswers?.[0]
    if (!hasChoices) {
      return (
        <div className="space-y-3 animate-pop_in">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(57,255,20,0.12)' }}>
            <p className="text-white/60 text-xs font-body mb-1">Bonne réponse</p>
            <p className="font-display text-xl" style={{ color: '#39ff14' }}>{correctAnswer}</p>
          </div>
          {myAnswer && (
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <p className="text-white/40 text-xs font-body mb-1">Ta réponse</p>
              <p className="font-body text-white">{myAnswer}</p>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="space-y-3 animate-pop_in">
        {choices.map((c, i) => {
          const isCorrect = c.id === correctAnswer || c.text === correctAnswer
          const isMine = c.id === myAnswer || c.text === myAnswer
          return (
            <div key={c.id} className="w-full rounded-2xl px-5 py-4 font-body text-base transition-all"
              style={{
                background: isCorrect ? 'rgba(57,255,20,0.18)' : isMine && !isCorrect ? 'rgba(255,50,50,0.18)' : 'rgba(255,255,255,0.06)',
                color: isCorrect ? '#39ff14' : isMine && !isCorrect ? '#ff8080' : 'rgba(255,255,255,0.7)',
              }}>
              {c.text}
              {isCorrect && <span className="ml-2">✓</span>}
              {isMine && !isCorrect && <span className="ml-2">✗</span>}
            </div>
          )
        })}
      </div>
    )
  }

  // QCM choices
  if (hasChoices && !hasAnswered) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {choices.map((c, i) => (
            <button key={c.id} onClick={() => handleChoice(c.id)}
              className="w-full rounded-2xl px-5 py-4 font-body text-left text-base font-semibold transition-all active:scale-95"
              style={{ background: `${COLORS[i]}18`, color: 'white' }}>
              <span className="font-display mr-3" style={{ color: COLORS[i] }}>
                {String.fromCharCode(65 + i)})
              </span>
              {c.text}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Text input fallback (no choices defined)
  if (!hasChoices && !hasAnswered) {
    return (
      <form onSubmit={e => { e.preventDefault(); const val = e.target.elements.answer.value.trim(); if (val) { if (onAnswer) onAnswer(val); else socket?.emit('player:answer', { answer: val }) } }}
        className="flex flex-col gap-3">
        <textarea
          name="answer"
          placeholder="Artiste + titre…"
          rows={3}
          className="w-full rounded-2xl px-5 py-4 font-body text-lg focus:outline-none resize-none"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', caretColor: '#9b59b6' }}
        />
        <button type="submit" className="btn-primary w-full">Envoyer</button>
      </form>
    )
  }

  // Waiting after answer
  return (
    <div className="rounded-2xl p-6 text-center animate-bounce_in"
      style={{ background: 'rgba(57,255,20,0.1)' }}>
      <p className="font-display text-lg text-white mb-1">Réponse envoyée !</p>
      <p className="text-white/40 font-body text-sm">En attente de la révélation…</p>
    </div>
  )
}
