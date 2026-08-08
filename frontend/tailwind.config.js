/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#101728", deep: "#0A0F1C" },
        baize: { DEFAULT: "#1B2740", hi: "#243352" },
        ivory: { DEFAULT: "#F2EDE3", dim: "#D9D2C4" },
        brass: "#C99A4A",
        muted: "#7E8CA6",
      },
      fontFamily: {
        display: ['"Bodoni Moda"', "Didot", '"Playfair Display"', "Georgia", "serif"],
        ui: ['"Archivo"', "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
