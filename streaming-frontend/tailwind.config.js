/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#10161B',
        surface: '#1A232B',
        surfaceLight: '#232F38',
        ink: '#F3F5F6',
        muted: '#8B98A1',
        primary: '#EF3340',
        slate: '#4A5C6A',
        alert: '#EF3340',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
