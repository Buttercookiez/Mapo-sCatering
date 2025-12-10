/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // CHANGE THIS LINE:
  darkMode: 'class', // <--- This allows you to toggle it manually
  theme: {
    extend: {},
  },
  plugins: [],
}