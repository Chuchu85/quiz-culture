// Game modes registry — add a new mode by creating its folder and registering it here

import ClassicQCMPlayer from './classic_qcm/PlayerView.jsx'
import ClassicQCMHost from './classic_qcm/HostView.jsx'
import ClassicQCMDisplay from './classic_qcm/DisplayView.jsx'

import InfoOuBluffPlayer from './info_ou_bluff/PlayerView.jsx'
import InfoOuBluffHost from './info_ou_bluff/HostView.jsx'
import InfoOuBluffDisplay from './info_ou_bluff/DisplayView.jsx'

import BuzzerPlayer from './buzzer/PlayerView.jsx'
import BuzzerHost from './buzzer/HostView.jsx'
import BuzzerDisplay from './buzzer/DisplayView.jsx'

import OeilDeLynxPlayer from './oeil_de_lynx/PlayerView.jsx'
import OeilDeLynxHost from './oeil_de_lynx/HostView.jsx'
import OeilDeLynxDisplay from './oeil_de_lynx/DisplayView.jsx'

import RechercheInterditePlayer from './recherche_interdite/PlayerView.jsx'
import RechercheInterditeHost from './recherche_interdite/HostView.jsx'
import RechercheInterditeDisplay from './recherche_interdite/DisplayView.jsx'

import PareilLaQuestionPlayer from './pareil_la_question/PlayerView.jsx'
import PareilLaQuestionHost from './pareil_la_question/HostView.jsx'
import PareilLaQuestionDisplay from './pareil_la_question/DisplayView.jsx'

import BlindTestPlayer from './blind_test/PlayerView.jsx'
import BlindTestDisplay from './blind_test/DisplayView.jsx'

export const GAME_MODES = {
  classic_qcm: {
    label: 'QCM Classique',
    description: 'Question à choix multiples — 4 propositions, 1 bonne réponse',
    icon: '🎯',
    color: '#ff1ee8',
    PlayerView: ClassicQCMPlayer,
    HostView: ClassicQCMHost,
    DisplayView: ClassicQCMDisplay,
    defaultSettings: {
      timer: 30,
      points: 1,
      speedBonus: true,
    },
  },

  top_reponse: {
    label: 'Top Réponse',
    description: 'QCM rapide — culture générale, actualité, sport',
    icon: '⚡',
    color: '#ffe600',
    PlayerView: ClassicQCMPlayer,   // même UI que classic_qcm
    HostView: ClassicQCMHost,
    DisplayView: ClassicQCMDisplay,
    defaultSettings: {
      timer: 20,
      points: 1,
      speedBonus: true,
    },
  },

  qui_se_cache: {
    label: 'Qui se cache ?',
    description: 'Image fusionnée de deux célébrités — trouvez les deux',
    icon: '🎭',
    color: '#7b2fff',
    PlayerView: ClassicQCMPlayer,   // même UI, mais affiche l'image
    HostView: ClassicQCMHost,
    DisplayView: ClassicQCMDisplay,
    defaultSettings: {
      timer: 30,
      points: 2,
      speedBonus: true,
    },
  },

  info_ou_bluff: {
    label: 'Info ou Bluff',
    description: 'Inventez une fausse réponse et trompez les autres équipes',
    icon: '🃏',
    color: '#ff6b35',
    PlayerView: InfoOuBluffPlayer,
    HostView: InfoOuBluffHost,
    DisplayView: InfoOuBluffDisplay,
    defaultSettings: {
      bluffTime: 30,
      voteTime: 20,
      points: { correctAnswer: 2, bluffVote: 1 },
    },
  },

  buzzer: {
    label: 'Question Buzzer',
    description: 'Le premier à buzzer répond — validation manuelle par l\'animateur',
    icon: '🔔',
    color: '#ff2020',
    PlayerView: BuzzerPlayer,
    HostView: BuzzerHost,
    DisplayView: BuzzerDisplay,
    defaultSettings: {
      timer: 60,
      points: 3,
      penalty: 0,
    },
  },

  oeil_de_lynx: {
    label: 'Œil de Lynx',
    description: 'Regardez la vidéo, puis répondez à une question sur un détail',
    icon: '🎬',
    color: '#00d4ff',
    PlayerView: OeilDeLynxPlayer,
    HostView: OeilDeLynxHost,
    DisplayView: OeilDeLynxDisplay,
    defaultSettings: {
      timer: 25,
      points: 2,
      speedBonus: true,
    },
  },

  recherche_interdite: {
    label: 'Recherche Interdite',
    description: 'Complétez les vraies recherches Google les plus improbables',
    icon: '🔍',
    color: '#4d9fff',
    PlayerView: RechercheInterditePlayer,
    HostView: RechercheInterditeHost,
    DisplayView: RechercheInterditeDisplay,
    defaultSettings: {
      timer: 25,
      points: 1,
      speedBonus: true,
    },
  },

  blind_test: {
    label: 'Blind Test',
    description: 'Reconnaissez l\'artiste et le titre d\'un extrait audio',
    icon: '🎵',
    color: '#9b59b6',
    PlayerView: BlindTestPlayer,
    HostView: ClassicQCMHost,
    DisplayView: BlindTestDisplay,
    defaultSettings: {
      timer: 40,
      points: 2,
      speedBonus: false,
    },
  },

  text_input: {
    label: 'Texte libre',
    description: 'Les joueurs saisissent leur réponse librement',
    icon: '✏️',
    color: '#2ecc71',
    PlayerView: ClassicQCMPlayer,
    HostView: ClassicQCMHost,
    DisplayView: ClassicQCMDisplay,
    defaultSettings: {
      timer: 40,
      points: 1,
      speedBonus: false,
    },
  },

  multiple_choice: {
    label: 'QCM (ancien format)',
    description: 'Format hérité — compatible avec les anciens quiz',
    icon: '📋',
    color: '#95a5a6',
    PlayerView: ClassicQCMPlayer,
    HostView: ClassicQCMHost,
    DisplayView: ClassicQCMDisplay,
    defaultSettings: {
      timer: 30,
      points: 1,
      speedBonus: true,
    },
  },

  pareil_la_question: {
    label: 'Pareil la Question',
    description: 'Question affichée simultanément sur le diaporama et les téléphones — réponse orale',
    icon: '💬',
    color: '#ff1ee8',
    PlayerView: PareilLaQuestionPlayer,
    HostView: PareilLaQuestionHost,
    DisplayView: PareilLaQuestionDisplay,
    defaultSettings: {
      timer: 0,
      points: 1,
      speedBonus: false,
    },
  },
}

export function getModeConfig(gameMode) {
  return GAME_MODES[gameMode] || GAME_MODES['classic_qcm']
}

export function getModeLabel(gameMode) {
  return GAME_MODES[gameMode]?.label || gameMode
}

export function getModeIcon(gameMode) {
  return GAME_MODES[gameMode]?.icon || '❓'
}

export function getModeColor(gameMode) {
  return GAME_MODES[gameMode]?.color || '#ffffff'
}

export const ORDERED_MODES = [
  'top_reponse',
  'classic_qcm',
  'info_ou_bluff',
  'qui_se_cache',
  'recherche_interdite',
  'oeil_de_lynx',
  'blind_test',
  'buzzer',
  'text_input',
  'pareil_la_question',
]
