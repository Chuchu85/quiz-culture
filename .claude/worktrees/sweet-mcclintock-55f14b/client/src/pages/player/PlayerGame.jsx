import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSocket } from '../../context/SocketContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import Background from '../../components/Background.jsx'
import Timer from '../../components/Timer.jsx'
import Scoreboard from '../../components/Scoreboard.jsx'
import confetti from 'canvas-confetti'

// Game mode player views
import ClassicQCMPlayerView from '../../gameModes/classic_qcm/PlayerView.jsx'
import InfoOuBluffPlayerView from '../../gameModes/info_ou_bluff/PlayerView.jsx'
import BuzzerPlayerView from '../../gameModes/buzzer/PlayerView.jsx'
import RechercheInterditePlayerView from '../../gameModes/recherche_interdite/PlayerView.jsx'
import OeilDeLynxPlayerView from '../../gameModes/oeil_de_lynx/PlayerView.jsx'
import PareilLaQuestionPlayerView from '../../gameModes/pareil_la_question/PlayerView.jsx'
import BlindTestPlayerView from '../../gameModes/blind_test/PlayerView.jsx'

function getModePlayerView(gameMode) {
  switch (gameMode) {
    case 'info_ou_bluff': return InfoOuBluffPlayerView
    case 'buzzer': return BuzzerPlayerView
    case 'recherche_interdite': return RechercheInterditePlayerView
    case 'oeil_de_lynx': return OeilDeLynxPlayerView
    case 'pareil_la_question': return PareilLaQuestionPlayerView
    case 'blind_test': return BlindTestPlayerView
    default: return ClassicQCMPlayerView
  }
}

