/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tik: {
          orange: '#E07B22',
          dark: '#C96918',
          light: '#F0931A',
          sidebar: '#D4701A',
        },
      },
    },
  },
  plugins: [],
}
