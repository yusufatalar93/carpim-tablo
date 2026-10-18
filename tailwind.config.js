/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#fef9ef',
        ink: '#2b2d42',
      },
    },
  },
  plugins: [],
};
