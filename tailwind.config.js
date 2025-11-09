const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Inter', ...defaultTheme.fontFamily.sans],
      serif: [...defaultTheme.fontFamily.serif],
      mono: [...defaultTheme.fontFamily.mono],
    },
    extend: {
      fontFamily: {
        legal: ['"Times New Roman"', 'Georgia', 'serif'],
        legalSans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        legal: {
          base: '#1f2937',
          muted: '#4b5563',
          accent: '#0f766e',
          accentLight: '#14b8a6',
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          danger: '#b91c1c',
        },
      },
      spacing: {
        legal: '1.5rem',
      },
      boxShadow: {
        legal: '0 20px 50px -20px rgba(15, 118, 110, 0.3)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

