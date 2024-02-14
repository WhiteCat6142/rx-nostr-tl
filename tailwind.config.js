/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/*.{vue,js,jsx,ts,tsx}'],
  plugins: [require('daisyui')],
  themes: ["light", "dark", "cupcake"],
};
