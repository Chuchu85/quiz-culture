import React from 'react'

const COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map((text) => ({ id: text, text, imageUrl: null }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id, imageUrl: c.imageUrl ?? null }))
}

export default function ClassicQCMDisplayView({ step, state }) {
  const choices = normalizeChoices(step?.choices)
  const status = state?.status
  const isTextMode = ['text_input', 'blind_test'].includes(step?.gameMode) || (!choices.length && step?.acceptedAnswers)
  const answersCount = state?.answersCount
  const hasImageChoices = choices.some(c => c.imageUrl)
  const correctAnswerIds = step?.correctAnswers?.length > 0
    ? step.correctAnswers
    : (step?.correctAnswer ? [step.correctAnswer] : [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', minHeight: 0 }}>

      {/* Question text */}
      {step?.question && (
        <div className="rounded-2xl px-6 py-3 text-center"
          style={{ background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1rem, 2vw, 1.7rem)' }}>
            {step.question}
          </p>
        </div>
      )}

      {/* Blind Test */}
      {step?.audio && step?.gameMode === 'blind_test' && status === 'question_active' && (
        <div className="flex justify-center" style={{ flexShrink: 0 }}>
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(155,89,182,0.15)' }}>
            <p className="font-display text-4xl mb-2">🎵</p>
            <p className="font-display text-white/70 text-xl uppercase tracking-widest">Blind Test</p>
          </div>
        </div>
      )}

      {/* MCQ choices — image mode : grille 2x2, lettres en overlay */}
      {hasImageChoices && choices.length > 0 && (
        <div style={{
          flex: 1, minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: choices.length > 2 ? '1fr 1fr' : '1fr',
          gap: 8,
        }}>
          {choices.map((c, i) => {
            const isCorrect = status === 'answer_revealed' && (correctAnswerIds.includes(c.id) || correctAnswerIds.includes(c.text))
            return (
              <div key={c.id} className="rounded-2xl overflow-hidden transition-all duration-500"
                style={{
                  position: 'relative', minHeight: 0,
                  boxShadow: isCorrect ? '0 0 30px rgba(57,255,20,0.6)' : 'none',
                  transform: isCorrect ? 'scale(1.02)' : 'none',
                  border: isCorrect ? '3px solid #39ff14' : `2px solid ${COLORS[i]}44`,
                }}>
                <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: 'rgba(0,0,0,0.4)' }} />
                {/* Overlay letter + label */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: isCorrect ? 'rgba(57,255,20,0.75)' : 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span className="font-display text-xl" style={{ color: isCorrect ? '#000' : COLORS[i] }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {c.text && c.text !== `Photo ${String.fromCharCode(65 + i)}` && (
                    <span className="font-body text-white text-sm font-bold flex-1">{c.text}</span>
                  )}
                  {isCorrect && <span className="text-lg">✓</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MCQ choices — image unique + choix texte : layout côte à côte */}
      {!hasImageChoices && choices.length > 0 && step?.image && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16 }}>
          {/* Image gauche */}
          <div className="rounded-2xl overflow-hidden animate-pop_in"
            style={{ flex: '0 0 55%', minHeight: 0, boxShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
            <img src={step.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {/* Choix droite */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            {choices.map((c, i) => {
              const isCorrect = status === 'answer_revealed' && (correctAnswerIds.includes(c.id) || correctAnswerIds.includes(c.text))
              return (
                <div key={c.id} className="rounded-2xl px-4 py-3 transition-all duration-500"
                  style={{
                    background: isCorrect ? 'rgba(57,255,20,0.2)' : `${COLORS[i]}18`,
                    border: `2px solid ${isCorrect ? '#39ff14' : COLORS[i] + '55'}`,
                    transform: isCorrect ? 'scale(1.02)' : 'none',
                  }}>
                  <span className="font-display text-xl mr-3" style={{ color: isCorrect ? '#39ff14' : COLORS[i] }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-body font-bold text-white" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1.2rem)' }}>{c.text}</span>
                  {isCorrect && <span className="ml-2 text-lg">✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MCQ choices — texte seul (sans image de question) */}
      {!hasImageChoices && choices.length > 0 && !step?.image && (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10 }}>
          {choices.map((c, i) => {
            const isCorrect = status === 'answer_revealed' && (correctAnswerIds.includes(c.id) || correctAnswerIds.includes(c.text))
            return (
              <div key={c.id} className="rounded-2xl px-6 py-5 transition-all duration-500"
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  background: isCorrect ? 'rgba(57,255,20,0.2)' : `${COLORS[i]}18`,
                  transform: isCorrect ? 'scale(1.03)' : 'none',
                  boxShadow: isCorrect ? '0 0 30px rgba(57,255,20,0.4)' : 'none',
                }}>
                <span className="font-display text-3xl mb-2" style={{ color: isCorrect ? '#39ff14' : COLORS[i] }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-body font-bold text-white" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.5rem)' }}>{c.text}</span>
                {isCorrect && <span className="text-2xl mt-1">✓</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Awaiting answers count */}
      {status === 'question_active' && answersCount && (
        <div className="flex justify-center" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-3 rounded-full px-5 py-2"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#39ff14' }} />
            <span className="font-display text-white text-lg">
              {answersCount.count} / {answersCount.total} ont répondu
            </span>
          </div>
        </div>
      )}

      {/* Reveal: correct answer for text modes */}
      {status === 'answer_revealed' && isTextMode && (
        <div className="rounded-3xl p-5 animate-bounce_in text-center"
          style={{ flexShrink: 0, background: 'rgba(57,255,20,0.15)', boxShadow: '0 0 40px rgba(57,255,20,0.3)' }}>
          <p className="font-display text-white/60 text-lg uppercase tracking-wider mb-2">Bonne réponse</p>
          <p className="font-display text-white text-4xl">{step?.correctAnswer ?? step?.acceptedAnswers?.[0]}</p>
          {step?.explanation && <p className="text-white/50 font-body mt-3 text-lg">{step.explanation}</p>}
        </div>
      )}

      {/* Reveal: explanation for MCQ */}
      {status === 'answer_revealed' && choices.length > 0 && step?.explanation && (
        <div className="rounded-2xl p-3 text-center animate-slide_up"
          style={{ flexShrink: 0, background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-white/50 font-body text-base">{step.explanation}</p>
        </div>
      )}
    </div>
  )
}
