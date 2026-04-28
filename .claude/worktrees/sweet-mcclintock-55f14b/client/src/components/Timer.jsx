import React, { useEffect, useRef } from 'react'

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function Timer({ remaining, total, size = 120 }) {
  const progress = total > 0 ? remaining / total : 0
  const offset = CIRCUMFERENCE * (1 - progress)
  const urgent = remaining <= 5 && remaining > 0
  const color = urgent ? '#ff3232' : remaining <= 10 ? '#ffe600' : '#39ff14'

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Background ring */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="absolute inset-0 -rotate-90"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      {/* Number */}
      <span
        className="font-display relative z-10"
        style={{
          fontSize: size * 0.35,
          color,
          textShadow: `0 0 15px ${color}`,
          animation: urgent ? 'shake 0.5s ease' : 'none',
        }}
      >
        {remaining}
      </span>
    </div>
  )
}
