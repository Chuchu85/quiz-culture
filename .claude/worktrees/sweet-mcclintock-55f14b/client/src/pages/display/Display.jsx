import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import Timer from '../../components/Timer.jsx'
import Background from '../../components/Background.jsx'
import { QRCodeSVG } from 'qrcode.react'
import FaucheLogo from '../../components/FaucheLogo.jsx'
import useSoundManager from '../../hooks/useSoundManager.js'

// Game mode display views
import ClassicQCMDisplayView from '../../gameModes/classic_qcm/DisplayView.jsx'
import InfoOuBluffDisplayView from '../../gameModes/info_ou_bluff/DisplayView.jsx'
import BuzzerDisplayView from '../../gameModes/buzzer/DisplayView.jsx'
import RechercheInterditeDisplayView from '../../gameModes/recherche_interdite/DisplayView.jsx'
import OeilDeLynxDisplayView from '../../gameModes/oeil_de_lynx/DisplayView.jsx'
import PareilLaQuestionDisplayView from '../../gameModes/pareil_la_question/DisplayView.jsx'
import BlindTestDisplayView from '../../gameModes/blind_test/DisplayView.jsx'

function getModeDisplayView(gameMode) {
  switch (gameMode) {
    case 'info_ou_bluff': return InfoOuBluffDisplayView
    case 'buzzer': return BuzzerDisplayView
    case 'recherche_interdite': return RechercheInterditeDisplayView
    case 'oeil_de_lynx': return OeilDeLynxDisplayView
    case 'pareil_la_question': return PareilLaQuestionDisplayView
    case 'blind_test': return BlindTestDisplayView
    default: return ClassicQCMDisplayView
  }
}

const MEDALS = ['🥇', '🥈', '🥉']