export default function PlayerGame() {
  const location = useLocation()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { refreshTheme } = useTheme()
  const teamName = location.state?.teamName ?? ''
  const myPhoto = location.state?.photo ?? null

  // Synchronise le fond/thème dès l'entrée dans la partie
  useEffect(() => { refreshTheme() }, [])

  const [gameStatus, setGameStatus] = useState('lobby')
  const [gameState, setGameState] = useState(null) // full state for mode components
  const [question, setQuestion] = useState(null)
  const [timer, setTimer] = useState(null)
  const [myAnswer, setMyAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [revealData, setRevealData] = useState(null)
  const [score, setScore] = useState(0)
  const [finishedData, setFinishedData] = useState(null)
  const [players, setPlayers] = useState([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [transition, setTransition] = useState(null)

  const answeredRef = useRef(false)
  const countdownTimerRef = useRef(null)
  const transitionTimerRef = useRef(null)

  useEffect(() => {
    if (!teamName) { navigate('/join'); return }

    socket.on('game:state', (s) => {
      setGameStatus(s.status)
      setGameState(s)
      setPlayers(s.players ?? [])
      setTotalQuestions(s.totalQuestions ?? 0)
      setQuestionIndex(s.questionIndex ?? s.stepIndex ?? 0)

      const newStep = s.step ?? s.question
      if (newStep) {
        // Reset answered state when new step starts
        const isNewStep = !question || newStep.id !== question?.id
        const isActiveStatus = ['video_playing', 'video_replay', 'question_active', 'bluff_input', 'vote_phase', 'buzzer_ready'].includes(s.status)
        if (isActiveStatus && isNewStep) {
          setQuestion(newStep)
          setMyAnswer(null)
          setHasAnswered(false)
          setRevealData(null)
          answeredRef.current = false
        } else if (s.status === 'answer_revealed') {
          setQuestion(newStep)
        }
      }
    })

    socket.on('game:timer', (t) => {
      setTimer(t)
      if (t.remaining <= 5 && t.remaining > 0) navigator.vibrate?.([80])
    })

    socket.on('quiz:answer-received', () => setHasAnswered(true))

    socket.on('game:transition', (data) => {
      setTransition(data)
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = setTimeout(() => setTransition(null), 1500)
    })

    socket.on('game:countdown', ({ count }) => {
      setTransition(null)
      setCountdown(count)
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = setTimeout(() => setCountdown(null), 1200)
    })

    socket.on('quiz:reveal', (data) => {
      setRevealData(data)
      setScore(data.score)
      if (data.correct) confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } })
    })

    socket.on('quiz:finished', (data) => {
      setFinishedData(data)
      setPlayers(data.leaderboard ?? [])
      setGameStatus('finished')
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } })
    })

    socket.on('player:error', ({ message }) => alert(message))

    return () => {
      socket.off('game:state')
      socket.off('game:timer')
      socket.off('game:transition')
      socket.off('game:countdown')
      socket.off('quiz:answer-received')
      socket.off('quiz:reveal')
      socket.off('quiz:finished')
      socket.off('player:error')
    }
  }, [socket, teamName, navigate, question])

  function submitAnswer(answer) {
    if (answeredRef.current) return
    answeredRef.current = true
    setHasAnswered(true)
    setMyAnswer(answer)
    socket.emit('player:answer', { answer })
  }

  const isUrgent = gameStatus === 'question_active' && timer && timer.remaining <= 5 && !hasAnswered
  const bgPhase =
    countdown !== null ? 'countdown'
    : isUrgent ? 'urgent'
    : gameStatus === 'answer_revealed' ? 'reveal'
    : null

  // ── OVERLAYS ──────────────────────────────────────────────────────────────
  const TransitionOverlay = transition && (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="text-center" style={{ animation: 'cine-slide-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <p className="font-display uppercase tracking-widest mb-2"
          style={{ fontSize: '0.9rem', color: '#ff1ee8', letterSpacing: '0.35em' }}>
          {transition.roundName ?? 'Question'}
        </p>
        <div className="font-display text-white" style={{ fontSize: '40vw', lineHeight: 1, textShadow: '0 0 60px rgba(255,30,232,0.9)' }}>
          {transition.questionNumber}
        </div>
        <p className="font-display text-white/40 mt-2" style={{ fontSize: '1.1rem' }}>/ {transition.totalQuestions}</p>
      </div>
    </div>
  )

  const CountdownOverlay = countdown !== null && (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div key={countdown} className="animate-bounce_in text-center">
        <div className="font-display"
          style={{ fontSize: '35vw', lineHeight: 1, color: countdown === 1 ? '#39ff14' : countdown === 2 ? '#ffe600' : '#ff1ee8', textShadow: `0 0 60px ${countdown === 1 ? '#39ff14' : countdown === 2 ? '#ffe600' : '#ff1ee8'}` }}>
          {countdown}
        </div>
      </div>
    </div>
  )

  const UrgentOverlay = isUrgent && (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
      style={{ animation: 'urgency-border 0.35s ease-in-out infinite' }}>
      <div key={timer.remaining} className="font-display"
        style={{ fontSize: '50vw', lineHeight: 1, opacity: 0.12, color: '#ff2020', animation: 'bg-pulse-fast 0.35s ease-in-out infinite' }}>
        {timer.remaining}
      </div>
    </div>
  )

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (gameStatus === 'idle' || gameStatus === 'lobby') {
    return (
      <Background glowColor="pink" phase={bgPhase}>
        {TransitionOverlay}{CountdownOverlay}
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 text-center">
          <div className="animate-pop_in mb-6">
            <img src="/logo.png" alt="Culture Mashup Quiz" className="w-48 mx-auto drop-shadow-2xl" />
          </div>
          <div className="quiz-card p-8 w-full max-w-sm animate-slide_up">
            <div className="flex flex-col items-center mb-4">
              {myPhoto
                ? <img src={myPhoto} alt={teamName} className="rounded-full mb-3" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid #39ff14', boxShadow: '0 0 20px rgba(57,255,20,0.5)' }} />
                : <div className="w-4 h-4 rounded-full mb-4 animate-pulse_glow" style={{ background: '#39ff14', boxShadow: '0 0 20px #39ff14' }} />
              }
              <p className="font-display text-2xl text-white">Tu es connecté !</p>
              <p className="font-display text-xl mt-1" style={{ color: '#ff1ee8' }}>{teamName}</p>
            </div>
            <p className="text-white/50 font-body text-sm">En attente du lancement par l'animateur…</p>
            {players.length > 0 && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <p className="text-white/30 text-xs font-body mb-3">{players.length} équipe{players.length > 1 ? 's' : ''} connectée{players.length > 1 ? 's' : ''}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {players.map(p => (
                    <span key={p.id} className="text-xs font-body px-2 py-1 rounded-full"
                      style={{ background: p.name === teamName ? 'rgba(57,255,20,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${p.name === teamName ? '#39ff14' : 'rgba(255,255,255,0.15)'}`, color: p.name === teamName ? '#39ff14' : 'rgba(255,255,255,0.6)' }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Background>
    )
  }

  // ── ACTIVE GAME PHASES: delegate to mode PlayerView ───────────────────────
  const MODE_ACTIVE_STATUSES = ['video_playing', 'video_replay', 'question_active', 'bluff_input', 'vote_phase', 'buzzer_ready', 'buzzer_locked']

  if (MODE_ACTIVE_STATUSES.includes(gameStatus) && question) {
    const gameMode = gameState?.gameMode || question?.gameMode || question?.type || 'classic_qcm'
    const ModePlayerView = getModePlayerView(gameMode)

    return (
      <Background phase={bgPhase}>
        {TransitionOverlay}{CountdownOverlay}{UrgentOverlay}
        <div className="flex flex-col min-h-screen px-5 py-5 gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-white/60 text-sm">Q{questionIndex + 1}/{totalQuestions}</p>
              <p className="font-display text-quiz-green text-xl">{score} pts</p>
            </div>
            {timer && ['question_active', 'bluff_input', 'vote_phase', 'buzzer_ready'].includes(gameStatus) && (
              <Timer remaining={timer.remaining} total={timer.total} size={76} />
            )}
            <div className="flex items-center gap-2 justify-end">
              {myPhoto && <img src={myPhoto} alt="" className="rounded-full" style={{ width: 32, height: 32, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />}
              <p className="font-display text-white/50 text-xs">{teamName}</p>
            </div>
          </div>

          {/* Question label for modes that don't show it themselves */}
          {question?.question && !['info_ou_bluff', 'buzzer', 'pareil_la_question'].includes(gameMode) && !['video_playing', 'video_replay'].includes(gameStatus) && (
            <div className="rounded-3xl p-5 animate-slide_up flex-shrink-0"
              style={{ background: 'rgba(255,30,232,0.08)', border: '1.5px solid rgba(255,30,232,0.25)' }}>
              <p className="font-body font-bold text-white text-lg leading-snug">{question.question}</p>
            </div>
          )}

          {/* Mode player view */}
          <div className="flex-1 flex flex-col">
            <ModePlayerView
              step={question}
              state={gameState}
              socket={socket}
              myAnswer={myAnswer}
              hasAnswered={hasAnswered}
              onAnswer={submitAnswer}
            />
          </div>
        </div>
      </Background>
    )
  }

  // ── QUESTION CLOSED ────────────────────────────────────────────────────────
  if (gameStatus === 'question_closed') {
    return (
      <Background>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-5 text-center">
          <div className="animate-pop_in max-w-sm w-full quiz-card p-10">
            <p className="text-5xl mb-4">⏳</p>
            <p className="font-display text-2xl text-white">Temps écoulé !</p>
            {hasAnswered
              ? <p className="text-quiz-green font-body text-sm mt-3">Tu as répondu ✓</p>
              : <p className="text-white/40 font-body text-sm mt-3">Tu n'as pas répondu à temps</p>
            }
            <p className="text-white/30 font-body text-xs mt-4">En attente de la révélation…</p>
          </div>
        </div>
      </Background>
    )
  }

  // ── ANSWER REVEALED ────────────────────────────────────────────────────────
  if (gameStatus === 'answer_revealed') {
    const isCorrect = revealData?.correct
    const correctAnswer = revealData?.correctAnswer ?? question?.correctAnswer ?? '?'
    return (
      <Background glowColor={isCorrect ? 'green' : 'pink'}>
        <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-5 text-center">
          <div className="animate-bounce_in max-w-sm w-full quiz-card p-8"
            style={{ background: isCorrect ? 'rgba(57,255,20,0.12)' : 'rgba(255,30,232,0.12)', border: `2px solid ${isCorrect ? '#39ff14' : '#ff1ee8'}` }}>
            {question?.type === 'celebrity_mix' && question.image && (
              <div className="flex justify-center mb-3">
                <img src={question.image} alt="" className="rounded-xl"
                  style={{ width: 100, height: 100, objectFit: 'cover', border: `3px solid ${isCorrect ? '#39ff14' : '#ff1ee8'}` }} />
              </div>
            )}
            {myPhoto && question?.type !== 'celebrity_mix' && (
              <img src={myPhoto} alt="" className="rounded-full mx-auto mb-3"
                style={{ width: 64, height: 64, objectFit: 'cover', border: `3px solid ${isCorrect ? '#39ff14' : '#ff1ee8'}`, boxShadow: `0 0 20px ${isCorrect ? 'rgba(57,255,20,0.5)' : 'rgba(255,30,232,0.5)'}` }} />
            )}
            {!myPhoto && question?.type !== 'celebrity_mix' && (
              <p className="text-6xl mb-3">{question?.type === 'blind_test' ? '🎵' : isCorrect ? '🎉' : '😅'}</p>
            )}
            <p className="font-display text-3xl text-white mb-2">{isCorrect ? 'Bonne réponse !' : 'Dommage !'}</p>
            {!isCorrect && revealData && (
              <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(57,255,20,0.1)', border: '1.5px solid #39ff14' }}>
                <p className="text-white/60 text-xs font-body mb-1">La bonne réponse était</p>
                <p className="font-display text-quiz-green text-xl">{correctAnswer}</p>
              </div>
            )}
            <p className="font-display text-3xl" style={{ color: '#39ff14' }}>{score} pts</p>
            {revealData?.speedBonus > 0 && (
              <div className="mt-3 rounded-xl px-4 py-2 animate-bounce_in"
                style={{ background: 'rgba(255,230,0,0.15)', border: '1.5px solid #ffe600' }}>
                <p className="font-display text-quiz-yellow text-lg">⚡ Bonus vitesse +{revealData.speedBonus} pts !</p>
              </div>
            )}
            <p className="text-white/30 font-body text-xs mt-4">En attente du classement…</p>
          </div>
        </div>
      </Background>
    )
  }

  // ── SCOREBOARD ─────────────────────────────────────────────────────────────
  if (gameStatus === 'scoreboard') {
    const myRank = players.findIndex(p => p.name === teamName)
    return (
      <Background glowColor="pink">
        <div className="flex flex-col items-center min-h-screen px-6 py-8">
          <h2 className="font-display text-3xl text-white text-glow-pink animate-pop_in mb-2">Classement</h2>
          <p className="font-display text-quiz-green text-xl mb-6">{score} pts</p>
          {myRank === 0 && <p className="font-display text-quiz-yellow text-lg mb-4 animate-bounce_in">Tu es en tête !</p>}
          <div className="w-full max-w-sm">
            <Scoreboard players={players} />
          </div>
          <p className="text-white/30 font-body text-xs mt-6">En attente de la question suivante…</p>
        </div>
      </Background>
    )
  }

  // ── FINISHED ───────────────────────────────────────────────────────────────
  if (gameStatus === 'finished') {
    const finalData = finishedData ?? { score, total: totalQuestions, leaderboard: players }
    const myRank = players.findIndex(p => p.name === teamName)
    return (
      <Background glowColor="pink">
        <div className="flex flex-col items-center min-h-screen px-6 py-8">
          <img src="/logo.png" alt="Culture Mashup Quiz" className="h-20 object-contain mb-4 animate-pop_in" />
          <h2 className="font-display text-white text-glow-pink animate-pop_in mb-1"
            style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
            Quiz terminé !
          </h2>
          <p className="font-display text-quiz-green text-2xl mb-1">{finalData.score} pt{finalData.score !== 1 ? 's' : ''}</p>
          {myRank === 0 && <p className="font-display text-quiz-yellow text-xl mb-4 animate-bounce_in">Bravo {teamName}, tu gagnes !</p>}
          <div className="w-full max-w-sm mt-4">
            <Scoreboard players={players} title="Podium Final" podium />
          </div>
          <button className="btn-primary mt-8" onClick={() => navigate('/join')}>Rejouer</button>
        </div>
      </Background>
    )
  }

  return (
    <Background>
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-display text-3xl text-white animate-pulse_glow">Chargement…</p>
      </div>
    </Background>
  )
}
