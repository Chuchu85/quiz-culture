import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx'

// ─── Game modes list ──────────────────────────────────────────────────────────
const MODES = [
  { id: 'classic_qcm',         label: 'QCM Classique',       icon: '🎯', color: '#ff1ee8' },
  { id: 'top_reponse',         label: 'Top Réponse',         icon: '⚡', color: '#ffe600' },
  { id: 'info_ou_bluff',       label: 'Info ou Bluff',       icon: '🃏', color: '#ff6b35' },
  { id: 'qui_se_cache',        label: 'Qui se cache ?',      icon: '🎭', color: '#7b2fff' },
  { id: 'recherche_interdite', label: 'Recherche Interdite', icon: '🔍', color: '#4d9fff' },
  { id: 'oeil_de_lynx',        label: 'Œil de Lynx',        icon: '🎬', color: '#00d4ff' },
  { id: 'blind_test',          label: 'Blind Test',          icon: '🎵', color: '#9b59b6' },
  { id: 'buzzer',              label: 'Buzzer',              icon: '🔔', color: '#ff2020' },
  { id: 'text_input',          label: 'Texte libre',         icon: '✏️', color: '#2ecc71' },
  { id: 'pareil_la_question',  label: 'Pareil la Question',  icon: '💬', color: '#ff1ee8' },
]

// ─── Tab component ────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="px-5 py-3 font-display text-sm whitespace-nowrap transition-all"
      style={{ color: active ? '#39ff14' : 'rgba(255,255,255,0.5)', borderBottom: active ? '3px solid #39ff14' : '3px solid transparent', background: 'transparent' }}>
      {label}
    </button>
  )
}

// ─── Inline input helper ──────────────────────────────────────────────────────
function Input({ label, value, onChange, type = 'text', hint, rows, placeholder }) {
  const [f, setF] = useState(false)
  const style = { background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 13px', color: 'white', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: '100%', caretColor: '#39ff14', resize: rows ? 'none' : undefined }
  return (
    <div className="mb-3">
      {label && <label className="block font-body text-white/60 text-xs mb-1">{label}</label>}
      {hint && <p className="text-white/30 text-xs font-body mb-1">{hint}</p>}
      {rows
        ? <textarea rows={rows} value={value ?? ''} onChange={e => onChange(e.target.value)} style={style} placeholder={placeholder} onFocus={() => setF(true)} onBlur={() => setF(false)} />
        : <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} style={style} placeholder={placeholder} onFocus={() => setF(true)} onBlur={() => setF(false)} />
      }
    </div>
  )
}

