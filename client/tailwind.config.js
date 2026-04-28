/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        quiz: {
          bg: '#1a0bdb',
          'bg-dark': '#0d0580',
          pink: '#ff1ee8',
          'pink-light': '#ff6ef7',
          green: '#39ff14',
          yellow: '#ffe600',
          purple: '#7b2fff',
        },
      },
      fontFamily: {
        display: ['"Lilita One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
      },
      keyframes: {
        pulse_glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        pop_in: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '80%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slide_up: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounce_in: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-8px)' },
          '80%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        pulse_glow: 'pulse_glow 2s ease-in-out infinite',
        pop_in: 'pop_in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        slide_up: 'slide_up 0.4s ease forwards',
        bounce_in: 'bounce_in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        shake: 'shake 0.5s ease',
      },
    },
  },
  plugins: [],
}
