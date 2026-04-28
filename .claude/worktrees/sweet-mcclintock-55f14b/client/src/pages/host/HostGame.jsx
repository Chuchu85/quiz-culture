import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import Timer from '../../components/Timer.jsx'
import Scoreboard from '../../components/Scoreboard.jsx'

// Game mode host views
import ClassicQCMHostView from '../../gameModes/classic_qcm/HostView.jsx'
import InfoOuBluffHostView from '../../gameModes/info_ou_bluff/HostView.jsx'
import BuzzerHostView from '../../gameModes/buzzer/HostView.jsx'
import BlindTestHostView from '../../gameModes/blind_test/HostView.jsx'
import RechercheInterditeHostView from '../../gameModes/recherche_interdite/HostView.jsx'
import OeilDeLynxHostView from '../../gameModes/oeil_de_lynx/HostView.jsx'
import PareilLaQuestionHostView from '../../gameModes/pareil_la_question/HostView.jsx'

function getModeHostView(gameMode) {
  switch (gameMode) {
    case 'info_ou_bluff': return InfoOuBluffHostView
    case 'buzzer': return BuzzerHostView
    case 'blind_test': return BlindTestHostView
    case 'recherche_interdite': return RechercheInterditeHostView
    case 'oeil_de_lynx': return OeilDeLynxHostView
    case 'pareil_la_question': return PareilLaQuestionHostView
    default: return ClassicQCMHostView
  }
}

// ── Design tokens — interface sobre fond blanc ─────────────────────────────
const H = {
  bg:        '#f0f2f7',
  card:      '#ffffff',
  border:    '#e2e8f0',
  text:      '#1e293b',
  muted:     '#64748b',
  green:     '#16a34a',
  greenBg:   '#f0fdf4',
  greenBd:   '#bbf7d0',
  red:       '#dc2626',
  redBg:     '#fef2f2',
  redBd:     '#fecaca',
  blue:      '#2563eb',
  blueBg:    '#eff6ff',
  blueBd:    '#bfdbfe',
  yellow:    '#d97706',
  yellowBg:  '#fffbeb',
  yellowBd:  '#fde68a',
  orange:    '#ea580c',
  orangeBg:  '#fff7ed',
  orangeBd:  '#fed7aa',
}

