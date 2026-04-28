import React from 'react'

const MEDALS = ['🥇', '🥈', '🥉']

function PlayerAvatar({ player, size = 40, light }) {
  if (player.photo) {
    return (
      <img
        src={player.photo}
        alt={player.name}
        className="rounded-full flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover', border: `2px solid ${light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'}` }}
      />
    )
  }
  return null
}

export default function Scoreboard({ players, title = 'Classement', podium = false, light = false }) {
  if (!players || players.length === 0) return null

  const rankColor = light ? '#64748b' : 'rgba(255,255,255,0.6)'
  const nameColor = light ? '#1e293b' : 'white'
  const scoreColors = light
    ? [i => i === 0 ? '#b45309' : '#16a34a']
    : [i => i === 0 ? '#ffe600' : '#39ff14']

  return (
    <div className="w-full max-w-lg mx-auto">
      {title && (
        <h2 className="font-display text-3xl text-center mb-6"
          style={{ color: light ? '#1e293b' : 'white', textShadow: light ? 'none' : undefined }}>
          {title}
        </h2>
      )}
      <div className="flex flex-col gap-3">
        {players.map((player, i) => {
          const isPodium = podium && i < 3
          return (
            <div
              key={player.id}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 animate-slide_up"
              style={{
                animationDelay: `${i * 0.08}s`,
                background: isPodium
                  ? (light
                    ? `linear-gradient(135deg, ${i === 0 ? 'rgba(255,215,0,0.18)' : i === 1 ? 'rgba(192,192,192,0.15)' : 'rgba(205,127,50,0.15)'}, transparent)`
                    : `linear-gradient(135deg, ${i === 0 ? 'rgba(255,215,0,0.25)' : i === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)'}, transparent)`)
                  : (light ? '#f8fafc' : 'rgba(255,255,255,0.08)'),
                border: `2px solid ${isPodium
                  ? (i === 0 ? 'rgba(255,215,0,0.5)' : i === 1 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)')
                  : (light ? '#e2e8f0' : 'rgba(255,255,255,0.15)')}`,
              }}
            >
              {/* Rank */}
              <div className="w-10 text-center flex-shrink-0">
                {isPodium ? (
                  <span className="text-2xl">{MEDALS[i]}</span>
                ) : (
                  <span className="font-display text-xl" style={{ color: rankColor }}>#{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              {player.photo && <PlayerAvatar player={player} size={isPodium ? 48 : 36} light={light} />}

              {/* Name */}
              <div className="flex-1 font-body font-semibold text-lg truncate" style={{ color: nameColor }}>
                {player.name}
              </div>

              {/* Score */}
              <div
                className="font-display text-2xl flex-shrink-0"
                style={{ color: light ? (i === 0 ? '#b45309' : '#16a34a') : (i === 0 ? '#ffe600' : '#39ff14') }}
              >
                {player.score} pt{player.score !== 1 ? 's' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
