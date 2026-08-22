/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080b14',
        surface: {
          DEFAULT: '#0f1524',
          subtle: '#121a2d',
          hover: '#18223a',
        },
        card: {
          DEFAULT: '#151d2e',
          hover: '#1b253b',
        },
        border: {
          DEFAULT: '#1e2d45',
          subtle: '#2a3b5a',
          active: '#3b82f6',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          light: '#60a5fa',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
          light: '#a78bfa',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        text: {
          primary: '#f1f5f9',
          muted: '#94a3b8',
          dim: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(59, 130, 246, 0.2), 0 0 30px rgba(139, 92, 246, 0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(139, 92, 246, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
