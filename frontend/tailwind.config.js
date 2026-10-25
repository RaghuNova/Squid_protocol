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
          bg: '#08090d',
          card: '#0f1218',
          cardHover: '#141822',
          panel: '#151922',
          border: '#1e2432',
          borderLight: '#2c3447',
          red: '#ff004f',
          redHover: '#e00045',
          pink: '#ff2e7e',
          green: '#00e676',
          greenHover: '#00c864',
          amber: '#f59e0b',
          gold: '#ffd166',
          cyan: '#00f0ff',
          muted: '#7a8599',
          subtle: '#434c5e',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['"Chakra Petch"', 'Rajdhani', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'elevated': '0 10px 30px -4px rgba(0, 0, 0, 0.7)',
        'red-sm': '0 0 12px -2px rgba(255, 0, 79, 0.3)',
        'green-sm': '0 0 12px -2px rgba(0, 230, 118, 0.3)',
        'cyan-sm': '0 0 12px -2px rgba(0, 240, 255, 0.3)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
