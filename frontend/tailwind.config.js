/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f7ff",
          100: "#e0ebff",
          500: "#2653ff",
          600: "#1e42cc",
          900: "#0b1638"
        }
      }
    }
  },
  plugins: []
};
