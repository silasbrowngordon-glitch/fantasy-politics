/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#06080f',
          800: '#0b1120',
          700: '#0f1c38',
          600: '#152650',
          500: '#1c3268',
        },
        // primary accent — patriot red
        gold: {
          500: '#cc2936',
          400: '#e03545',
          300: '#f87171',
        },
        // secondary accent — patriot blue
        patriot: {
          700: '#1e3a8a',
          600: '#1d4ed8',
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
        crimson: {
          600: '#9b1c1c',
          500: '#b91c1c',
          400: '#dc2626',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
