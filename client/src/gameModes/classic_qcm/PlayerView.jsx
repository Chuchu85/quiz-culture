import React, { useState } from 'react'

const COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map((text, i) => ({ id: text, text, imageUrl: null }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id, imageUrl: c.imageUrl ?? null }))
}

export default function ClassicQCMPlayerView({ step, state, socket, myAnswer, hasAnswered, onAnswer }) {
  const choices = normalizeChoices(step?.choices)
  const isTextMode = ['text_input', 'blind_test'].includes(step?.gameMode) || (!choices.length && step?.acceptedAnswers)
  const [text, setText] = useState('')
  const [selectedAnswers, setSelectedAnswers] = useState([])

  const status = state?.status
  const hasImageChoices = choices.some(c => c.imageUrl)
  const isMultiAnswer = !!step?.multipleAnswers
  const correctAnswerIds = step?.correctAnswers?.length > 0
    ? step.correctAnswers
    : (step?.correctAnswer ? [step.correctAnswer] : [])

  function handleChoice(id) {
    if (hasAnswered) return
    if (isMultiAnswer) {
      setSelectedAnswers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    } else {
      if (onAnswer) onAnswer(id)
      else socket?.emit('player:answer', { answer: id })
    }
  }

  function submitMultiAnswer() {
    if (selectedAnswers.length === 0 || hasAnswered) return
    const answer = JSON.stringify(selectedAnswers)
    if (onAnswer) onAnswer(answer)
    else socket?.emit('player:answer', { answer })
  }

  function handleTextSubmit(e) {
    e.preventDefault()
    if (!text.trim() || hasAnswered) return
    if (onAnswer) onAnswer(text.trim())
    else socket?.emit('player:answer', { answer: text.trim() })
  }

  // ── Reveal state ──────────────────────────────────────────────────────────────
  if (status === 'answer_revealed') {
    let myAnswerArr
    try { myAnswerArr = JSON.parse(myAnswer) } catch { myAnswerArr = myAnswer ? [myAnswer] : [] }
    if (!Array.isArray(myAnswerArr)) myAnswerArr = [myAnswerArr]

    if (isTextMode) {
      const correctAnswer = step?.correctAnswer ?? step?.acceptedAnswers?.[0]
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

    if (hasImageChoices) {
      return (
        <div className="grid grid-cols-2 gap-2 animate-pop_in">
          {choices.map((c, i) => {
            const isCorrect = correctAnswerIds.includes(c.id) || correctAnswerIds.includes(c.text)
            const isMine = myAnswerArr.includes(c.id) || myAnswerArr.includes(c.text)
            return (
              <div key={c.id} className="rounded-2xl overflow-hidden"
                style={{ boxShadow: isCorrect ? '0 0 20px rgba(57,255,20,0.5)' : isMine && !isCorrect ? '0 0 12px rgba(255,80,80,0.4)' : 'none' }}>
                <img src={c.imageUrl} alt="" style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                <div className="px-2 py-1.5 flex items-center gap-1"
                  style={{ background: isCorrect ? 'rgba(57,255,20,0.2)' : isMine && !isCorrect ? 'rgba(255,50,50,0.2)' : 'rgba(255,255,255,0.06)' }}>
                  <span className="font-display text-sm" style={{ color: isCorrect ? '#39ff14' : isMine && !isCorrect ? '#ff8080' : COLORS[i] }}>
                    {String.fromCharCode(65 + i)})
                  </span>
                  {c.text && <span className="font-body text-white text-xs flex-1">{c.text}</span>}
                  {isCorrect && <span className="text-sm">✓</span>}
                  {isMine && !isCorrect && <span className="text-sm">✗</span>}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div className="space-y-3 animate-pop_in">
        {choices.map((c, i) => {
          const isCorrect = correctAnswerIds.includes(c.id) || correctAnswerIds.includes(c.text)
          const isMine = myAnswerArr.includes(c.id) || myAnswerArr.includes(c.text)
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

  // ── Text input mode ───────────────────────────────────────────────────────────
  if (isTextMode && !hasAnswered) {
    return (
      <div className="space-y-4">
        {step?.audio && (
          <div className="rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ background: 'rgba(155,89,182,0.15)' }}>
            <p className="font-display text-white/70 text-sm uppercase tracking-widest">🎵 Blind Test</p>
            <p className="font-body text-white/40 text-xs mt-1">Écoutez l'extrait…</p>
          </div>
        )}
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={step?.gameMode === 'blind_test' ? 'Artiste + titre…' : step?.gameMode === 'qui_se_cache' ? 'Noms des deux célébrités…' : 'Votre réponse…'}
            rows={3}
            className="w-full rounded-2xl px-5 py-4 font-body text-lg focus:outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', caretColor: '#ff1ee8' }}
          />
          <button type="submit" className="btn-primary w-full" disabled={!text.trim()}>
            Envoyer
          </button>
        </form>
      </div>
    )
  }

  // ── MCQ choices ───────────────────────────────────────────────────────────────
  if (!hasAnswered) {
    return (
      <div className="space-y-3">
        {hasImageChoices ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {choices.map((c, i) => {
                const isSelected = isMultiAnswer && selectedAnswers.includes(c.id)
                return (
                  <button key={c.id} onClick={() => handleChoice(c.id)}
                    className="rounded-2xl overflow-hidden transition-all active:scale-95"
                    style={{
                      outline: isSelected ? `2px solid ${COLORS[i]}` : 'none',
                      outlineOffset: 2,
                    }}>
                    <img src={c.imageUrl} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
                    <div className="px-2 py-1.5 flex items-center gap-1"
                      style={{ background: isSelected ? `${COLORS[i]}30` : 'rgba(255,255,255,0.07)' }}>
                      <span className="font-display text-sm" style={{ color: COLORS[i] }}>{String.fromCharCode(65 + i)})</span>
                      {c.text && <span className="font-body text-white text-xs flex-1 text-left">{c.text}</span>}
                      {isSelected && <span className="text-sm">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            {isMultiAnswer && (
              <button onClick={submitMultiAnswer} disabled={selectedAnswers.length === 0}
                className="w-full rounded-2xl px-5 py-4 font-display text-base transition-all active:scale-95"
                style={{
                  background: selectedAnswers.length > 0 ? '#39ff14' : 'rgba(255,255,255,0.1)',
                  color: selectedAnswers.length > 0 ? '#000' : 'rgba(255,255,255,0.3)',
                }}>
                Valider ({selectedAnswers.length} sélectionné{selectedAnswers.length > 1 ? 's' : ''})
              </button>
            )}
          </>
        ) : (
          <>
            {choices.map((c, i) => {
              const isSelected = isMultiAnswer && selectedAnswers.includes(c.id)
              return (
                <button key={c.id} onClick={() => handleChoice(c.id)}
                  className="w-full rounded-2xl px-5 py-4 font-body text-left text-base font-semibold transition-all active:scale-95"
                  style={{
                    background: isSelected ? `${COLORS[i]}35` : `${COLORS[i]}18`,
                    color: 'white',
                    outline: isSelected ? `2px solid ${COLORS[i]}` : 'none',
                    outlineOffset: 2,
                  }}>
                  <span className="font-display mr-3" style={{ color: COLORS[i] }}>
                    {String.fromCharCode(65 + i)})
                  </span>
                  {c.text}
                  {isSelected && <span className="ml-2">✓</span>}
                </button>
              )
            })}
            {isMultiAnswer && (
              <button onClick={submitMultiAnswer} disabled={selectedAnswers.length === 0}
                className="w-full rounded-2xl px-5 py-4 font-display text-base transition-all active:scale-95"
                style={{
                  background: selectedAnswers.length > 0 ? '#39ff14' : 'rgba(255,255,255,0.1)',
                  color: selectedAnswers.length > 0 ? '#000' : 'rgba(255,255,255,0.3)',
                }}>
                Valider ({selectedAnswers.length} sélectionné{selectedAnswers.length > 1 ? 's' : ''})
              </button>
            )}
          </>
        )}
      </div>
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
