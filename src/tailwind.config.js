/** @type {import('tailwindcss').Config} */
module.exports = {
  // Dit vertelt Tailwind waar het naar CSS-klassen moet zoeken
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}