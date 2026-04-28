import React from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

// phase: null | 'countdown' | 'urgent' | 'reveal'
export default function Background({ glowColor = 'pink', phase = null, children, className = '' }) {
  const { theme } = useTheme()
  const hasBgImage = !!theme?.backgroundImage

  const primary = 'var(--theme-primary, #ff1ee8)'
  const secondary = 'var(--theme-secondary, #39ff14)'

  const glowColorFallback =
    phase === 'urgent' ? 'rgba(255,40,40,0.7)'
    : phase === 'reveal' ? 'rgba(57,255,20,0.7)'
    : glowColor === 'green' ? 'rgba(57,255,20,0.35)'
    : 'rgba(255,30,232,0.45)'

  const glowAnimation =
    phase === 'countdown' ? 'bg-pulse-slow 1s ease-in-out infinite'
    : phase === 'urgent'   ? 'bg-pulse-fast 0.35s ease-in-out infinite'
    : phase === 'reveal'   ? 'bg-reveal-flash 1.4s ease-out forwards'
    : undefined

  const screenUrgency = phase === 'urgent'
    ? { animation: 'urgency-border 0.35s ease-in-out infinite' }
    : {}

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--theme-bg, #1a0bdb)',
        backgroundImage: 'var(--theme-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        ...screenUrgency,
      }}
    >
      {/* Gradient overlay — opaque sans image, semi-transparent avec image */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, var(--theme-gradient-from, #1a0bdb) 0%, var(--theme-gradient-to, #0d0221) 100%)',
        opacity: hasBgImage ? 0.55 : 1,
        transition: 'opacity 0.4s',
      }} />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        opacity: hasBgImage ? 0.5 : 1,
      }} />

      {/* Central glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 45%, ${glowColorFallback} 0%, transparent 65%)`,
        animation: glowAnimation,
        transformOrigin: 'center',
      }} />

      {/* Deco gauche */}
      <img src="/3.png" alt="" aria-hidden="true" className="absolute pointer-events-none select-none"
        style={{ left: '-2%', top: '5%', height: '90%', width: 'auto', opacity: hasBgImage ? 0.2 : 0.45, mixBlendMode: 'screen' }} />

      {/* Deco droite */}
      <img src="/2.png" alt="" aria-hidden="true" className="absolute pointer-events-none select-none"
        style={{ right: '-2%', bottom: '0%', height: '75%', width: 'auto', opacity: hasBgImage ? 0.25 : 0.5, mixBlendMode: 'screen' }} />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
