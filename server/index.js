import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import multer from 'multer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] } })

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ─── Uploads ────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads')
const audioDir = path.join(uploadsDir, 'audio')
const imagesDir = path.join(uploadsDir, 'images')
const videosDir = path.join(uploadsDir, 'videos')
const logosDir = path.join(uploadsDir, 'logos')
const celebritesDir = path.join(uploadsDir, 'celebrites') // legacy

for (const dir of [uploadsDir, audioDir, imagesDir, videosDir, logosDir, celebritesDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir, { maxAge: 0 }))

// ─── Serve React client build (production) ───────────────────────────────────
const clientDist = path.join(__dirname, '../client/dist')
if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  // SPA fallback — toutes les routes non-API renvoient index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/socket.io/')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

function makeStorage(dest, prefix) {
  return multer.diskStorage({
    destination: dest,
    filename: (_req, file, cb) => cb(null, `${prefix}_${Date.now()}${path.extname(file.originalname)}`),
  })
}

const upload = multer({ storage: makeStorage(logosDir, 'logo'), limits: { fileSize: 5 * 1024 * 1024 } })
const uploadClient = multer({ storage: makeStorage(logosDir, 'client-logo'), limits: { fileSize: 5 * 1024 * 1024 } })

const uploadAudio = multer({
  storage: multer.diskStorage({
    destination: audioDir,
    filename: (req, file, cb) => {
      const id = req.params.stepId || req.params.questionId || 'unknown'
      cb(null, `${id}${path.extname(file.originalname) || '.mp3'}`)
    },
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
})

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: imagesDir,
    filename: (req, file, cb) => {
      const id = req.params.stepId || req.params.questionId || 'unknown'
      cb(null, `${id}${path.extname(file.originalname) || '.jpg'}`)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: videosDir,
    filename: (req, file, cb) => cb(null, `${req.params.stepId}${path.extname(file.originalname) || '.mp4'}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
})

// Legacy celebrity upload
const uploadCelebrite = multer({
  storage: multer.diskStorage({
    destination: celebritesDir,
    filename: (req, file, cb) => cb(null, `${req.params.questionId}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
})

// ─── Data paths ───────────────────────────────────────────────────────────────
const configPath = path.join(__dirname, 'data/config.json')
const quizzesDir = path.join(__dirname, 'data/quizzes')
const themesDir = path.join(__dirname, 'data/themes')

if (!existsSync(themesDir)) mkdirSync(themesDir, { recursive: true })

// ─── Config helpers ──────────────────────────────────────────────────────────
function loadConfig() {
  if (!existsSync(configPath)) {
    const defaults = {
      hostPassword: 'animateur',
      backofficePassword: 'admin2024',
      gameCode: 'QUIZ01',
      quizId: 'quiz_mashup',
      activeQuizId: 'quiz_mashup',
      defaultDuration: 40,
      logo: null,
      clientLogo: null,
      activeThemeId: 'theme_default',
    }
    writeFileSync(configPath, JSON.stringify(defaults, null, 2))
    return defaults
  }
  const cfg = JSON.parse(readFileSync(configPath, 'utf-8'))
  if (!cfg.activeQuizId) cfg.activeQuizId = cfg.quizId || 'quiz_mashup'
  if (!cfg.activeThemeId) cfg.activeThemeId = 'theme_default'
  return cfg
}

function saveConfig(cfg) {
  writeFileSync(configPath, JSON.stringify(cfg, null, 2))
}

// ─── Theme helpers ───────────────────────────────────────────────────────────
function loadTheme(themeId) {
  if (!themeId) return null
  const p = path.join(themesDir, `${themeId}.json`)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { return null }
}

function saveTheme(theme) {
  const p = path.join(themesDir, `${theme.id}.json`)
  writeFileSync(p, JSON.stringify(theme, null, 2))
}

function listThemes() {
  if (!existsSync(themesDir)) return []
  return readdirSync(themesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => { try { return JSON.parse(readFileSync(path.join(themesDir, f), 'utf-8')) } catch { return null } })
    .filter(Boolean)
}

// ─── Quiz helpers ─────────────────────────────────────────────────────────────

const TYPE_TO_MODE = {
  multiple_choice: 'classic_qcm',
  text_input: 'text_input',
  blind_test: 'blind_test',
  celebrity_mix: 'qui_se_cache',
  interstitial: 'interstitial',
}

// Convert old-format question to GameStep
function convertQuestion(q, roundName) {
  return {
    ...q,
    gameMode: TYPE_TO_MODE[q.type] || q.type || 'classic_qcm',
    roundName: roundName || q.roundName || null,
    // New fields
    question: q.label || q.question || '',
    label: q.label || q.question || '', // backward compat
    timer: q.duration || q.timer,
    // Keep all original fields for backward compat
  }
}

// Ensure quiz always has steps[] (migrate from rounds[] if needed)
function normalizeQuiz(quiz) {
  if (quiz.steps && quiz.steps.length > 0) return quiz
  // Convert from rounds format
  const steps = []
  ;(quiz.rounds || []).forEach(round => {
    ;(round.questions || []).forEach(q => steps.push(convertQuestion(q, round.name)))
  })
  return { ...quiz, steps }
}

function loadQuiz(quizId) {
  const p = path.join(quizzesDir, `${quizId}.json`)
  if (!existsSync(p)) return null
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8'))
    return normalizeQuiz(raw)
  } catch { return null }
}

function listQuizzes() {
  if (!existsSync(quizzesDir)) return []
  return readdirSync(quizzesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const raw = JSON.parse(readFileSync(path.join(quizzesDir, f), 'utf-8'))
        const quiz = normalizeQuiz(raw)
        return {
          id: quiz.id,
          title: quiz.title || quiz.name || quiz.id,
          description: quiz.description || '',
          themeId: quiz.themeId || 'theme_default',
          sessionCode: quiz.sessionCode || null,
          stepCount: (quiz.steps || []).filter(s => s.gameMode !== 'interstitial').length,
          gameModes: [...new Set((quiz.steps || []).map(s => s.gameMode).filter(Boolean))],
        }
      } catch { return null }
    })
    .filter(Boolean)
}

