/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bloomberg-amber': '#ff9900',
        'bloomberg-bg': '#000000',
        'bloomberg-border': '#333333',
      },
      fontFamily: {
        mono: ['Courier New', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
