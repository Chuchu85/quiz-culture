import React, { useState, useEffect } from 'react'

export default function InfoOuBluffPlayerView({ step, state, socket, myAnswer, hasAnswered }) {
  const [bluffText, setBluffText] = useState('')
  const [bluffSent, setBluffSent] = useState(false)
  const [myVote, setMyVote] = useState(null)
  const [voteSent, setVoteSent] = useState(false)

  const status = state?.status
  const options = state?.mixedOptions || []

  useEffect(() => {
    if (status === 'bluff_input') { setBluffSent(false); setMyVote(null); setVoteSent(false) }
  }, [status])

  function submitBluff(e) {
    e.preventDefault()
    if (!bluffText.trim() || bluffSent) return
    socket.emit('player:submit-bluff', { bluff: bluffText.trim() })
    setBluffSent(true)
  }

  function submitVote(optionId) {
    if (voteSent) return
    setMyVote(optionId)
    setVoteSent(true)
    socket.emit('player:vote', { optionId })
  }

  // Phase 1 — écrire un bluff
  if (status === 'bluff_input') {
    if (bluffSent) {
      return (
        <div className="rounded-2xl p-6 text-center animate-bounce_in"
          style={{ background: 'rgba(255,107,53,0.12)' }}>
          <p className="text-4xl mb-3">🃏</p>
          <p className="font-display text-xl text-white mb-1">Bluff envoyé !</p>
          <p className="font-body text-white/40 text-sm">En attente des autres équipes…</p>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-4 animate-slide_up"
          style={{ background: 'rgba(255,107,53,0.12)' }}>
          <p className="font-display text-white/60 text-xs uppercase tracking-widest mb-1">Phase 1 — Bluff</p>
          <p className="font-body text-white/80 text-sm">
            Inventez une réponse <strong>fausse mais crédible</strong> pour tromper les autres équipes !
          </p>
        </div>
        <form onSubmit={submitBluff} className="flex flex-col gap-3">
          <textarea
            value={bluffText}
            onChange={e => setBluffText(e.target.value)}
            placeholder="Votre fausse réponse crédible…"
            rows={3}
            className="w-full rounded-2xl px-5 py-4 font-body text-lg focus:outline-none resize-none"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', caretColor: '#ff6b35' }}
          />
          <button type="submit" className="w-full rounded-2xl py-4 font-display text-xl font-bold transition-all"
            disabled={!bluffText.trim()}
            style={{
              background: bluffText.trim() ? 'rgba(255,107,53,0.8)' : 'rgba(255,107,53,0.2)',
              color: 'white',
              opacity: bluffText.trim() ? 1 : 0.5,
            }}>
            Envoyer mon bluff 🃏
          </button>
        </form>
      </div>
    )
  }

  // Phase 2 — voter
  if (status === 'vote_phase') {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl p-3 animate-slide_up"
          style={{ background: 'rgba(255,107,53,0.1)' }}>
          <p className="font-display text-white/60 text-xs uppercase tracking-widest mb-1">Phase 2 — Vote</p>
          <p className="font-body text-white/80 text-sm">
            Quelle est la <strong>vraie réponse</strong> ? Évitez les pièges !
          </p>
        </div>
        {voteSent ? (
          <div className="rounded-2xl p-5 text-center animate-bounce_in"
            style={{ background: 'rgba(255,107,53,0.12)' }}>
            <p className="font-display text-lg text-white">Vote envoyé !</p>
            <p className="text-white/40 text-sm font-body mt-1">En attente de la révélation…</p>
          </div>
        ) : (
          options.map((opt, i) => (
            <button key={opt.id} onClick={() => submitVote(opt.id)}
              className="w-full text-left rounded-2xl px-5 py-4 font-body text-base transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'white' }}>
              <span className="font-display mr-3" style={{ color: '#ff6b35' }}>{i + 1}.</span>
              {opt.text}
            </button>
          ))
        )}
      </div>
    )
  }

  // Reveal
  if (status === 'answer_revealed') {
    const revealOptions = state?.mixedOptions || options
    return (
      <div className="space-y-3 animate-pop_in">
        {revealOptions.map((opt, i) => {
          const isReal = opt.isReal
          const isMine = opt.id === myVote
          return (
            <div key={opt.id} className="rounded-2xl px-5 py-4 transition-all"
              style={{
                background: isReal ? 'rgba(57,255,20,0.15)' : isMine && !isReal ? 'rgba(255,50,50,0.15)' : 'rgba(255,255,255,0.05)',
              }}>
              <span className="font-body text-white">{opt.text}</span>
              {isReal && <span className="ml-2 text-sm font-display" style={{ color: '#39ff14' }}>✓ Vraie réponse</span>}
              {isMine && !isReal && <span className="ml-2 text-sm" style={{ color: '#ff8080' }}>✗ C'était un bluff</span>}
            </div>
          )
        })}
      </div>
    )
  }

  return null
}
