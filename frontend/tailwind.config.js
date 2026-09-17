/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0e14',
          900: '#0f141c',
          800: '#151c27',
          700: '#1c2531',
          600: '#28323f',
          500: '#3a4655',
          400: '#5c6b7c',
          300: '#8896a5',
          200: '#b8c2cc',
          100: '#e4e9ed',
        },
        risk: {
          low: '#22c55e',
          moderate: '#eab308',
          high: '#f97316',
          veryhigh: '#ef4444',
          critical: '#dc2626',
        },
        accent: {
          DEFAULT: '#3b9eff',
          dim: '#1e5a94',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