// ─── StepEditor ───────────────────────────────────────────────────────────────
function StepEditor({ step, onChange, onDelete, onMediaUpload, index }) {
  const [open, setOpen] = useState(false)
  const mode = MODES.find(m => m.id === step.gameMode) || MODES[0]
  const imageInputRef = useRef()
  const audioInputRef = useRef()
  const videoInputRef = useRef()

  function set(key, val) { onChange({ ...step, [key]: val }) }

  // Normalise choices to string[] for easier editing
  const rawChoices = step.choices ?? []
  const choices = rawChoices.map(c => typeof c === 'string' ? c : (c.text ?? ''))

  function setChoice(i, val) {
    const next = [...choices]; next[i] = val; set('choices', next)
  }
  function addChoice() { set('choices', [...choices, '']) }
  function removeChoice(i) { set('choices', choices.filter((_, ci) => ci !== i)) }

  const hasChoices = ['classic_qcm','top_reponse','qui_se_cache','recherche_interdite','oeil_de_lynx','blind_test'].includes(step.gameMode)
  const CHOICE_COLORS = ['#ff1ee8','#39ff14','#ffe600','#7b2fff']

  return (
    <div className="rounded-2xl mb-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setOpen(o => !o)}
        style={{ background: open ? `${mode.color}10` : 'rgba(255,255,255,0.02)' }}>
        <span className="font-display text-white/30 text-xs w-6">#{index + 1}</span>
        <span className="text-base">{mode.icon}</span>
        <span className="flex-1 font-body text-white text-sm truncate">{step.question || '(question vide)'}</span>
        <span className="font-display text-xs px-2 py-0.5 rounded-full hidden sm:inline" style={{ background: `${mode.color}20`, color: mode.color }}>{mode.label}</span>
        <span className="text-white/40 text-xs ml-1">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="px-4 pb-5 pt-3 space-y-3">
          {/* Mode selector */}
          <div>
            <p className="font-body text-white/50 text-xs mb-2">Mode de jeu</p>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map(m => (
                <button key={m.id} onClick={() => set('gameMode', m.id)}
                  className="font-body text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{ background: step.gameMode === m.id ? `${m.color}30` : 'rgba(255,255,255,0.05)', color: step.gameMode === m.id ? m.color : 'rgba(255,255,255,0.45)' }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question text */}
          <Input label="Question" value={step.question} onChange={v => set('question', v)} rows={2} />

          {/* Round name */}
          <Input label="Nom du round (optionnel)" value={step.roundName} onChange={v => set('roundName', v)} placeholder="ex: Histoire, Sport…" />

          {/* Choices */}
          {hasChoices && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-body text-white/50 text-xs">Choix de réponses</p>
                <button onClick={addChoice} className="font-body text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(57,255,20,0.12)', color: '#39ff14' }}>+ Ajouter</button>
              </div>
              {choices.map((c, ci) => {
                const isCorrect = step.correctAnswer === c && c !== ''
                return (
                  <div key={ci} className="flex items-center gap-2 mb-1.5">
                    <span className="font-display text-xs w-5 text-center flex-shrink-0" style={{ color: CHOICE_COLORS[ci % 4] }}>{String.fromCharCode(65 + ci)})</span>
                    <input value={c} onChange={e => setChoice(ci, e.target.value)}
                      className="flex-1 rounded-xl px-3 py-2 font-body text-white text-sm focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', caretColor: '#39ff14' }} />
                    <button onClick={() => set('correctAnswer', c)} title="Bonne réponse"
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
                      style={{ background: isCorrect ? 'rgba(57,255,20,0.25)' : 'rgba(255,255,255,0.07)', color: isCorrect ? '#39ff14' : 'rgba(255,255,255,0.4)' }}>✓</button>
                    <button onClick={() => removeChoice(ci)}
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs"
                      style={{ background: 'rgba(255,50,50,0.12)', color: '#ff8080' }}>✕</button>
                  </div>
                )
              })}
              {step.correctAnswer && <p className="font-body text-xs mt-1" style={{ color: '#39ff14' }}>✓ Bonne réponse : <strong>{step.correctAnswer}</strong></p>}
            </div>
          )}

          {/* Correct answer for non-MCQ */}
          {!hasChoices && step.gameMode !== 'buzzer' && (
            <Input label="Bonne réponse" value={step.correctAnswer} onChange={v => set('correctAnswer', v)} />
          )}

          {/* Mode-specific fields */}
          {step.gameMode === 'info_ou_bluff' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Temps pour les bluffs (sec)" type="number" value={step.bluffTime ?? 30} onChange={v => set('bluffTime', parseInt(v))} />
              <Input label="Temps de vote (sec)" type="number" value={step.voteTime ?? 20} onChange={v => set('voteTime', parseInt(v))} />
            </div>
          )}
          {step.gameMode === 'recherche_interdite' && (
            <Input label="Préfixe de recherche Google" value={step.searchPrefix} onChange={v => set('searchPrefix', v)} placeholder="ex: Comment perdre du poids rapidement…" />
          )}

          {/* Media: audio upload for blind_test */}
          {step.gameMode === 'blind_test' && (
            <div>
              <p className="font-body text-white/50 text-xs mb-1">Fichier audio</p>
              {step.audio && <audio controls src={step.audio} className="w-full mb-2" style={{ height: 32 }} />}
              <Input label="URL audio (ou uploadez ci-dessous)" value={step.audio} onChange={v => set('audio', v)} placeholder="/uploads/audio/…" />
              {step.id && (
                <button onClick={() => audioInputRef.current?.click()} className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(155,89,182,0.2)', color: '#c39bd3' }}>
                  📁 Uploader un MP3
                </button>
              )}
              <input ref={audioInputRef} type="file" accept="audio/*,.mp3" className="hidden"
                onChange={e => onMediaUpload && onMediaUpload('audio', step.id, e.target.files[0], url => set('audio', url))} />
            </div>
          )}

          {/* Media: image for qui_se_cache */}
          {step.gameMode === 'qui_se_cache' && (
            <div>
              <p className="font-body text-white/50 text-xs mb-1">Image (célébrités mixées)</p>
              {step.image && <img src={step.image} alt="" className="rounded-xl mb-2" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'cover' }} />}
              <Input label="URL image (ou uploadez)" value={step.image} onChange={v => set('image', v)} placeholder="/uploads/images/…" />
              {step.id && (
                <button onClick={() => imageInputRef.current?.click()} className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(123,47,255,0.2)', color: '#b07fff' }}>
                  📁 Uploader une image
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => onMediaUpload && onMediaUpload('image', step.id, e.target.files[0], url => set('image', url))} />
            </div>
          )}

          {/* Media: video for oeil_de_lynx */}
          {step.gameMode === 'oeil_de_lynx' && (
            <div>
              <p className="font-body text-white/50 text-xs mb-1">Vidéo</p>
              {step.videoUrl && <video controls src={step.videoUrl} className="w-full rounded-xl mb-2" style={{ maxHeight: 140 }} />}
              <Input label="URL vidéo (ou uploadez)" value={step.videoUrl} onChange={v => set('videoUrl', v)} placeholder="/uploads/videos/…" />
              {step.id && (
                <button onClick={() => videoInputRef.current?.click()} className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>
                  📁 Uploader une vidéo
                </button>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => onMediaUpload && onMediaUpload('video', step.id, e.target.files[0], url => set('videoUrl', url))} />
            </div>
          )}

          {/* text_input accepted answers */}
          {step.gameMode === 'text_input' && (
            <Input label="Réponses acceptées (séparées par virgules)" value={(step.acceptedAnswers ?? []).join(', ')}
              onChange={v => set('acceptedAnswers', v.split(',').map(s => s.trim()).filter(Boolean))} />
          )}

          {/* Timer, Points, Speed bonus */}
          <div className="grid grid-cols-3 gap-2">
            <Input label="Timer (sec)" type="number" value={step.timer ?? 30} onChange={v => set('timer', parseInt(v))} />
            <Input label="Points" type="number" value={step.points ?? 1} onChange={v => set('points', parseInt(v))} />
            <div>
              <p className="font-body text-white/50 text-xs mb-1">Bonus vitesse</p>
              <button onClick={() => set('speedBonus', !step.speedBonus)}
                className="w-full py-2 rounded-xl font-body text-xs transition-all"
                style={{ background: step.speedBonus ? 'rgba(57,255,20,0.2)' : 'rgba(255,255,255,0.05)', color: step.speedBonus ? '#39ff14' : 'rgba(255,255,255,0.4)' }}>
                {step.speedBonus ? '✓ Oui' : 'Non'}
              </button>
            </div>
          </div>

          <Input label="Explication (affichée après la révélation)" value={step.explanation} onChange={v => set('explanation', v)} rows={2} />

          <div className="flex justify-end pt-1">
            <button onClick={onDelete} className="font-body text-xs px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,50,50,0.12)', color: '#ff8080' }}>
              Supprimer cette étape
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── VisualUploadBox ──────────────────────────────────────────────────────────
function VisualUploadBox({ label, url, onFile, accept = 'image/*' }) {
  const ref = useRef()
  return (
    <div>
      <p className="font-body text-white/50 text-xs mb-1.5">{label}</p>
      {url && (
        <img src={url} alt="" className="rounded-xl w-full mb-1.5"
          style={{ height: 64, objectFit: 'cover' }} />
      )}
      <div className="rounded-xl py-3 px-2 text-center cursor-pointer select-none transition-all"
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <p className="font-body text-white/40 text-xs">{url ? '↺ Remplacer' : '+ Uploader'}</p>
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => { onFile(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}

const QUIZ_COLOR_FIELDS = [
  { key: 'bg',            label: 'Fond principal' },
  { key: 'bgGradientFrom', label: 'Dégradé depuis' },
  { key: 'bgGradientTo',  label: 'Dégradé vers' },
  { key: 'primary',       label: 'Couleur principale' },
  { key: 'secondary',     label: 'Couleur secondaire' },
  { key: 'accent',        label: 'Accent' },
  { key: 'timerNormal',   label: 'Timer normal' },
  { key: 'timerWarning',  label: 'Timer alerte' },
  { key: 'timerUrgent',   label: 'Timer urgent' },
]

// ─── QuizAppearancePanel ──────────────────────────────────────────────────────
function QuizAppearancePanel({ quiz, onChange, onVisualUpload, onSoundUpload }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState('visuels') // 'visuels' | 'couleurs' | 'sons'
  const visual = quiz.visual || {}
  const colors = visual.colors || {}
  const sounds = visual.sounds || {}
  const soundInputRefs = useRef({})

  function setVisual(key, val) {
    onChange({ ...quiz, visual: { ...visual, [key]: val } })
  }
  function setColor(key, val) {
    onChange({ ...quiz, visual: { ...visual, colors: { ...colors, [key]: val } } })
  }

  const hasContent = visual.clientName || visual.logoUrl || visual.backgroundUrl
    || Object.values(colors).some(Boolean) || Object.values(sounds).some(Boolean)

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
      style={{ background: 'rgba(255,165,0,0.03)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
        style={{ background: open ? 'rgba(255,165,0,0.06)' : 'transparent' }}>
        <span className="text-base">🎨</span>
        <div className="flex-1">
          <p className="font-display text-white text-sm">Apparence & sons</p>
          <p className="font-body text-white/30 text-xs">
            {hasContent ? [
              visual.clientName && `Client : ${visual.clientName}`,
              visual.logoUrl && 'logo',
              visual.backgroundUrl && 'fond',
              Object.values(colors).some(Boolean) && 'couleurs',
              Object.values(sounds).some(Boolean) && 'sons',
            ].filter(Boolean).join(' · ') : 'Logos, couleurs, sons — par quiz'}
          </p>
        </div>
        <span className="text-white/30 text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div >

          {/* Sub-tabs */}
          <div className="flex" >
            {[
              { id: 'visuels', label: '🖼️ Visuels' },
              { id: 'couleurs', label: '🎨 Couleurs' },
              { id: 'sons', label: '🎵 Sons' },
            ].map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className="px-4 py-2 font-body text-xs transition-all"
                style={{
                  color: section === s.id ? '#ffa500' : 'rgba(255,255,255,0.4)',
                  borderBottom: section === s.id ? '2px solid #ffa500' : '2px solid transparent',
                  background: 'transparent' }}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="px-4 pb-5 pt-4 space-y-4">

            {/* ── VISUELS ── */}
            {section === 'visuels' && (
              <>
                <Input
                  label="Nom du client / entreprise"
                  value={visual.clientName || ''}
                  onChange={v => setVisual('clientName', v)}
                  placeholder="ex : Société XYZ"
                />
                <div className="grid grid-cols-3 gap-3">
                  <VisualUploadBox label="🎯 Logo quiz" url={visual.logoUrl} onFile={f => onVisualUpload('logo', f)} />
                  <VisualUploadBox label="🏢 Logo client" url={visual.clientLogoUrl} onFile={f => onVisualUpload('clientLogo', f)} />
                  <VisualUploadBox label="🖼️ Fond d'écran" url={visual.backgroundUrl} onFile={f => onVisualUpload('background', f)} />
                </div>
              </>
            )}

            {/* ── COULEURS ── */}
            {section === 'couleurs' && (
              <>
                <p className="font-body text-white/30 text-xs">Laissez vide pour utiliser les valeurs du thème global.</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUIZ_COLOR_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 rounded-xl p-2"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <input type="color" value={colors[key] || '#000000'}
                        onChange={e => setColor(key, e.target.value)}
                        style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-white/50 text-xs">{label}</p>
                        <p className="font-body text-white/25 text-xs truncate">{colors[key] || '—'}</p>
                      </div>
                      {colors[key] && (
                        <button onClick={() => setColor(key, '')}
                          className="text-white/25 text-xs hover:text-white/60">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── SONS ── */}
            {section === 'sons' && (
              <>
                <p className="font-body text-white/30 text-xs">Musiques jouées automatiquement pendant les différentes phases du quiz.</p>
                <div className="flex flex-col gap-2">
                  {SOUND_EVENTS.map(({ key, label, icon, loop }) => {
                    const url = sounds[key]
                    return (
                      <div key={key} className="flex items-center gap-2 rounded-lg p-2"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-white/70 text-xs">{label}</p>
                          {loop && <p className="font-body text-white/25 text-xs">boucle</p>}
                        </div>
                        {url
                          ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-body text-xs px-2 py-1 rounded"
                                style={{ background: 'rgba(57,255,20,0.1)', color: '#39ff14' }}>
                                ✓ chargé
                              </span>
                              <button onClick={() => soundInputRefs.current[key]?.click()}
                                className="font-body text-xs px-2 py-1 rounded"
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                                title="Remplacer">↺</button>
                              <button onClick={() => onSoundUpload(key, null)}
                                className="font-body text-xs px-2 py-1 rounded"
                                style={{ background: 'rgba(255,50,50,0.12)', color: '#ff8080' }}>✕</button>
                            </div>
                          )
                          : (
                            <button onClick={() => soundInputRefs.current[key]?.click()}
                              className="font-body text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.07)', color: 'white' }}>
                              📁 Ajouter
                            </button>
                          )
                        }
                        <input
                          ref={el => soundInputRefs.current[key] = el}
                          type="file" accept="audio/*" className="hidden"
                          onChange={e => { onSoundUpload(key, e.target.files[0]); e.target.value = '' }}
                        />
                      </div>
                    )
                  })}
                </div>
                <p className="font-body text-white/20 text-xs">MP3, OGG, WAV — max 20 Mo.</p>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

// ─── PDF export ───────────────────────────────────────────────────────────────
function generateQuizPDF(quiz) {
  const steps = quiz.steps ?? []
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const quizName = quiz.name || quiz.title || 'Quiz sans nom'
  const clientName = quiz.visual?.clientName || ''

  const MODE_INFO = {
    classic_qcm:         { icon: '🎯', label: 'QCM Classique',       scoring: 'Automatique',  color: '#ff1ee8', instructions: 'Lisez la question et les choix à voix haute. Les équipes sélectionnent une réponse sur leur téléphone. Les points sont attribués automatiquement à la révélation.' },
    top_reponse:         { icon: '⚡', label: 'Top Réponse',         scoring: 'Automatique',  color: '#ffe600', instructions: 'Même principe que le QCM, mais la vitesse de réponse compte double. Encouragez les équipes à répondre vite !' },
    info_ou_bluff:       { icon: '🃏', label: 'Info ou Bluff',       scoring: 'Automatique',  color: '#ff6b35', instructions: 'Phase 1 : chaque équipe invente une fausse réponse crédible (bluff). Phase 2 : toutes les réponses s\'affichent mélangées, les équipes votent pour la vraie. +2 pts si on trouve la vraie réponse, +1 pt si les autres équipes votent votre bluff.' },
    qui_se_cache:        { icon: '🎭', label: 'Qui se cache ?',      scoring: 'Manuel',       color: '#7b2fff', instructions: 'Montrez l\'image (depuis ce PDF ou votre téléphone). Les équipes doivent identifier les deux célébrités mixées. L\'animateur valide les réponses à la révélation.' },
    recherche_interdite: { icon: '🔍', label: 'Recherche Interdite', scoring: 'Automatique',  color: '#4d9fff', instructions: 'Lisez le début de la recherche Google à voix haute. Les équipes doivent deviner la fin de l\'autocomplétion sans utiliser internet. Choisissez "Fermer la question" quand tout le monde a répondu.' },
    oeil_de_lynx:        { icon: '🎬', label: 'Œil de Lynx',        scoring: 'Automatique',  color: '#00d4ff', instructions: 'Lancez la vidéo depuis votre ordinateur (fichier local dans /uploads/videos/). Stoppez-la au moment clé. Les équipes observent puis répondent en QCM.' },
    blind_test:          { icon: '🎵', label: 'Blind Test',          scoring: 'Automatique',  color: '#9b59b6', instructions: 'Jouez l\'extrait audio depuis votre ordinateur (fichier local ou Spotify/YouTube). Les équipes identifient l\'artiste et le titre. Les mots-clés indiqués ci-dessous doivent tous apparaître dans la réponse.' },
    buzzer:              { icon: '🔔', label: 'Buzzer',              scoring: 'Manuel',       color: '#ff2020', instructions: 'Lisez la question. La première équipe à lever la main (ou presser un buzzer physique) répond à voix haute. L\'animateur valide oralement et attribue le point manuellement via l\'interface.' },
    text_input:          { icon: '✏️', label: 'Texte libre',         scoring: 'Automatique',  color: '#2ecc71', instructions: 'Les équipes tapent leur réponse sur le téléphone. La réponse est comparée aux mots-clés acceptés (insensible à la casse et aux accents). En cas de doute, l\'animateur peut corriger via l\'interface.' },
    pareil_la_question:  { icon: '💬', label: 'Pareil la Question',  scoring: 'Manuel',       color: '#ff1ee8', instructions: 'Question orale — les équipes répondent à voix haute à l\'animateur. L\'animateur révèle la réponse et attribue les points manuellement.' },
  }

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
  const MCQ_MODES = ['classic_qcm', 'top_reponse', 'qui_se_cache', 'recherche_interdite', 'oeil_de_lynx', 'blind_test']

  // Unique modes used in this quiz
  const usedModes = [...new Set(steps.map(s => s.gameMode || 'classic_qcm'))]
  const totalPoints = steps.reduce((s, q) => s + (q.points ?? 1), 0)
  const totalMinutes = Math.ceil(steps.reduce((s, q) => s + (q.timer ?? 30), 0) / 60)

  // ── Helpers ──
  function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
  // Convert relative server paths to absolute URLs so they work inside a blob document
  function abs(url) {
    if (!url) return ''
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url
    return window.location.origin + (url.startsWith('/') ? url : '/' + url)
  }

  function stepHTML(step, i) {
    const mode = MODE_INFO[step.gameMode] || MODE_INFO.classic_qcm
    const choices = (step.choices ?? []).map(c => typeof c === 'string' ? c : (c.text ?? ''))
    const correctAnswer = step.correctAnswer ?? step.acceptedAnswers?.[0] ?? ''
    const isQCM = MCQ_MODES.includes(step.gameMode) && choices.length > 0

    const choicesBlock = isQCM ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0 0;">
        ${choices.map((c, ci) => {
          const ok = c === step.correctAnswer
          return `<div style="padding:11px 15px;border-radius:10px;border:${ok ? '2px solid #16a34a' : '1.5px solid #d1d5db'};background:${ok ? '#f0fdf4' : '#f9fafb'};font-size:14px;font-weight:${ok ? '700' : '400'};color:${ok ? '#14532d' : '#374151'};">
            <span style="font-weight:900;margin-right:6px;color:${ok ? '#16a34a' : '#9ca3af'};">${LETTERS[ci]})</span>${esc(c)}${ok ? ' ✅' : ''}
          </div>`
        }).join('')}
      </div>` : ''

    const imageBlock = step.image ? `
      <div style="text-align:center;margin:16px 0;">
        <img src="${esc(abs(step.image))}" style="max-height:220px;max-width:100%;border-radius:12px;border:2px solid #e5e7eb;display:inline-block;" />
        <p style="font-size:11px;color:#94a3b8;margin-top:6px;">Image — si vous n'avez pas accès au serveur, montrez une impression ou votre téléphone</p>
      </div>` : ''

    const audioBlock = step.audio ? `
      <div style="background:#fdf4ff;border:1.5px solid #e879f9;border-radius:10px;padding:10px 15px;margin:14px 0;font-size:13px;">
        <span style="color:#7e22ce;font-weight:700;">🎵 Extrait audio :</span>
        <span style="color:#4b0082;margin-left:6px;">${esc(step.audio.split('/').pop())}</span>
        <br/><span style="color:#86198f;font-size:12px;">→ Jouez ce fichier depuis votre ordinateur (dossier /uploads/audio/) ou via Spotify/YouTube</span>
      </div>` : ''

    const videoBlock = step.videoUrl ? `
      <div style="background:#eff6ff;border:1.5px solid #93c5fd;border-radius:10px;padding:10px 15px;margin:14px 0;font-size:13px;">
        <span style="color:#1d4ed8;font-weight:700;">🎬 Vidéo :</span>
        <span style="color:#1e40af;margin-left:6px;">${esc(step.videoUrl.split('/').pop())}</span>
        <br/><span style="color:#2563eb;font-size:12px;">→ Jouez ce fichier localement, stoppez-le au moment clé puis révélez les choix</span>
      </div>` : ''

    const searchBlock = step.searchPrefix ? `
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:10px 15px;margin:14px 0;font-size:13px;">
        <span style="color:#15803d;font-weight:700;">🔍 Recherche :</span>
        <span style="color:#166534;margin-left:6px;font-style:italic;">"${esc(step.searchPrefix)}"</span>
      </div>` : ''

    const bluffBlock = step.gameMode === 'info_ou_bluff' ? `
      <div style="display:flex;gap:12px;margin:14px 0;">
        <div style="flex:1;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;font-size:13px;color:#c2410c;">
          <strong>Phase bluff :</strong> ${step.bluffTime ?? 30}s
        </div>
        <div style="flex:1;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:10px 14px;font-size:13px;color:#1d4ed8;">
          <strong>Phase vote :</strong> ${step.voteTime ?? 20}s
        </div>
      </div>` : ''

    const acceptedBlock = (step.acceptedAnswers?.length > 0 && step.gameMode !== 'classic_qcm')
      ? `<p style="font-size:12px;color:#6b7280;margin-top:6px;">Autres réponses acceptées : <em>${step.acceptedAnswers.map(esc).join(' · ')}</em></p>` : ''

    const explanationBlock = step.explanation ? `
      <div style="background:#f9fafb;border-left:3px solid #d1d5db;padding:10px 14px;margin:14px 0 0;font-size:13px;color:#374151;border-radius:0 8px 8px 0;">
        <strong>💡 Explication :</strong> ${esc(step.explanation)}
      </div>` : ''

    const speedBadge = step.speedBonus !== false
      ? `<span style="background:#fefce8;color:#a16207;border-radius:8px;padding:3px 8px;font-size:10px;font-weight:600;">⚡ Bonus vitesse</span>` : ''

    return `
    <div style="break-before:page;page-break-before:always;padding:28px 36px 20px;min-height:100vh;box-sizing:border-box;position:relative;display:flex;flex-direction:column;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="background:#0f172a;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;flex-shrink:0;">${i + 1}</div>
          ${step.roundName ? `<span style="background:#fff7ed;border:1px solid #fdba74;color:#c2410c;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600;">${esc(step.roundName)}</span>` : ''}
          <span style="background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;border-radius:20px;padding:3px 11px;font-size:12px;">${mode.icon} ${mode.label}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="background:#f1f5f9;color:#64748b;border-radius:8px;padding:3px 10px;font-size:11px;">⏱ ${step.timer ?? 30}s</span>
          <span style="background:#f0fdf4;color:#16a34a;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;">+${step.points ?? 1} pt${(step.points ?? 1) > 1 ? 's' : ''}</span>
          ${speedBadge}
        </div>
      </div>

      <!-- Question -->
      <p style="font-size:24px;font-weight:800;color:#0f172a;line-height:1.35;margin-bottom:4px;">${esc(step.question) || '<em style="color:#94a3b8;">(question vide)</em>'}</p>

      ${imageBlock}
      ${audioBlock}
      ${videoBlock}
      ${searchBlock}
      ${bluffBlock}
      ${choicesBlock}

      <!-- Correct answer — always shown -->
      <div style="background:#f0fdf4;border:2.5px solid #16a34a;border-radius:12px;padding:14px 20px;margin-top:22px;">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#16a34a;font-weight:800;margin-bottom:6px;">✅ Bonne réponse — animateur uniquement</p>
        <p style="font-size:22px;font-weight:900;color:#0f172a;">${esc(correctAnswer) || '<span style="color:#94a3b8;">—</span>'}</p>
        ${acceptedBlock}
      </div>

      ${explanationBlock}

      <!-- Notes & scoring badge -->
      <div style="margin-top:auto;padding-top:18px;">
        <div style="border-top:1px dashed #e2e8f0;padding-top:12px;display:flex;align-items:flex-start;gap:20px;">
          <div style="flex:1;">
            <p style="font-size:10px;color:#94a3b8;margin-bottom:8px;">Notes animateur :</p>
            <div style="border-bottom:1px solid #f1f5f9;height:20px;margin-bottom:6px;"></div>
            <div style="border-bottom:1px solid #f1f5f9;height:20px;"></div>
          </div>
          <span style="font-size:10px;color:#94a3b8;border:1px solid #e2e8f0;border-radius:8px;padding:4px 10px;white-space:nowrap;align-self:flex-end;">Correction : ${mode.scoring}</span>
        </div>
      </div>

    </div>`
  }

  // ── Score sheet ──
  const scoreSheetHTML = `
  <div style="break-before:page;page-break-before:always;padding:36px 40px;">
    <h2 style="font-size:24px;font-weight:900;color:#0f172a;margin-bottom:4px;">📊 Feuille de score</h2>
    <p style="color:#64748b;font-size:13px;margin-bottom:6px;">${esc(quizName)} — ${date}</p>
    <p style="color:#94a3b8;font-size:12px;margin-bottom:24px;">Total : ${totalPoints} points sur ${steps.length} question${steps.length > 1 ? 's' : ''}</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px 10px;border:1.5px solid #e2e8f0;background:#f1f5f9;min-width:130px;border-radius:8px 0 0 0;">Équipe / Joueur</th>
          ${steps.map((s, i) => {
            const m = MODE_INFO[s.gameMode] || MODE_INFO.classic_qcm
            return `<th style="padding:6px 3px;border:1.5px solid #e2e8f0;background:#f1f5f9;text-align:center;min-width:36px;" title="${esc(s.question || '')}">
              <div style="font-size:9px;color:#94a3b8;">Q${i + 1}</div>
              <div style="font-size:11px;">${m.icon}</div>
              <div style="font-size:9px;color:#64748b;font-weight:700;">+${s.points ?? 1}</div>
            </th>`
          }).join('')}
          <th style="padding:10px 8px;border:1.5px solid #e2e8f0;background:#0f172a;color:white;text-align:center;min-width:55px;font-size:13px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${Array(8).fill('').map((_, ti) => `
          <tr>
            <td style="padding:16px 10px;border:1px solid #e2e8f0;border-right:1.5px solid #e2e8f0;"></td>
            ${steps.map(() => `<td style="padding:16px 3px;border:1px solid #e2e8f0;text-align:center;"></td>`).join('')}
            <td style="padding:16px 8px;border:1.5px solid #e2e8f0;background:#f8fafc;"></td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:20px;display:flex;gap:20px;flex-wrap:wrap;">
      <p style="font-size:11px;color:#94a3b8;">⚡ Bonus vitesse : +3/+2/+1 pts aux 3 premières bonnes réponses</p>
      <p style="font-size:11px;color:#94a3b8;">Modes manuels dans ce quiz : ${usedModes.filter(m => ['buzzer','pareil_la_question','qui_se_cache'].includes(m)).map(m => MODE_INFO[m]?.icon + ' ' + MODE_INFO[m]?.label).join(', ') || 'aucun'}</p>
    </div>
  </div>`

  // ── Emergency guide ──
  const guideHTML = `
  <div style="break-before:page;page-break-before:always;padding:36px 40px;">
    <h2 style="font-size:24px;font-weight:900;color:#0f172a;margin-bottom:4px;">🆘 Guide urgence — Panne d'internet</h2>
    <p style="color:#64748b;font-size:13px;margin-bottom:24px;">Comment animer "${esc(quizName)}" si la connexion WiFi est coupée</p>

    <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="font-weight:800;color:#dc2626;margin-bottom:10px;font-size:15px;">⚡ Procédure d'urgence — Étapes</p>
      <ol style="padding-left:18px;color:#374151;font-size:13px;line-height:2.2;">
        <li><strong>Réseau local intact :</strong> si seul internet est coupé (pas le WiFi local), les joueurs restent connectés. Continuez normalement.</li>
        <li><strong>WiFi complètement coupé :</strong> utilisez ce document pour animer manuellement. Distribuez les rôles : un animateur lit les questions, un autre note les scores.</li>
        <li><strong>Medias locaux :</strong> les fichiers audio et vidéo sont sur cet ordinateur dans /uploads/. Ouvrez-les directement dans VLC ou le navigateur.</li>
        <li><strong>Images "Qui se cache ?" :</strong> montrez ce PDF sur votre écran (les images sont incluses) ou imprimez les pages concernées.</li>
        <li><strong>Scores :</strong> utilisez la feuille de score en page suivante.</li>
      </ol>
    </div>

    <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;color:#1e293b;">Modes de jeu utilisés dans ce quiz</h3>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${usedModes.map(modeId => {
        const m = MODE_INFO[modeId]
        if (!m) return ''
        return `<div style="padding:14px 16px;border:1.5px solid #e2e8f0;border-radius:10px;border-left:4px solid ${m.color};">
          <p style="font-weight:800;font-size:14px;margin-bottom:5px;color:#0f172a;">${m.icon} ${m.label} <span style="font-size:11px;color:#94a3b8;font-weight:400;margin-left:8px;">Correction : ${m.scoring}</span></p>
          <p style="font-size:13px;color:#374151;line-height:1.6;">${m.instructions}</p>
        </div>`
      }).join('')}
    </div>

    <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:16px 20px;margin-top:20px;">
      <p style="font-weight:800;color:#16a34a;margin-bottom:8px;">💡 Attribution des points manuelle</p>
      <p style="font-size:13px;color:#374151;line-height:1.6;">
        Chaque question indique le nombre de points en haut à droite. Pour les modes automatiques passés en manuel, appliquez la même règle :
        bonne réponse = points de la question, bonus vitesse = +3/+2/+1 pts pour les 3 premières équipes correctes (si activé, badge ⚡ visible).
      </p>
    </div>
  </div>`

  // ── Slide function (projector view — no correct answer) ──
  const SLIDE_COLORS = ['#ff1ee8', '#39ff14', '#ffe600', '#7b2fff']

  function slideHTML(step, i) {
    const mode = MODE_INFO[step.gameMode] || MODE_INFO.classic_qcm
    const choices = (step.choices ?? []).map(c => typeof c === 'string' ? c : (c.text ?? ''))
    const isQCM = MCQ_MODES.includes(step.gameMode) && choices.length > 0
    const bgUrl = abs(quiz.visual?.backgroundUrl)
    const clientLogoUrl = abs(quiz.visual?.clientLogoUrl || quiz.visual?.logoUrl)

    // Choices grid (no correct answer highlighted)
    const choicesBlock = isQCM ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;max-width:860px;margin:0 auto;">
        ${choices.map((c, ci) => {
          const col = SLIDE_COLORS[ci % 4]
          return `<div style="background:${col}18;border:2px solid ${col}40;border-radius:16px;padding:18px 22px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:22px;font-weight:900;color:${col};flex-shrink:0;">${LETTERS[ci]})</span>
            <span style="font-size:20px;font-weight:700;color:white;line-height:1.3;">${esc(c)}</span>
          </div>`
        }).join('')}
      </div>` : ''

    // Image (qui_se_cache)
    const imageBlock = step.image ? `
      <div style="margin:20px auto;text-align:center;">
        <img src="${esc(abs(step.image))}" style="max-height:280px;max-width:680px;border-radius:20px;box-shadow:0 0 60px rgba(123,47,255,0.5);display:inline-block;" />
      </div>` : ''

    // Blind test visual
    const blindBlock = step.gameMode === 'blind_test' && !isQCM ? `
      <div style="margin:24px auto;background:rgba(155,89,182,0.15);border:2px solid rgba(155,89,182,0.4);border-radius:20px;padding:28px 40px;text-align:center;max-width:480px;">
        <p style="font-size:52px;margin-bottom:10px;">🎵</p>
        <p style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.15em;">Blind Test</p>
        <p style="font-size:14px;color:rgba(255,255,255,0.35);margin-top:8px;">Écoutez l'extrait…</p>
      </div>` : ''

    // Recherche interdite
    const searchBlock = step.searchPrefix ? `
      <div style="margin:20px auto;background:rgba(77,159,255,0.1);border:2px solid rgba(77,159,255,0.3);border-radius:16px;padding:16px 28px;max-width:700px;text-align:center;">
        <p style="font-size:13px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Complétez la recherche</p>
        <p style="font-size:22px;color:rgba(255,255,255,0.8);font-style:italic;">"${esc(step.searchPrefix)}"</p>
      </div>` : ''

    // Info ou bluff clue
    const bluffBlock = step.gameMode === 'info_ou_bluff' ? `
      <div style="margin:20px auto;background:rgba(255,107,53,0.1);border:2px solid rgba(255,107,53,0.3);border-radius:16px;padding:16px 28px;max-width:680px;text-align:center;">
        <p style="font-size:14px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Info ou Bluff ?</p>
        <p style="font-size:16px;color:rgba(255,255,255,0.6);">Écrivez votre fausse réponse crédible</p>
      </div>` : ''

    // Video / buzzer note
    const videoBlock = step.videoUrl ? `
      <div style="margin:20px auto;background:rgba(0,212,255,0.08);border:2px solid rgba(0,212,255,0.25);border-radius:16px;padding:16px 28px;max-width:680px;text-align:center;">
        <p style="font-size:40px;margin-bottom:6px;">🎬</p>
        <p style="font-size:16px;color:rgba(255,255,255,0.5);">Regardez attentivement…</p>
      </div>` : ''

    const buzzerBlock = step.gameMode === 'buzzer' ? `
      <div style="margin:20px auto;background:rgba(255,32,32,0.1);border:2px solid rgba(255,32,32,0.3);border-radius:16px;padding:20px 40px;max-width:480px;text-align:center;">
        <p style="font-size:52px;">🔔</p>
        <p style="font-size:18px;color:rgba(255,255,255,0.6);margin-top:8px;">Premier qui buzze répond !</p>
      </div>` : ''

    const questionFontSize = (step.question?.length ?? 0) > 120 ? '24px' : (step.question?.length ?? 0) > 60 ? '30px' : '36px'

    const bgStyle = bgUrl
      ? `background:#0f172a url('${bgUrl}') center/cover no-repeat`
      : 'background:#0f172a'
    // dark overlay so content stays readable over any background image
    const overlayStyle = bgUrl
      ? 'position:absolute;inset:0;background:rgba(10,12,26,0.72);pointer-events:none;'
      : ''

    return `
    <div style="break-before:page;page-break-before:always;${bgStyle};min-height:100vh;display:flex;flex-direction:column;padding:0;box-sizing:border-box;position:relative;">

      ${overlayStyle ? `<div style="${overlayStyle}"></div>` : ''}

      <!-- Top bar -->
      <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(4px);background:rgba(0,0,0,0.25);">
        <div style="display:flex;align-items:center;gap:14px;">
          ${clientLogoUrl ? `<img src="${esc(clientLogoUrl)}" style="height:36px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(0,0,0,0.6));" onerror="this.style.display='none'" />` : ''}
          ${step.roundName ? `<span style="background:rgba(255,107,53,0.25);border:1px solid rgba(255,107,53,0.5);color:#ff8c50;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;">${esc(step.roundName)}</span>` : ''}
          <span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.6);border-radius:20px;padding:3px 12px;font-size:12px;">${mode.icon} ${mode.label}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);border-radius:8px;padding:4px 12px;font-size:12px;">⏱ ${step.timer ?? 30}s</span>
          <span style="background:rgba(57,255,20,0.15);color:#39ff14;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700;">+${step.points ?? 1} pt${(step.points ?? 1) > 1 ? 's' : ''}</span>
          <span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.35);border-radius:8px;padding:4px 12px;font-size:12px;">${i + 1} / ${steps.length}</span>
        </div>
      </div>

      <!-- Main content -->
      <div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 48px;gap:24px;text-align:center;">

        <!-- Question -->
        ${step.question ? `
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:30px 44px;max-width:900px;width:100%;backdrop-filter:blur(8px);">
          <p style="font-size:${questionFontSize};font-weight:800;color:white;line-height:1.35;text-shadow:0 2px 12px rgba(0,0,0,0.5);">${esc(step.question)}</p>
        </div>` : ''}

        ${imageBlock}
        ${blindBlock}
        ${videoBlock}
        ${buzzerBlock}
        ${searchBlock}
        ${bluffBlock}
        ${choicesBlock}
      </div>

      <!-- Bottom accent bar -->
      <div style="position:relative;z-index:1;height:4px;background:linear-gradient(90deg,#ff1ee8,#7b2fff,#39ff14);"></div>
    </div>`
  }

  // ── Cover page ──
  const coverHTML = `
  <div style="padding:60px 52px;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;background:#0f172a;color:white;box-sizing:border-box;">
    <div>
      ${quiz.visual?.logoUrl
        ? `<img src="${esc(abs(quiz.visual.logoUrl))}" style="height:56px;object-fit:contain;margin-bottom:44px;filter:brightness(0) invert(1);" onerror="this.style.display='none'" />`
        : '<div style="height:36px;margin-bottom:44px;"></div>'}
      <p style="font-size:12px;letter-spacing:0.18em;color:#475569;text-transform:uppercase;margin-bottom:14px;">Document Animateur — Confidentiel</p>
      <h1 style="font-size:46px;font-weight:900;line-height:1.12;margin-bottom:18px;color:white;">${esc(quizName)}</h1>
      ${quiz.description ? `<p style="font-size:16px;color:#94a3b8;margin-bottom:10px;">${esc(quiz.description)}</p>` : ''}
      ${clientName ? `<p style="font-size:14px;color:#64748b;">Client : ${esc(clientName)}</p>` : ''}
    </div>
    <div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;">
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;">
          <p style="font-size:36px;font-weight:900;color:#39ff14;margin-bottom:4px;">${steps.length}</p>
          <p style="font-size:12px;color:#64748b;">Question${steps.length > 1 ? 's' : ''}</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;">
          <p style="font-size:36px;font-weight:900;color:#ff1ee8;margin-bottom:4px;">${totalPoints}</p>
          <p style="font-size:12px;color:#64748b;">Points au total</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:18px;">
          <p style="font-size:36px;font-weight:900;color:#ffe600;margin-bottom:4px;">~${totalMinutes}</p>
          <p style="font-size:12px;color:#64748b;">Min. estimées</p>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">
        ${usedModes.map(m => {
          const info = MODE_INFO[m]
          return info ? `<span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 12px;font-size:12px;">${info.icon} ${info.label}</span>` : ''
        }).join('')}
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
        <p style="font-size:13px;color:#475569;">Généré le ${date}</p>
        <p style="font-size:13px;color:#475569;">Culture Mashup Quiz</p>
      </div>
    </div>
  </div>`

  const fullHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Export Animateur — ${esc(quizName)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 0; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>

  <!-- Floating print button -->
  <div class="no-print" style="position:fixed;top:16px;right:16px;z-index:9999;display:flex;gap:8px;">
    <button onclick="window.print()" style="background:#16a34a;color:white;border:none;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.4);">
      🖨️ Imprimer / Enregistrer PDF
    </button>
    <button onclick="window.close()" style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:10px;padding:12px 20px;font-size:14px;cursor:pointer;">
      ✕
    </button>
  </div>

  ${coverHTML}
  ${guideHTML}
  ${scoreSheetHTML}
  ${steps.map((step, i) => stepHTML(step, i)).join('')}

  <!-- ══ SLIDES SEPARATOR ══ -->
  <div style="break-before:page;page-break-before:always;${abs(quiz.visual?.backgroundUrl) ? `background:#0f172a url('${abs(quiz.visual.backgroundUrl)}') center/cover no-repeat` : 'background:#0f172a'};min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px;box-sizing:border-box;position:relative;">
    ${abs(quiz.visual?.backgroundUrl) ? `<div style="position:absolute;inset:0;background:rgba(10,12,26,0.78);"></div>` : ''}
    <div style="position:relative;z-index:1;">
      ${abs(quiz.visual?.clientLogoUrl || quiz.visual?.logoUrl) ? `<img src="${esc(abs(quiz.visual.clientLogoUrl || quiz.visual.logoUrl))}" style="height:64px;object-fit:contain;margin-bottom:32px;filter:drop-shadow(0 0 16px rgba(0,0,0,0.8));" onerror="this.style.display='none'" />` : ''}
      <p style="font-size:60px;margin-bottom:24px;">🎞️</p>
      <h2 style="font-size:40px;font-weight:900;color:white;margin-bottom:12px;">Diaporama</h2>
      <p style="font-size:18px;color:rgba(255,255,255,0.4);">Slides à projeter — sans les réponses</p>
      <p style="margin-top:40px;font-size:14px;color:rgba(255,255,255,0.2);">${steps.length} slide${steps.length > 1 ? 's' : ''} · ${esc(quizName)}</p>
    </div>
  </div>

  ${steps.map((step, i) => slideHTML(step, i)).join('')}

</body>
</html>`

  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// ─── QuizList tab ─────────────────────────────────────────────────────────────
function QuizListTab({ quizzes, activeQuizId, loading, onActivate, onEdit, onDuplicate, onDelete, onCreate, onExportPDF }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-white">Mes Quiz</h2>
        <button onClick={onCreate} className="font-body text-sm px-4 py-2 rounded-xl"
          style={{ background: 'rgba(57,255,20,0.15)', color: '#39ff14' }}>
          + Nouveau quiz
        </button>
      </div>
      {quizzes.length === 0 && (
        <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-4xl mb-3">🎮</p>
          <p className="font-display text-white/50 text-lg">Aucun quiz</p>
          <p className="font-body text-white/30 text-sm mt-1">Cliquez sur "+ Nouveau quiz" pour commencer</p>
        </div>
      )}
      <div className="space-y-3">
        {quizzes.map(q => {
          const isActive = q.id === activeQuizId
          const name = q.name || q.title || q.id
          const stepCount = q.stepCount ?? (q.steps?.length ?? 0)
          return (
            <div key={q.id} className="rounded-2xl p-4 flex items-center gap-4"
              style={{ background: isActive ? 'rgba(57,255,20,0.06)' : 'rgba(255,255,255,0.03)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-display text-white text-base truncate">{name}</p>
                  {isActive && <span className="font-body text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(57,255,20,0.2)', color: '#39ff14' }}>Actif</span>}
                </div>
                <p className="font-body text-white/40 text-xs">{stepCount} étape{stepCount !== 1 ? 's' : ''} · {(q.gameModes ?? []).join(', ') || '—'}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isActive && (
                  <button onClick={() => onActivate(q.id)} disabled={loading} className="font-body text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(57,255,20,0.1)', color: '#39ff14' }}>
                    Activer
                  </button>
                )}
                <button onClick={() => onEdit(q.id)} className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)' }}>
                  Modifier
                </button>
                <button onClick={() => onExportPDF(q.id)} title="Exporter PDF animateur" className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(0,180,255,0.1)', color: '#38bdf8' }}>
                  📄 PDF
                </button>
                <button onClick={() => onDuplicate(q.id)} className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,230,0,0.08)', color: '#ffe600' }}>
                  Copier
                </button>
                <button onClick={() => onDelete(q.id)} disabled={loading} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                  style={{ background: 'rgba(255,50,50,0.1)', color: '#ff8080' }}>
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── QuizBuilder tab ──────────────────────────────────────────────────────────
function QuizBuilderTab({ quiz, onChange, onSave, onMediaUpload, loading, onVisualUpload, onSoundUpload, onExportPDF }) {
  if (!quiz) {
    return (
      <div className="text-center py-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-4xl mb-3">✏️</p>
        <p className="font-body text-white/40">Sélectionnez un quiz dans "Mes Quiz" pour le modifier</p>
      </div>
    )
  }

  function setField(key, val) { onChange({ ...quiz, [key]: val }) }

  function updateStep(i, s) {
    const steps = [...(quiz.steps ?? [])]; steps[i] = s; setField('steps', steps)
  }
  function deleteStep(i) { setField('steps', (quiz.steps ?? []).filter((_, idx) => idx !== i)) }
  function moveStep(i, dir) {
    const steps = [...(quiz.steps ?? [])]; const j = i + dir
    if (j < 0 || j >= steps.length) return
    ;[steps[i], steps[j]] = [steps[j], steps[i]]; setField('steps', steps)
  }
  function addStep() {
    setField('steps', [...(quiz.steps ?? []), {
      id: `step_${Date.now()}`, gameMode: 'classic_qcm', question: '', choices: ['', '', '', ''],
      correctAnswer: '', timer: 30, points: 1, speedBonus: true, explanation: '' }])
  }

  const steps = quiz.steps ?? []
  const name = quiz.name || quiz.title || ''

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl text-white">{name || 'Quiz sans nom'}</h2>
          <p className="font-body text-white/40 text-xs">{steps.length} étape{steps.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExportPDF} title="Générer le diaporama PDF pour animer sans internet"
            className="font-body text-sm px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(0,180,255,0.12)', color: '#38bdf8', border: '1px solid rgba(0,180,255,0.2)' }}>
            📄 Exporter PDF
          </button>
          <button onClick={onSave} disabled={loading}
            className="font-body text-sm px-5 py-2.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#ff1ee8,#a005d0)', color: 'white', opacity: loading ? 0.6 : 1, boxShadow: '0 3px 12px rgba(255,30,232,0.4)' }}>
            {loading ? 'Sauvegarde…' : '💾 Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Quiz meta */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nom du quiz" value={name} onChange={v => { onChange({ ...quiz, name: v, title: v }) }} placeholder="Mon super quiz" />
          <Input label="Description (optionnel)" value={quiz.description ?? ''} onChange={v => setField('description', v)} />
        </div>
        <Input label="Code de session (optionnel)" value={quiz.sessionCode ?? ''} onChange={v => setField('sessionCode', v)} placeholder="ex : FOOT01 — affiché dans l'URL projecteur" />
      </div>

      {/* Appearance per quiz */}
      <QuizAppearancePanel
        quiz={quiz}
        onChange={onChange}
        onVisualUpload={onVisualUpload}
        onSoundUpload={onSoundUpload}
      />

      {/* Steps */}
      {steps.map((step, i) => (
        <div key={step.id ?? i} className="flex gap-2 mb-1">
          <div className="flex flex-col gap-1 pt-3 flex-shrink-0">
            <button onClick={() => moveStep(i, -1)} disabled={i === 0}
              className="w-6 h-6 rounded flex items-center justify-center text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', color: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }}>▲</button>
            <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
              className="w-6 h-6 rounded flex items-center justify-center text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', color: i === steps.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }}>▼</button>
          </div>
          <div className="flex-1 min-w-0">
            <StepEditor step={step} index={i}
              onChange={s => updateStep(i, s)}
              onDelete={() => deleteStep(i)}
              onMediaUpload={onMediaUpload}
            />
          </div>
        </div>
      ))}

      <button onClick={addStep}
        className="w-full mt-3 py-4 rounded-2xl font-display text-base transition-all"
        style={{ background: 'rgba(57,255,20,0.05)', color: '#39ff14' }}>
        + Ajouter une étape
      </button>

      <button onClick={onSave} disabled={loading}
        className="w-full mt-4 py-4 rounded-xl font-display text-lg text-white"
        style={{ background: 'linear-gradient(135deg,#ff1ee8,#a005d0)', boxShadow: '0 4px 20px rgba(255,30,232,0.4)', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Sauvegarde…' : '💾 Sauvegarder le quiz'}
      </button>
    </div>
  )
}

// ─── Full Theme Editor ────────────────────────────────────────────────────────
const COLOR_FIELDS = [
  { key: 'bg',            label: 'Fond principal' },
  { key: 'bgGradientFrom', label: 'Dégradé depuis' },
  { key: 'bgGradientTo',  label: 'Dégradé vers' },
  { key: 'primary',       label: 'Couleur principale' },
  { key: 'secondary',     label: 'Couleur secondaire' },
  { key: 'accent',        label: 'Couleur accent' },
  { key: 'text',          label: 'Texte principal' },
  { key: 'timerNormal',   label: 'Timer normal' },
  { key: 'timerWarning',  label: 'Timer alerte' },
  { key: 'timerUrgent',   label: 'Timer urgent' },
]

const SOUND_EVENTS = [
  { key: 'lobby',         label: 'Lobby / Attente',        icon: '🎵', loop: true },
  { key: 'questionStart', label: 'Lancement question',     icon: '🎯', loop: false },
  { key: 'countdown',     label: 'Décompte / Timer',       icon: '⏱️', loop: true },
  { key: 'reveal',        label: 'Révélation réponse',     icon: '🎉', loop: false },
  { key: 'scoreboard',    label: 'Classement inter',       icon: '📊', loop: false },
  { key: 'victory',       label: 'Fin de quiz / Victoire', icon: '🏆', loop: true },
]

function ThemeEditor({ theme, onSave, onActivate, onDelete, isActive, loading, showToast }) {
  const [t, setT] = useState(theme)
  const bgInputRef = useRef()
  const soundInputRefs = useRef({})

  useEffect(() => { setT(theme) }, [theme.id])

  function setColor(key, val) { setT(prev => ({ ...prev, colors: { ...prev.colors, [key]: val } })) }
  function setField(key, val) { setT(prev => ({ ...prev, [key]: val })) }

  async function uploadSound(event, file) {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch(`/api/backoffice/themes/${t.id}/sounds/${event}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setT(prev => ({ ...prev, sounds: { ...prev.sounds, [event]: data.url } }))
        showToast(`Son « ${event} » uploadé ✓`)
      }
    } catch { showToast('Erreur upload son', 'error') }
  }

  async function deleteSound(event) {
    try {
      await fetch(`/api/backoffice/themes/${t.id}/sounds/${event}`, { method: 'DELETE' })
      setT(prev => ({ ...prev, sounds: { ...prev.sounds, [event]: null } }))
      showToast('Son supprimé')
    } catch { showToast('Erreur suppression son', 'error') }
  }

  async function uploadBackground(file) {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch(`/api/backoffice/themes/${t.id}/background`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.backgroundImage) {
        setT(prev => ({ ...prev, backgroundImage: data.backgroundImage }))
        showToast('Image de fond uploadée ✓')
      }
    } catch { showToast('Erreur upload', 'error') }
  }

  const colors = t.colors || {}

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
      {/* Theme header */}
      <div className="flex items-center gap-3 mb-4">
        {/* Mini preview */}
        <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 56, height: 56, background: colors.bgGradientFrom || colors.bg || '#1a0bdb' }}>
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.primary || '#ff1ee8'}40, ${colors.secondary || '#39ff14'}20)` }}>
            <div className="w-4 h-4 rounded-full" style={{ background: colors.primary || '#ff1ee8' }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Input value={t.name ?? ''} onChange={v => setField('name', v)} placeholder="Nom du thème" />
          <Input value={t.description ?? ''} onChange={v => setField('description', v)} placeholder="Description…" />
        </div>
        {isActive && <span className="font-body text-xs px-2 py-1 rounded-full flex-shrink-0" style={{ background: 'rgba(57,255,20,0.2)', color: '#39ff14' }}>Actif</span>}
      </div>

      {/* Colors grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <input type="color" value={colors[key] || '#000000'}
              onChange={e => setColor(key, e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', padding: 2, background: 'transparent' }} />
            <div className="flex-1 min-w-0">
              <p className="font-body text-white/50 text-xs">{label}</p>
              <p className="font-body text-white/30 text-xs truncate">{colors[key] || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Background image */}
      <div className="mb-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <p className="font-body text-white/50 text-xs mb-2">🖼️ Image de fond (appliquée sur tous les écrans)</p>
        {t.backgroundImage
          ? (
            <div className="flex items-center gap-3 mb-2">
              <img src={t.backgroundImage} alt="" className="rounded-lg" style={{ height: 60, width: 80, objectFit: 'cover' }} />
              <div>
                <p className="font-body text-white/60 text-xs truncate max-w-[200px]">{t.backgroundImage}</p>
                <button onClick={() => setField('backgroundImage', null)} className="font-body text-xs mt-1" style={{ color: '#ff8080' }}>Supprimer</button>
              </div>
            </div>
          )
          : <p className="font-body text-white/30 text-xs mb-2">Aucune image de fond</p>
        }
        <div className="flex gap-2">
          <button onClick={() => bgInputRef.current?.click()}
            className="font-body text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
            📁 Uploader une image
          </button>
          <input ref={bgInputRef} type="file" accept="image/*,video/mp4" className="hidden"
            onChange={e => uploadBackground(e.target.files[0])} />
        </div>
        <p className="font-body text-white/20 text-xs mt-1">PNG, JPG, WEBP — max 20 Mo. S'applique sur le fond de tous les écrans.</p>
      </div>

      {/* Sounds */}
      <div className="mb-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <p className="font-body text-white/50 text-xs mb-3">🎵 Sons & Musiques</p>
        <div className="flex flex-col gap-2">
          {SOUND_EVENTS.map(({ key, label, icon, loop }) => {
            const url = t.sounds?.[key]
            return (
              <div key={key} className="flex items-center gap-2 rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-white/70 text-xs">{label}</p>
                  {loop && <p className="font-body text-white/25 text-xs">lecture en boucle</p>}
                </div>
                {url
                  ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-body text-white/50 text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(57,255,20,0.1)', color: '#39ff14' }}>
                        ✓ chargé
                      </span>
                      <button onClick={() => soundInputRefs.current[key]?.click()}
                        className="font-body text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                        title="Remplacer">
                        ↺
                      </button>
                      <button onClick={() => deleteSound(key)}
                        className="font-body text-xs px-2 py-1 rounded"
                        style={{ background: 'rgba(255,50,50,0.12)', color: '#ff8080' }}>
                        ✕
                      </button>
                    </div>
                  )
                  : (
                    <button onClick={() => soundInputRefs.current[key]?.click()}
                      className="font-body text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'white' }}>
                      📁 Ajouter
                    </button>
                  )
                }
                <input
                  ref={el => soundInputRefs.current[key] = el}
                  type="file" accept="audio/*" className="hidden"
                  onChange={e => uploadSound(key, e.target.files[0])}
                />
              </div>
            )
          })}
        </div>
        <p className="font-body text-white/20 text-xs mt-2">MP3, OGG, WAV — max 20 Mo par fichier.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onSave(t)} disabled={loading}
          className="flex-1 font-body text-sm py-2.5 rounded-xl"
          style={{ background: 'linear-gradient(135deg,#ff1ee8,#a005d0)', color: 'white', opacity: loading ? 0.6 : 1 }}>
          💾 Sauvegarder
        </button>
        {!isActive && (
          <button onClick={() => onActivate(t.id)} disabled={loading}
            className="flex-1 font-body text-sm py-2.5 rounded-xl"
            style={{ background: 'rgba(57,255,20,0.15)', color: '#39ff14' }}>
            ✓ Activer
          </button>
        )}
        {!isActive && (
          <button onClick={() => onDelete(t.id)}
            className="w-10 rounded-xl text-sm flex items-center justify-center"
            style={{ background: 'rgba(255,50,50,0.12)', color: '#ff8080' }}>
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

function ThemesTab({ showToast }) {
  const [themes, setThemes] = useState([])
  const [activeThemeId, setActiveThemeId] = useState(null)
  const [loading, setLoading] = useState(false)
  const { refreshTheme } = useTheme()

  useEffect(() => { loadThemes() }, [])

  async function loadThemes() {
    try {
      const res = await fetch('/api/backoffice/themes')
      const data = await res.json()
      setThemes(data.themes ?? data ?? [])
      setActiveThemeId(data.activeThemeId ?? null)
    } catch { showToast('Erreur chargement thèmes', 'error') }
  }

  async function saveTheme(theme) {
    setLoading(true)
    try {
      await fetch(`/api/backoffice/themes/${theme.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(theme) })
      setThemes(prev => prev.map(t => t.id === theme.id ? theme : t))
      showToast('Thème sauvegardé ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function activateTheme(id) {
    setLoading(true)
    try {
      await fetch('/api/backoffice/themes/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      setActiveThemeId(id)
      refreshTheme()
      showToast('Thème activé ✓ — visible sur tous les écrans')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function deleteTheme(id) {
    if (!confirm('Supprimer ce thème ?')) return
    try {
      await fetch(`/api/backoffice/themes/${id}`, { method: 'DELETE' })
      setThemes(prev => prev.filter(t => t.id !== id))
      showToast('Thème supprimé ✓')
    } catch { showToast('Erreur', 'error') }
  }

  async function createTheme() {
    const name = prompt('Nom du nouveau thème :')
    if (!name) return
    const newTheme = {
      id: `theme_${Date.now()}`,
      name,
      description: '',
      colors: {
        bg: '#0d0221', bgGradientFrom: '#1a0bdb', bgGradientTo: '#0d0221',
        primary: '#ff1ee8', secondary: '#39ff14', accent: '#ffe600',
        text: '#ffffff', textMuted: 'rgba(255,255,255,0.5)',
        cardBg: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.12)',
        timerNormal: '#39ff14', timerWarning: '#ffe600', timerUrgent: '#ff2020' },
      backgroundImage: null }
    try {
      await fetch('/api/backoffice/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTheme) })
      setThemes(prev => [...prev, newTheme])
      showToast('Thème créé ✓')
    } catch { showToast('Erreur', 'error') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-white">Thèmes visuels</h2>
          <p className="font-body text-white/40 text-sm mt-0.5">Couleurs, fonds et identité visuelle de tous les écrans</p>
        </div>
        <button onClick={createTheme} className="font-body text-sm px-4 py-2 rounded-xl"
          style={{ background: 'rgba(255,30,232,0.15)', color: '#ff6ef7' }}>
          + Nouveau thème
        </button>
      </div>

      <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(57,255,20,0.06)' }}>
        <p className="font-body text-white/60 text-sm">
          💡 Le thème actif s'applique instantanément sur <strong className="text-white">tous les écrans</strong> : projecteur, joueurs, animateur.
          Uploadez une image de fond pour habiller complètement vos soirées à thème.
        </p>
      </div>

      <div className="space-y-4">
        {themes.map(theme => (
          <ThemeEditor
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            loading={loading}
            onSave={saveTheme}
            onActivate={activateTheme}
            onDelete={deleteTheme}
            showToast={showToast}
          />
        ))}
        {themes.length === 0 && <p className="text-center font-body text-white/30 py-8">Aucun thème disponible</p>}
      </div>
    </div>
  )
}

// ─── Main Backoffice ──────────────────────────────────────────────────────────
export default function Backoffice() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('bo_auth') === '1')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState(null)

  const [activeTab, setActiveTab] = useState('quizzes')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Config
  const [hostPassword, setHostPassword] = useState('')
  const [backofficePassword, setBackofficePassword] = useState('')
  const [gameCode, setGameCode] = useState('')
  const [defaultDuration, setDefaultDuration] = useState(40)
  const [randomizeQuestions, setRandomizeQuestions] = useState(false)
  const [customJoinUrl, setCustomJoinUrl] = useState('')
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(null)
  const qrCodeInputRef = useRef(null)

  // Quizzes
  const [quizzes, setQuizzes] = useState([])
  const [activeQuizId, setActiveQuizId] = useState(null)
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [themes, setThemes] = useState([])

  // Logo global (fallback si le quiz n'a pas son propre logo)
  const [logo, setLogo] = useState(null)

  // Media
  const [media, setMedia] = useState(null)
  const audioInputRefs = useRef({})
  const celebInputRefs = useRef({})

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function login(e) {
    e.preventDefault()
    try {
      const res = await fetch('/api/backoffice/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: authPassword }) })
      if (!res.ok) { setAuthError('Mot de passe incorrect'); return }
      sessionStorage.setItem('bo_auth', '1')
      setAuthenticated(true)
      loadData()
    } catch { setAuthError("Impossible de contacter le serveur") }
  }

  // ── Load data ──────────────────────────────────────────────────────────────
  async function loadData() {
    try {
      const [configRes, quizzesRes] = await Promise.all([
        fetch('/api/backoffice/data'),
        fetch('/api/backoffice/quizzes'),
      ])
      const configData = await configRes.json()
      const { config } = configData
      setHostPassword(config.hostPassword ?? '')
      setBackofficePassword(config.backofficePassword ?? '')
      setGameCode(config.gameCode ?? '')
      setDefaultDuration(config.defaultDuration ?? 40)
      setRandomizeQuestions(config.randomizeQuestions ?? false)
      setCustomJoinUrl(config.customJoinUrl ?? '')
      setQrCodeImageUrl(config.qrCodeImageUrl ?? null)
      setLogo(config.logo ?? null)
      setThemes(configData.themes ?? [])

      const qData = await quizzesRes.json()
      // Server returns { quizzes: [...], activeQuizId: '...' }
      const list = Array.isArray(qData) ? qData : (qData.quizzes ?? [])
      setQuizzes(list)
      setActiveQuizId(qData.activeQuizId ?? config.activeQuizId ?? null)
    } catch { showToast('Erreur lors du chargement', 'error') }
  }

  useEffect(() => { if (authenticated) loadData() }, [authenticated])

  // ── Quiz CRUD ──────────────────────────────────────────────────────────────
  async function createQuiz() {
    const name = prompt('Nom du quiz :')
    if (!name?.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/backoffice/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, title: name, steps: [] }) })
      const data = await res.json()
      const newQuiz = data.quiz || { id: data.id, name, title: name, steps: [] }
      setQuizzes(prev => [...prev, newQuiz])
      // Open in builder with full quiz object
      openBuilder(newQuiz)
      showToast('Quiz créé ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function openBuilder(quizOrId) {
    const id = typeof quizOrId === 'string' ? quizOrId : quizOrId?.id
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/backoffice/quizzes/${id}`)
      const full = await res.json()
      setEditingQuiz(full)
      setActiveTab('builder')
    } catch { showToast('Impossible de charger le quiz', 'error') }
    finally { setLoading(false) }
  }

  async function saveEditingQuiz() {
    if (!editingQuiz) return
    setLoading(true)
    try {
      const res = await fetch(`/api/backoffice/quizzes/${editingQuiz.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingQuiz) })
      const data = await res.json()
      setQuizzes(prev => prev.map(q => q.id === editingQuiz.id ? { ...q, name: editingQuiz.name || editingQuiz.title, title: editingQuiz.name || editingQuiz.title, stepCount: (editingQuiz.steps || []).length } : q))
      showToast('Quiz sauvegardé ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function activateQuiz(id) {
    setLoading(true)
    try {
      await fetch(`/api/backoffice/quizzes/${id}/activate`, { method: 'POST' })
      setActiveQuizId(id)
      showToast('Quiz activé ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function duplicateQuiz(id) {
    setLoading(true)
    try {
      const res = await fetch(`/api/backoffice/quizzes/${id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (data.quiz) setQuizzes(prev => [...prev, data.quiz])
      else { await loadData() }
      showToast('Quiz dupliqué ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function deleteQuiz(id) {
    if (!confirm('Supprimer ce quiz définitivement ?')) return
    setLoading(true)
    try {
      await fetch(`/api/backoffice/quizzes/${id}`, { method: 'DELETE' })
      setQuizzes(prev => prev.filter(q => q.id !== id))
      if (editingQuiz?.id === id) setEditingQuiz(null)
      showToast('Quiz supprimé ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  // ── Media upload from builder ──────────────────────────────────────────────
  async function handleMediaUpload(type, stepId, file, onSuccess) {
    if (!file || !stepId) return
    const fd = new FormData(); fd.append('file', file)
    const endpoint = type === 'audio' ? `/api/backoffice/media/audio/${stepId}`
      : type === 'image' ? `/api/backoffice/media/image/${stepId}`
      : `/api/backoffice/media/video/${stepId}`
    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const url = data.audio || data.image || data.videoUrl
      onSuccess(url)
      showToast('Fichier uploadé ✓')
    } catch (e) { showToast(e.message || 'Erreur upload', 'error') }
  }

  // ── Quiz sound upload ──────────────────────────────────────────────────────
  async function uploadQuizSound(event, file) {
    if (!editingQuiz?.id) return
    // null means delete
    if (!file) {
      try {
        await fetch(`/api/backoffice/quizzes/${editingQuiz.id}/visual/sounds/${event}`, { method: 'DELETE' })
        setEditingQuiz(prev => ({
          ...prev,
          visual: { ...(prev.visual || {}), sounds: { ...(prev.visual?.sounds || {}), [event]: null } } }))
        showToast('Son supprimé')
      } catch { showToast('Erreur suppression', 'error') }
      return
    }
    const fd = new FormData(); fd.append('file', file)
    setLoading(true)
    try {
      const res = await fetch(`/api/backoffice/quizzes/${editingQuiz.id}/visual/sounds/${event}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEditingQuiz(prev => ({
        ...prev,
        visual: { ...(prev.visual || {}), sounds: { ...(prev.visual?.sounds || {}), [event]: data.url } } }))
      showToast('Son uploadé ✓')
    } catch (e) { showToast(e.message || 'Erreur upload', 'error') }
    finally { setLoading(false) }
  }

  // ── Quiz visual uploads (logo, client-logo, background per quiz) ──────────
  async function uploadQuizVisual(type, file) {
    if (!file || !editingQuiz?.id) return
    const fd = new FormData(); fd.append('file', file)
    const slug = type === 'clientLogo' ? 'client-logo' : type
    const endpoint = `/api/backoffice/quizzes/${editingQuiz.id}/visual/${slug}`
    setLoading(true)
    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const fieldMap = { logo: 'logoUrl', clientLogo: 'clientLogoUrl', background: 'backgroundUrl' }
      setEditingQuiz(prev => ({
        ...prev,
        visual: { ...(prev.visual || {}), [fieldMap[type]]: data.url } }))
      showToast('Image uploadée ✓')
    } catch (e) { showToast(e.message || 'Erreur upload', 'error') }
    finally { setLoading(false) }
  }

  // ── Media ──────────────────────────────────────────────────────────────────
  async function loadMedia() {
    try { const res = await fetch('/api/backoffice/media'); setMedia(await res.json()) }
    catch { showToast('Erreur chargement médias', 'error') }
  }

  async function uploadAudio(questionId, file) {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    setLoading(true)
    try {
      const res = await fetch(`/api/backoffice/media/audio/${questionId}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMedia(prev => ({ ...prev, blindTests: prev.blindTests.map(q => q.id === questionId ? { ...q, audio: data.audio } : q) }))
      showToast('Audio mis à jour ✓')
    } catch (e) { showToast(e.message || 'Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function uploadCelebrite(questionId, file) {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    setLoading(true)
    try {
      const res = await fetch(`/api/backoffice/media/celebrite/${questionId}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMedia(prev => ({ ...prev, celebrites: prev.celebrites.map(q => q.id === questionId ? { ...q, image: data.image } : q) }))
      showToast('Image mise à jour ✓')
    } catch (e) { showToast(e.message || 'Erreur', 'error') }
    finally { setLoading(false) }
  }

  // ── Config save ──────────────────────────────────────────────────────────
  async function saveConfig(e) {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/backoffice/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hostPassword, backofficePassword, gameCode, defaultDuration, randomizeQuestions, customJoinUrl }) })
      if (!res.ok) throw new Error()
      showToast('Configuration sauvegardée ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  async function uploadQrCode(file) {
    if (!file) return
    const fd = new FormData(); fd.append('qrcode', file)
    setLoading(true)
    try {
      const res = await fetch('/api/backoffice/qrcode', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQrCodeImageUrl(data.qrCodeImageUrl)
      showToast('QR Code importé ✓')
    } catch (e) { showToast(e.message || 'Erreur upload', 'error') }
    finally { setLoading(false) }
  }

  async function deleteQrCode() {
    setLoading(true)
    try {
      await fetch('/api/backoffice/qrcode', { method: 'DELETE' })
      setQrCodeImageUrl(null)
      showToast('QR Code supprimé ✓')
    } catch { showToast('Erreur', 'error') }
    finally { setLoading(false) }
  }

  // ─── Login screen ──────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#0d0a2a' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Culture Mashup Quiz" className="h-20 mx-auto mb-4 object-contain" />
            <h1 className="font-display text-3xl text-white">Backoffice</h1>
            <p className="text-white/40 font-body text-sm mt-1">Administration du quiz</p>
          </div>
          {authError && (
            <div className="mb-4 p-4 rounded-xl text-center text-sm font-body" style={{ background: 'rgba(255,50,50,0.15)', color: '#ff8080' }}>
              {authError}
            </div>
          )}
          <form onSubmit={login} className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <label className="font-body text-white/70 text-sm">Mot de passe backoffice</label>
            <input type="password" value={authPassword} onChange={e => { setAuthPassword(e.target.value); setAuthError(null) }}
              placeholder="••••••••" className="w-full rounded-xl px-4 py-3 font-body text-white text-lg text-center focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', letterSpacing: '0.2em', caretColor: '#ff1ee8' }}
              onFocus={e => (e.target.style.border = '1.5px solid #ff1ee8')}
              onBlur={e => (e.target.style.border = '1.5px solid rgba(255,255,255,0.2)')} autoFocus />
            <button type="submit" className="w-full py-4 rounded-xl font-display text-lg text-white"
              style={{ background: 'linear-gradient(135deg,#ff1ee8,#a005d0)', boxShadow: '0 4px 20px rgba(255,30,232,0.4)' }}>
              Accéder
            </button>
          </form>
          <p className="text-center text-white/20 text-xs font-body mt-4">Mot de passe par défaut : <span className="text-white/40">admin2024</span></p>
          <button onClick={() => navigate('/')} className="w-full text-center text-white/30 hover:text-white/60 mt-4 font-body text-sm transition-colors">← Retour</button>
        </div>
      </div>
    )
  }

  // ─── Main backoffice ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0a2a', color: 'white' }}>

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-body text-sm animate-slide_up"
          style={{ background: toast.type === 'error' ? 'rgba(220,50,50,0.95)' : 'rgba(30,180,30,0.95)', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(13,10,42,0.97)', backdropFilter: 'blur(10px)' }}>
        <div className="flex items-center gap-3">
          <img src={logo ?? '/logo.png'} alt="" className="h-9 object-contain" />
          <div>
            <h1 className="font-display text-lg text-white leading-tight">Backoffice</h1>
            <p className="text-white/30 font-body text-xs">{quizzes.length} quiz · {gameCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/host')} className="font-body text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(57,255,20,0.1)', color: '#39ff14' }}>
            🎙️ Animateur
          </button>
          <button onClick={() => { sessionStorage.removeItem('bo_auth'); setAuthenticated(false) }}
            className="font-body text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 overflow-x-auto" >
        <div className="flex gap-0 min-w-max">
          <Tab label="🎮 Mes Quiz"     active={activeTab === 'quizzes'} onClick={() => setActiveTab('quizzes')} />
          <Tab label="✏️ Constructeur" active={activeTab === 'builder'} onClick={() => setActiveTab('builder')} />
          <Tab label="⚙️ Config"       active={activeTab === 'config'}  onClick={() => setActiveTab('config')} />
          <Tab label="📁 Médias"       active={activeTab === 'media'}   onClick={() => { setActiveTab('media'); loadMedia() }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-7">

        {activeTab === 'quizzes' && (
          <QuizListTab quizzes={quizzes} activeQuizId={activeQuizId} loading={loading}
            onActivate={activateQuiz} onEdit={openBuilder} onDuplicate={duplicateQuiz}
            onDelete={deleteQuiz} onCreate={createQuiz}
            onExportPDF={async (quizId) => {
              try {
                const res = await fetch(`/api/backoffice/quizzes/${quizId}`)
                const full = await res.json()
                generateQuizPDF(full)
              } catch { showToast('Impossible de charger le quiz pour l\'export', 'error') }
            }} />
        )}

        {activeTab === 'builder' && (
          <QuizBuilderTab quiz={editingQuiz} onChange={setEditingQuiz}
            onSave={saveEditingQuiz} onMediaUpload={handleMediaUpload} loading={loading}
            onVisualUpload={uploadQuizVisual} onSoundUpload={uploadQuizSound}
            onExportPDF={() => editingQuiz && generateQuizPDF(editingQuiz)} />
        )}

        {activeTab === 'config' && (
          <form onSubmit={saveConfig}>
            <h2 className="font-display text-2xl text-white mb-5">Configuration générale</h2>
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-display text-base text-white mb-3">Accès animateur</h3>
              <Input label="Mot de passe animateur" value={hostPassword} onChange={setHostPassword} type="password" hint="Pour accéder à /host" />
              <Input label="Code de la partie" value={gameCode} onChange={setGameCode} hint="Affiché dans l'URL du projecteur" />
              <Input label="Durée par défaut des questions (sec)" value={defaultDuration} onChange={v => setDefaultDuration(parseInt(v) || 40)} type="number" />
            </div>
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-display text-base text-white mb-3">Sécurité backoffice</h3>
              <Input label="Mot de passe backoffice" value={backofficePassword} onChange={setBackofficePassword} type="password" />
            </div>
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-display text-base text-white mb-3">Rejoindre le quiz</h3>
              <Input
                label="URL personnalisée (affiché sur le projecteur)"
                value={customJoinUrl}
                onChange={setCustomJoinUrl}
                placeholder="ex: quiz.monentreprise.com/join"
                hint="Laissez vide pour utiliser l'URL automatique"
              />
              <p className="font-body text-white/50 text-xs mb-2">QR Code personnalisé (si le QR auto ne fonctionne pas)</p>
              {qrCodeImageUrl ? (
                <div className="flex items-center gap-3 mb-2">
                  <img src={qrCodeImageUrl} alt="QR Code" style={{ width: 80, height: 80, objectFit: 'contain', background: 'white', borderRadius: 8, padding: 4 }} />
                  <div>
                    <button type="button" onClick={() => qrCodeInputRef.current?.click()}
                      className="font-body text-xs px-3 py-1.5 rounded-lg block mb-1"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
                      Remplacer
                    </button>
                    <button type="button" onClick={deleteQrCode}
                      className="font-body text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(255,50,50,0.12)', color: '#ff8080' }}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => qrCodeInputRef.current?.click()}
                  className="font-body text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>
                  📁 Importer un QR Code
                </button>
              )}
              <input ref={qrCodeInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { uploadQrCode(e.target.files[0]); e.target.value = '' }} />
            </div>
            <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="font-display text-base text-white mb-3">Mode de jeu</h3>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setRandomizeQuestions(v => !v)}
                  className="w-11 h-6 rounded-full transition-all flex-shrink-0 flex items-center px-0.5"
                  style={{ background: randomizeQuestions ? '#39ff14' : 'rgba(255,255,255,0.15)' }}>
                  <div className="w-5 h-5 rounded-full bg-white transition-all"
                    style={{ transform: randomizeQuestions ? 'translateX(20px)' : 'translateX(0)' }} />
                </div>
                <div>
                  <p className="font-body text-white text-sm">Questions en ordre aléatoire</p>
                  <p className="font-body text-white/40 text-xs">Les questions seront mélangées à chaque partie</p>
                </div>
              </label>
            </div>
            <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,230,0,0.05)' }}>
              <p className="font-body text-yellow-400 text-xs font-bold mb-2">Rappel des accès</p>
              <ul className="space-y-1 font-body text-white/50 text-xs">
                <li>• Joueurs : <strong className="text-white">/join</strong></li>
                <li>• Animateur : <strong className="text-white">/host</strong> → <strong className="text-white">{hostPassword || '…'}</strong></li>
                <li>• Projecteur : <strong className="text-white">/display/{gameCode || '…'}</strong></li>
                <li>• Backoffice : <strong className="text-white">/backoffice</strong> → <strong className="text-white">{backofficePassword || '…'}</strong></li>
              </ul>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-display text-lg text-white"
              style={{ background: 'linear-gradient(135deg,#ff1ee8,#a005d0)', boxShadow: '0 4px 20px rgba(255,30,232,0.4)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sauvegarde…' : 'Sauvegarder la configuration'}
            </button>
          </form>
        )}

        {activeTab === 'media' && (
          <div>
            <h2 className="font-display text-2xl text-white mb-2">Médias</h2>
            <p className="font-body text-white/40 text-sm mb-6">Fichiers audio (Blind Test) et images (Célébrités) du quiz actif.</p>
            {!media && <p className="text-white/30 font-body text-center py-12">Chargement…</p>}
            {media && (
              <>
                <h3 className="font-display text-lg text-white mb-3">Blind Test — Audio</h3>
                <div className="flex flex-col gap-3 mb-8">
                  {(media.blindTests ?? []).map(q => (
                    <div key={q.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-body text-white text-sm font-bold truncate">{q.correctAnswer}</p>
                        <span className="font-display text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(255,30,232,0.2)', color: '#ff6ef7' }}>{q.id}</span>
                      </div>
                      {q.audio ? <audio controls src={q.audio} className="w-full mb-2" style={{ height: 32 }} /> : <p className="text-white/30 text-xs mb-2">Aucun audio</p>}
                      <button onClick={() => audioInputRefs.current[q.id]?.click()} disabled={loading}
                        className="font-body text-xs px-3 py-1.5 rounded-lg w-full"
                        style={{ background: 'rgba(255,30,232,0.15)', color: '#ff6ef7' }}>
                        Remplacer le fichier MP3
                      </button>
                      <input ref={el => (audioInputRefs.current[q.id] = el)} type="file" accept="audio/*,.mp3" className="hidden"
                        onChange={e => { uploadAudio(q.id, e.target.files[0]); e.target.value = '' }} />
                    </div>
                  ))}
                </div>
                <h3 className="font-display text-lg text-white mb-3">Célébrités — Images</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(media.celebrites ?? []).map(q => (
                    <div key={q.id} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {q.image
                        ? <img src={`${q.image}?t=${Date.now()}`} alt={q.correctAnswer} className="rounded-xl w-full mb-2" style={{ height: 120, objectFit: 'cover' }} />
                        : <div className="rounded-xl mb-2 flex items-center justify-center" style={{ height: 100, background: 'rgba(255,50,50,0.08)' }}><p className="text-white/30 text-xs">Aucune image</p></div>
                      }
                      <p className="font-body text-white text-xs font-bold text-center truncate mb-1">{q.correctAnswer}</p>
                      <button onClick={() => celebInputRefs.current[q.id]?.click()} disabled={loading}
                        className="font-body text-xs px-2 py-1.5 rounded-lg w-full"
                        style={{ background: 'rgba(255,30,232,0.15)', color: '#ff6ef7' }}>
                        Remplacer
                      </button>
                      <input ref={el => (celebInputRefs.current[q.id] = el)} type="file" accept="image/*" className="hidden"
                        onChange={e => { uploadCelebrite(q.id, e.target.files[0]); e.target.value = '' }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
