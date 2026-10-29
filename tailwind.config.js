/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0068ff', // Zalo signature blue
          600: '#0052cc',
          700: '#003e99',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        zalo: {
          blue: '#0068ff',
          lightBlue: '#e5efff',
          bg: '#f4f5f7',
          sidebar: '#0091ff',
          active: '#e5efff',
          bubble: '#e5efff',
          bubbleSelf: '#e5efff',
          darkBg: '#1e1e24',
          darkPanel: '#2a2a32',
          darkBorder: '#383844',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
