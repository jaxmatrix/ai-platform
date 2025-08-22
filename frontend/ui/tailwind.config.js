/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkblue: {
          500: '#0047AB', // Custom dark blue color
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