function saveQuiz(quiz) {
  const p = path.join(quizzesDir, `${quiz.id}.json`)
  writeFileSync(p, JSON.stringify(quiz, null, 2))
}

// Build the flat steps list for a game session
function generateGame(quizId) {
  const quiz = loadQuiz(quizId)
  if (!quiz) return []
  const cfg = loadConfig()

  let steps = (quiz.steps || [])
    .filter(s => s.gameMode !== 'interstitial')
    .map(s => ({
      ...s,
      timer: s.timer ?? s.duration ?? cfg.defaultDuration,
      points: s.points ?? 1,
    }))

  if (cfg.randomizeQuestions) {
    for (let i = steps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [steps[i], steps[j]] = [steps[j], steps[i]]
    }
  }

  return steps
}

// ─── Room state ───────────────────────────────────────────────────────────────
// status: idle | lobby | video_playing | video_replay | question_active | question_closed | answer_revealed |
//         scoreboard | finished | bluff_input | vote_phase | buzzer_ready | buzzer_locked

const room = {
  status: 'idle',
  hostSocketId: null,
  stepIndex: 0,
  steps: [],
  timerId: null,
  questionStartedAt: null,
  players: new Map(),    // Map<socketId, player>
  playerPhotos: new Map(),
  displaySockets: new Set(),
  // Info ou Bluff
  bluffs: new Map(),     // Map<socketId, string>
  votes: new Map(),      // Map<socketId, optionId>
  mixedOptions: [],      // [{id, text, isReal, authorId}]
  bluffTimerId: null,
  voteTimerId: null,
  // Buzzer
  buzzQueue: [],         // [{id, name, time}]
  buzzLocked: false,
}

// Backward-compat aliases
Object.defineProperty(room, 'questions', { get() { return this.steps }, set(v) { this.steps = v }, configurable: true })
Object.defineProperty(room, 'questionIndex', { get() { return this.stepIndex }, set(v) { this.stepIndex = v }, configurable: true })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPlayers() {
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map(p => ({ id: p.id, name: p.name, score: p.score, photo: room.playerPhotos.get(p.id) ?? null }))
}

function getCurrentStep() { return room.steps[room.stepIndex] ?? null }

function safeStepFor(status) {
  const s = getCurrentStep()
  if (!s) return null
  const { correctAnswer, acceptedAnswers, ...safe } = s
  if (status === 'answer_revealed') {
    return { ...safe, correctAnswer: s.correctAnswer ?? s.acceptedAnswers?.[0] ?? null, acceptedAnswers: s.acceptedAnswers ?? [] }
  }
  return safe
}

function getAnswers() {
  return [...room.players.values()].map(p => ({
    playerId: p.id,
    teamName: p.name,
    photo: room.playerPhotos.get(p.id) ?? null,
    answer: p.currentAnswer,
    answered: p.answered,
    correct: p.correct,
    speedBonus: p.speedBonus ?? 0,
    responseTime: (p.answeredAt && room.questionStartedAt)
      ? Math.round((p.answeredAt - room.questionStartedAt) / 100) / 10
      : null,
  }))
}

function answersCount() {
  const vals = [...room.players.values()]
  return { count: vals.filter(p => p.answered).length, total: vals.length }
}

function buildState(overrideStatus) {
  const status = overrideStatus ?? room.status
  const step = getCurrentStep()
  return {
    status,
    stepIndex: room.stepIndex,
    questionIndex: room.stepIndex, // backward compat
    totalQuestions: room.steps.length,
    question: safeStepFor(status),
    step: safeStepFor(status),
    gameMode: step?.gameMode ?? null,
    roundName: step?.roundName ?? null,
    players: getPlayers(),
    answers: getAnswers(),
    answersCount: answersCount(),
    // Info ou Bluff: only send option texts in vote phase
    mixedOptions: status === 'vote_phase'
      ? room.mixedOptions.map(o => ({ id: o.id, text: o.text }))
      : (status === 'answer_revealed' && room.mixedOptions.length > 0)
        ? room.mixedOptions.map(o => ({ id: o.id, text: o.text, isReal: o.isReal, authorId: o.authorId }))
        : undefined,
    // Buzzer
    buzzedBy: (status === 'buzzer_locked' && room.buzzQueue[0])
      ? { id: room.buzzQueue[0].id, name: room.buzzQueue[0].name }
      : undefined,
    bluffsCount: room.bluffs.size,
    votesCount: room.votes.size,
  }
}

function buildHostState(overrideStatus) {
  const fullState = buildState(overrideStatus)
  const status = overrideStatus ?? room.status
  const rawStep = getCurrentStep()
  const hostStep = rawStep
    ? { ...safeStepFor(status), correctAnswer: rawStep.correctAnswer ?? rawStep.acceptedAnswers?.[0] ?? null, acceptedAnswers: rawStep.acceptedAnswers ?? [] }
    : null
  return { ...fullState, step: hostStep, question: hostStep }
}

function broadcastState(overrideStatus) {
  const fullState = buildState(overrideStatus)
  const status = overrideStatus ?? room.status

  const hostState = buildHostState(overrideStatus)

  io.to('host-room').emit('game:state', hostState)
  if (room.hostSocketId) io.to(room.hostSocketId).emit('game:state', hostState)

  // Display: hide answers during question_active
  const displayState = {
    ...fullState,
    answers: fullState.answers?.map(a => ({
      ...a,
      answer: fullState.status === 'question_active' ? null : a.answer,
    })),
  }
  room.displaySockets.forEach(sid => io.to(sid).emit('game:state', displayState))

  // Players: no other players' answers
  const playerState = { ...fullState, answers: undefined }
  room.players.forEach((_p, sid) => io.to(sid).emit('game:state', playerState))
}

