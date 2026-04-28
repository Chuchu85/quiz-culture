import React from 'react'
import { useNavigate } from 'react-router-dom'
import Background from '../components/Background.jsx'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <Background>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="mb-10 animate-pop_in">
          <img src="/logo.png" alt="Culture Mashup Quiz" className="w-80 max-w-xs mx-auto drop-shadow-2xl" />
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4">
          <button className="btn-green w-full flex flex-col items-center gap-2 py-8"
            onClick={() => navigate('/join')}>
            <span className="text-quiz-bg text-2xl">Jouer !</span>
            <span className="text-quiz-bg/60 text-sm font-body">Entrer le nom de mon équipe</span>
          </button>
        </div>

        {/* Discrete links for host/backoffice */}
        <div className="flex gap-6 mt-10">
          <button onClick={() => navigate('/host')}
            className="text-white/20 hover:text-white/50 font-body text-xs transition-colors">
            Animateur
          </button>
          <button onClick={() => navigate('/backoffice')}
            className="text-white/20 hover:text-white/50 font-body text-xs transition-colors">
            Backoffice
          </button>
        </div>
      </div>
    </Background>
  )
}
