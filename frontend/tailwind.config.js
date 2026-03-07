/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#050d1a",
        secondary: "#0a1628",
        card: "#112240",
        accent: {
          DEFAULT: "#1a56db",
          light: "#63B3ED",
        },
        content: {
          primary: "#E8EDF5",
          secondary: "#6B7A99",
          label: "#A8B8D0",
        },
        positive: "#34D399",
        negative: "#F87171",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-ibm-plex)", "sans-serif"],
      },
    },
  },
  plugins: []
};
