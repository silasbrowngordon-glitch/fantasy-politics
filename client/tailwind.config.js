/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Page backgrounds — deep navy
        ink: {
          950: '#010510',
          900: '#040d1f',
          800: '#081228',
          700: '#0c1835',
          600: '#111e44',
          500: '#172654',
          400: '#1e2f64',
          300: '#2a3d7a',
        },
        // Primary accent — electric blue
        gold: {
          600: '#1840c8',
          500: '#2354e8',
          400: '#3b6ef8',
          300: '#6b92fb',
          200: '#a8c3fd',
          100: '#dce8ff',
        },
        // Secondary accent — patriot red
        crimson: {
          700: '#7d0c1a',
          600: '#a31222',
          500: '#cc1a2e',
          400: '#e52040',
          300: '#f55070',
        },
        // Cool silver text
        cream: {
          100: '#f0f4ff',
          200: '#d8e0f5',
          300: '#b0bcdc',
          400: '#8090bc',
          500: '#566090',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'Impact', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
