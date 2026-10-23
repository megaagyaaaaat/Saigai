/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ner: {
          bg: '#080D14',
          surface: '#0E1621',
          panel: '#111C29',
          border: '#253443',
          'border-light': '#32475B',
          text: '#EDF4FA',
          muted: '#96A8BA',
          cyan: '#64E2E8',
          blue: '#64A8FF',
          amber: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          emerald: '#10B981'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-cyan': '0 0 15px rgba(100, 226, 232, 0.25)',
        'glow-blue': '0 0 15px rgba(100, 168, 255, 0.25)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
