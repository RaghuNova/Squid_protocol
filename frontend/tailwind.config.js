/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        squid: {
          dark: '#0a0b0e',
          card: '#12151c',
          cardBorder: '#232936',
          panel: '#181c26',
          red: '#ff004f',
          redGlow: 'rgba(255, 0, 79, 0.4)',
          pink: '#ff2e7e',
          green: '#00e676',
          greenGlow: 'rgba(0, 230, 118, 0.4)',
          gold: '#ffd166',
          cyan: '#00f0ff',
          muted: '#8b949e',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['"Chakra Petch"', 'Rajdhani', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Rajdhani', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'fade-in': 'fade-in 0.3s ease forwards',
        'slide-up': 'slide-up 0.3s ease forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(255, 0, 79, 0.6))' },
          '50%': { opacity: '.8', filter: 'drop-shadow(0 0 5px rgba(255, 0, 79, 0.2))' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
