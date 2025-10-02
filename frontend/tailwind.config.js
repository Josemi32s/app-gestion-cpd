/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'inset-sm': 'inset 0 1px 0 0 rgba(255,255,255,0.4)',
      },
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f6f7f9',
          alt: '#f0f2f5',
          dark: '#1f242b'
        }
      }
    },
  },
  plugins: [],
}