function HCard({ children, style, className = '' }) {
  return (
    <div className={className}
      style={{ background: H.card, border: `1px solid ${H.border}`, borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  )
}

function HBtn({ children, onClick, disabled, color = 'default', size = 'md', className = '' }) {
  const sizes = { sm: '8px 16px', md: '10px 20px', lg: '14px 24px' }
  const colors = {
    green:  { background: H.greenBg,  border: `1.5px solid ${H.greenBd}`,  color: H.green },
    red:    { background: H.redBg,    border: `1.5px solid ${H.redBd}`,    color: H.red   },
    blue:   { background: H.blueBg,   border: `1.5px solid ${H.blueBd}`,   color: H.blue  },
    orange: { background: H.orangeBg, border: `1.5px solid ${H.orangeBd}`, color: H.orange },
    ghost:  { background: '#f8fafc',  border: `1.5px solid ${H.border}`,   color: H.muted },
    solid:  { background: '#1e293b',  border: 'none',                      color: 'white'  },
  }
  const c = colors[color] || { background: '#f8fafc', border: `1px solid ${H.border}`, color: H.text }
  return (
    <button onClick={onClick} disabled={disabled} className={`font-display transition-all active:scale-95 ${className}`}
      style={{ ...c, padding: sizes[size], borderRadius: 10, fontSize: size === 'lg' ? '1rem' : '0.85rem',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, width: '100%' }}>
      {children}
    </button>
  )
}

export default function HostGame() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { refreshTheme } = useTheme()
  const [state, setState] = useState(null)
  const [timer, setTimer] = useState(null)

  useEffect(() => { refreshTheme() }, [])

  useEffect(() => {
    socket.on('game:state', (s) => setState(s))
    socket.on('game:timer', (t) => setTimer(t))
    socket.on('error', ({ message }) => alert(message))
    function onReconnect() {
      const pwd = sessionStorage.getItem('host_pwd')
      if (pwd) socket.emit('host:connect', { password: pwd })
    }
    socket.on('connect', onReconnect)
    return () => {
      socket.off('game:state'); socket.off('game:timer')
      socket.off('error'); socket.off('connect', onReconnect)
    }
  }, [socket])

  const emit = useCallback((event) => socket.emit(event), [socket])

  const pageStyle = { minHeight: '100vh', background: H.bg, color: H.text, fontFamily: 'inherit' }

  if (!state) {
    return (
      <div style={pageStyle} className="flex items-center justify-center">
        <p style={{ color: H.muted }} className="font-body animate-pulse">Chargement…</p>
      </div>
    )
  }

  const { status, question, step, questionIndex, stepIndex, totalQuestions, players, answersCount, answers, roundName } = state
  const currentStep = step ?? question
  const currentIndex = stepIndex ?? questionIndex ?? 0
  const gameMode = state.gameMode || currentStep?.gameMode || currentStep?.type || 'classic_qcm'

  function awardPoint(playerId) { socket.emit('host:award-point', { playerId }) }
  function adjustScore(playerId, delta) { socket.emit('host:adjust-score', { playerId, delta }) }

  const ModeHostView = getModeHostView(gameMode)

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (status === 'lobby') {
    return (
      <div style={pageStyle} className="flex flex-col items-center justify-center px-8 gap-6">
        <img src="/logo.png" alt="Culture Mashup Quiz" className="h-20 object-contain" />
        <HCard style={{ padding: 32, textAlign: 'center', width: '100%', maxWidth: 420 }}>
          <p style={{ color: H.muted }} className="font-body mb-2">Équipes connectées</p>
          <p className="font-display text-6xl" style={{ color: H.green }}>{players?.length ?? 0}</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {players?.map(p => (
              <span key={p.id} className="font-body px-3 py-1 rounded-full text-sm"
                style={{ background: H.greenBg, border: `1px solid ${H.greenBd}`, color: H.green }}>
                {p.name}
              </span>
            ))}
          </div>
        </HCard>
        <button onClick={() => emit('host:launch-question')}
          disabled={!players?.length}
          className="font-display text-xl px-12 py-5 rounded-2xl transition-all active:scale-95"
          style={{ background: '#16a34a', color: 'white', boxShadow: '0 4px 16px rgba(22,163,74,0.35)', opacity: !players?.length ? 0.5 : 1 }}>
          ▶ Lancer la première question
        </button>
        <button onClick={() => { if (window.confirm('Arrêter le quiz ?')) { socket.emit('host:stop-quiz'); navigate('/') } }}
          className="font-body text-sm px-6 py-2 rounded-xl transition-all"
          style={{ background: 'transparent', border: `1px solid ${H.border}`, color: H.muted, cursor: 'pointer' }}>
          ⏹ Annuler / Arrêter
        </button>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div className="flex flex-col min-h-screen px-4 py-4 gap-3">

        {/* ── Top bar ── */}
        <HCard style={{ padding: '10px 20px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" style={{ height: 32, objectFit: 'contain' }} />
              <span className="font-display text-base" style={{ color: H.muted }}>
                Animateur · <span style={{ color: H.blue }}>{code}</span>
              </span>
              {roundName && (
                <span className="font-body text-xs px-2 py-1 rounded-full"
                  style={{ background: H.orangeBg, border: `1px solid ${H.orangeBd}`, color: H.orange }}>
                  {roundName}
                </span>
              )}
              {gameMode && gameMode !== 'classic_qcm' && (
                <span className="font-body text-xs px-2 py-1 rounded-full"
                  style={{ background: H.blueBg, border: `1px solid ${H.blueBd}`, color: H.blue }}>
                  {gameMode.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(status === 'question_active' || status === 'bluff_input' || status === 'vote_phase' || status === 'buzzer_ready') && timer && (
                <Timer remaining={timer.remaining} total={timer.total} size={52} />
              )}
              {currentStep && status !== 'finished' && status !== 'scoreboard' && (
                <span className="font-display text-sm px-3 py-1 rounded-full"
                  style={{ background: H.yellowBg, border: `1px solid ${H.yellowBd}`, color: H.yellow }}>
                  Q {currentIndex + 1} / {totalQuestions}
                </span>
              )}
            </div>
          </div>
        </HCard>

        <div className="flex gap-3 flex-1 min-h-0">

          {/* ── Left: mode view + answers ── */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {currentStep && status !== 'finished' && status !== 'scoreboard' && (
              <HCard style={{ padding: 20 }}>
                {/* Question */}
                {currentStep.question && (
                  <div className="mb-3 pb-3" style={{ borderBottom: `1px solid ${H.border}` }}>
                    <p className="font-body text-xs mb-1" style={{ color: H.muted }}>Question</p>
                    <p className="font-display text-lg" style={{ color: H.text }}>{currentStep.question}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  {answersCount && (
                    <span className="font-body text-sm" style={{ color: H.green }}>
                      ✓ {answersCount.count}/{answersCount.total} ont répondu
                    </span>
                  )}
                </div>
                <ModeHostView step={currentStep} state={state} socket={socket} />
              </HCard>
            )}

            {/* Answers list */}
            {answers && answers.filter(a => a.answer).length > 0 && status !== 'scoreboard' && status !== 'finished'
              && !['bluff_input', 'vote_phase', 'buzzer_ready', 'buzzer_locked'].includes(status) && (
              <HCard style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-base" style={{ color: H.text }}>Réponses</h3>
                  {answersCount && (
                    <span className="font-display text-sm" style={{ color: H.green }}>
                      {answersCount.count}/{answersCount.total}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {answers.map((ans, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                      style={{
                        background: status === 'answer_revealed'
                          ? (ans.correct ? H.greenBg : H.redBg)
                          : '#f8fafc',
                        border: `1px solid ${status === 'answer_revealed'
                          ? (ans.correct ? H.greenBd : H.redBd)
                          : H.border}`,
                      }}>
                      {ans.photo
                        ? <img src={ans.photo} alt="" className="rounded-full flex-shrink-0" style={{ width: 26, height: 26, objectFit: 'cover' }} />
                        : <div className="rounded-full flex-shrink-0 flex items-center justify-center font-display text-xs"
                            style={{ width: 26, height: 26, background: H.blueBg, border: `1px solid ${H.blueBd}`, color: H.blue }}>
                            {ans.teamName?.[0]?.toUpperCase()}
                          </div>
                      }
                      <span className="font-body font-semibold flex-1 truncate text-sm" style={{ color: H.text }}>{ans.teamName}</span>
                      <span className="font-body text-sm flex-shrink-0 max-w-[40%] truncate" style={{ color: H.muted }}>
                        {ans.answer || '—'}
                      </span>
                      {status === 'answer_revealed' && (
                        <span className="text-base flex-shrink-0">{ans.correct ? '✅' : '❌'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </HCard>
            )}

            {/* Scoreboard */}
            {(status === 'scoreboard' || status === 'finished') && (
              <HCard style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                <Scoreboard
                  players={players}
                  title={status === 'finished' ? 'Classement Final' : 'Classement'}
                  podium={status === 'finished'}
                  light
                />
              </HCard>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ width: 240 }} className="flex-shrink-0 flex flex-col gap-3">

            {/* Controls */}
            <HCard style={{ padding: 16 }}>
              <p className="font-display text-sm mb-3" style={{ color: H.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contrôles</p>
              <div className="flex flex-col gap-2">

                {status === 'question_active' && (
                  <HBtn color="ghost" onClick={() => emit('host:close-question')}>
                    ⏹ Clôturer la question
                  </HBtn>
                )}

                {status === 'question_closed' && (
                  <HBtn color="blue" onClick={() => emit('host:reveal-answer')}>
                    👁 Révéler la réponse
                  </HBtn>
                )}

                {/* Info ou Bluff */}
                {status === 'bluff_input' && (
                  <>
                    <div className="rounded-xl p-3 text-center"
                      style={{ background: H.orangeBg, border: `1px solid ${H.orangeBd}` }}>
                      <p className="font-display text-xs" style={{ color: H.orange }}>Phase 1 — Bluffs</p>
                      <p className="font-display text-2xl" style={{ color: H.text }}>
                        {state.bluffsCount ?? 0} / {answersCount?.total ?? 0}
                      </p>
                      <p className="font-body text-xs" style={{ color: H.muted }}>bluffs reçus</p>
                      {(state.bluffsCount ?? 0) >= (answersCount?.total ?? 1) && (
                        <p className="font-body text-xs mt-1" style={{ color: H.green }}>✅ Tout le monde a répondu !</p>
                      )}
                    </div>
                    <HBtn color="orange" onClick={() => socket.emit('host:force-vote-phase')}>
                      🎭 Afficher les propositions
                    </HBtn>
                  </>
                )}

                {status === 'vote_phase' && (
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: H.orangeBg, border: `1px solid ${H.orangeBd}` }}>
                    <p className="font-display text-xs" style={{ color: H.orange }}>Phase 2 — Votes</p>
                    <p className="font-display text-2xl" style={{ color: H.text }}>{state.votesCount ?? 0}</p>
                    <p className="font-body text-xs" style={{ color: H.muted }}>votes reçus</p>
                  </div>
                )}

                {/* Buzzer */}
                {status === 'buzzer_ready' && (
                  <>
                    <div className="rounded-xl p-3 text-center"
                      style={{ background: H.redBg, border: `1px solid ${H.redBd}` }}>
                      <p className="font-body text-sm" style={{ color: H.red }}>🔔 En attente du buzzer…</p>
                    </div>
                    {currentStep?.correctAnswer && (
                      <div className="rounded-xl p-3" style={{ background: H.greenBg, border: `1px solid ${H.greenBd}` }}>
                        <p className="font-display text-xs uppercase tracking-wider mb-1" style={{ color: H.green }}>✅ Bonne réponse</p>
                        <p className="font-body text-sm font-semibold" style={{ color: H.text }}>{currentStep.correctAnswer}</p>
                      </div>
                    )}
                  </>
                )}

                {status === 'buzzer_locked' && state.buzzedBy && (
                  <>
                    <div className="rounded-xl p-3 text-center"
                      style={{ background: H.redBg, border: `1.5px solid ${H.red}` }}>
                      <p className="font-body text-xs mb-1" style={{ color: H.muted }}>A buzzé</p>
                      <p className="font-display text-lg" style={{ color: H.red }}>
                        {state.buzzedBy?.name ?? state.buzzedBy}
                      </p>
                    </div>
                    {currentStep?.correctAnswer && (
                      <div className="rounded-xl p-3" style={{ background: H.greenBg, border: `1px solid ${H.greenBd}` }}>
                        <p className="font-display text-xs uppercase tracking-wider mb-1" style={{ color: H.green }}>✅ Bonne réponse</p>
                        <p className="font-body text-sm font-semibold" style={{ color: H.text }}>{currentStep.correctAnswer}</p>
                      </div>
                    )}
                    <HBtn color="green" size="md" onClick={() => socket.emit('host:buzz-validate', { correct: true })}>
                      ✅ Bonne réponse
                    </HBtn>
                    <HBtn color="red" size="md" onClick={() => socket.emit('host:buzz-reopen')}>
                      ❌ Mauvaise réponse
                    </HBtn>
                    <HBtn color="ghost" size="md" onClick={() => socket.emit('host:buzz-reopen')}>
                      🔁 Rouvrir le buzzer
                    </HBtn>
                  </>
                )}

                {/* Œil de Lynx — replay video */}
                {status === 'video_replay' && (
                  <div className="rounded-xl p-3 text-center"
                    style={{ background: H.blueBg, border: `1px solid ${H.blueBd}` }}>
                    <p className="font-body text-sm" style={{ color: H.blue }}>🎬 Vidéo en replay…</p>
                    <HBtn color="blue" size="sm" onClick={() => socket.emit('host:stop-video')} className="mt-2">
                      ✂️ Arrêter le replay
                    </HBtn>
                  </div>
                )}

                {status === 'answer_revealed' && (
                  <>
                    {gameMode === 'oeil_de_lynx' && currentStep?.videoUrl && (
                      <HBtn color="blue" onClick={() => socket.emit('host:replay-video')}>
                        🎬 Rejouer la vidéo
                      </HBtn>
                    )}
                    <HBtn color="ghost" onClick={() => emit('host:show-scoreboard')}>
                      📊 Voir le classement
                    </HBtn>
                    {currentIndex + 1 < totalQuestions
                      ? <HBtn color="green" onClick={() => emit('host:next-question')}>▶ Question suivante</HBtn>
                      : <HBtn color="green" onClick={() => emit('host:end-game')}>🏁 Terminer la partie</HBtn>
                    }
                  </>
                )}

                {status === 'scoreboard' && (
                  currentIndex + 1 < totalQuestions
                    ? <HBtn color="green" onClick={() => emit('host:next-question')}>▶ Question suivante</HBtn>
                    : <HBtn color="green" onClick={() => emit('host:end-game')}>🏁 Terminer la partie</HBtn>
                )}

                {status === 'finished' && (
                  <>
                    <HBtn color="blue" onClick={() => emit('host:restart')}>↺ Nouvelle partie</HBtn>
                    <HBtn color="ghost" onClick={() => navigate('/')}>← Accueil</HBtn>
                  </>
                )}

                {/* Boutons globaux — toujours disponibles hors idle et finished */}
                {status !== 'idle' && status !== 'finished' && (
                  <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${H.border}` }}>
                    <HBtn color="orange" onClick={() => {
                      if (window.confirm('Recommencer le quiz depuis le début ? Tous les scores seront réinitialisés.')) {
                        socket.emit('host:restart')
                      }
                    }}>
                      ↺ Recommencer le quiz
                    </HBtn>
                    <HBtn color="red" onClick={() => {
                      if (window.confirm('Arrêter le quiz ? La session sera terminée.')) {
                        socket.emit('host:stop-quiz')
                        navigate('/')
                      }
                    }}>
                      ⏹ Arrêter le quiz
                    </HBtn>
                  </div>
                )}

                <button className="font-body text-xs text-center mt-1 transition-colors"
                  style={{ color: H.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => window.open(`/display/${code}`, '_blank', 'noopener')}>
                  Ouvrir le projecteur ↗
                </button>
              </div>
            </HCard>

            {/* Live scores */}
            <HCard style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
              <p className="font-display text-sm mb-3" style={{ color: H.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scores</p>
              <div className="flex flex-col gap-2">
                {players?.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="font-display text-xs w-5" style={{ color: H.muted }}>#{i + 1}</span>
                    <span className="font-body text-sm flex-1 truncate" style={{ color: H.text }}>{p.name}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustScore(p.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: H.redBg, border: `1px solid ${H.redBd}`, color: H.red }}>−</button>
                      <span className="font-display text-sm w-8 text-center" style={{ color: H.green }}>{p.score}</span>
                      <button onClick={() => adjustScore(p.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ background: H.greenBg, border: `1px solid ${H.greenBd}`, color: H.green }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </HCard>

          </div>
        </div>
      </div>
    </div>
  )
}
