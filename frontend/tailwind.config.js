/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F7FAFB",
        card: "#FFFFFF",
        accent: {
          DEFAULT: "#1D9E75",
          hover: "#0F6E56",
        },
        heading: "#0C447C",
        content: {
          primary: "#333333",
          secondary: "#6B7A99",
        },
        badge: {
          bg: "#E1F5EE",
          text: "#0F6E56",
        },
        positive: "#1D9E75",
        negative: "#E24B4A",
        border: "#E8EDF5",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: []
};