function startTimer(duration) {
  clearInterval(room.timerId)
  let remaining = duration
  io.emit('game:timer', { remaining, total: duration })
  room.timerId = setInterval(() => {
    remaining--
    io.emit('game:timer', { remaining, total: duration })
    if (remaining <= 0) {
      clearInterval(room.timerId)
      room.timerId = null
      if (room.status === 'question_active') {
        room.status = 'question_closed'
        broadcastState()
      } else if (room.status === 'buzzer_ready') {
        room.status = 'question_closed'
        broadcastState()
      }
    }
  }, 1000)
}

function resetPlayerAnswers() {
  room.players.forEach(p => {
    p.currentAnswer = null
    p.answered = false
    p.correct = false
    p.answeredAt = null
    p.speedBonus = 0
  })
  room.bluffs.clear()
  room.votes.clear()
  room.mixedOptions = []
  room.buzzQueue = []
  room.buzzLocked = false
}

function clearAllTimers() {
  clearInterval(room.timerId)
  clearInterval(room.bluffTimerId)
  clearInterval(room.voteTimerId)
  room.timerId = room.bluffTimerId = room.voteTimerId = null
}

// ─── Mode-aware scoring ───────────────────────────────────────────────────────
// Normalize: lowercase, trim, remove accents
function normalizeText(s) {
  return String(s).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function calcScores() {
  const step = getCurrentStep()
  if (!step) return

  const mode = step.gameMode || step.type || 'classic_qcm'

  if (mode === 'info_ou_bluff') { calcInfoOuBluffScores(step); return }
  if (mode === 'buzzer') return // scored manually by host

  const isCorrect = (answer) => {
    if (!answer) return false
    const normAnswer = normalizeText(answer)

    // MCQ-style: player answered with a choice id/text — compare normalized
    if (step.choices?.length && step.correctAnswer) {
      return normAnswer === normalizeText(step.correctAnswer)
    }

    // Blind test (text): acceptedAnswers = keywords that must ALL appear (artist + title)
    if (mode === 'blind_test' && step.acceptedAnswers?.length) {
      return step.acceptedAnswers.every(a => normAnswer.includes(normalizeText(a)))
    }

    // Text input: acceptedAnswers = list of valid alternatives, ANY one is enough
    if (step.acceptedAnswers?.length) {
      return step.acceptedAnswers.some(a => {
        const normA = normalizeText(a)
        return normAnswer === normA || normAnswer.includes(normA)
      })
    }

    // Single correctAnswer fallback
    if (step.correctAnswer) return normAnswer === normalizeText(step.correctAnswer)

    return false
  }

  const correctPlayers = []
  room.players.forEach(p => {
    if (!p.answered) return
    const correct = isCorrect(p.currentAnswer)
    p.correct = correct
    if (correct) { p.score += step.points ?? 1; correctPlayers.push(p) }
  })

  // Speed bonus: top 3 correct get +3/+2/+1
  if (step.speedBonus !== false) {
    correctPlayers.sort((a, b) => (a.answeredAt ?? Infinity) - (b.answeredAt ?? Infinity))
    ;[3, 2, 1].forEach((bonus, i) => {
      if (correctPlayers[i]) { correctPlayers[i].score += bonus; correctPlayers[i].speedBonus = bonus }
    })
  }
}

function calcInfoOuBluffScores(step) {
  const pts = step.points
  const pointsCorrect = (typeof pts === 'object' ? pts.correctAnswer : null) ?? pts ?? 2
  const pointsBluff = (typeof pts === 'object' ? pts.bluffVote : null) ?? 1
  const correctOption = room.mixedOptions.find(o => o.isReal)

  room.votes.forEach((optionId, socketId) => {
    const player = room.players.get(socketId)
    if (!player) return
    if (optionId === correctOption?.id) {
      player.correct = true
      player.score += pointsCorrect
    } else {
      const bluffOption = room.mixedOptions.find(o => o.id === optionId && !o.isReal)
      if (bluffOption?.authorId && bluffOption.authorId !== socketId) {
        const author = room.players.get(bluffOption.authorId)
        if (author) author.score += pointsBluff
      }
    }
  })
}

// ─── Game flow ────────────────────────────────────────────────────────────────
function launchQuestion() {
  const step = getCurrentStep()
  if (!step) return
  resetPlayerAnswers()

  const mode = step.gameMode || step.type || 'classic_qcm'

  io.emit('game:transition', {
    questionNumber: room.stepIndex + 1,
    totalQuestions: room.steps.length,
    roundName: step.roundName ?? null,
    gameMode: mode,
  })

  setTimeout(() => {
    let count = 3
    io.emit('game:countdown', { count })
    const cTimer = setInterval(() => {
      count--
      if (count > 0) {
        io.emit('game:countdown', { count })
      } else {
        clearInterval(cTimer)
        if (mode === 'info_ou_bluff') {
          startBluffPhase(step)
        } else if (mode === 'buzzer') {
          startBuzzerPhase(step)
        } else if (mode === 'oeil_de_lynx' && step.videoUrl) {
          // Show video first — host will stop it manually
          room.status = 'video_playing'
          broadcastState()
        } else {
          room.status = 'question_active'
          room.questionStartedAt = Date.now()
          broadcastState()
          startTimer(step.timer ?? step.duration ?? 40)
        }
      }
    }, 1000)
  }, 1600)
}

function startBluffPhase(step) {
  room.status = 'bluff_input'
  room.questionStartedAt = Date.now()
  broadcastState()

  const bluffTime = step.bluffTime ?? 30
  let remaining = bluffTime
  io.emit('game:timer', { remaining, total: bluffTime })

  room.bluffTimerId = setInterval(() => {
    remaining--
    io.emit('game:timer', { remaining, total: bluffTime })
    if (remaining <= 0) {
      clearInterval(room.bluffTimerId)
      room.bluffTimerId = null
      io.emit('game:timer', { remaining: 0, total: bluffTime })
    }
  }, 1000)
}

function startVotePhase(step) {
  const options = [{ id: 'opt_real', text: step.correctAnswer, isReal: true, authorId: null }]
  let idx = 0
  room.bluffs.forEach((text, socketId) => {
    if (text?.trim()) {
      options.push({ id: `opt_${++idx}`, text: text.trim(), isReal: false, authorId: socketId })
    }
  })
  room.mixedOptions = options.sort(() => Math.random() - 0.5)

  room.status = 'vote_phase'
  broadcastState()

  const voteTime = step.voteTime ?? 20
  let remaining = voteTime
  io.emit('game:timer', { remaining, total: voteTime })

  room.voteTimerId = setInterval(() => {
    remaining--
    io.emit('game:timer', { remaining, total: voteTime })
    const allVoted = room.votes.size >= room.players.size
    if (remaining <= 0 || allVoted) {
      clearInterval(room.voteTimerId)
      room.voteTimerId = null
      room.status = 'question_closed'
      broadcastState()
    }
  }, 1000)
}

function startBuzzerPhase(step) {
  room.status = 'buzzer_ready'
  room.questionStartedAt = Date.now()
  room.buzzQueue = []
  room.buzzLocked = false
  broadcastState()
  const timer = step.timer ?? step.duration ?? 0
  if (timer > 0) startTimer(timer)
}

function endGame() {
  clearAllTimers()
  room.status = 'finished'
  broadcastState()
  room.players.forEach((player, sid) => {
    io.to(sid).emit('quiz:finished', {
      score: player.score,
      total: room.steps.length,
      leaderboard: getPlayers(),
    })
  })
  console.log('🏁  Partie terminée')
}

// ─── REST API ──────────────────────────────────────────────────────────────────

// Public room info
app.get('/api/room', (_req, res) => {
  const cfg = loadConfig()
  const qid = cfg.activeQuizId || cfg.quizId
  const quiz = loadQuiz(qid)
  const visual = quiz?.visual || {}
  res.json({
    quizName: qid,
    questionCount: generateGame(qid).length,
    playerCount: room.players.size,
    state: room.status,
    logo: visual.logoUrl || cfg.logo,
    clientLogo: visual.clientLogoUrl || cfg.clientLogo,
    clientName: visual.clientName || '',
    customJoinUrl: cfg.customJoinUrl || null,
    qrCodeImageUrl: cfg.qrCodeImageUrl || null,
  })
})

// Public active theme — merges active quiz visual overrides
app.get('/api/theme/active', (_req, res) => {
  const cfg = loadConfig()
  const qid = cfg.activeQuizId || cfg.quizId
  const quiz = loadQuiz(qid)
  const visual = quiz?.visual || {}
  // Quiz can override the theme (use its own themeId if set)
  const themeId = visual.themeId || cfg.activeThemeId
  let theme = loadTheme(themeId) || { id: 'theme_default', name: 'Défaut', colors: {} }
  theme = { ...theme }
  // Merge quiz-specific visual fields
  if (visual.backgroundUrl) theme.backgroundImage = visual.backgroundUrl
  if (visual.logoUrl) theme.logoUrl = visual.logoUrl
  if (visual.clientLogoUrl) theme.clientLogoUrl = visual.clientLogoUrl
  if (visual.clientName) theme.clientName = visual.clientName
  // Merge quiz-specific colors (per-key override)
  if (visual.colors && Object.keys(visual.colors).length) {
    theme.colors = { ...(theme.colors || {}), ...visual.colors }
  }
  // Merge quiz-specific sounds (per-event override)
  if (visual.sounds && Object.values(visual.sounds).some(Boolean)) {
    theme.sounds = { ...(theme.sounds || {}), ...visual.sounds }
  }
  res.json(theme)
})

// ── Backoffice auth ───────────────────────────────────────────────────────────
app.post('/api/backoffice/auth', (req, res) => {
  const cfg = loadConfig()
  if (req.body.password === cfg.backofficePassword) return res.json({ ok: true })
  res.status(401).json({ error: 'Mot de passe incorrect' })
})

// ── Backoffice full data load ─────────────────────────────────────────────────
app.get('/api/backoffice/data', (_req, res) => {
  const cfg = loadConfig()
  const qid = cfg.activeQuizId || cfg.quizId
  const quiz = loadQuiz(qid)
  const quizList = listQuizzes()
  const themes = listThemes()
  res.json({ config: cfg, quiz, quizList, themes })
})

// ── Config ────────────────────────────────────────────────────────────────────
app.put('/api/backoffice/config', (req, res) => {
  const cfg = loadConfig()
  const { hostPassword, backofficePassword, gameCode, defaultDuration, activeQuizId, activeThemeId, randomizeQuestions, customJoinUrl } = req.body
  if (hostPassword !== undefined) cfg.hostPassword = hostPassword
  if (backofficePassword !== undefined) cfg.backofficePassword = backofficePassword
  if (gameCode !== undefined) cfg.gameCode = gameCode
  if (defaultDuration !== undefined) cfg.defaultDuration = parseInt(defaultDuration)
  if (activeQuizId !== undefined) { cfg.activeQuizId = activeQuizId; cfg.quizId = activeQuizId }
  if (activeThemeId !== undefined) cfg.activeThemeId = activeThemeId
  if (randomizeQuestions !== undefined) cfg.randomizeQuestions = Boolean(randomizeQuestions)
  if (customJoinUrl !== undefined) cfg.customJoinUrl = customJoinUrl || null
  saveConfig(cfg)
  res.json({ ok: true })
})

// ── Quiz CRUD ─────────────────────────────────────────────────────────────────
app.get('/api/backoffice/quizzes', (_req, res) => {
  const cfg = loadConfig()
  res.json({ quizzes: listQuizzes(), activeQuizId: cfg.activeQuizId || cfg.quizId || null })
})

app.get('/api/backoffice/quizzes/:id', (req, res) => {
  const quiz = loadQuiz(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' })
  res.json(quiz)
})

app.post('/api/backoffice/quizzes', (req, res) => {
  const quiz = { ...req.body }
  if (!quiz.id) quiz.id = `quiz_${Date.now()}`
  if (!quiz.title && !quiz.name) { quiz.title = quiz.name || 'Nouveau quiz'; quiz.name = quiz.title }
  if (!quiz.steps) quiz.steps = []
  saveQuiz(quiz)
  res.json({ ok: true, quiz })
})

app.put('/api/backoffice/quizzes/:id', (req, res) => {
  const quiz = { ...req.body, id: req.params.id }
  saveQuiz(quiz)
  io.emit('room:updated')
  res.json({ ok: true, quiz })
})

app.delete('/api/backoffice/quizzes/:id', (req, res) => {
  const p = path.join(quizzesDir, `${req.params.id}.json`)
  if (!existsSync(p)) return res.status(404).json({ error: 'Quiz introuvable' })
  try { unlinkSync(p); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/backoffice/quizzes/:id/duplicate', (req, res) => {
  const quiz = loadQuiz(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' })
  const newId = `${quiz.id}_copie_${Date.now()}`
  const newQuiz = { ...quiz, id: newId, title: `${quiz.title || quiz.name || quiz.id} (copie)`, name: `${quiz.name || quiz.title || quiz.id} (copie)` }
  saveQuiz(newQuiz)
  res.json({ ok: true, quiz: newQuiz })
})

app.post('/api/backoffice/quizzes/:id/activate', (req, res) => {
  const cfg = loadConfig()
  cfg.activeQuizId = req.params.id
  cfg.quizId = req.params.id
  saveConfig(cfg)
  res.json({ ok: true })
})

// ── Themes CRUD ───────────────────────────────────────────────────────────────
app.get('/api/backoffice/themes', (_req, res) => {
  const cfg = loadConfig()
  res.json({ themes: listThemes(), activeThemeId: cfg.activeThemeId || 'theme_default' })
})

app.get('/api/backoffice/themes/:id', (req, res) => {
  const theme = loadTheme(req.params.id)
  if (!theme) return res.status(404).json({ error: 'Thème introuvable' })
  res.json(theme)
})

app.post('/api/backoffice/themes', (req, res) => {
  const theme = { ...req.body }
  if (!theme.id) theme.id = `theme_${Date.now()}`
  if (!theme.name) theme.name = 'Nouveau thème'
  saveTheme(theme)
  res.json({ ok: true, id: theme.id })
})

app.put('/api/backoffice/themes/:id', (req, res) => {
  const theme = { ...req.body, id: req.params.id }
  saveTheme(theme)
  io.emit('room:updated')
  res.json({ ok: true })
})

app.delete('/api/backoffice/themes/:id', (req, res) => {
  const p = path.join(themesDir, `${req.params.id}.json`)
  if (!existsSync(p)) return res.status(404).json({ error: 'Thème introuvable' })
  try { unlinkSync(p); res.json({ ok: true }) } catch (e) { res.status(500).json({ error: e.message }) }
})

// Activate a theme
app.post('/api/backoffice/themes/activate', (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json({ error: 'id requis' })
  const cfg = loadConfig()
  cfg.activeThemeId = id
  saveConfig(cfg)
  io.emit('room:updated')
  res.json({ ok: true })
})

// Upload background image for a theme
const themesBgDir = path.join(uploadsDir, 'themes')
if (!existsSync(themesBgDir)) mkdirSync(themesBgDir, { recursive: true })

const uploadThemeBg = multer({
  storage: multer.diskStorage({
    destination: themesBgDir,
    filename: (req, file, cb) => cb(null, `theme_bg_${req.params.id}_${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
})

app.post('/api/backoffice/themes/:id/background', (req, res, next) => {
  uploadThemeBg.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/themes/${req.file.filename}`
    const theme = loadTheme(req.params.id)
    if (!theme) return res.status(404).json({ error: 'Thème introuvable' })
    theme.backgroundImage = url
    saveTheme(theme)
    res.json({ ok: true, backgroundImage: url })
  })
})

// Upload a sound for a theme event
const themeSoundsDir = path.join(uploadsDir, 'themes', 'sounds')
if (!existsSync(themeSoundsDir)) mkdirSync(themeSoundsDir, { recursive: true })

const uploadThemeSound = multer({
  storage: multer.diskStorage({
    destination: themeSoundsDir,
    filename: (req, file, cb) => cb(null, `theme_${req.params.id}_${req.params.event}_${Date.now()}${path.extname(file.originalname) || '.mp3'}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
})

const VALID_SOUND_EVENTS = ['lobby', 'questionStart', 'countdown', 'reveal', 'scoreboard', 'victory']

app.post('/api/backoffice/themes/:id/sounds/:event', (req, res) => {
  if (!VALID_SOUND_EVENTS.includes(req.params.event)) return res.status(400).json({ error: 'Événement invalide' })
  uploadThemeSound.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/themes/sounds/${req.file.filename}`
    const theme = loadTheme(req.params.id)
    if (!theme) return res.status(404).json({ error: 'Thème introuvable' })
    if (!theme.sounds) theme.sounds = {}
    theme.sounds[req.params.event] = url
    saveTheme(theme)
    res.json({ ok: true, event: req.params.event, url })
  })
})

app.delete('/api/backoffice/themes/:id/sounds/:event', (req, res) => {
  if (!VALID_SOUND_EVENTS.includes(req.params.event)) return res.status(400).json({ error: 'Événement invalide' })
  const theme = loadTheme(req.params.id)
  if (!theme) return res.status(404).json({ error: 'Thème introuvable' })
  if (theme.sounds) theme.sounds[req.params.event] = null
  saveTheme(theme)
  res.json({ ok: true })
})

// ── Quiz visual uploads (logo, client-logo, background per quiz) ──────────────
const uploadQuizLogo = multer({
  storage: makeStorage(logosDir, 'quiz-logo'),
  limits: { fileSize: 5 * 1024 * 1024 },
})
const uploadQuizBg = multer({
  storage: multer.diskStorage({
    destination: themesBgDir,
    filename: (req, file, cb) => cb(null, `quiz_bg_${req.params.id}_${Date.now()}${path.extname(file.originalname) || '.jpg'}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
})

app.post('/api/backoffice/quizzes/:id/visual/logo', (req, res) => {
  uploadQuizLogo.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/logos/${req.file.filename}`
    const quiz = loadQuiz(req.params.id)
    if (quiz) { quiz.visual = { ...(quiz.visual || {}), logoUrl: url }; saveQuiz(quiz) }
    io.emit('room:updated')
    res.json({ ok: true, url })
  })
})

app.post('/api/backoffice/quizzes/:id/visual/client-logo', (req, res) => {
  uploadQuizLogo.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/logos/${req.file.filename}`
    const quiz = loadQuiz(req.params.id)
    if (quiz) { quiz.visual = { ...(quiz.visual || {}), clientLogoUrl: url }; saveQuiz(quiz) }
    io.emit('room:updated')
    res.json({ ok: true, url })
  })
})

app.post('/api/backoffice/quizzes/:id/visual/background', (req, res) => {
  uploadQuizBg.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/themes/${req.file.filename}`
    const quiz = loadQuiz(req.params.id)
    if (quiz) { quiz.visual = { ...(quiz.visual || {}), backgroundUrl: url }; saveQuiz(quiz) }
    io.emit('room:updated')
    res.json({ ok: true, url })
  })
})

// Upload a sound for a quiz event (stored in quiz.visual.sounds)
const quizSoundsDir = path.join(uploadsDir, 'quiz-sounds')
if (!existsSync(quizSoundsDir)) mkdirSync(quizSoundsDir, { recursive: true })

const uploadQuizSound = multer({
  storage: multer.diskStorage({
    destination: quizSoundsDir,
    filename: (req, file, cb) => cb(null, `quiz_${req.params.id}_${req.params.event}_${Date.now()}${path.extname(file.originalname) || '.mp3'}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
})

app.post('/api/backoffice/quizzes/:id/visual/sounds/:event', (req, res) => {
  if (!VALID_SOUND_EVENTS.includes(req.params.event)) return res.status(400).json({ error: 'Événement invalide' })
  uploadQuizSound.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/quiz-sounds/${req.file.filename}`
    const quiz = loadQuiz(req.params.id)
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' })
    quiz.visual = quiz.visual || {}
    quiz.visual.sounds = quiz.visual.sounds || {}
    quiz.visual.sounds[req.params.event] = url
    saveQuiz(quiz)
    io.emit('room:updated')
    res.json({ ok: true, event: req.params.event, url })
  })
})

app.delete('/api/backoffice/quizzes/:id/visual/sounds/:event', (req, res) => {
  if (!VALID_SOUND_EVENTS.includes(req.params.event)) return res.status(400).json({ error: 'Événement invalide' })
  const quiz = loadQuiz(req.params.id)
  if (!quiz) return res.status(404).json({ error: 'Quiz introuvable' })
  if (quiz.visual?.sounds) quiz.visual.sounds[req.params.event] = null
  saveQuiz(quiz)
  io.emit('room:updated')
  res.json({ ok: true })
})

// ── Legacy quiz save (backward compat) ───────────────────────────────────────
app.put('/api/backoffice/quiz', (req, res) => {
  const cfg = loadConfig()
  const p = path.join(quizzesDir, `${cfg.activeQuizId || cfg.quizId}.json`)
  try { writeFileSync(p, JSON.stringify(req.body, null, 2)); res.json({ ok: true }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Logos ─────────────────────────────────────────────────────────────────────
app.post('/api/backoffice/logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
  const cfg = loadConfig()
  cfg.logo = `/uploads/logos/${req.file.filename}`
  saveConfig(cfg)
  io.emit('room:updated')
  res.json({ ok: true, logo: cfg.logo })
})

app.delete('/api/backoffice/logo', (_req, res) => {
  const cfg = loadConfig(); cfg.logo = null; saveConfig(cfg); res.json({ ok: true })
})

app.post('/api/backoffice/client-logo', uploadClient.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
  const cfg = loadConfig()
  cfg.clientLogo = `/uploads/logos/${req.file.filename}`
  saveConfig(cfg)
  io.emit('room:updated')
  res.json({ ok: true, clientLogo: cfg.clientLogo })
})

app.delete('/api/backoffice/client-logo', (_req, res) => {
  const cfg = loadConfig(); cfg.clientLogo = null; saveConfig(cfg); res.json({ ok: true })
})

// ── QR Code custom image ──────────────────────────────────────────────────────
app.post('/api/backoffice/qrcode', upload.single('qrcode'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
  const cfg = loadConfig()
  cfg.qrCodeImageUrl = `/uploads/logos/${req.file.filename}`
  saveConfig(cfg)
  res.json({ ok: true, qrCodeImageUrl: cfg.qrCodeImageUrl })
})

app.delete('/api/backoffice/qrcode', (_req, res) => {
  const cfg = loadConfig(); cfg.qrCodeImageUrl = null; saveConfig(cfg); res.json({ ok: true })
})

// ── Media uploads ─────────────────────────────────────────────────────────────
function updateStepField(stepId, field, value) {
  const cfg = loadConfig()
  const qid = cfg.activeQuizId || cfg.quizId
  const quiz = loadQuiz(qid)
  if (!quiz) return false
  let updated = false
  ;(quiz.steps || []).forEach(s => { if (s.id === stepId) { s[field] = value; updated = true } })
  if (!updated) {
    ;(quiz.rounds || []).forEach(r => r.questions?.forEach(q => {
      if (q.id === stepId) { q[field] = value; updated = true }
    }))
  }
  if (updated) writeFileSync(path.join(quizzesDir, `${qid}.json`), JSON.stringify(quiz, null, 2))
  return updated
}

app.post('/api/backoffice/media/audio/:stepId', (req, res, next) => {
  uploadAudio.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/audio/${req.file.filename}`
    updateStepField(req.params.stepId, 'audio', url)
    res.json({ ok: true, audio: url })
  })
})

// Legacy endpoint
app.post('/api/backoffice/media/audio-legacy/:questionId', (req, res, next) => {
  uploadAudio.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/audio/${req.file.filename}`
    updateStepField(req.params.questionId, 'audio', url)
    res.json({ ok: true, audio: url })
  })
})

app.post('/api/backoffice/media/image/:stepId', (req, res, next) => {
  uploadImage.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/images/${req.file.filename}`
    updateStepField(req.params.stepId, 'image', url)
    res.json({ ok: true, image: url })
  })
})

app.post('/api/backoffice/media/video/:stepId', (req, res, next) => {
  uploadVideo.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/videos/${req.file.filename}`
    updateStepField(req.params.stepId, 'videoUrl', url)
    res.json({ ok: true, videoUrl: url })
  })
})

// Legacy celebrity upload
app.post('/api/backoffice/media/celebrite/:questionId', (req, res, next) => {
  uploadCelebrite.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' })
    const url = `/uploads/celebrites/${req.file.filename}`
    updateStepField(req.params.questionId, 'image', url)
    res.json({ ok: true, image: url })
  })
})

app.get('/api/backoffice/media', (_req, res) => {
  const cfg = loadConfig()
  const quiz = loadQuiz(cfg.activeQuizId || cfg.quizId)
  if (!quiz) return res.json({ audio: [], images: [], videos: [], blindTests: [], celebrites: [] })
  const audio = [], images = [], videos = [], blindTests = [], celebrites = []
  ;(quiz.steps || []).forEach(s => {
    if (s.audio) { audio.push({ id: s.id, question: s.question || s.label, audio: s.audio }); blindTests.push({ id: s.id, label: s.question || s.label, audio: s.audio, correctAnswer: s.correctAnswer }) }
    if (s.image) { images.push({ id: s.id, question: s.question || s.label, image: s.image }); celebrites.push({ id: s.id, label: s.question || s.label, image: s.image, correctAnswer: s.correctAnswer }) }
    if (s.videoUrl) videos.push({ id: s.id, question: s.question || s.label, videoUrl: s.videoUrl })
  })
  res.json({ audio, images, videos, blindTests, celebrites })
})

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', socket => {

  // ── HOST ───────────────────────────────────────────────────────────────────
  socket.on('host:connect', ({ password } = {}) => {
    const cfg = loadConfig()
    if (password !== cfg.hostPassword) return socket.emit('host:error', { message: 'Mot de passe incorrect' })
    socket.join('host-room')
    room.hostSocketId = socket.id
    socket.emit('host:connected', { code: cfg.gameCode })
    socket.emit('game:state', buildHostState())
    console.log('🎙️  Hôte connecté')
  })

  socket.on('host:request-state', () => {
    socket.join('host-room')
    room.hostSocketId = socket.id
    socket.emit('game:state', buildHostState())
  })

  socket.on('host:start-game', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    const cfg = loadConfig()
    room.steps = generateGame(cfg.activeQuizId || cfg.quizId)
    room.stepIndex = 0
    room.status = 'lobby'
    resetPlayerAnswers()
    broadcastState()
    console.log(`▶  Partie — ${room.steps.length} étapes`)
  })

  socket.on('host:launch-question', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    const step = getCurrentStep()
    if (!step || (room.status !== 'lobby' && room.status !== 'scoreboard')) return
    launchQuestion()
  })

  socket.on('host:close-question', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    clearAllTimers()
    room.status = 'question_closed'
    broadcastState()
  })

  socket.on('host:reveal-answer', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    clearAllTimers()
    calcScores()
    room.status = 'answer_revealed'
    broadcastState()
    const step = getCurrentStep()
    room.players.forEach((player, sid) => {
      io.to(sid).emit('quiz:reveal', {
        correctAnswer: step?.correctAnswer ?? step?.acceptedAnswers?.[0] ?? null,
        givenAnswer: player.currentAnswer,
        correct: player.correct,
        score: player.score,
        speedBonus: player.speedBonus ?? 0,
        mixedOptions: room.mixedOptions.length > 0 ? room.mixedOptions : undefined,
        myVote: room.votes.get(sid),
        myBluff: room.bluffs.get(sid),
      })
    })
  })

  socket.on('host:show-scoreboard', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    room.status = 'scoreboard'
    broadcastState()
  })

  socket.on('host:next-question', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    room.stepIndex++
    if (room.stepIndex >= room.steps.length) { endGame(); return }
    launchQuestion()
  })

  socket.on('host:end-game', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    endGame()
  })

  socket.on('host:restart', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    clearAllTimers()
    room.status = 'lobby'
    room.stepIndex = 0
    room.bluffs.clear()
    room.votes.clear()
    room.mixedOptions = []
    room.buzzQueue = []
    room.buzzLocked = false
    room.players.forEach(p => { p.score = 0; p.currentAnswer = null; p.answered = false; p.correct = false; p.answeredAt = null; p.speedBonus = 0 })
    broadcastState()
    console.log('↺  Quiz recommencé')
  })

  socket.on('host:stop-quiz', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    clearAllTimers()
    room.status = 'idle'
    resetPlayerAnswers()
    broadcastState()
    console.log('⏹  Quiz arrêté')
  })

  socket.on('host:award-point', ({ playerId }) => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    const p = [...room.players.values()].find(p => p.id === playerId)
    if (p) {
      const step = getCurrentStep()
      p.score += step?.points ?? 1
      p.correct = true
      broadcastState()
    }
  })

  socket.on('host:reject-answer', ({ playerId }) => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    const p = [...room.players.values()].find(p => p.id === playerId)
    if (p) { p.correct = false; broadcastState() }
  })

  socket.on('host:adjust-score', ({ playerId, delta }) => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    const p = [...room.players.values()].find(p => p.id === playerId)
    if (p) { p.score = Math.max(0, p.score + delta); broadcastState() }
  })

  // Buzzer host controls
  socket.on('host:buzz-validate', ({ correct } = {}) => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    const buzzed = room.buzzQueue[0]
    if (!buzzed) return
    const player = room.players.get(buzzed.id)
    const step = getCurrentStep()
    if (player && correct) {
      player.score += step?.points ?? 1
      player.correct = true
      player.speedBonus = 3
    }
    room.status = 'answer_revealed'
    broadcastState()
    if (player) {
      io.to(buzzed.id).emit('quiz:reveal', { correct, score: player.score, speedBonus: correct ? 3 : 0 })
    }
  })

  socket.on('host:buzz-reopen', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    room.buzzQueue = []
    room.buzzLocked = false
    room.status = 'buzzer_ready'
    broadcastState()
  })

  // Œil de Lynx — host stops the video and starts the question + timer
  socket.on('host:stop-video', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    if (room.status === 'video_playing') {
      const step = getCurrentStep()
      room.status = 'question_active'
      room.questionStartedAt = Date.now()
      broadcastState()
      startTimer(step?.timer ?? step?.duration ?? 40)
    } else if (room.status === 'video_replay') {
      room.status = 'answer_revealed'
      broadcastState()
    }
  })

  // Œil de Lynx — host replays the video with audio after answer reveal
  socket.on('host:replay-video', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    if (room.status !== 'answer_revealed') return
    const step = getCurrentStep()
    if (!step?.videoUrl) return
    room.status = 'video_replay'
    broadcastState()
  })

  // Info ou Bluff: force jump to vote phase
  socket.on('host:force-vote-phase', () => {
    if (!io.sockets.adapter.rooms.get('host-room')?.has(socket.id)) return
    if (room.status !== 'bluff_input') return
    clearInterval(room.bluffTimerId)
    room.bluffTimerId = null
    startVotePhase(getCurrentStep())
  })

  // ── PLAYER ──────────────────────────────────────────────────────────────────
  socket.on('player:join', ({ teamName } = {}) => {
    const name = teamName?.trim()
    if (!name) return socket.emit('player:error', { message: "Entre un nom d'équipe !" })
    if ([...room.players.values()].some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return socket.emit('player:error', { message: 'Ce nom est déjà pris !' })
    }
    const player = { id: socket.id, name, score: 0, currentAnswer: null, answered: false, correct: false, answeredAt: null, speedBonus: 0 }
    room.players.set(socket.id, player)
    socket.emit('player:joined', { teamName: name })
    socket.emit('game:state', { ...buildState(), answers: undefined })
    broadcastState()
    console.log(`👤 ${name} (${room.players.size} joueur(s))`)
  })

  socket.on('player:photo', ({ photo } = {}) => {
    if (!photo || typeof photo !== 'string' || !photo.startsWith('data:image')) return
    if (photo.length > 30000) return
    room.playerPhotos.set(socket.id, photo)
    broadcastState()
  })

  socket.on('player:answer', ({ answer } = {}) => {
    const player = room.players.get(socket.id)
    if (!player || player.answered || room.status !== 'question_active') return
    player.currentAnswer = answer
    player.answered = true
    player.answeredAt = Date.now()
    socket.emit('quiz:answer-received', { answer })
    broadcastState()
  })

  // Info ou Bluff — phase 1: submit a bluff answer
  socket.on('player:submit-bluff', ({ bluff } = {}) => {
    const player = room.players.get(socket.id)
    if (!player || room.status !== 'bluff_input') return
    if (!bluff?.trim()) return
    room.bluffs.set(socket.id, bluff.trim())
    socket.emit('quiz:bluff-received', { ok: true })
    broadcastState() // update bluffsCount
  })

  // Info ou Bluff — phase 2: vote for an answer
  socket.on('player:vote', ({ optionId } = {}) => {
    const player = room.players.get(socket.id)
    if (!player || room.status !== 'vote_phase') return
    room.votes.set(socket.id, optionId)
    player.answered = true
    player.answeredAt = Date.now()
    socket.emit('quiz:vote-received', { optionId })
    broadcastState()
  })

  // Buzzer — player hits the buzzer
  socket.on('player:buzz', () => {
    const player = room.players.get(socket.id)
    if (!player || room.status !== 'buzzer_ready' || room.buzzLocked) return
    room.buzzLocked = true
    room.buzzQueue.push({ id: socket.id, name: player.name, time: Date.now() })
    room.status = 'buzzer_locked'
    clearAllTimers()
    broadcastState()
    console.log(`🔔 ${player.name} a buzzé`)
  })

  // ── DISPLAY ─────────────────────────────────────────────────────────────────
  socket.on('display:join', () => {
    room.displaySockets.add(socket.id)
    socket.emit('display:joined')
    socket.emit('game:state', buildState())
  })

  // Œil de Lynx — display signals video ended; auto-transition state
  socket.on('display:video-ended', () => {
    if (room.status === 'video_playing') {
      const step = getCurrentStep()
      room.status = 'question_active'
      room.questionStartedAt = Date.now()
      broadcastState()
      startTimer(step?.timer ?? step?.duration ?? 40)
    } else if (room.status === 'video_replay') {
      room.status = 'answer_revealed'
      broadcastState()
    }
  })

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (socket.id === room.hostSocketId) room.hostSocketId = null
    room.displaySockets.delete(socket.id)
    const player = room.players.get(socket.id)
    if (player) {
      room.players.delete(socket.id)
      room.playerPhotos.delete(socket.id)
      if (room.status !== 'idle') broadcastState()
      console.log(`✕ ${player.name} déconnecté (${room.players.size} joueur(s))`)
    }
  })
})

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  const cfg = loadConfig()
  console.log(`\n🎮 Culture Mashup Quiz — Plateforme Multi-Modes`)
  console.log(`   → Serveur    : http://localhost:${PORT}`)
  console.log(`   → Hôte       : /host  (mdp : "${cfg.hostPassword}")`)
  console.log(`   → Joueurs    : /join`)
  console.log(`   → Backoffice : /backoffice  (mdp : "${cfg.backofficePassword}")`)
  console.log(`   → Code jeu   : ${cfg.gameCode}`)
  console.log(`   → Quiz actif : ${cfg.activeQuizId || cfg.quizId}\n`)
})
