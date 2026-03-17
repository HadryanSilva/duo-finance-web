/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        surface: {
          0:   '#ffffff',
          50:  '#f8f8f7',
          100: '#f1f0ee',
          200: '#e4e2df',
          300: '#cbc8c2',
          400: '#a8a49c',
          500: '#888279',
          600: '#6b6560',
          700: '#524f4a',
          800: '#3a3835',
          900: '#252320',
          950: '#141312'
        },
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        income:  '#22c55e',
        expense: '#ef4444'
      }
    }
  },
  plugins: []
}
