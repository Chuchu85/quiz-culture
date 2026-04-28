import React from 'react'

const COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

function normalizeChoices(choices) {
  if (!choices?.length) return []
  if (typeof choices[0] === 'string') return choices.map((text) => ({ id: text, text }))
  return choices.map(c => ({ id: c.id ?? c.text, text: c.text ?? c.id }))
}

export default function ClassicQCMDisplayView({ step, state }) {
  const choices = normalizeChoices(step?.choices)
  const status = state?.status
  const isTextMode = ['text_input', 'blind_test'].includes(step?.gameMode) || (!choices.length && step?.acceptedAnswers)
  const answersCount = state?.answersCount

  return (
    <div className="flex flex-col gap-6">
      {/* Question text */}
      {step?.question && (
        <div className="rounded-3xl px-8 py-6 text-center"
          style={{ background: 'rgba(255,255,255,0.07)', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
          <p className="font-display text-white leading-snug" style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
            {step.question}
          </p>
        </div>
      )}

      {/* Image for qui_se_cache */}
      {step?.image && ['qui_se_cache', 'celebrity_mix'].includes(step?.gameMode) && (
        <div className="flex justify-center animate-pop_in">
          <div className="rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(123,47,255,0.6)', maxWidth: 480 }}>
            <img src={step.image} alt="Qui se cache ?" style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }} />
          </div>
        </div>
      )}

      {/* Blind Test : indicateur visuel uniquement, pas de lecture audio (gérée côté animateur) */}
      {step?.audio && step?.gameMode === 'blind_test' && status === 'question_active' && (
        <div className="flex justify-center">
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(155,89,182,0.15)', boxShadow: '0 4px 32px rgba(155,89,182,0.25)' }}>
            <p className="font-display text-4xl mb-3">🎵</p>
            <p className="font-display text-white/70 text-xl uppercase tracking-widest">Blind Test</p>
            <p className="font-body text-white/40 text-sm mt-2">Écoutez l'extrait…</p>
          </div>
        </div>
      )}

      {/* MCQ choices */}
      {choices.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {choices.map((c, i) => {
            const isCorrect = status === 'answer_revealed' && (c.id === step.correctAnswer || c.text === step.correctAnswer)
            return (
              <div key={c.id} className="rounded-2xl px-6 py-5 transition-all duration-500"
                style={{
                  background: isCorrect ? 'rgba(57,255,20,0.2)' : `${COLORS[i]}18`,
                  transform: isCorrect ? 'scale(1.03)' : 'none',
                  boxShadow: isCorrect ? '0 0 30px rgba(57,255,20,0.4)' : 'none',
                }}>
                <span className="font-display text-3xl mb-2 block" style={{ color: isCorrect ? '#39ff14' : COLORS[i] }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-body font-bold text-white text-xl">{c.text}</span>
                {isCorrect && <span className="ml-3 text-2xl">✓</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Awaiting answers count */}
      {status === 'question_active' && answersCount && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 rounded-full px-6 py-3"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#39ff14' }} />
            <span className="font-display text-white text-xl">
              {answersCount.count} / {answersCount.total} ont répondu
            </span>
          </div>
        </div>
      )}

      {/* Reveal: show correct answer for text modes */}
      {status === 'answer_revealed' && isTextMode && (
        <div className="rounded-3xl p-6 animate-bounce_in text-center"
          style={{ background: 'rgba(57,255,20,0.15)', boxShadow: '0 0 40px rgba(57,255,20,0.3)' }}>
          <p className="font-display text-white/60 text-lg uppercase tracking-wider mb-2">Bonne réponse</p>
          <p className="font-display text-white text-4xl">{step?.correctAnswer ?? step?.acceptedAnswers?.[0]}</p>
          {step?.explanation && (
            <p className="text-white/50 font-body mt-3 text-lg">{step.explanation}</p>
          )}
        </div>
      )}

      {/* Reveal: explanation for MCQ */}
      {status === 'answer_revealed' && choices.length > 0 && step?.explanation && (
        <div className="rounded-2xl p-4 text-center animate-slide_up"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <p className="text-white/50 font-body text-lg">{step.explanation}</p>
        </div>
      )}
    </div>
  )
}
