/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1E3F',
        eco: '#1B7A5E',
        mist: '#F3F7FB'
      }
    }
  },
  plugins: []
};
