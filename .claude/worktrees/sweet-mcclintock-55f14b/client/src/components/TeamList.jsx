import React from 'react'

function Avatar({ player, index }) {
  if (player.photo) {
    return (
      <img
        src={player.photo}
        alt={player.name}
        className="rounded-full flex-shrink-0"
        style={{ width: 36, height: 36, objectFit: 'cover', border: '2px solid #ff1ee8' }}
      />
    )
  }
  return (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display flex-shrink-0"
      style={{ background: 'rgba(255,30,232,0.4)', border: '2px solid #ff1ee8' }}
    >
      {index + 1}
    </span>
  )
}

export default function TeamList({ players }) {
  if (!players || players.length === 0) {
    return (
      <p className="text-white/50 text-center font-body italic py-6">
        En attente des équipes…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {players.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-xl px-4 py-3 animate-slide_up"
          style={{
            animationDelay: `${i * 0.05}s`,
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}
        >
          <Avatar player={p} index={i} />
          <span className="font-body font-700 text-white text-lg flex-1 truncate">{p.name}</span>
          {p.answered && (
            <span className="ml-auto text-quiz-green text-xl">✓</span>
          )}
        </div>
      ))}
    </div>
  )
}