// ── Spotlight podium final ─────────────────────────────────────────────────
function SpotlightPodium({ players }) {
  const [revealed, setRevealed] = useState(0)
  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  useEffect(() => {
    setRevealed(0)
    top3.forEach((_, i) => {
      setTimeout(() => setRevealed(r => r + 1), (i + 1) * 1800)
    })
  }, [players.length])

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="flex items-end justify-center gap-6 w-full">
        {[1, 0, 2].map((playerIdx) => {
          const player = top3[playerIdx]
          if (!player) return null
          const isVisible = revealed > (playerIdx === 0 ? 2 : playerIdx === 1 ? 1 : 0)
          const sizes = [200, 160, 140]
          const size = sizes[playerIdx]
          const glowColors = ['rgba(255,215,0,0.8)', 'rgba(192,192,192,0.7)', 'rgba(205,127,50,0.7)']
          const borderColors = ['#ffe600', '#c0c0c0', '#cd7f32']

          return (
            <div key={player.id} className="flex flex-col items-center gap-3"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.4) translateY(80px)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              <div style={{ position: 'relative' }}>
                {isVisible && (
                  <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: `radial-gradient(ellipse, ${glowColors[playerIdx]} 0%, transparent 70%)`, animation: 'bg-pulse-slow 2s ease-in-out infinite' }} />
                )}
                {player.photo
                  ? <img src={player.photo} alt={player.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `5px solid ${borderColors[playerIdx]}`, boxShadow: `0 0 40px ${glowColors[playerIdx]}`, position: 'relative', zIndex: 1 }} />
                  : <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(135deg, ${glowColors[playerIdx]}, transparent)`, border: `5px solid ${borderColors[playerIdx]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 900, color: 'white', position: 'relative', zIndex: 1 }}>
                      {player.name[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div style={{ fontSize: '2.5rem' }}>{MEDALS[playerIdx]}</div>
              <div className="font-display text-white text-center" style={{ fontSize: playerIdx === 0 ? '1.6rem' : '1.3rem', maxWidth: 200 }}>{player.name}</div>
              <div className="font-display" style={{ fontSize: playerIdx === 0 ? '2rem' : '1.5rem', color: borderColors[playerIdx], textShadow: `0 0 20px ${glowColors[playerIdx]}` }}>{player.score} pts</div>
            </div>
          )
        })}
      </div>
      {rest.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mt-4" style={{ opacity: revealed >= top3.length ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}>
          {rest.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {p.photo && <img src={p.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />}
              <span className="font-display text-white/60 text-sm">#{i + 4}</span>
              <span className="font-body text-white text-sm">{p.name}</span>
              <span className="font-display text-quiz-green text-sm">{p.score} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Score bars ─────────────────────────────────────────────────────────────
function ScoreBars({ players, prevScores }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [])
  const maxScore = Math.max(...players.map(p => p.score), 1)

  return (
    <div className="w-full flex flex-col gap-3">
      {players.map((p, i) => {
        const prev = prevScores?.[p.id] ?? 0
        const gained = p.score - prev
        const targetPct = (p.score / maxScore) * 100
        const startPct = (prev / maxScore) * 100
        const currentPct = animated ? targetPct : startPct

        return (
          <div key={p.id} className="flex flex-col gap-1" style={{ opacity: 0, animation: `cine-slide-in 0.4s ease forwards ${i * 0.08}s` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {p.photo && <img src={p.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />}
                <span className="font-body text-white text-sm">{p.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {gained > 0 && (
                  <span className="font-display text-sm px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,230,0,0.2)', color: '#ffe600', animation: 'score-flash 0.6s ease forwards' }}>+{gained}</span>
                )}
                <span className="font-display text-sm" style={{ color: '#39ff14' }}>{p.score} pts</span>
              </div>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 10, background: 'rgba(255,255,255,0.1)' }}>
              <div style={{ height: '100%', borderRadius: 999, background: p.correct ? 'linear-gradient(90deg, #39ff14, #20d000)' : 'linear-gradient(90deg, #ff1ee8, #a005d0)', width: `${currentPct}%`, transition: `width ${0.7 + i * 0.08}s cubic-bezier(0.34, 1.2, 0.64, 1) ${i * 0.1 + 0.3}s`, boxShadow: p.correct ? '0 0 8px rgba(57,255,20,0.6)' : '0 0 8px rgba(255,30,232,0.4)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Display ───────────────────────────────────────────────────────────
export default function Display() {
  const { code } = useParams()
  const { socket } = useSocket()
  const { theme, refreshTheme } = useTheme()
  const [state, setState] = useState(null)
  const [timer, setTimer] = useState(null)
  const [joined, setJoined] = useState(false)
  const [logo, setLogo] = useState(null)
  const [clientLogo, setClientLogo] = useState(null)
  const [customJoinUrl, setCustomJoinUrl] = useState(null)
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [transition, setTransition] = useState(null)
  const countdownRef = useRef(null)
  const transitionRef = useRef(null)
  const prevScoresRef = useRef({})
  const prevStatusRef = useRef(null)

  // Sound manager — reads sounds from active theme
  const { playOnce, playLoop, stopLoop } = useSoundManager(theme?.sounds)

  // Refresh theme when display loads so per-quiz sounds/visuals are applied
  useEffect(() => { refreshTheme() }, [])

  useEffect(() => {
    fetch('/api/room').then(r => r.json()).then(d => {
      setLogo(d.logo)
      setClientLogo(d.clientLogo)
      setCustomJoinUrl(d.customJoinUrl || null)
      setQrCodeImageUrl(d.qrCodeImageUrl || null)
    }).catch(() => {})
  }, [state?.status])

  useEffect(() => {
    socket.emit('display:join')
    socket.on('display:joined', () => setJoined(true))
    socket.on('game:state', (s) => {
      if (s.status !== 'answer_revealed') {
        const map = {}
        s.players?.forEach(p => { map[p.id] = p.score })
        prevScoresRef.current = map
      }
      setState(s)
    })
    socket.on('game:timer', (t) => setTimer(t))
    socket.on('game:countdown', ({ count }) => {
      setTransition(null)
      setCountdown(count)
      clearTimeout(countdownRef.current)
      countdownRef.current = setTimeout(() => setCountdown(null), 1200)
    })
    socket.on('game:transition', (data) => {
      setTransition(data)
      clearTimeout(transitionRef.current)
      transitionRef.current = setTimeout(() => setTransition(null), 1500)
    })
    return () => {
      socket.off('display:joined')
      socket.off('game:state')
      socket.off('game:timer')
      socket.off('game:countdown')
      socket.off('game:transition')
    }
  }, [socket])

  // React to game status changes → play appropriate sounds
  useEffect(() => {
    const status = state?.status
    if (!status || status === prevStatusRef.current) return
    const prev = prevStatusRef.current
    prevStatusRef.current = status

    if (status === 'idle' || status === 'lobby') {
      playLoop('lobby')
    } else if (status === 'question_active') {
      stopLoop()
      playOnce('questionStart')
      // Start countdown loop after the jingle (give ~2 s head start)
      const t = setTimeout(() => playLoop('countdown'), 2000)
      return () => clearTimeout(t)
    } else if (status === 'question_closed') {
      stopLoop()
    } else if (status === 'answer_revealed') {
      stopLoop()
      playOnce('reveal')
    } else if (status === 'scoreboard') {
      stopLoop()
      playOnce('scoreboard')
    } else if (status === 'finished') {
      stopLoop()
      playLoop('victory')
    }
  }, [state?.status])

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
        else document.exitFullscreen?.()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  if (!joined || !state) {
    return (
      <Background>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="font-display text-4xl text-white animate-pulse_glow mb-4">Connexion…</p>
            <p className="text-white/40 font-body">Écran projecteur — {code}</p>
          </div>
        </div>
      </Background>
    )
  }

  const { status, question, step, questionIndex, stepIndex, totalQuestions, players, answersCount, answers = [], roundName } = state
  const currentStep = step ?? question
  const currentIndex = stepIndex ?? questionIndex ?? 0
  const gameMode = state.gameMode || currentStep?.gameMode || currentStep?.type || 'classic_qcm'
  const joinUrl = customJoinUrl || `${window.location.origin}/join`

  const bgPhase =
    countdown !== null ? 'countdown'
    : status === 'question_active' && timer && timer.remaining <= 5 ? 'urgent'
    : status === 'answer_revealed' ? 'reveal'
    : null

  const SoundUnlockBtn = null

  // Overlays
  const TransitionOverlay = transition && (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="text-center" style={{ animation: 'cine-slide-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <p className="font-display uppercase tracking-widest mb-3"
          style={{ fontSize: '1.2rem', color: '#ff1ee8', letterSpacing: '0.4em' }}>
          {transition.roundName ?? 'Question'}
        </p>
        <div className="font-display text-white leading-none"
          style={{ fontSize: 'clamp(8rem, 20vw, 16rem)', textShadow: '0 0 80px rgba(255,30,232,0.9)', lineHeight: 0.9 }}>
          {transition.questionNumber}
        </div>
        <p className="font-display text-white/40 mt-4" style={{ fontSize: '1.5rem' }}>/ {transition.totalQuestions}</p>
      </div>
    </div>
  )

  const CountdownOverlay = countdown !== null && (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div key={countdown} className="animate-bounce_in text-center">
        <div className="font-display"
          style={{ fontSize: '20vw', lineHeight: 1, color: countdown === 1 ? '#39ff14' : countdown === 2 ? '#ffe600' : '#ff1ee8', textShadow: `0 0 80px ${countdown === 1 ? 'rgba(57,255,20,0.8)' : countdown === 2 ? 'rgba(255,230,0,0.8)' : 'rgba(255,30,232,0.8)'}` }}>
          {countdown}
        </div>
        <p className="font-display text-white/60 text-3xl mt-4 tracking-widest uppercase">Préparez-vous !</p>
      </div>
    </div>
  )

  // Shared header
  function Header() {
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <img src={logo ?? '/logo.png'} alt="" style={{ height: '56px', maxWidth: '220px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ width: 2, height: 36, background: 'rgba(255,255,255,0.25)', borderRadius: 1 }} />
          <FaucheLogo src={clientLogo} size={52} />
          <span className="font-display text-xl px-4 py-1 rounded-full"
            style={{ background: 'rgba(255,230,0,0.2)', color: '#ffe600' }}>
            Question {currentIndex + 1}/{totalQuestions}
          </span>
          {roundName && <span className="font-body text-white/40 text-sm">{roundName}</span>}
        </div>
        <div className="flex items-center gap-4">
          {answersCount && (
            <span className="font-body text-white/60 text-lg">{answersCount.count}/{answersCount.total} ont répondu</span>
          )}
          {timer && <Timer remaining={timer.remaining} total={timer.total} size={100} />}
        </div>
      </div>
    )
  }

  // ── LOBBY ──────────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'lobby') {
    return (
      <Background glowColor="pink" phase={bgPhase}>
        {TransitionOverlay}{CountdownOverlay}{SoundUnlockBtn}
        <div className="flex flex-col items-center justify-center min-h-screen px-8 gap-8">
          <div className="animate-pop_in flex items-center justify-center gap-10">
            <img src={logo ? `${logo}?t=${Date.now()}` : '/logo.png'} alt="Culture Mashup Quiz" className="drop-shadow-2xl"
              style={{ maxHeight: '220px', maxWidth: '480px', objectFit: 'contain' }} />
            <div style={{ width: 3, height: 140, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)', borderRadius: 2 }} />
            <FaucheLogo src={clientLogo} size={160} />
          </div>
          <div className="flex items-center gap-10 rounded-3xl px-12 py-8 animate-bounce_in"
            style={{ background: 'rgba(57,255,20,0.12)', border: '4px solid #39ff14', boxShadow: '0 0 60px rgba(57,255,20,0.3)' }}>
            <div className="rounded-2xl overflow-hidden p-3" style={{ background: 'white' }}>
              {qrCodeImageUrl
                ? <img src={qrCodeImageUrl} alt="QR Code" style={{ width: 160, height: 160, objectFit: 'contain' }} />
                : <QRCodeSVG value={joinUrl} size={160} bgColor="#ffffff" fgColor="#111827" />
              }
            </div>
            <div>
              <p className="font-body text-quiz-green text-xl uppercase tracking-widest mb-3">Scannez ou rejoignez sur</p>
              <p className="font-body font-extrabold text-white"
                style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)', textShadow: '0 0 20px rgba(57,255,20,0.6)' }}>
                {joinUrl}
              </p>
            </div>
          </div>
          {players.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
              {players.map(p => (
                <span key={p.id} className="flex items-center gap-2 font-display text-white text-xl px-5 py-2 rounded-full animate-pop_in"
                  style={{ background: 'rgba(255,30,232,0.25)', border: '2px solid #ff1ee8' }}>
                  {p.photo && <img src={p.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />}
                  {p.name}
                </span>
              ))}
            </div>
          )}
          {players.length === 0 && <p className="font-display text-white/40 text-xl animate-pulse_glow">En attente des équipes…</p>}
          <p className="text-white/20 font-body text-sm">Appuyez sur F pour le plein écran</p>
        </div>
      </Background>
    )
  }

  // ── ACTIVE GAME PHASES: delegate to mode DisplayView ──────────────────
  const MODE_ACTIVE_STATUSES = ['video_playing', 'video_replay', 'question_active', 'question_closed', 'answer_revealed', 'bluff_input', 'vote_phase', 'buzzer_ready', 'buzzer_locked']

  if (MODE_ACTIVE_STATUSES.includes(status) && currentStep) {
    const ModeDisplayView = getModeDisplayView(gameMode)

    // Answer progress bar for question_active
    const pct = answersCount?.total > 0 ? (answersCount.count / answersCount.total) * 100 : 0

    return (
      <Background phase={bgPhase}>
        {TransitionOverlay}{CountdownOverlay}{SoundUnlockBtn}
        <div className="flex flex-col min-h-screen px-8 py-6">
          <Header />

          {/* Answer progress bar (question_active, non-buzzer) */}
          {status === 'question_active' && gameMode !== 'buzzer' && answersCount?.total > 0 && (
            <div className="mb-4">
              <div className="w-full rounded-full h-3 mb-3 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff1ee8, #39ff14)', boxShadow: '0 0 12px rgba(57,255,20,0.5)' }} />
              </div>
              {answers.some(a => a.answered) && (
                <div className="flex flex-wrap gap-2">
                  {answers.filter(a => a.answered).map(a => (
                    <div key={a.playerId} className="flex items-center gap-1 rounded-full px-2 py-1"
                      style={{ background: 'rgba(57,255,20,0.12)' }}>
                      {a.photo
                        ? <img src={a.photo} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#39ff14', fontWeight: 700 }}>{a.teamName?.[0]?.toUpperCase()}</div>
                      }
                      <span className="font-body text-white/70 text-xs">{a.teamName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mode-specific display */}
          <div className="flex-1 flex flex-col justify-center">
            <ModeDisplayView step={currentStep} state={state} socket={socket} />
          </div>

          {/* Answer revealed: fastest finger + score bars */}
          {status === 'answer_revealed' && (
            <div className="mt-6 flex gap-6 items-start">
              <div className="flex-1 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <p className="font-display text-white text-lg mb-4">Scores</p>
                <ScoreBars players={players} prevScores={prevScoresRef.current} />
              </div>
              {/* Fastest finger */}
              {(() => {
                const fastest = (answers ?? []).filter(a => a.correct && a.responseTime !== null).sort((a, b) => a.responseTime - b.responseTime).slice(0, 3)
                if (!fastest.length) return null
                return (
                  <div className="w-64 flex-shrink-0 rounded-2xl p-5 animate-slide_up"
                    style={{ background: 'rgba(255,230,0,0.1)', boxShadow: '0 4px 24px rgba(255,230,0,0.15)' }}>
                    <p className="font-display text-quiz-yellow text-lg uppercase tracking-wider mb-3">⚡ Plus rapides</p>
                    <div className="flex flex-col gap-3">
                      {fastest.map((a, i) => (
                        <div key={a.playerId} className="flex items-center gap-3">
                          <span className="font-display text-xl" style={{ width: 28 }}>{['🥇','🥈','🥉'][i]}</span>
                          {a.photo
                            ? <img src={a.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,230,0,0.5)', flexShrink: 0 }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,230,0,0.2)', border: '2px solid rgba(255,230,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffe600', fontWeight: 700, flexShrink: 0 }}>{a.teamName?.[0]?.toUpperCase()}</div>
                          }
                          <span className="font-body font-bold text-white flex-1">{a.teamName}</span>
                          <span className="font-display text-quiz-yellow text-sm">{a.responseTime}s</span>
                          {a.speedBonus > 0 && <span className="font-display text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,230,0,0.2)', color: '#ffe600' }}>+{a.speedBonus}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </Background>
    )
  }

  // ── SCOREBOARD ─────────────────────────────────────────────────────────
  if (status === 'scoreboard') {
    return (
      <Background glowColor="pink" phase={bgPhase}>
        {TransitionOverlay}{CountdownOverlay}{SoundUnlockBtn}
        <div className="flex flex-col items-center justify-center min-h-screen px-8 py-8">
          <div className="flex items-center gap-6 mb-6 animate-pop_in">
            <img src={logo ?? '/logo.png'} alt="" style={{ maxHeight: '100px', maxWidth: '280px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
            <div style={{ width: 3, height: 70, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)', borderRadius: 2 }} />
            <FaucheLogo src={clientLogo} size={96} />
          </div>
          <h2 className="font-display text-white mb-8 text-glow-pink animate-pop_in"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
            Classement
          </h2>
          <div className="w-full max-w-2xl">
            <ScoreBars players={players} prevScores={prevScoresRef.current} />
          </div>
        </div>
      </Background>
    )
  }

  // ── FINISHED ───────────────────────────────────────────────────────────
  if (status === 'finished') {
    return (
      <Background glowColor="pink">
        {SoundUnlockBtn}
        <div className="flex flex-col items-center justify-center min-h-screen px-8 py-8">
          <div className="flex items-center gap-6 mb-4 animate-pop_in">
            <img src={logo ?? '/logo.png'} alt="" style={{ maxHeight: '100px', maxWidth: '280px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
            <div style={{ width: 3, height: 70, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.4), transparent)', borderRadius: 2 }} />
            <FaucheLogo src={clientLogo} size={96} />
          </div>
          <h2 className="font-display text-white mb-6 text-glow-pink animate-pop_in"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            Fin du quiz !
          </h2>
          <div className="w-full max-w-4xl">
            <SpotlightPodium players={players} />
          </div>
        </div>
      </Background>
    )
  }

  return (
    <Background>
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-display text-3xl text-white animate-pulse_glow">En attente…</p>
      </div>
    </Background>
  )
}
