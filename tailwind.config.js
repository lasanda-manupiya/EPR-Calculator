/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // SustainZone brand palette
        navy: '#12313d', // deep teal-charcoal (matches "Calculator" wordmark)
        eco: '#16bccf', // brand teal (primary)
        sun: '#F5811F', // brand orange (accent)
        mist: '#F3F7FB',
        // Rebrand existing emerald usages to SustainZone teal in one place.
        emerald: {
          50: '#ecfeff',
          100: '#cef9fd',
          200: '#a2f0f8',
          300: '#67e2f0',
          400: '#23cbe0',
          500: '#16bccf',
          600: '#0c96ab',
          700: '#0f7688',
          800: '#146070',
          900: '#154e5c',
          950: '#063842',
        },
      },
    },
  },
  plugins: [],
};
