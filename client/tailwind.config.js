/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page backgrounds
        ink: {
          950: '#06060a',
          900: '#0a0a0f',
          800: '#111118',
          700: '#18181f',
          600: '#22222d',
          500: '#2e2e3d',
          400: '#3d3d52',
          300: '#56566e',
        },
        // Primary accent — warm amber gold
        gold: {
          600: '#a07835',
          500: '#c4972f',
          400: '#d4a843',
          300: '#e8c46a',
          200: '#f5dfa0',
          100: '#fdf4dc',
        },
        // Secondary accent — deep crimson
        crimson: {
          700: '#8b0f22',
          600: '#a8152b',
          500: '#c41e3a',
          400: '#e02040',
          300: '#f05070',
        },
        // Warm off-white text
        cream: {
          100: '#f5efe3',
          200: '#ede8df',
          300: '#d8d0c4',
          400: '#b8b0a4',
          500: '#8a8278',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-ink': `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
    },
  },
  plugins: [],
};
