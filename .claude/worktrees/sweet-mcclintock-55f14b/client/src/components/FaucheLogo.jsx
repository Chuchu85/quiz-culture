import React from 'react'

// Logo client dynamique — src vient de /api/room clientLogo
// N'affiche rien si pas de logo configuré
export default function FaucheLogo({ src, size = 56 }) {
  if (!src) return null
  return (
    <img
      src={src}
      alt="Logo client"
      style={{
        maxHeight: size,
        maxWidth: size * 2.5,
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: 8,
        flexShrink: 0,
      }}
    />
  )
}
